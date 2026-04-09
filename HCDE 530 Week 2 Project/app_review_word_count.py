"""Simple app review word-count demo.

This script reads reviews from reviews.csv, counts words in each review,
and prints summary statistics.
"""

import csv


filename = "reviews.csv"
reviews = []

with open(filename, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        reviews.append(row)


# Count words in a single review
def count_words(text):
    return len(text.split())


word_counts = []

print(f"{'Review #':<10} {'Words':<6} {'Text Preview'}")
print("-" * 70)

for row in reviews:
    review_id = row["review_id"]
    review = row["review_text"]
    words = count_words(review)
    word_counts.append(words)

    preview = review if len(review) <= 50 else review[:50] + "..."
    print(f"{review_id:<10} {words:<6} {preview}")


# Print summary stats across all reviews
print("\nSummary")
print("-" * 70)
print(f"Total reviews : {len(word_counts)}")
print(f"Shortest      : {min(word_counts)} words")
print(f"Longest       : {max(word_counts)} words")
print(f"Average       : {sum(word_counts) / len(word_counts):.1f} words")
