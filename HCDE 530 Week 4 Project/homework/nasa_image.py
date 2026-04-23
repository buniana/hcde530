import requests
import json

# The base URL for the NASA Image and Video Library API
# No API key needed — this is a free, public API
BASE_URL = "https://images-api.nasa.gov/search"

# Parameters tell the API what we want:
# - q: the search query (what we're looking for)
# - media_type: we only want images, not videos or audio
# - page_size: how many results to return (more = more variety on refresh)
params = {
    "q": "earth from space",
    "media_type": "image",
    "page_size": 20
}

# Make a GET request to the NASA API with our parameters
# This sends: https://images-api.nasa.gov/search?q=earth+from+space&media_type=image&page_size=20
response = requests.get(BASE_URL, params=params)

# Convert the raw response text into a Python dictionary we can work with
data = response.json()

# The results are nested inside data > collection > items
# Each item has a "data" key which is a list containing the metadata
items = data["collection"]["items"]

print(f"Found {len(items)} results for 'earth from space'\n")
print("=" * 50)

# This list will store the cleaned up data we want to save
gallery = []

# Loop through each result and extract the fields we care about
for item in items:

    # metadata is stored inside item["data"][0]
    # it's a list but always has one element, so we grab index [0]
    info = item["data"][0]

    # Extract fields — we use .get() so it won't crash if a field is missing
    title = info.get("title", "No title available")
    date = info.get("date_created", "")
    description = info.get("description", "No description available")
    nasa_id = info.get("nasa_id", "")
    center = info.get("center", "Unknown center")

    # The image URL lives separately in item["links"]
    # links[0]["href"] gives us the thumbnail image URL
    image_url = ""
    if "links" in item:
        image_url = item["links"][0].get("href", "")

    # Only include items that actually have an image URL
    if image_url:
        gallery.append({
            "title": title,
            "date": date[:10] if date else "Unknown date",  # just YYYY-MM-DD
            "description": description,
            "nasa_id": nasa_id,
            "center": center,
            "image_url": image_url
        })

        # Print a summary of each item
        print(f"Title:    {title}")
        print(f"Date:     {date[:10] if date else 'Unknown'}")
        print(f"Center:   {center}")
        print(f"Image:    {image_url}")
        print("-" * 50)

# Save the gallery data to a JSON file
# This is what the HTML file will read to display the images
with open("nasa_gallery.json", "w") as f:
    json.dump(gallery, f, indent=4)

print(f"\nSaved {len(gallery)} images to nasa_gallery.json")
print("Open nasa_gallery.html in your browser to see the gallery!")