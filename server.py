from __future__ import annotations

import json
import os
import re
import tempfile
from datetime import datetime
from html import unescape
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import quote, urljoin, urlparse
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
BLOCKED_WORD_PATTERNS = [
    r"\bfuck(?:ing|ed|er|ers)?\b",
    r"\bshit(?:ty|ting|ted)?\b",
    r"\bbitch(?:es|y)?\b",
    r"\basshole?s?\b",
    r"\bcunt\b",
    r"\bdick(?:head)?s?\b",
    r"\bbastard(?:s)?\b",
    r"\bpiss(?:ed|ing)?\b",
]
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_PUBLISHABLE_KEY = os.environ.get("SUPABASE_PUBLISHABLE_KEY", "").strip()
SUPABASE_REVIEWS_TABLE = os.environ.get("SUPABASE_REVIEWS_TABLE", "anreview_reviews")
SUPABASE_REPORTS_TABLE = os.environ.get("SUPABASE_REPORTS_TABLE", "anreview_reports")
SUPABASE_PROFILES_TABLE = os.environ.get("SUPABASE_PROFILES_TABLE", "anreview_profiles")
GA_MEASUREMENT_ID = os.environ.get("GA_MEASUREMENT_ID", "").strip()


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


def public_config_payload() -> dict:
    return {
        "gaMeasurementId": GA_MEASUREMENT_ID,
        "supabaseUrl": SUPABASE_URL,
        "supabasePublishableKey": SUPABASE_PUBLISHABLE_KEY,
    }


def read_request_json(handler: SimpleHTTPRequestHandler) -> dict:
    content_length = int(handler.headers.get("Content-Length", "0"))
    raw_body = handler.rfile.read(content_length) if content_length > 0 else b"{}"
    return json.loads(raw_body.decode("utf-8"))


def sanitize_text(value: str, max_length: int) -> str:
    return re.sub(r"\s+", " ", value).strip()[:max_length]


def contains_blocked_language(value: str) -> bool:
    lowered = value.lower()
    return any(re.search(pattern, lowered) for pattern in BLOCKED_WORD_PATTERNS)


def supabase_enabled() -> bool:
    return bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)


def supabase_headers() -> dict[str, str]:
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
    }
    if "." in SUPABASE_SERVICE_ROLE_KEY:
        headers["Authorization"] = f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"
    return headers


def supabase_auth_headers(access_token: str) -> dict[str, str]:
    api_key = SUPABASE_PUBLISHABLE_KEY or SUPABASE_SERVICE_ROLE_KEY
    return {
        "apikey": api_key,
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }


def call_supabase(path: str, method: str = "GET", payload: dict | list | None = None, prefer: str | None = None) -> list | dict | str:
    request = Request(f"{SUPABASE_URL}{path}", method=method, headers=supabase_headers())
    if prefer:
        request.add_header("Prefer", prefer)
    if payload is not None:
        request.data = json.dumps(payload).encode("utf-8")
    try:
        with urlopen(request, timeout=20) as response:
            body = response.read().decode("utf-8")
            if not body:
                return {}
            try:
                return json.loads(body)
            except json.JSONDecodeError:
                return body
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Supabase request failed: {error.code} {detail or error.reason}") from error
    except URLError as error:
        raise RuntimeError(f"Supabase request failed: {error.reason}") from error


def call_supabase_auth(path: str, access_token: str) -> dict:
    request = Request(f"{SUPABASE_URL}{path}", method="GET", headers=supabase_auth_headers(access_token))
    try:
        with urlopen(request, timeout=20) as response:
            body = response.read().decode("utf-8")
            return json.loads(body) if body else {}
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Supabase auth request failed: {error.code} {detail or error.reason}") from error
    except URLError as error:
        raise RuntimeError(f"Supabase auth request failed: {error.reason}") from error


