import csv

# This dictionary maps number words to their integer values.
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

# This dictionary maps tens number words to their integer values.
# It supports values like "twenty" or "thirty".
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


# This function counts how many people use each primary tool.
# It normalizes tool names so small text differences are grouped together.
def count_primary_tools(survey_rows):
    """Count how many survey responses report each primary tool."""
    tool_counts = {}

    for row in survey_rows:
        tool = (row.get("primary_tool") or "").strip().title()
        if not tool:
            tool = "Unknown"

        if tool in tool_counts:
            tool_counts[tool] += 1
        else:
            tool_counts[tool] = 1

    return tool_counts


# Load the survey data from a CSV file
filename = "week3_survey_messy.csv"
rows = []

with open(filename, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        rows.append(row)

# Count responses by role
# Normalize role names so "ux researcher" and "UX Researcher" are counted together
role_counts = {}

for row in rows:
    role = row["role"].strip().title()
    if role in role_counts:
        role_counts[role] += 1
    else:
        role_counts[role] = 1

print("Responses by role:")
for role, count in sorted(role_counts.items()):
    print(f"  {role}: {count}")

# Count and print how many people use each primary tool.
primary_tool_counts = count_primary_tools(rows)
print("\nResponses by primary tool:")
for tool, count in sorted(primary_tool_counts.items()):
    print(f"  {tool}: {count}")

# Calculate the average years of experience
total_experience = 0
valid_experience_count = 0
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
for row in rows:
    score = parse_int(row.get("satisfaction_score"))
    if score is not None:
        participant_name = (row.get("participant_name") or "").strip() or "Unknown"
        scored_rows.append((participant_name, score))

scored_rows.sort(key=lambda x: x[1], reverse=True)
top5 = scored_rows[:5]

# This loop prints the highest 5 satisfaction scores after sorting.
print("\nTop 5 satisfaction scores:")
for name, score in top5:
    print(f"  {name}: {score}")
