# Week 4 — Competency Claim: C1, C2, C3, C4, and C7

## Observations

This week helped me understand what APIs are, how they are structured, and how to actually use one in a Python script. I went from not knowing what an endpoint was to building a working script that retrieves real NASA imagery data and displays it in an HTML gallery.

### C4: API Use — retrieving and processing data from a web API

My main focus this week was building real fluency with APIs. I started with the class demo API (`hcde530-week4-api.onrender.com`) because it was simple and self-documenting. At first I was confused about what `/reviews` actually was — I didn't understand why a URL had a slash and a word after the domain. Through working with it, I came to understand that these are endpoints, and that the developer of the API deliberately chooses what endpoints exist, what parameters they accept, and what data they return.

From there I moved to a publicly available API I chose myself: the NASA Image and Video Library. I wrote a Python script that calls the API, filters results using query parameters, and extracts specific fields — `title`, `date_created`, and `description` — from a nested JSON response. I also went a step further and built an HTML gallery that reads the saved JSON and displays a random image each time the page loads.

### C2: Code Reading — understanding what each part of the script does

A big part of this week was reading and understanding code, not just running it. I had to trace through the structure of the API response to understand why data was nested inside `item["data"][0]` and how `item["links"][0]["href"]` gave me the image URL. I also learned why `.get()` is safer than direct key access — it prevents the script from crashing when a field is missing.

### C3: Data Handling — working with structured JSON data

Understanding JSON structure was one of the hardest parts of this week. I had to learn that what comes back from an API isn't a file — it's a Python dictionary that I can navigate with keys, and that nested structures require multiple levels of access. I also saved the extracted data to a `nasa_gallery.json` file and then read it back in the HTML, which helped me understand the full cycle of how data moves from an API to a usable format.

### C1: Vibe-coding and rapid prototyping

I used AI assistance throughout this week to build iteratively. I didn't start with a complete plan — I started with the basic API call, understood the output, then extended the script to save a JSON file, and finally built an HTML visualization on top of that. Each step built on the last, which is a prototyping mindset.

### C7: Critical Evaluation and Professional Judgment

I made deliberate choices about what to extract and why. Rather than dumping all the fields the API returns, I focused on three that would be meaningful to someone viewing the gallery: the image itself, the date it was taken, and NASA's description. This required thinking about the end experience, not just what was technically available.

### Concrete practices that helped

- **Using a simple API first:** Starting with the class demo API before moving to NASA gave me a mental model of how endpoints and parameters work before the stakes were higher.
- **Reading the raw JSON output:** Printing the full response before trying to extract fields helped me understand the actual structure rather than guessing.
- **Building incrementally:** Script first, then JSON export, then HTML — each step was small enough to debug but meaningful enough to feel like progress.

### Challenges

The hardest part was understanding nested JSON structure. When a response has multiple layers — a list inside a dictionary inside another dictionary — it's easy to get lost. I also found it challenging to understand what APIs are conceptually at first. The idea that there's no file sitting anywhere, that the server runs code and generates the response on the fly, took time to internalize.

### HCD Reflection

APIs feel like a purely technical topic — and honestly, the process of writing a script and parsing JSON doesn't feel like design work. But I think the connection to HCD becomes clear when you look at what you do with the data.

APIs make public data accessible to people who couldn't otherwise get it. Before this week, I wouldn't have known how to pull NASA's image archive programmatically. Now I can use public APIs to build tools for user research, surface patterns in data, or create experiences for people who would never touch the raw JSON themselves. The NASA gallery I built is a small example of this — the API returns structured metadata, but the HTML turns it into something a non-technical person could actually engage with.

That said, I do think there's a real gap between API literacy and design practice. Learning to use an API requires a baseline of technical knowledge that most users don't have. This makes me think the more important HCD question isn't "how do I use this API" but "how do I use what this API gives me to build something that serves a real human need." That's where the two fields meet.
