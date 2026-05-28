# Week 5 — Competency Claim: C3, C5, C7

## Observations

This week focused on using pandas to explore and analyze structured datasets. I worked with two datasets — `app_reviews_demo.csv` (in-class activity) and `category_helpful_votes.csv` (homework notebook) — and used pandas operations to answer specific questions about each one.

---

### C3: Data Handling through loading, reshaping, and summarizing

Across both notebooks I used five pandas operations to systematically answer questions:

- `df.head()` and `df.info()` to inspect shape, column types, and completeness
- `df['helpful_votes'].value_counts()` to see how helpfulness ratings are distributed across reviews
- `df[df['helpful_votes'] >= 40]` to filter to the 86 most community-validated reviews
- `df.groupby('category')['helpful_votes'].mean()` to aggregate by tool type
- `df.isnull().sum()` to check for missing data

The homework dataset (`category_helpful_votes.csv`, 500 rows, 2 columns) was complete and clean — `isnull().sum()` returned 0 for both columns — which let me focus on the analytical operations without cleanup. The in-class dataset (`app_reviews_demo.csv`, 500 rows, 10 columns) had two incomplete columns (`device_type` missing 12.6%, `app_version` missing 22.2%), which made the missing value check more consequential.

The merge demo added a step not in the five-question activity: combining two tables on a shared key (`app_id`) so that review data and app metadata could be analyzed together — a common pattern when data is stored across multiple files.

**Key files:** `week5_inclass_activity.ipynb`, `week5_homework.ipynb`, `week5_merge_demo.ipynb`, `category_helpful_votes.csv`, `app_reviews_demo.csv`

---

### C5: Data Analysis with Pandas

`week5_homework.ipynb` loads `category_helpful_votes.csv` and answers five analytical questions. The most substantive result came from Question 4: grouping by tool category and computing average helpful votes showed that collaborative whiteboard tools (avg 25.1) and research repositories (avg 24.6) consistently get higher community validation than usability testing (22.0) or user research tools (21.9). That gap is likely because tool selection in those categories involves higher stakes — reviewers go into more depth, and readers find that detail more useful.

Question 3 (filtering to 40+ helpful votes) returned 86 rows. Collaborative whiteboard and user research entries appear frequently in that subset, which aligns with the groupby result — the same categories produce both the highest averages and the most individually outstanding reviews.

Question 5 confirmed the dataset is complete: 0 missing values in either column, so no rows needed to be dropped or filled before analysis.

**Key files:** `week5_inclass_activity.ipynb`, `week5_homework.ipynb`

---

### C7: Critical Evaluation and Professional Judgment

When AI generated the initial groupby code for Question 4, the first version sorted in ascending order — putting the lowest-performing category at the top. The numbers were correct but the ordering was the opposite of what's useful for identifying which category performs best. I caught this by reading the output before treating it as done and corrected the sort direction. This is a small example of a consistent pattern: AI produces syntactically correct code that still requires checking for analytical correctness.

In the in-class activity I also flagged that `app_version` being 22.2% missing is not a minor issue — silently dropping those rows would remove more than one in five records and meaningfully skew any version-based analysis. That consequence only shows up when you interpret the output rather than just run the cell.

**Key files:** `week5_inclass_activity.ipynb`, `week5_homework.ipynb`
