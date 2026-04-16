import csv


WORD_TO_INT = {
    "zero": 0,
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10,
    "eleven": 11,
    "twelve": 12,
    "thirteen": 13,
    "fourteen": 14,
    "fifteen": 15,
    "sixteen": 16,
    "seventeen": 17,
    "eighteen": 18,
    "nineteen": 19,
}

TENS_TO_INT = {
    "twenty": 20,
    "thirty": 30,
    "forty": 40,
    "fifty": 50,
    "sixty": 60,
    "seventy": 70,
    "eighty": 80,
    "ninety": 90,
}


# This function safely turns text into an integer.
# It accepts digits (like "12") and number words (like "fifteen" or "forty two").
# If a value cannot be converted, it returns None instead of crashing.
def parse_int(value):
    """Convert numeric text or number words to int."""
    text = (value or "").strip().lower()
    if not text:
        return None

    if text.lstrip("-").isdigit():
        return int(text)

    if text in WORD_TO_INT:
        return WORD_TO_INT[text]

    # Support values like "twenty-one" or "forty two".
    normalized_text = text.replace("-", " ")
    parts = normalized_text.split()
    if len(parts) == 2 and parts[0] in TENS_TO_INT and parts[1] in WORD_TO_INT:
        return TENS_TO_INT[parts[0]] + WORD_TO_INT[parts[1]]

    if text in TENS_TO_INT:
        return TENS_TO_INT[text]

    return None


# Load the survey data from a CSV file
filename = "week3_survey_messy.csv"
rows = []

with open(filename, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    # This loop reads each survey row from the CSV and stores it in memory.
    for row in reader:
        rows.append(row)

# Count responses by role
# Normalize role names so "ux researcher" and "UX Researcher" are counted together
role_counts = {}

# This loop groups people by normalized role name and counts each role.
for row in rows:
    role = row["role"].strip().title()
    if role in role_counts:
        role_counts[role] += 1
    else:
        role_counts[role] = 1

print("Responses by role:")
# This loop prints the final role counts in alphabetical order by role name.
for role, count in sorted(role_counts.items()):
    print(f"  {role}: {count}")

# Calculate the average years of experience
total_experience = 0
valid_experience_count = 0
# This loop converts experience values to numbers and keeps only valid entries.
for row in rows:
    years = parse_int(row.get("experience_years"))
    if years is not None:
        total_experience += years
        valid_experience_count += 1

if valid_experience_count > 0:
    avg_experience = total_experience / valid_experience_count
    print(f"\nAverage years of experience: {avg_experience:.1f}")
else:
    print("\nAverage years of experience: no valid numeric data")

# Find the top 5 highest satisfaction scores
scored_rows = []
# This loop converts satisfaction scores and saves valid (name, score) pairs.
for row in rows:
    score = parse_int(row.get("satisfaction_score"))
    if score is not None:
        participant_name = (row.get("participant_name") or "").strip() or "Unknown"
        scored_rows.append((participant_name, score))

scored_rows.sort(key=lambda x: x[1], reverse=True)
top5 = scored_rows[:5]

print("\nTop 5 satisfaction scores:")
# This loop prints the highest 5 satisfaction scores after sorting.
for name, score in top5:
    print(f"  {name}: {score}")