def extract_bearer_token(handler: SimpleHTTPRequestHandler) -> str:
    authorization = handler.headers.get("Authorization", "").strip()
    if authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    return ""


def normalize_profile_value(value: str, max_length: int) -> str:
    return sanitize_text(value, max_length)


def email_verified_from_user(auth_user: dict) -> bool:
    return bool(auth_user.get("email_confirmed_at") or auth_user.get("confirmed_at"))


def derive_verified_flag(email: str, email_is_verified: bool) -> bool:
    return email_is_verified and email.lower().endswith("@anu.edu.au")


def derive_user_profile(auth_user: dict, stored_profile: dict | None = None, profile_updates: dict | None = None) -> dict:
    stored_profile = stored_profile or {}
    profile_updates = profile_updates or {}
    metadata = auth_user.get("user_metadata") or {}
    email = normalize_profile_value(str(auth_user.get("email", "") or stored_profile.get("email", "")), 160)
    display_name = normalize_profile_value(
        str(
            profile_updates.get("displayName")
            or stored_profile.get("display_name")
            or metadata.get("display_name")
            or metadata.get("full_name")
            or metadata.get("name")
            or ""
        ),
        80,
    )
    username = normalize_profile_value(
        str(profile_updates.get("username") or stored_profile.get("username") or metadata.get("username") or ""),
        40,
    ).lower()
    phone = normalize_profile_value(
        str(profile_updates.get("phone") or stored_profile.get("phone") or metadata.get("phone") or ""),
        32,
    )
    email_is_verified = email_verified_from_user(auth_user)
    is_anu_verified = derive_verified_flag(email, email_is_verified)
    fallback_author = display_name or username or email.split("@", 1)[0] or "Anonymous"
    return {
        "id": auth_user.get("id", ""),
        "email": email,
        "display_name": display_name,
        "username": username,
        "phone": phone,
        "is_email_verified": email_is_verified,
        "is_anu_verified": is_anu_verified,
        "author": normalize_profile_value(fallback_author, 40) or "Anonymous",
    }


def ensure_unique_username(profile: dict, user_id: str) -> None:
    username = profile.get("username", "")
    if not username:
        return
    if not re.fullmatch(r"[a-z0-9._-]{3,40}", username):
        raise ValueError("Usernames must be 3-40 characters using letters, numbers, dots, underscores, or hyphens.")
    rows = call_supabase(
        f"/rest/v1/{SUPABASE_PROFILES_TABLE}?select=id,username&username=eq.{quote(username)}"
    )
    if isinstance(rows, list):
        for row in rows:
            if row.get("id") != user_id:
                raise ValueError("That username is already taken.")


def load_profile_row(user_id: str) -> dict | None:
    rows = call_supabase(
        f"/rest/v1/{SUPABASE_PROFILES_TABLE}?select=*&id=eq.{quote(user_id)}"
    )
    if isinstance(rows, list) and rows:
        return rows[0]
    return None


def upsert_profile(auth_user: dict, profile_updates: dict | None = None) -> dict:
    if not supabase_enabled():
        raise ValueError("Supabase auth is not configured.")
    user_id = sanitize_text(str(auth_user.get("id", "")), 80)
    if not user_id:
        raise ValueError("Authenticated user is missing an id.")
    stored_profile = load_profile_row(user_id)
    profile = derive_user_profile(auth_user, stored_profile, profile_updates)
    ensure_unique_username(profile, user_id)
    payload = {
        "id": user_id,
        "email": profile["email"],
        "display_name": profile["display_name"],
        "username": profile["username"],
        "phone": profile["phone"],
        "is_anu_verified": profile["is_anu_verified"],
        "updated_at": datetime.now().isoformat(timespec="seconds"),
    }
    result = call_supabase(
        f"/rest/v1/{SUPABASE_PROFILES_TABLE}",
        method="POST",
        payload=payload,
        prefer="resolution=merge-duplicates,return=representation",
    )
    if isinstance(result, list) and result:
        merged = dict(result[0])
        merged["author"] = profile["author"]
        merged["is_email_verified"] = profile["is_email_verified"]
        merged["is_anu_verified"] = profile["is_anu_verified"]
        return merged
    merged = dict(payload)
    merged["author"] = profile["author"]
    merged["is_email_verified"] = profile["is_email_verified"]
    return merged


