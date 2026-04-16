"""Clean response data from responses.csv.

This script removes rows with an empty "name" field, capitalizes all values
in the "role" column, and writes the cleaned data to responses_cleaned.csv.
"""

import csv


# This function reads the input CSV, removes rows with blank names,
# normalizes role values to uppercase, and stores cleaned rows.
def clean_csv_data(input_file: str, output_file: str) -> None:
    """Read CSV input, clean rows, and write cleaned output."""
    with open(input_file, "r", encoding="utf-8", newline="") as infile:
        reader = csv.DictReader(infile)

        if reader.fieldnames is None:
            raise ValueError("Input CSV must include a header row.")

        fieldnames = reader.fieldnames
        cleaned_rows = []

        # Loop through each row and keep only rows with a non-empty name.
        # For kept rows, convert the role text to uppercase for consistency.
        for row in reader:
            name_value = (row.get("name") or "").strip()
            if not name_value:
                continue

            if "role" in row and row["role"] is not None:
                row["role"] = row["role"].upper()

            cleaned_rows.append(row)

    # Write the original header plus all cleaned rows to the output CSV file.
    with open(output_file, "w", encoding="utf-8", newline="") as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(cleaned_rows)


if __name__ == "__main__":
    INPUT_FILE = "responses.csv"
    OUTPUT_FILE = "responses_cleaned.csv"
    clean_csv_data(INPUT_FILE, OUTPUT_FILE)
    print(f"Cleaned data written to {OUTPUT_FILE}")
