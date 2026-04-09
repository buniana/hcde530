import csv


# Load the CSV file
filename = "demo_responses.csv"
responses = []

with open(filename, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        responses.append(row)

# Count how many words are in one response string.
def count_words(response):
    """Count the number of words in a response string.

    Takes a string, splits it on whitespace, and returns the word count.
    Used to measure response length across all participants.
    """
    return len(response.split())

# Match a response to one or more themes using curated keywords.
def assign_themes(response, theme_keywords):
    """Return a list of matched themes for a response.

    We keep this simple and readable for learning:
    - convert text to lowercase
    - if any keyword for a theme appears, add that theme
    """
    text = response.lower()
    matched = []
    for theme, keywords in theme_keywords.items():
        if any(keyword in text for keyword in keywords):
            matched.append(theme)
    return matched


# Curated keywords for theme grouping.
# This is "automatic" because the script matches text for you,
# but "curated" because we choose the keywords intentionally.
THEME_KEYWORDS = {
    "Process & Timeline": [
        "sprint",
        "discovery",
        "timeline",
        "time",
        "schedule",
        "approved",
        "budget",
    ],
    "Research Operations": [
        "recruit",
        "participants",
        "sessions",
        "study",
        "diary",
        "interviews",
        "transcript",
    ],
    "Stakeholder Alignment": [
        "stakeholder",
        "engineers",
        "product",
        "senior",
        "team",
        "legal",
        "owner",
    ],
    "Synthesis & Decisions": [
        "synthesis",
        "findings",
        "themes",
        "deck",
        "decisions",
        "reports",
        "affinity",
    ],
    "Accessibility & Content": [
        "accessibility",
        "assistive",
        "language",
        "terminology",
        "content",
        "error messages",
        "plain language",
    ],
}


# Count words in each response and print a row-by-row summary
print(
    f"{'ID':<6} {'Role':<22} {'Words':<6} {'Themes':<28} {'Response (first 45 chars)'}"
)
print("-" * 120)

word_counts = []
theme_counts = {theme: 0 for theme in THEME_KEYWORDS}
unmatched_count = 0

for row in responses:
    participant = row["participant_id"]
    role = row["role"]
    response = row["response"]

    # Call our function to count words in this response
    count = count_words(response)
    word_counts.append(count)

    # Assign one or more themes based on curated keyword groups.
    themes = assign_themes(response, THEME_KEYWORDS)
    if themes:
        for theme in themes:
            theme_counts[theme] += 1
        theme_label = ", ".join(themes)
    else:
        unmatched_count += 1
        theme_label = "Uncategorized"

    # Truncate the response preview for display
    if len(response) > 45:
        preview = response[:45] + "..."
    else:
        preview = response

    print(f"{participant:<6} {role:<22} {count:<6} {theme_label:<28} {preview}")

# Print summary statistics
print()
print("── Summary ─────────────────────────────────")
print(f"  Total responses : {len(word_counts)}")
print(f"  Shortest        : {min(word_counts)} words")
print(f"  Longest         : {max(word_counts)} words")
print(f"  Average         : {sum(word_counts) / len(word_counts):.1f} words")
print()
print("── Theme counts (curated keyword grouping) ─")
for theme, count in sorted(theme_counts.items(), key=lambda item: item[1], reverse=True):
    print(f"  {theme:<24} {count}")
print(f"  {'Uncategorized':<24} {unmatched_count}")