def verify_supabase_user(access_token: str) -> tuple[dict, dict]:
    if not supabase_enabled():
        raise ValueError("Supabase auth is not configured.")
    if not access_token:
        raise ValueError("Authentication is required.")
    user = call_supabase_auth("/auth/v1/user", access_token)
    if not user.get("id"):
        raise ValueError("Unable to verify this login session.")
    profile = upsert_profile(user)
    return user, profile


def review_to_supabase_row(review: dict) -> dict:
    return {
        "id": review["id"],
        "item_id": review["itemId"],
        "item_type": review["itemType"],
        "author": review["author"],
        "user_id": review.get("userId") or None,
        "user_email": review.get("userEmail", ""),
        "display_name": review.get("displayName", ""),
        "username": review.get("username", ""),
        "is_anu_verified": bool(review.get("isAnuVerified", False)),
        "is_guest": bool(review.get("isGuest", True)),
        "created_at": review["createdAt"],
        "overall": review["overall"],
        "metric_a": review["metricA"],
        "metric_b": review["metricB"],
        "metric_c": review["metricC"],
        "semester": review.get("semester", ""),
        "taken_year": review.get("takenYear", ""),
        "academic_id": review.get("academicId", ""),
        "academic_name": review.get("academicName", ""),
        "upvotes": review.get("upvotes", 0),
        "downvotes": review.get("downvotes", 0),
        "tags": review["tags"],
        "comment": review["comment"],
    }


