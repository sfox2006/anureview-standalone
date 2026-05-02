from __future__ import annotations

import html
import json
import re
import time
import unicodedata
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Any

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "cbe-rating" / "data.js"
SEARCH_URL = "https://programsandcourses.anu.edu.au/search"
COURSE_ENDPOINT = "https://programsandcourses.anu.edu.au/data/CourseSearch/GetCourses"
REQUEST_HEADERS = {"User-Agent": "ANRevUCourseRefresh/1.0 (+https://anureview-standalone.onrender.com)"}
REQUEST_TIMEOUT = 45
PAGE_SIZE = 2000
MAX_WORKERS = 10


@dataclass
class CourseAggregate:
    code: str
    name: str = ""
    sessions_by_year: dict[int, set[str]] = field(default_factory=dict)
    careers_by_year: dict[int, set[str]] = field(default_factory=dict)
    modes_by_year: dict[int, set[str]] = field(default_factory=dict)
    units_by_year: dict[int, float] = field(default_factory=dict)

    def add(self, item: dict[str, Any]) -> None:
        year = int(item.get("Year") or 0)
        self.name = (item.get("Name") or self.name or "").strip()
        if year not in self.sessions_by_year:
            self.sessions_by_year[year] = set()
        if year not in self.careers_by_year:
            self.careers_by_year[year] = set()
        if year not in self.modes_by_year:
            self.modes_by_year[year] = set()
        for session in split_sessions(item.get("Session") or ""):
            self.sessions_by_year[year].add(session)
        career = (item.get("Career") or "").strip()
        if career:
            self.careers_by_year[year].add(career)
        mode = (item.get("ModeOfDelivery") or "").strip()
        if mode:
            self.modes_by_year[year].add(mode)
        units = item.get("Units")
        if units is not None:
            self.units_by_year[year] = float(units)

    @property
    def years(self) -> list[int]:
        return sorted(year for year in self.sessions_by_year if year)

    @property
    def latest_year(self) -> int:
        return max(self.years) if self.years else 0

    def latest_sessions(self) -> list[str]:
        return sorted(self.sessions_by_year.get(self.latest_year, set()))

    def latest_career(self) -> str:
        careers = sorted(self.careers_by_year.get(self.latest_year, set()))
        return careers[0] if careers else ""


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text.lower()).strip("-")
    return text or "course"


def split_sessions(value: str) -> list[str]:
    parts = [part.strip() for part in value.split("/") if part.strip()]
    normalized = [normalize_session_name(part) for part in parts]
    return normalized


def normalize_session_name(name: str) -> str:
    name = re.sub(r"\b20\d{2}\b", "", name).strip()
    replacements = {
        "Summer/Quarter 1": "Summer Session",
        "Autumn/Quarter 2": "Autumn Session",
        "Winter/Quarter 3": "Winter Session",
        "Spring/Quarter 4": "Spring Session",
        "First Semester": "First Semester",
        "Second Semester": "Second Semester",
        "Summer Session": "Summer Session",
        "Autumn Session": "Autumn Session",
        "Winter Session": "Winter Session",
        "Spring Session": "Spring Session",
    }
    return replacements.get(name, name)


def fetch_years() -> list[int]:
    html_text = requests.get(SEARCH_URL, timeout=REQUEST_TIMEOUT, headers=REQUEST_HEADERS).text
    years = sorted({int(match) for match in re.findall(r'&quot;Text&quot;:&quot;(20\d{2})&quot;', html_text)})
    return years or list(range(2014, date.today().year + 2))


def load_payload() -> dict[str, Any]:
    text = DATA_PATH.read_text(encoding="utf-8")
    return json.loads(text.split("=", 1)[1].rsplit(";", 1)[0].strip())


