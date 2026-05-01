from __future__ import annotations

import json
import os
import re
import tempfile
from datetime import datetime
from html import unescape
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

WORKSPACE_DIR = Path(__file__).resolve().parent


def resolve_storage_dir() -> Path:
    configured = os.environ.get("ANREVIEW_STORAGE_DIR")
    if configured:
        return Path(configured)
    render_disk = Path("/var/data")
    if render_disk.exists():
        return render_disk / "ANReview"
    return Path(tempfile.gettempdir()) / "ANReview"


ANREVIEW_STORAGE_DIR = resolve_storage_dir()
ANREVIEW_REVIEWS_PATH = ANREVIEW_STORAGE_DIR / "shared-reviews.json"
ANREVIEW_REPORTS_PATH = ANREVIEW_STORAGE_DIR / "review-reports.json"
ANREVIEW_CATALOG_CACHE_PATH = ANREVIEW_STORAGE_DIR / "catalog-cache.json"
BUNDLED_DATA_PATH = WORKSPACE_DIR / "cbe-rating" / "data.js"
HOST = "0.0.0.0"
PORT = int(os.environ.get("PORT", "8000"))
CACHE_VERSION = 9
DEFAULT_REVIEW_METRICS = ["Clarity", "Support", "Engagement"]
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_REVIEWS_TABLE = os.environ.get("SUPABASE_REVIEWS_TABLE", "anreview_reviews")
SUPABASE_REPORTS_TABLE = os.environ.get("SUPABASE_REPORTS_TABLE", "anreview_reports")


def read_json_file(path: Path, default: list[dict]) -> list[dict]:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return default


def write_json_file(path: Path, payload: list[dict] | dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def ensure_anreview_storage() -> None:
    ANREVIEW_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    if not ANREVIEW_REVIEWS_PATH.exists():
        write_json_file(ANREVIEW_REVIEWS_PATH, [])
    if not ANREVIEW_REPORTS_PATH.exists():
        write_json_file(ANREVIEW_REPORTS_PATH, [])


def load_anreview_reviews() -> list[dict]:
    if supabase_enabled():
        return load_supabase_reviews()
    ensure_anreview_storage()
    return read_json_file(ANREVIEW_REVIEWS_PATH, [])


def load_anreview_reports() -> list[dict]:
    if supabase_enabled():
        return load_supabase_reports()
    ensure_anreview_storage()
    return read_json_file(ANREVIEW_REPORTS_PATH, [])


def send_json(handler: SimpleHTTPRequestHandler, payload: dict | list, status: int = 200) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def read_request_json(handler: SimpleHTTPRequestHandler) -> dict:
    content_length = int(handler.headers.get("Content-Length", "0"))
    raw_body = handler.rfile.read(content_length) if content_length > 0 else b"{}"
    return json.loads(raw_body.decode("utf-8"))


def sanitize_text(value: str, max_length: int) -> str:
    return re.sub(r"\s+", " ", value).strip()[:max_length]


def supabase_enabled() -> bool:
    return bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)


def supabase_headers() -> dict[str, str]:
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }


def call_supabase(path: str, method: str = "GET", payload: dict | list | None = None, prefer: str | None = None) -> list | dict:
    request = Request(f"{SUPABASE_URL}{path}", method=method, headers=supabase_headers())
    if prefer:
        request.add_header("Prefer", prefer)
    if payload is not None:
        request.data = json.dumps(payload).encode("utf-8")
    try:
        with urlopen(request, timeout=20) as response:
            body = response.read().decode("utf-8")
            return json.loads(body) if body else {}
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Supabase request failed: {error.code} {detail or error.reason}") from error
    except URLError as error:
        raise RuntimeError(f"Supabase request failed: {error.reason}") from error


def review_to_supabase_row(review: dict) -> dict:
    return {
        "id": review["id"],
        "item_id": review["itemId"],
        "item_type": review["itemType"],
        "author": review["author"],
        "created_at": review["createdAt"],
        "overall": review["overall"],
        "metric_a": review["metricA"],
        "metric_b": review["metricB"],
        "metric_c": review["metricC"],
        "tags": review["tags"],
        "comment": review["comment"],
    }


