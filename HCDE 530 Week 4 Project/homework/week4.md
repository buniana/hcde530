# Week 4 — Competency Claim: C4, C2, C3, C1, C7

## Observations

This week I went from not knowing what an endpoint was to building a working script that retrieves real NASA imagery data, saves it to a JSON file, and displays it in an HTML gallery.

---

### C4: API Use — retrieving and processing data from a web API

I called the NASA Image and Video Library API (`https://images-api.nasa.gov/search`) in `nasa_image.py`. This is a free public API — no key required, which I confirmed from the documentation before writing any code. I passed three parameters: `q="earth from space"`, `media_type="image"`, and `page_size=20`. The endpoint returns a nested JSON structure: results are inside `data["collection"]["items"]`, each item's metadata is in `item["data"][0]`, and the thumbnail image URL is separately in `item["links"][0]["href"]`.

I extracted five fields — `title`, `date_created`, `description`, `nasa_id`, and `center` — saved the cleaned records to `nasa_gallery.json`, and built `nasa_gallery.html` to display a random image each page load. Before the NASA script I worked through the class demo API (`hcde530-week4-api.onrender.com`) first, which gave me a mental model of endpoints and parameters before the stakes were higher.

---

### C2: Code Literacy — reading and explaining why, not just what

The inline comments in `nasa_image.py` explain decisions, not just operations. For example: the comment on `.get()` explains that direct key access (`item["data"][0]["title"]`) would crash if a field is missing, while `.get("title", "No title available")` returns a safe fallback instead. The comment on `data["collection"]["items"]` explains the nesting path so a reader can follow the JSON structure without making a live API call. The note on `date[:10]` explains why only the first ten characters are kept — to strip the time portion and keep only `YYYY-MM-DD`.

---

### C3: Data Handling — navigating and saving structured JSON

The API response is a Python dictionary generated on the fly — not a file. Understanding the nesting was the core challenge: metadata and image URL live in different parts of the same item object (`item["data"][0]` vs `item["links"][0]["href"]`). I read the actual JSON structure by printing `items[0]` before writing the extraction loop. The cleaned records are saved to `nasa_gallery.json` and read back in `nasa_gallery.html` — completing the full cycle from API call to usable output.

---

### C1: Vibecoding and Rapid Prototyping

I built this iteratively with AI assistance, one step at a time: first just the raw API call and printed response, then the field extraction loop, then the JSON export, then the HTML gallery. I didn't ask for everything at once. At each step I read the output before moving to the next — that's how I caught that the image URL lives in `item["links"]` separately from the metadata in `item["data"]`, which the first AI-generated version had wrong. The HTML gallery (`nasa_gallery.html`) was the final output of that iteration — it reads from the saved JSON and requires no live API call to display results.

---

### C7: Critical Evaluation and Professional Judgment

When AI generated the field extraction loop, the first version used direct key access without fallbacks. I recognized this as fragile — a single item missing a `title` field would crash the loop mid-run and lose everything collected so far. I asked the AI to switch to `.get()` with default values, then confirmed in the output that sparse records were handled rather than causing errors. I also chose to leave out fields the API returns that weren't relevant to the gallery — `keywords`, `album`, and `secondary_creator` were in the response but would have cluttered the JSON without adding anything to the display. That selective extraction required reading the full response structure and making a deliberate judgment call about what a gallery viewer actually needs.