def write_payload(payload: dict[str, Any]) -> None:
    payload["generatedAt"] = str(date.today())
    DATA_PATH.write_text(
        "window.ANREVIEW_DATA = " + json.dumps(payload, indent=2, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )


def build_school_maps(payload: dict[str, Any]) -> tuple[dict[str, str], dict[str, str]]:
    school_to_college: dict[str, str] = {}
    school_to_code: dict[str, str] = {}
    for item in payload.get("courses", []):
        school = (item.get("school") or "").strip()
        college = (item.get("college") or "").strip()
        school_code = (item.get("schoolCode") or "").strip()
        if school and college:
            school_to_college.setdefault(school, college)
        if school and school_code:
            school_to_code.setdefault(school, school_code)
    return school_to_college, school_to_code


def collect_courses(years: list[int]) -> dict[str, CourseAggregate]:
    courses: dict[str, CourseAggregate] = {}
    for year in years:
        page_index = 0
        while True:
            response = requests.get(
                COURSE_ENDPOINT,
                params={"SelectedYear": year, "PageSize": PAGE_SIZE, "PageIndex": page_index},
                timeout=REQUEST_TIMEOUT,
                headers={**REQUEST_HEADERS, "X-Requested-With": "XMLHttpRequest"},
            )
            response.raise_for_status()
            data = response.json()
            items = data.get("Items") or []
            if not items:
                break
            for item in items:
                code = (item.get("CourseCode") or "").strip().upper()
                if not code:
                    continue
                aggregate = courses.setdefault(code, CourseAggregate(code=code))
                aggregate.add(item)
            if len(items) < PAGE_SIZE:
                break
            page_index += 1
        print(f"Collected course search results for {year}.")
    return courses


def course_urls(code: str, latest_year: int) -> list[tuple[str, bool]]:
    urls = [(f"https://programsandcourses.anu.edu.au/course/{code}", False)]
    if latest_year:
        urls.append((f"https://programsandcourses.anu.edu.au/{latest_year}/course/{code}", True))
    return urls


def clean_html_text(value: str) -> str:
    value = html.unescape(value or "")
    value = re.sub(r"<br\s*/?>", " ", value, flags=re.I)
    value = re.sub(r"</p>", " ", value, flags=re.I)
    value = re.sub(r"<[^>]+>", "", value)
    return re.sub(r"\s+", " ", value).strip()


def parse_course_details(code: str, aggregate: CourseAggregate, school_to_college: dict[str, str], school_to_code: dict[str, str], latest_catalogue_year: int) -> dict[str, Any]:
    html_text = ""
    used_historical_page = False
    final_url = ""
    for url, historical in course_urls(code, aggregate.latest_year):
        response = requests.get(url, timeout=REQUEST_TIMEOUT, headers=REQUEST_HEADERS)
        final_url = response.url
        if "Page not found" not in response.text:
            html_text = response.text
            used_historical_page = historical
            break
    summary = aggregate.name or code
    school = "ANU"
    college = ""
    level = "UGRD" if aggregate.latest_career().lower().startswith("under") else "PGRD"
    conveners: list[str] = []
    mode = ""
    if html_text:
        soup = BeautifulSoup(html_text, "html.parser")
        meta_summary = soup.find("meta", attrs={"name": "course-description"})
        if meta_summary and meta_summary.get("content"):
            summary = clean_html_text(meta_summary["content"])
        title_h1 = soup.find_all("h1")
        if len(title_h1) > 1:
            title = title_h1[1].get_text(" ", strip=True)
        else:
            title = aggregate.name or code
        fields: dict[str, list[str]] = {}
        for item in soup.select("li.degree-summary__code"):
            heading = item.select_one(".degree-summary__code-heading")
            if not heading:
                continue
            key = heading.get_text(" ", strip=True)
            values = [node.get_text(" ", strip=True) for node in item.select(".degree-summary__code-text")]
            cleaned = [value for value in values if value and not value.startswith("See Future Offerings")]
            if cleaned:
                fields.setdefault(key, []).extend(cleaned)
        school = first_value(fields.get("Offered by")) or school
        college = first_value(fields.get("ANU College")) or school_to_college.get(school, "")
        level = first_value(fields.get("Academic career")) or level
        conveners = dedupe_preserve(fields.get("Course convener") or [])
        mode = first_value(fields.get("Mode of delivery")) or ""
        subject = first_value(fields.get("Course subject")) or code_prefix(code)
        terms = dedupe_preserve(split_sessions(" / ".join(fields.get("Offered in") or []))) or aggregate.latest_sessions()
        school_code = school_to_code.get(school) or code_prefix(code)
        tags = build_tags(subject, school, level)
        return {
            "id": code.lower(),
            "type": "course",
            "code": code,
            "name": title,
            "college": college or infer_college_from_school(school),
            "school": school,
            "schoolCode": school_code,
            "level": normalize_level(level, aggregate.latest_career()),
            "terms": terms,
            "conveners": conveners,
            "handbookUrl": canonical_course_url(code, aggregate.latest_year, used_historical_page),
            "summary": summary,
            "tags": tags,
            "reviewMetrics": ["Course load", "Assessment design", "How interesting"],
        }

    latest_sessions = aggregate.latest_sessions()
    return {
        "id": code.lower(),
        "type": "course",
        "code": code,
        "name": aggregate.name or code,
        "college": "",
        "school": "ANU",
        "schoolCode": code_prefix(code),
        "level": normalize_level("", aggregate.latest_career()),
        "terms": latest_sessions,
        "conveners": [],
        "handbookUrl": canonical_course_url(code, aggregate.latest_year, True),
        "summary": summary,
        "tags": [code_prefix(code).lower()],
        "reviewMetrics": ["Course load", "Assessment design", "How interesting"],
    }


def code_prefix(code: str) -> str:
    match = re.match(r"[A-Z]+", code.upper())
    return match.group(0) if match else "ANU"


def canonical_course_url(code: str, year: int, historical: bool) -> str:
    if historical and year:
        return f"https://programsandcourses.anu.edu.au/{year}/course/{code}"
    return f"https://programsandcourses.anu.edu.au/course/{code}"


def first_value(values: list[str] | None) -> str:
    if not values:
        return ""
    for value in values:
        cleaned = re.sub(r"\s+", " ", value).strip()
        if cleaned:
            return cleaned
    return ""


def dedupe_preserve(values: list[str]) -> list[str]:
    seen: list[str] = []
    for value in values:
        cleaned = re.sub(r"\s+", " ", value).strip()
        if cleaned and cleaned not in seen:
            seen.append(cleaned)
    return seen


def normalize_level(raw_level: str, career_text: str) -> str:
    level = raw_level.strip().upper()
    if level in {"UGRD", "PGRD", "RSCH"}:
        return level
    career = career_text.lower()
    if "under" in career:
        return "UGRD"
    if "research" in career:
        return "RSCH"
    return "PGRD"


def infer_college_from_school(school: str) -> str:
    text = school.lower()
    if any(keyword in text for keyword in ["business", "economics", "accounting", "finance", "actuarial"]):
        return "ANU College of Business and Economics"
    if any(keyword in text for keyword in ["law", "governance", "policy", "crawford", "regulation", "security"]):
        return "ANU College of Law, Governance and Policy"
    if any(keyword in text for keyword in ["asia", "pacific", "china in the world", "coral bell", "language"]):
        return "ANU College of Asia and the Pacific"
    if any(keyword in text for keyword in ["science", "chemistry", "physics", "biology", "astronomy", "earth", "medicine", "medical"]):
        return "ANU College of Science and Medicine"
    if any(keyword in text for keyword in ["computing", "engineering", "cybernetics", "environment", "mathematical sciences", "statistics"]):
        return "ANU College of Systems and Society"
    return "ANU College of Arts and Social Sciences"


def build_tags(subject: str, school: str, level: str) -> list[str]:
    tags = [slugify(subject), slugify(school), "undergrad" if level == "UGRD" else "postgrad" if level == "PGRD" else "research"]
    return dedupe_preserve(tags)[:4]


def refresh_courses() -> tuple[int, int]:
    payload = load_payload()
    years = fetch_years()
    school_to_college, school_to_code = build_school_maps(payload)
    course_map = collect_courses(years)
    latest_catalogue_year = max(years)

    refreshed: list[dict[str, Any]] = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {
            executor.submit(parse_course_details, code, aggregate, school_to_college, school_to_code, latest_catalogue_year): code
            for code, aggregate in course_map.items()
            if aggregate.latest_year >= latest_catalogue_year
        }
        for index, future in enumerate(as_completed(futures), start=1):
            refreshed.append(future.result())
            if index % 250 == 0:
                print(f"Parsed {index} / {len(futures)} course pages...")
                time.sleep(0.2)

    refreshed.sort(key=lambda item: item["code"])
    payload["courses"] = refreshed
    source_label = "ANU Catalogue Search: all courses across all available years"
    if not any(source.get("label") == source_label for source in payload.get("sources", []) if isinstance(source, dict)):
        payload.setdefault("sources", []).append(
            {"label": source_label, "url": "https://programsandcourses.anu.edu.au/search"}
        )
    write_payload(payload)
    return len(refreshed), 0


if __name__ == "__main__":
    total, historical = refresh_courses()
    print(f"Refreshed {total} courses.")
    print(f"Historical/no-longer-offered courses flagged: {historical}.")