def review_from_supabase_row(row: dict) -> dict:
    return {
        "id": row.get("id", ""),
        "itemId": row.get("item_id", ""),
        "itemType": row.get("item_type", ""),
        "author": row.get("author", "Anonymous"),
        "createdAt": row.get("created_at", ""),
        "overall": row.get("overall", 0),
        "metricA": row.get("metric_a", 0),
        "metricB": row.get("metric_b", 0),
        "metricC": row.get("metric_c", 0),
        "tags": row.get("tags", []) or [],
        "comment": row.get("comment", ""),
    }


def report_to_supabase_row(report: dict) -> dict:
    return {
        "id": report["id"],
        "review_id": report["reviewId"],
        "item_id": report["itemId"],
        "reason": report["reason"],
        "created_at": report["createdAt"],
        "status": report["status"],
    }


def report_from_supabase_row(row: dict) -> dict:
    return {
        "id": row.get("id", ""),
        "reviewId": row.get("review_id", ""),
        "itemId": row.get("item_id", ""),
        "reason": row.get("reason", ""),
        "createdAt": row.get("created_at", ""),
        "status": row.get("status", "open"),
    }


def load_supabase_reviews() -> list[dict]:
    rows = call_supabase(
        f"/rest/v1/{SUPABASE_REVIEWS_TABLE}?select=*&order=created_at.desc,id.desc"
    )
    return [review_from_supabase_row(row) for row in rows]


def load_supabase_reports() -> list[dict]:
    rows = call_supabase(
        f"/rest/v1/{SUPABASE_REPORTS_TABLE}?select=*&order=created_at.desc,id.desc"
    )
    return [report_from_supabase_row(row) for row in rows]


def save_review(review: dict) -> None:
    if supabase_enabled():
        call_supabase(
            f"/rest/v1/{SUPABASE_REVIEWS_TABLE}",
            method="POST",
            payload=review_to_supabase_row(review),
            prefer="return=representation",
        )
        return

    reviews = load_anreview_reviews()
    reviews.insert(0, review)
    write_json_file(ANREVIEW_REVIEWS_PATH, reviews)


def save_report(report: dict) -> None:
    if supabase_enabled():
        call_supabase(
            f"/rest/v1/{SUPABASE_REPORTS_TABLE}",
            method="POST",
            payload=report_to_supabase_row(report),
            prefer="return=representation",
        )
        return

    reports = load_anreview_reports()
    reports.insert(0, report)
    write_json_file(ANREVIEW_REPORTS_PATH, reports)


def build_review_record(payload: dict) -> dict:
    comment = sanitize_text(str(payload.get("comment", "")), 600)
    if len(comment) < 20:
        raise ValueError("Comment must be at least 20 characters long.")

    item_id = sanitize_text(str(payload.get("itemId", "")), 80)
    item_type = sanitize_text(str(payload.get("itemType", "")), 20)
    if not item_id or item_type not in {"course", "academic"}:
        raise ValueError("Review must include a valid item target.")

    tags = [
        sanitize_text(str(tag), 24)
        for tag in payload.get("tags", [])
        if sanitize_text(str(tag), 24)
    ][:5]

    ratings = {}
    for field in ("overall", "metricA", "metricB", "metricC"):
        value = int(payload.get(field, 0))
        if value < 1 or value > 5:
            raise ValueError("Ratings must be between 1 and 5.")
        ratings[field] = value

    return {
        "id": f"shared-{datetime.now().strftime('%Y%m%d%H%M%S%f')}",
        "itemId": item_id,
        "itemType": item_type,
        "author": sanitize_text(str(payload.get("author", "Anonymous")) or "Anonymous", 40),
        "createdAt": datetime.now().date().isoformat(),
        "overall": ratings["overall"],
        "metricA": ratings["metricA"],
        "metricB": ratings["metricB"],
        "metricC": ratings["metricC"],
        "tags": tags,
        "comment": comment,
    }


def build_report_record(payload: dict) -> dict:
    review_id = sanitize_text(str(payload.get("reviewId", "")), 80)
    item_id = sanitize_text(str(payload.get("itemId", "")), 80)
    if not review_id or not item_id:
        raise ValueError("Report must include reviewId and itemId.")

    reason = sanitize_text(str(payload.get("reason", "Needs moderator review")), 180)
    return {
        "id": f"report-{datetime.now().strftime('%Y%m%d%H%M%S%f')}",
        "reviewId": review_id,
        "itemId": item_id,
        "reason": reason or "Needs moderator review",
        "createdAt": datetime.now().isoformat(timespec="seconds"),
        "status": "open",
    }


