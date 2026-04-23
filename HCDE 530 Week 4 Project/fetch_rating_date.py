"""Pull review rating and date from the HCDE 530 Week 4 class API.

The assignment base URL is the API host; review rows are returned from GET /reviews.
"""

from __future__ import annotations

import csv
import json
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

BASE_URL = "https://hcde530-week4-api.onrender.com"
REVIEWS_URL = f"{BASE_URL}/reviews"

PAGE_SIZE = 100
OUTPUT_FILENAME = "rating_date.csv"


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

    rows: list[tuple[int | str, str]] = []
    for item in reviews:
        rating = item.get("rating")
        if rating is None:
            rating = ""
        else:
            rating = int(rating)
        date_str = str(item.get("date", "") or "")
        rows.append((rating, date_str))

    with open(out_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["rating", "date"])
        writer.writerows(rows)

    print(f"Wrote {len(rows)} rows to {out_path}")


if __name__ == "__main__":
    main()
