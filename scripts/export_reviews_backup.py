from __future__ import annotations

import csv
import json
import os
import shutil
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from google.auth.transport.requests import Request as GoogleAuthRequest
from google.oauth2.credentials import Credentials as UserCredentials
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload


SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_REVIEWS_TABLE = os.environ.get("SUPABASE_REVIEWS_TABLE", "anreview_reviews")
SUPABASE_REPORTS_TABLE = os.environ.get("SUPABASE_REPORTS_TABLE", "anreview_reports")
BACKUP_DIR = Path(os.environ.get("ANREVIEW_BACKUP_DIR", "backups/review-exports"))
GOOGLE_DRIVE_FOLDER_ID = os.environ.get("GOOGLE_DRIVE_FOLDER_ID", "").strip()
GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON = os.environ.get("GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON", "").strip()
GOOGLE_DRIVE_OAUTH_CLIENT_ID = os.environ.get("GOOGLE_DRIVE_OAUTH_CLIENT_ID", "").strip()
GOOGLE_DRIVE_OAUTH_CLIENT_SECRET = os.environ.get("GOOGLE_DRIVE_OAUTH_CLIENT_SECRET", "").strip()
GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN = os.environ.get("GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN", "").strip()
GOOGLE_DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive"]


def require_env(name: str, value: str) -> str:
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def supabase_headers() -> dict[str, str]:
    key = require_env("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY)
    headers = {
        "apikey": key,
        "Content-Type": "application/json",
    }
    if "." in key:
        headers["Authorization"] = f"Bearer {key}"
    return headers


def call_supabase(path: str) -> object:
    base_url = require_env("SUPABASE_URL", SUPABASE_URL)
    request = Request(f"{base_url}{path}", headers=supabase_headers())
    try:
        with urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Supabase export failed: {error.code} {detail or error.reason}") from error
    except URLError as error:
        raise RuntimeError(f"Supabase export failed: {error.reason}") from error


def normalize_rows(payload: object, label: str) -> list[dict]:
    if payload is None:
        return []
    if isinstance(payload, dict):
        return [payload]
    if isinstance(payload, list):
        normalized: list[dict] = []
        for index, row in enumerate(payload):
            if isinstance(row, dict):
                normalized.append(row)
            else:
                normalized.append(
                    {
                        "id": f"invalid-{label}-{index}",
                        "raw_value": json.dumps(row, ensure_ascii=False),
                    }
                )
        return normalized
    return [{"id": f"invalid-{label}-0", "raw_value": json.dumps(payload, ensure_ascii=False)}]


def fetch_reviews() -> list[dict]:
    return normalize_rows(
        call_supabase(
            f"/rest/v1/{SUPABASE_REVIEWS_TABLE}?select=*&order=created_at.desc,id.desc"
        ),
        "reviews",
    )


def fetch_reports() -> list[dict]:
    return normalize_rows(
        call_supabase(
            f"/rest/v1/{SUPABASE_REPORTS_TABLE}?select=*&order=created_at.desc,id.desc"
        ),
        "reports",
    )


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def write_csv(path: Path, rows: list[dict], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            if not isinstance(row, dict):
                safe_row = {fieldnames[0]: "", fieldnames[-1]: str(row)}
            else:
                safe_row = {field: row.get(field, "") for field in fieldnames}
            writer.writerow(safe_row)


def create_export_bundle() -> tuple[Path, Path]:
    reviews = fetch_reviews()
    reports = fetch_reports()
    generated_at = datetime.now(timezone.utc)
    stamp = generated_at.strftime("%Y%m%d-%H%M%S")
    run_dir = BACKUP_DIR / stamp
    latest_dir = BACKUP_DIR / "latest"

    manifest = {
        "generatedAt": generated_at.isoformat(),
        "reviewsTable": SUPABASE_REVIEWS_TABLE,
        "reportsTable": SUPABASE_REPORTS_TABLE,
        "counts": {
            "reviews": len(reviews),
            "reports": len(reports),
        },
    }

    write_json(run_dir / "manifest.json", manifest)
    write_json(run_dir / "reviews.json", reviews)
    write_json(run_dir / "reports.json", reports)
    write_csv(
        run_dir / "reviews.csv",
        reviews,
        [
            "id", "item_id", "item_type", "author", "created_at", "overall",
            "metric_a", "metric_b", "metric_c", "semester", "taken_year",
            "academic_id", "academic_name", "upvotes", "downvotes", "comment",
        ],
    )
    write_csv(
        run_dir / "reports.csv",
        reports,
        ["id", "review_id", "item_id", "reason", "created_at", "status"],
    )

    latest_dir.mkdir(parents=True, exist_ok=True)
    for child in latest_dir.iterdir():
        if child.is_file():
            child.unlink()
        elif child.is_dir():
            shutil.rmtree(child)
    for file_path in run_dir.iterdir():
        shutil.copy2(file_path, latest_dir / file_path.name)

    zip_path = BACKUP_DIR / f"anreview-backup-{stamp}.zip"
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for file_path in run_dir.iterdir():
            archive.write(file_path, arcname=f"{stamp}/{file_path.name}")

    return run_dir, zip_path


def drive_service_account_info() -> dict | None:
    if not GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON:
        return None
    return json.loads(GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON)


def drive_user_credentials() -> UserCredentials | None:
    if not (
        GOOGLE_DRIVE_OAUTH_CLIENT_ID
        and GOOGLE_DRIVE_OAUTH_CLIENT_SECRET
        and GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN
    ):
        return None
    credentials = UserCredentials(
        token=None,
        refresh_token=GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=GOOGLE_DRIVE_OAUTH_CLIENT_ID,
        client_secret=GOOGLE_DRIVE_OAUTH_CLIENT_SECRET,
        scopes=GOOGLE_DRIVE_SCOPES,
    )
    credentials.refresh(GoogleAuthRequest())
    return credentials


def upload_to_google_drive(zip_path: Path, manifest_path: Path) -> str | None:
    if not GOOGLE_DRIVE_FOLDER_ID:
        return None

    credentials = drive_user_credentials()
    if credentials is None:
        service_account_info = drive_service_account_info()
        if service_account_info:
            credentials = Credentials.from_service_account_info(
                service_account_info,
                scopes=GOOGLE_DRIVE_SCOPES,
            )
        else:
            return None

    service = build("drive", "v3", credentials=credentials, cache_discovery=False)

    uploaded_ids: list[str] = []
    for path, mime_type in (
        (zip_path, "application/zip"),
        (manifest_path, "application/json"),
    ):
        metadata = {
            "name": path.name,
            "parents": [GOOGLE_DRIVE_FOLDER_ID],
        }
        media = MediaFileUpload(str(path), mimetype=mime_type, resumable=False)
        created = (
            service.files()
            .create(body=metadata, media_body=media, fields="id")
            .execute()
        )
        uploaded_ids.append(created["id"])
    return ", ".join(uploaded_ids)


def main() -> None:
    run_dir, zip_path = create_export_bundle()
    manifest_path = run_dir / "manifest.json"
    drive_ids = None
    drive_error = None
    try:
        drive_ids = upload_to_google_drive(zip_path, manifest_path)
    except Exception as error:  # pragma: no cover - depends on external Drive config
        drive_error = str(error)

    print(f"Backup written to {run_dir}")
    print(f"Archive written to {zip_path}")
    if drive_ids:
        print(f"Uploaded backup files to Google Drive: {drive_ids}")
    elif drive_error:
        print(f"Google Drive upload failed: {drive_error}")
    else:
        print("Google Drive upload skipped (no credentials or folder configured).")


if __name__ == "__main__":
    main()
