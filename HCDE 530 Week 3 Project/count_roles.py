"""Clean responses and count role frequency.

This script first cleans responses.csv into responses_cleaned.csv,
then counts roles case-insensitively from the cleaned file and prints
results to the terminal.
"""

import csv
from collections import Counter
from clean_responses import clean_csv_data


def count_roles(input_file: str) -> None:
    """Count and print role totals from a CSV file."""
    role_counts = Counter()
    skipped_missing_name = 0
    processed_rows = 0

    with open(input_file, "r", encoding="utf-8", newline="") as infile:
        reader = csv.DictReader(infile)

        if reader.fieldnames is None:
            raise ValueError("Input CSV must include a header row.")

        for row in reader:
            name_value = (row.get("name") or "").strip()
            if not name_value:
                skipped_missing_name += 1
                continue

            role_value = (row.get("role") or "").strip()
            if role_value:
                normalized_role = role_value.upper()
                role_counts[normalized_role] += 1

            processed_rows += 1

    print("Role counts (case-insensitive):")
    if role_counts:
        for role, count in sorted(role_counts.items()):
            print(f"- {role}: {count}")
    else:
        print("- No role values found.")

    print(f"\nProcessed rows: {processed_rows}")
    print(f"Skipped rows with missing name: {skipped_missing_name}")


if __name__ == "__main__":
    RAW_INPUT_FILE = "responses.csv"
    CLEANED_OUTPUT_FILE = "responses_cleaned.csv"

    clean_csv_data(RAW_INPUT_FILE, CLEANED_OUTPUT_FILE)
    print(f"Cleaned data written to {CLEANED_OUTPUT_FILE}")
    count_roles(CLEANED_OUTPUT_FILE)
