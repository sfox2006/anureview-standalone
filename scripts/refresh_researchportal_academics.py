from __future__ import annotations

import json
import re
import time
import unicodedata
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date
from pathlib import Path
from typing import Any

import requests

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "cbe-rating" / "data.js"
SITEMAP_URL = "https://researchportalplus.anu.edu.au/sitemap/persons.xml"
USER_AGENT = "ANRevUAcademicRefresh/1.0 (+https://anureview-standalone.onrender.com)"
REQUEST_TIMEOUT = 30
MAX_WORKERS = 8

TITLE_PREFIXES = {
    "Prof ": "Professor",
    "A/Prof ": "Associate Professor",
    "AsPr ": "Associate Professor",
    "Dr ": "Academic",
    "Mr ": "",
    "Ms ": "",
    "Mrs ": "",
    "Miss ": "",
    "Mx ": "",
}

COLLEGE_LABELS = {
    "cbe": "ANU College of Business and Economics",
    "law": "ANU College of Law, Governance and Policy",
    "cass": "ANU College of Arts and Social Sciences",
    "cap": "ANU College of Asia and the Pacific",
    "csm": "ANU College of Science and Medicine",
    "css": "ANU College of Systems and Society",
}

KEYWORD_COLLEGES = [
    (
        "csm",
        [
            "science and medicine",
            "health and medicine",
            "physics",
            "chemistry",
            "biology",
            "astronomy",
            "earth sciences",
            "medical research",
            "medicine and psychology",
            "biochemistry",
            "biomedical",
            "climate and ocean geoscience",
            "john curtin school",
            "shine-dalgarno",
        ],
    ),
    (
        "css",
        [
            "systems and society",
            "computing",
            "cybernetics",
            "engineering",
            "mathematical sciences",
            "statistics",
            "environment & society",
            "environment and society",
            "public awareness of science",
            "school of art",
            "fenner",
        ],
    ),
    (
        "cap",
        [
            "asia and the pacific",
            "asia pacific",
            "coral bell",
            "culture, history and language",
            "china in the world",
            "pacific",
        ],
    ),
    (
        "law",
        [
            "law",
            "crawford",
            "regulation and global governance",
            "national security",
            "population health",
            "epidemiology",
            "public policy",
            "governance",
        ],
    ),
    (
        "cass",
        [
            "arts and social sciences",
            "sociology",
            "history",
            "philosophy",
            "demography",
            "anthropology",
            "archaeology",
            "music",
            "literature",
            "linguistics",
            "school of art and design",
            "school of politics",
            "international relations",
            "school of culture",
            "school of history",
            "school of philosophy",
            "school of sociology",
        ],
    ),
    (
        "cbe",
        [
            "business and economics",
            "economics",
            "accounting",
            "finance",
            "management",
            "actuarial",
            "business",
            "marketing",
        ],
    ),
]


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
    return text or "academic"


def school_code_for(name: str) -> str:
    tokens = re.findall(r"[A-Za-z0-9]+", name)
    if not tokens:
        return "ANU"
    stopwords = {"of", "and", "the", "anu", "school", "college", "centre", "center", "for", "research"}
    letters = [token[0].upper() for token in tokens if token.lower() not in stopwords]
    if not letters:
        letters = [token[0].upper() for token in tokens]
    return "".join(letters[:6]) or "ANU"


def read_payload() -> dict[str, Any]:
    text = DATA_PATH.read_text(encoding="utf-8")
    payload = text.split("=", 1)[1].rsplit(";", 1)[0].strip()
    return json.loads(payload)


