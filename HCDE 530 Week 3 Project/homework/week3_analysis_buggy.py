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
    """Count how many survey responses report each primary tool.

    Returns a dictionary mapping each tool name (title-cased) to the number
    of survey responses that listed it as their primary tool. Responses with
    a missing or empty tool name are grouped under \"Unknown\".
    """
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


def export_figma_users(survey_rows, input_filename, output_filename="week3_figma_only.csv"):
    """Extract all Figma users from survey data and write them to a new CSV file.

    Iterates over the provided survey rows and keeps only rows where the
    "primary_tool" field normalizes to "Figma" (case-insensitive, whitespace
    stripped). The matching rows are written to a new CSV file using the same
    column headers as the original file.

    Args:
        survey_rows (list[dict]): A list of row dictionaries as returned by
            csv.DictReader, representing the full survey dataset.
        input_filename (str): Path to the original CSV file, used to read the
            fieldnames for the output file header.
        output_filename (str): Path for the output CSV file containing only
            Figma users. Defaults to "week3_figma_only.csv".

    Returns:
        list[dict]: The list of rows where the primary tool is Figma.
    """
    figma_rows = [
        row for row in survey_rows
        if (row.get("primary_tool") or "").strip().lower() == "figma"
    ]

    with open(input_filename, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames

    with open(output_filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(figma_rows)

    print(f"\nFigma users written to '{output_filename}' "
          f"({len(figma_rows)} rows).")

    return figma_rows


def summarize_data(rows):
    """Return a plain-language summary of key statistics for the given rows.

    Computes two metrics from the provided dataset:
    - Total number of rows (responses).
    - Number of rows where the "participant_name" field is missing or blank.

    Args:
        rows (list[dict]): A list of row dictionaries, typically as returned by
            csv.DictReader or by export_figma_users.

    Returns:
        str: A multi-line plain-language summary string ready to be printed.
    """
    row_count = len(rows)

    empty_name_count = sum(
        1 for row in rows
        if not (row.get("participant_name") or "").strip()
    )

    summary_lines = [
        f"Total responses: {row_count}",
        f"Responses with missing name: {empty_name_count}",
    ]
    return "\n".join(summary_lines)


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

# Extract Figma users and export them to a new CSV file.
figma_rows = export_figma_users(rows, filename)

# Print a plain-language summary of the Figma-user data.
print("\nSummary of Figma user data:")
print(summarize_data(figma_rows))