def fetch_html(url: str) -> str:
    request = Request(url, headers=REQUEST_HEADERS)
    with urlopen(request, timeout=20) as response:
        return response.read().decode("utf-8", errors="ignore")


def clean_html_text(value: str) -> str:
    text = re.sub(r"<[^>]+>", " ", unescape(value))
    return re.sub(r"\s+", " ", text).strip()


def load_bundled_catalog_snapshot() -> dict | None:
    if not BUNDLED_DATA_PATH.exists():
        return None

    raw = BUNDLED_DATA_PATH.read_text(encoding="utf-8").strip()
    if raw.startswith("window.ANREVIEW_DATA ="):
        raw = raw.split("=", 1)[1].strip()
    if raw.endswith(";"):
        raw = raw[:-1].strip()
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        return None

    courses = payload.get("courses") or []
    academics = payload.get("academics") or []
    if not courses or not academics:
        return None

    cbe_count = sum(1 for academic in academics if (academic.get("college") or "") == "CBE")
    law_count = sum(
        1
        for academic in academics
        if academic.get("schoolCode") in {"LAW", "CRAW", "REGN", "NSC", "NCEPH"}
        or (academic.get("college") or "") in {"ANU Law School", "ANU College of Law, Governance and Policy"}
    )
    cass_count = sum(
        1
        for academic in academics
        if (academic.get("college") or "").lower() in {"cass", "anu college of arts and social sciences"}
        or academic.get("schoolCode") == "CASS"
    )
    cap_count = sum(
        1
        for academic in academics
        if (academic.get("college") or "") == "ANU College of Asia and the Pacific"
        or academic.get("schoolCode") in {"CAP", "BELL", "CHL", "CIW"}
    )
    return {
        "version": CACHE_VERSION,
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "courses": courses,
        "academics": academics,
        "counts": {
            "courses": len(courses),
            "cbe": cbe_count,
            "law": law_count,
            "cass": cass_count,
            "cap": cap_count,
            "total": len(academics),
        },
    }

def build_catalog_payload() -> dict:
    bundled = load_bundled_catalog_snapshot()
    if not bundled:
        raise RuntimeError("Bundled catalogue snapshot is unavailable.")
    return bundled


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WORKSPACE_DIR), **kwargs)

    def end_headers(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path.startswith("/cbe-rating") or parsed.path.startswith("/api/anreview"):
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/":
            self.send_response(302)
            self.send_header("Location", "/cbe-rating/")
            self.end_headers()
            return
        if parsed.path == "/api/anreview/reviews":
            send_json(
                self,
                {
                    "reviews": load_anreview_reviews(),
                    "reportCount": len(load_anreview_reports()),
                    "generatedAt": datetime.now().isoformat(timespec="seconds"),
                },
            )
            return
        if parsed.path == "/api/anreview/catalog":
            try:
                send_json(self, build_catalog_payload())
            except Exception as error:  # pragma: no cover - network-dependent fallback
                stale = (
                    json.loads(ANREVIEW_CATALOG_CACHE_PATH.read_text(encoding="utf-8"))
                    if ANREVIEW_CATALOG_CACHE_PATH.exists()
                    else None
                )
                if stale:
                    stale["warning"] = str(error)
                    send_json(self, stale)
                    return
                bundled = load_bundled_catalog_snapshot()
                if bundled:
                    bundled["warning"] = str(error)
                    send_json(self, bundled)
                    return
                send_json(
                    self,
                    {
                        "courses": [],
                        "academics": [],
                        "counts": {"courses": 0, "cbe": 0, "law": 0, "cass": 0, "cap": 0, "total": 0},
                        "error": str(error),
                    },
                    status=503,
                )
            return
        super().do_GET()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        try:
            payload = read_request_json(self)
            if parsed.path == "/api/anreview/reviews":
                review = build_review_record(payload)
                save_review(review)
                send_json(self, {"ok": True, "review": review}, status=201)
                return

            if parsed.path == "/api/anreview/reports":
                report = build_report_record(payload)
                save_report(report)
                send_json(self, {"ok": True, "report": report}, status=201)
                return

            send_json(self, {"ok": False, "error": "Not found."}, status=404)
        except ValueError as error:
            send_json(self, {"ok": False, "error": str(error)}, status=400)
        except json.JSONDecodeError:
            send_json(self, {"ok": False, "error": "Invalid JSON body."}, status=400)


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), AppHandler)
    print(f"Serving ANReview at http://{HOST}:{PORT}/cbe-rating/")
    server.serve_forever()