def write_payload(payload: dict[str, Any]) -> None:
    payload["generatedAt"] = str(date.today())
    DATA_PATH.write_text(
        "window.ANREVIEW_DATA = " + json.dumps(payload, indent=2, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )


def build_existing_maps(payload: dict[str, Any]) -> tuple[dict[str, str], dict[str, str], dict[str, dict[str, Any]]]:
    school_to_college: dict[str, str] = {}
    school_to_code: dict[str, str] = {}
    url_to_academic: dict[str, dict[str, Any]] = {}
    for item in payload.get("academics", []):
        school = (item.get("school") or "").strip()
        college = (item.get("college") or "").strip()
        school_code = (item.get("schoolCode") or "").strip()
        profile_url = normalize_url(item.get("profileUrl") or "")
        if school and college:
            school_to_college.setdefault(school, college)
        if school and school_code:
            school_to_code.setdefault(school, school_code)
        if profile_url:
            url_to_academic[profile_url] = item
    for course in payload.get("courses", []):
        school = (course.get("school") or "").strip()
        college = (course.get("college") or "").strip()
        school_code = (course.get("schoolCode") or "").strip()
        if school and college:
            school_to_college.setdefault(school, college)
        if school and school_code:
            school_to_code.setdefault(school, school_code)
    return school_to_college, school_to_code, url_to_academic


def normalize_url(url: str) -> str:
    return url.rstrip("/").strip().lower()


def fetch_sitemap_urls() -> list[str]:
    response = requests.get(SITEMAP_URL, timeout=REQUEST_TIMEOUT, headers={"User-Agent": USER_AGENT})
    response.raise_for_status()
    root = ET.fromstring(response.text)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    return [loc.text.strip() for loc in root.findall(".//sm:loc", ns) if loc.text]


def infer_college(affiliations: list[str], school_to_college: dict[str, str]) -> str:
    for affiliation in affiliations:
        if affiliation in school_to_college:
            return school_to_college[affiliation]
    text = " ".join(affiliations).lower()
    for code, keywords in KEYWORD_COLLEGES:
        if any(keyword in text for keyword in keywords):
            return COLLEGE_LABELS[code]
    return "ANU College of Arts and Social Sciences"


def infer_school(affiliations: list[str]) -> str:
    for affiliation in affiliations:
        cleaned = affiliation.strip()
        if cleaned and cleaned != "The Australian National University" and not cleaned.startswith("ANU College of"):
            return cleaned
    for affiliation in affiliations:
        if affiliation.strip():
            return affiliation.strip()
    return "ANU Research Portal+"


def infer_position(name: str) -> str:
    for prefix, label in TITLE_PREFIXES.items():
        if name.startswith(prefix):
            return label
    return "Academic"


def build_tags(school: str, college: str) -> list[str]:
    tags = [slugify(school)]
    if college:
        tags.append(slugify(college).replace("anu-", ""))
    tags.append("research-portal")
    seen: list[str] = []
    for tag in tags:
        if tag and tag not in seen:
            seen.append(tag)
    return seen[:4]


def parse_profile(url: str, school_to_college: dict[str, str], school_to_code: dict[str, str]) -> dict[str, Any] | None:
    try:
        response = requests.get(url, timeout=REQUEST_TIMEOUT, headers={"User-Agent": USER_AGENT})
        response.raise_for_status()
    except Exception:
        return fallback_profile(url, school_to_college, school_to_code)

    html = response.text
    title_match = re.search(r"<title>\s*(.*?)\s*-\s*The Australian National University", html, re.S | re.I)
    name = re.sub(r"\s+", " ", title_match.group(1)).strip() if title_match else ""
    jsonld_match = re.search(
        r'<script type="application/ld\+json">\s*(\{.*?\})\s*</script>',
        html,
        re.S | re.I,
    )
    affiliations: list[str] = []
    if jsonld_match:
        try:
            data = json.loads(jsonld_match.group(1))
            for item in data.get("affiliation", []):
                if isinstance(item, dict):
                    org_name = (item.get("name") or "").strip()
                    if org_name:
                        affiliations.append(org_name)
        except Exception:
            pass
    if not affiliations:
        affiliations = [
            value.strip()
            for value in re.findall(
                r'<a[^>]+rel="Organisation"[^>]*>\s*<span>(.*?)</span>\s*</a>',
                html,
                re.S | re.I,
            )
            if value.strip()
        ]

    school = infer_school(affiliations)
    college = infer_college(affiliations, school_to_college)
    school_code = school_to_code.get(school) or school_code_for(school)
    display_name = name or title_from_slug(url)
    return {
        "id": f"anu-portal-{slugify(display_name)}",
        "type": "academic",
        "name": display_name,
        "position": infer_position(display_name),
        "focus": "ANU Research Portal+ profile",
        "school": school,
        "schoolCode": school_code,
        "college": college,
        "profileUrl": ensure_trailing_slash(url),
        "email": "",
        "office": "",
        "linkedCourses": [],
        "reviewMetrics": ["Clarity", "Support", "Engagement"],
        "tags": build_tags(school, college),
    }


def title_from_slug(url: str) -> str:
    slug = ensure_trailing_slash(url).rstrip("/").split("/")[-1]
    slug = slug.replace("-", " ")
    return " ".join(part.capitalize() for part in slug.split() if part)


def fallback_profile(url: str, school_to_college: dict[str, str], school_to_code: dict[str, str]) -> dict[str, Any]:
    school = "ANU Research Portal+"
    college = "ANU College of Arts and Social Sciences"
    school_code = school_to_code.get(school) or "ANU"
    display_name = title_from_slug(url)
    return {
        "id": f"anu-portal-{slugify(display_name)}",
        "type": "academic",
        "name": display_name,
        "position": "Academic",
        "focus": "ANU Research Portal+ profile",
        "school": school,
        "schoolCode": school_code,
        "college": college,
        "profileUrl": ensure_trailing_slash(url),
        "email": "",
        "office": "",
        "linkedCourses": [],
        "reviewMetrics": ["Clarity", "Support", "Engagement"],
        "tags": ["research-portal", "anu"],
    }


def ensure_trailing_slash(url: str) -> str:
    return url if url.endswith("/") else f"{url}/"


def refresh_academics() -> tuple[int, int]:
    payload = read_payload()
    school_to_college, school_to_code, url_to_academic = build_existing_maps(payload)
    sitemap_urls = [ensure_trailing_slash(url) for url in fetch_sitemap_urls()]
    existing_urls = {normalize_url(url) for url in url_to_academic}
    missing_urls = [url for url in sitemap_urls if normalize_url(url) not in existing_urls]

    new_academics: list[dict[str, Any]] = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {
            executor.submit(parse_profile, url, school_to_college, school_to_code): url
            for url in missing_urls
        }
        for index, future in enumerate(as_completed(futures), start=1):
            profile = future.result()
            if profile:
                new_academics.append(profile)
            if index % 250 == 0:
                print(f"Processed {index} / {len(missing_urls)} Research Portal profiles...")
                time.sleep(0.2)

    merged = payload.get("academics", []) + new_academics
    deduped: list[dict[str, Any]] = []
    seen_keys: set[str] = set()
    for academic in merged:
        key = normalize_url(academic.get("profileUrl") or "")
        if not key:
            key = slugify(academic.get("name") or "")
        if key in seen_keys:
            continue
        seen_keys.add(key)
        deduped.append(academic)

    deduped.sort(key=lambda item: (item.get("name") or "").lower())
    payload["academics"] = deduped
    sources = payload.get("sources", [])
    label = "ANU Research Portal+: Find Profiles sitemap"
    if not any(source.get("label") == label for source in sources if isinstance(source, dict)):
        sources.append(
            {
                "label": label,
                "url": "https://researchportalplus.anu.edu.au/sitemap/persons.xml",
            }
        )
    payload["sources"] = sources
    write_payload(payload)
    return len(new_academics), len(deduped)


if __name__ == "__main__":
    added, total = refresh_academics()
    print(f"Added {added} academics from the ANU Research Portal sitemap.")
    print(f"Academic total is now {total}.")