def review_from_supabase_row(row: dict) -> dict:
    return {
        "id": row.get("id", ""),
        "itemId": row.get("item_id", ""),
        "itemType": row.get("item_type", ""),
        "author": row.get("author", "Anonymous"),
        "userId": row.get("user_id", "") or "",
        "userEmail": row.get("user_email", "") or "",
        "displayName": row.get("display_name", "") or "",
        "username": row.get("username", "") or "",
        "isAnuVerified": bool(row.get("is_anu_verified", False)),
        "isGuest": bool(row.get("is_guest", True)),
        "createdAt": row.get("created_at", ""),
        "overall": row.get("overall", 0),
        "metricA": row.get("metric_a", 0),
        "metricB": row.get("metric_b", 0),
        "metricC": row.get("metric_c", 0),
        "semester": row.get("semester", "") or "",
        "takenYear": row.get("taken_year", "") or "",
        "academicId": row.get("academic_id", "") or "",
        "academicName": row.get("academic_name", "") or "",
        "upvotes": row.get("upvotes", 0) or 0,
        "downvotes": row.get("downvotes", 0) or 0,
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


def save_review(review: dict) -> dict:
    if supabase_enabled():
        result = call_supabase(
            f"/rest/v1/{SUPABASE_REVIEWS_TABLE}",
            method="POST",
            payload=review_to_supabase_row(review),
            prefer="return=representation"
        )
        if isinstance(result, list) and result:
            return review_from_supabase_row(result[0])
        return review

    reviews = load_anreview_reviews()
    reviews.insert(0, review)
    write_json_file(ANREVIEW_REVIEWS_PATH, reviews)
    return review


def save_report(report: dict) -> dict:
    if supabase_enabled():
        result = call_supabase(
            f"/rest/v1/{SUPABASE_REPORTS_TABLE}",
            method="POST",
            payload=report_to_supabase_row(report),
            prefer="return=representation"
        )
        if isinstance(result, list) and result:
            return report_from_supabase_row(result[0])
        return report

    reports = load_anreview_reports()
    reports.insert(0, report)
    write_json_file(ANREVIEW_REPORTS_PATH, reports)
    return report


def clear_all_reviews() -> None:
    if supabase_enabled():
        call_supabase(
            f"/rest/v1/{SUPABASE_REVIEWS_TABLE}?id=not.is.null",
            method="DELETE",
            prefer="return=minimal",
        )
        return
    ensure_anreview_storage()
    write_json_file(ANREVIEW_REVIEWS_PATH, [])


def clear_all_reports() -> None:
    if supabase_enabled():
        call_supabase(
            f"/rest/v1/{SUPABASE_REPORTS_TABLE}?id=not.is.null",
            method="DELETE",
            prefer="return=minimal",
        )
        return
    ensure_anreview_storage()
    write_json_file(ANREVIEW_REPORTS_PATH, [])


def find_review(review_id: str) -> dict | None:
    reviews = load_anreview_reviews()
    return next((review for review in reviews if review.get("id") == review_id), None)


def save_review_vote(review_id: str, direction: str) -> dict:
    if direction not in {"up", "down"}:
        raise ValueError("Vote direction must be 'up' or 'down'.")

    if supabase_enabled():
        rows = call_supabase(
            f"/rest/v1/{SUPABASE_REVIEWS_TABLE}?id=eq.{review_id}&select=*"
        )
        if not isinstance(rows, list) or not rows:
            raise ValueError("Review not found.")
        current = review_from_supabase_row(rows[0])
        current["upvotes"] = int(current.get("upvotes", 0))
        current["downvotes"] = int(current.get("downvotes", 0))
        if direction == "up":
            current["upvotes"] += 1
        else:
            current["downvotes"] += 1
        result = call_supabase(
            f"/rest/v1/{SUPABASE_REVIEWS_TABLE}?id=eq.{review_id}",
            method="PATCH",
            payload={
                "upvotes": current["upvotes"],
                "downvotes": current["downvotes"],
            },
            prefer="return=representation",
        )
        if isinstance(result, list) and result:
            return review_from_supabase_row(result[0])
        return current

    ensure_anreview_storage()
    reviews = load_anreview_reviews()
    for review in reviews:
        if review.get("id") == review_id:
            review["upvotes"] = int(review.get("upvotes", 0))
            review["downvotes"] = int(review.get("downvotes", 0))
            if direction == "up":
                review["upvotes"] += 1
            else:
                review["downvotes"] += 1
            write_json_file(ANREVIEW_REVIEWS_PATH, reviews)
            return review
    raise ValueError("Review not found.")


def build_review_record(payload: dict, auth_user: dict | None = None, profile: dict | None = None) -> dict:
    comment = sanitize_text(str(payload.get("comment", "")), 600)
    if contains_blocked_language(comment):
        raise ValueError("Swear words cannot be published.")

    item_id = sanitize_text(str(payload.get("itemId", "")), 80)
    item_type = sanitize_text(str(payload.get("itemType", "")), 20)
    if not item_id or item_type not in {"course", "academic"}:
        raise ValueError("Review must include a valid item target.")

    tags = [
        sanitize_text(str(tag), 24)
        for tag in payload.get("tags", [])
        if sanitize_text(str(tag), 24)
    ][:5]
    if any(contains_blocked_language(tag) for tag in tags):
        raise ValueError("Swear words cannot be published.")

    if auth_user and profile:
        author = normalize_profile_value(str(profile.get("author", "Anonymous")), 40) or "Anonymous"
    else:
        author = sanitize_text(str(payload.get("author", "Anonymous")) or "Anonymous", 40)
        if contains_blocked_language(author):
            raise ValueError("Swear words cannot be published.")

    semester = sanitize_text(str(payload.get("semester", "")), 20)
    if item_type == "course" and semester not in {"Summer", "Winter", "Semester 1", "Semester 2"}:
        raise ValueError("Course reviews must include a valid semester.")
    if item_type != "course":
        semester = ""

    taken_year = sanitize_text(str(payload.get("takenYear", "")), 4)
    if item_type == "course" and (not taken_year.isdigit() or not (2015 <= int(taken_year) <= 2100)):
        raise ValueError("Course reviews must include a valid year.")
    if item_type != "course":
        taken_year = ""

    academic_id = sanitize_text(str(payload.get("academicId", "")), 80) if item_type == "course" else ""
    academic_name = sanitize_text(str(payload.get("academicName", "")), 120) if item_type == "course" else ""

    ratings = {}
    for field in ("overall", "metricA", "metricB", "metricC"):
        value = float(payload.get(field, 0))
        if value < 1 or value > 10:
            raise ValueError("Ratings must be between 1 and 10.")
        ratings[field] = value

    return {
        "id": f"shared-{datetime.now().strftime('%Y%m%d%H%M%S%f')}",
        "itemId": item_id,
        "itemType": item_type,
        "author": author,
        "userId": auth_user.get("id", "") if auth_user else "",
        "userEmail": profile.get("email", "") if profile else "",
        "displayName": profile.get("display_name", "") if profile else "",
        "username": profile.get("username", "") if profile else "",
        "isAnuVerified": bool(profile.get("is_anu_verified", False)) if profile else False,
        "isGuest": not bool(auth_user),
        "createdAt": datetime.now().date().isoformat(),
        "overall": ratings["overall"],
        "metricA": ratings["metricA"],
        "metricB": ratings["metricB"],
        "metricC": ratings["metricC"],
        "semester": semester,
        "takenYear": taken_year,
        "academicId": academic_id,
        "academicName": academic_name,
        "upvotes": 0,
        "downvotes": 0,
        "tags": tags,
        "comment": comment,
    }


def update_review_record(existing_review: dict, payload: dict, auth_user: dict, profile: dict) -> dict:
    if not existing_review.get("userId") or existing_review.get("userId") != auth_user.get("id"):
        raise ValueError("You can only edit your own signed-in reviews.")
    updated = build_review_record(payload, auth_user=auth_user, profile=profile)
    updated["id"] = existing_review["id"]
    updated["createdAt"] = existing_review.get("createdAt", updated["createdAt"])
    updated["upvotes"] = int(existing_review.get("upvotes", 0))
    updated["downvotes"] = int(existing_review.get("downvotes", 0))
    return updated


def save_review_update(review_id: str, review: dict) -> dict:
    if supabase_enabled():
        result = call_supabase(
            f"/rest/v1/{SUPABASE_REVIEWS_TABLE}?id=eq.{quote(review_id)}",
            method="PATCH",
            payload=review_to_supabase_row(review),
            prefer="return=representation",
        )
        if isinstance(result, list) and result:
            return review_from_supabase_row(result[0])
        return review

    ensure_anreview_storage()
    reviews = load_anreview_reviews()
    for index, existing in enumerate(reviews):
        if existing.get("id") == review_id:
            reviews[index] = review
            write_json_file(ANREVIEW_REVIEWS_PATH, reviews)
            return review
    raise ValueError("Review not found.")


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


def profile_response_payload(auth_user: dict, profile: dict) -> dict:
    return {
        "id": auth_user.get("id", ""),
        "email": profile.get("email", ""),
        "displayName": profile.get("display_name", ""),
        "username": profile.get("username", ""),
        "phone": profile.get("phone", ""),
        "isEmailVerified": bool(profile.get("is_email_verified", False)),
        "isAnuVerified": bool(profile.get("is_anu_verified", False)),
        "author": profile.get("author", "Anonymous"),
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
            try:
                send_json(
                    self,
                    {
                        "reviews": load_anreview_reviews(),
                        "reportCount": len(load_anreview_reports()),
                        "generatedAt": datetime.now().isoformat(timespec="seconds"),
                    },
                )
            except Exception as error:
                send_json(
                    self,
                    {
                        "reviews": [],
                        "reportCount": 0,
                        "generatedAt": datetime.now().isoformat(timespec="seconds"),
                        "error": str(error) or "Unable to load review storage.",
                    },
                    status=503,
                )
            return
        if parsed.path == "/api/anreview/public-config":
            send_json(self, public_config_payload())
            return
        if parsed.path == "/api/anreview/profile":
            try:
                auth_user, profile = verify_supabase_user(extract_bearer_token(self))
                send_json(self, {"ok": True, "profile": profile_response_payload(auth_user, profile)})
            except Exception as error:
                send_json(self, {"ok": False, "error": str(error) or "Unable to load your profile."}, status=401)
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
            if parsed.path == "/api/anreview/admin/clear":
                provided_secret = self.headers.get("X-ANREVIEW-ADMIN", "")
                if not SUPABASE_SERVICE_ROLE_KEY or provided_secret != SUPABASE_SERVICE_ROLE_KEY:
                    send_json(self, {"ok": False, "error": "Forbidden."}, status=403)
                    return
                clear_all_reviews()
                clear_all_reports()
                send_json(self, {"ok": True}, status=200)
                return

            if parsed.path == "/api/anreview/reviews":
                access_token = extract_bearer_token(self)
                auth_user = None
                profile = None
                if access_token:
                    auth_user, profile = verify_supabase_user(access_token)
                review = build_review_record(payload, auth_user=auth_user, profile=profile)
                saved_review = save_review(review)
                send_json(self, {"ok": True, "review": saved_review}, status=201)
                return

            if parsed.path == "/api/anreview/reviews/update":
                access_token = extract_bearer_token(self)
                auth_user, profile = verify_supabase_user(access_token)
                review_id = sanitize_text(str(payload.get("reviewId", "")), 80)
                if not review_id:
                    raise ValueError("Review update must include reviewId.")
                existing_review = find_review(review_id)
                if not existing_review:
                    raise ValueError("Review not found.")
                updated_review = update_review_record(existing_review, payload, auth_user, profile)
                saved_review = save_review_update(review_id, updated_review)
                send_json(self, {"ok": True, "review": saved_review}, status=200)
                return

            if parsed.path == "/api/anreview/profile":
                access_token = extract_bearer_token(self)
                auth_user = call_supabase_auth("/auth/v1/user", access_token)
                profile = upsert_profile(auth_user, payload)
                send_json(self, {"ok": True, "profile": profile_response_payload(auth_user, profile)}, status=200)
                return

            if parsed.path == "/api/anreview/reports":
                report = build_report_record(payload)
                saved_report = save_report(report)
                send_json(self, {"ok": True, "report": saved_report}, status=201)
                return

            if parsed.path == "/api/anreview/reviews/vote":
                access_token = extract_bearer_token(self)
                verify_supabase_user(access_token)
                review_id = sanitize_text(str(payload.get("reviewId", "")), 80)
                direction = sanitize_text(str(payload.get("direction", "")), 8)
                if not review_id:
                    raise ValueError("Vote must include reviewId.")
                updated_review = save_review_vote(review_id, direction)
                send_json(self, {"ok": True, "review": updated_review}, status=200)
                return

            send_json(self, {"ok": False, "error": "Not found."}, status=404)
        except ValueError as error:
            send_json(self, {"ok": False, "error": str(error)}, status=400)
        except json.JSONDecodeError:
            send_json(self, {"ok": False, "error": "Invalid JSON body."}, status=400)
        except Exception as error:  # pragma: no cover - defensive API guard
            send_json(self, {"ok": False, "error": str(error) or "Unexpected server error."}, status=500)


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), AppHandler)
    print(f"Serving ANReview at http://{HOST}:{PORT}/cbe-rating/")
    server.serve_forever()
