"""Pull category and helpful vote counts from the HCDE 530 Week 4 class API.

The service root (/) returns API metadata; review rows live at GET /reviews.
"""

from __future__ import annotations

import csv
import json
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

# Base URL from the assignment; review payloads are at /reviews.
BASE_URL = "https://hcde530-week4-api.onrender.com"
REVIEWS_URL = f"{BASE_URL}/reviews"

# Paginate so the script still works if the API lowers max ?limit=.
PAGE_SIZE = 100
OUTPUT_FILENAME = "category_helpful_votes.csv"


def fetch_reviews_page(offset: int, limit: int) -> dict:
    """Return parsed JSON for one page of reviews."""
    query = urllib.parse.urlencode({"offset": offset, "limit": limit})
    url = f"{REVIEWS_URL}?{query}"
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "HCDE530-Week4-Python/1.0"},
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_all_reviews() -> list[dict]:
    """Fetch every review, following offset pagination until total is reached."""
    all_reviews: list[dict] = []
    offset = 0
    total: int | None = None

    while True:
        payload = fetch_reviews_page(offset, PAGE_SIZE)
        reviews = payload.get("reviews") or []
        if total is None:
            total = int(payload.get("total", 0))

        if not reviews:
            break

        all_reviews.extend(reviews)
        offset += len(reviews)

        if total and offset >= total:
            break
        if len(reviews) < PAGE_SIZE:
            break

    return all_reviews


def main() -> None:
    out_dir = Path(__file__).resolve().parent
    out_path = out_dir / OUTPUT_FILENAME

    try:
        reviews = fetch_all_reviews()
    except urllib.error.URLError as exc:
        raise SystemExit(f"Could not reach API: {exc}") from exc

    rows: list[tuple[str, int]] = []
    for item in reviews:
        category = str(item.get("category", ""))
        votes = item.get("helpful_votes")
        if votes is None:
            votes = 0
        rows.append((category, int(votes)))

    # Print each row as requested.
    for category, helpful_votes in rows:
        print(f"{category}: {helpful_votes} helpful votes")

    with open(out_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["category", "helpful_votes"])
        writer.writerows(rows)

    print(f"\nWrote {len(rows)} rows to {out_path}")


if __name__ == "__main__":
    main()
