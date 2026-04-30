# Week 5 — Competency Claim: C1, C3, C5, C7

## Observations

This week focused on using pandas to explore and analyze structured datasets. I worked with two datasets — `app_reviews_demo.csv` (used during the in-class activity) and `category_helpful_votes.csv` (used in the homework notebook) — and ran a series of operations to understand their shape, distributions, and patterns. The merge demo also introduced a new technique for combining two tables that each hold partial information.

---

### C1: Vibecoding and rapid prototyping

The Jupyter notebooks this week were built using AI-assisted vibe-coding. I described what I wanted in plain English — for example, "show me the average helpful votes grouped by category, sorted from highest to lowest" — and used that description to generate working pandas code. The result was a functioning, runnable notebook (`week5_homework.ipynb`) without having to write every line from scratch.

This competency also showed up in the merge demo (`week5_merge_demo.ipynb`), where the notebook demonstrates exactly how to write a strong prompt to an AI agent: stating both DataFrame names, listing their columns, naming the shared join key, and specifying the join type. That precision is what makes vibe-coding reliable rather than hit-or-miss.

**Key files:** `week5_homework.ipynb`, `week5_merge_demo.ipynb`

---

### C3: Data handling through loading, reshaping, and summarizing

Across both the in-class activity and the homework notebook, I used pandas to load CSV files and systematically answer questions about the data:

- `df.head()` and `df.info()` to inspect shape, column types, and completeness
- `df['column'].value_counts()` to summarize how values are distributed
- Boolean filtering (`df[df['helpful_votes'] >= 40]`) to isolate a meaningful subset
- `df.groupby('category')['helpful_votes'].mean()` to aggregate numeric values by group
- `df.isnull().sum()` to identify and quantify missing values

The homework dataset (`category_helpful_votes.csv`, 500 rows, 2 columns) was simple and clean, which let me practice each operation clearly. The in-class dataset (`app_reviews_demo.csv`, 500 rows, 10 columns) was richer and more realistic — it had two incomplete columns (`device_type` missing 12.6%, `app_version` missing 22.2%), which made the missing value check more meaningful.

The merge demo added a reshaping step not covered in the five-question activity: combining two tables on a shared key (`app_id`) so that review data and app metadata could be analyzed together. This is a common real-world pattern whenever data is stored across multiple files.

**Key files:** `week5_inclass_activity.ipynb`, `week5_homework.ipynb`, `week5_merge_demo.ipynb`, `category_helpful_votes.csv`, `app_reviews_demo.csv`

---

### C5: Visualization — Producing clear, labeled summaries of data patterns

This is the most directly practiced competency this week. Each notebook produces outputs that make data patterns visible, and every output is paired with a markdown cell that labels and explains what it shows. This combination — a clear output plus a plain-English interpretation — is the core of producing a useful data visualization.

Specific examples:

**Rating distribution table** (in-class activity, Question 2): A count-and-percentage table showing that 5-star reviews make up 41.4% of the dataset and 1-star reviews only 5.8%. The markdown cell below it explains the positivity skew and why this matters: "a 'low' average of 3.67 actually represents a meaningful drop from the norm." A raw number without this framing looks different to a UX researcher than it does to someone familiar with skewed review datasets.

**Average rating by app** (in-class activity, Question 4): A grouped mean table showing Dovetail at 4.12 and Fieldkit at 3.67. The interpretation cell notes that all five apps have similar review counts (89–121), so the difference in means is not simply a sample-size effect — a detail that matters when deciding whether to act on the finding.

**Missing value summary** (in-class activity, Question 5): A two-row table showing exactly which columns are incomplete and by what percentage. The markdown cell explains the practical consequence: dropping `app_version` rows silently would remove 22% of the data, which is not a safe default.

**Helpful votes by category** (homework, Question 4): A sorted grouped-mean table showing which tool category tends to generate the most community-validated reviews. The markdown explanation connects this back to what the numbers might mean in a UX context — higher stakes in tool selection, more detailed review content, or a more engaged reviewer base.

The through-line across all of these is that a table or aggregation alone is not a visualization in the useful sense — it becomes one when it is labeled, sorted, and accompanied by an explanation of what the reader should take away. Every output in both notebooks follows this pattern.

**Key files:** `week5_inclass_activity.ipynb`, `week5_homework.ipynb`

---

### C7: Critical evaluation and professional judgment

Across both notebooks, the markdown interpretation cells required me to think past the output and ask: what does this actually mean for a UX researcher or product team? This is not automatic — pandas returns numbers, and translating numbers into insight requires judgment.

A few specific moments where this showed up:

- Recognizing that the positivity skew in ratings means averages are not neutral — a 3.67 average signals real dissatisfaction in a dataset where the typical score is 4+.
- Noting that the 72 negative reviews (14.4%) are disproportionately important relative to their volume, because they tend to name specific, actionable friction points.
- Flagging that `app_version` being 22.2% missing is not a minor data quality issue — it is large enough to meaningfully affect any version-based analysis and should not be silently dropped.
- In the merge demo, applying professional judgment to explain *when* to use a merge: when data is split across files with a shared key, which is a common real-world pattern in participant data, survey results, and tool logs.

**Key files:** `week5_inclass_activity.ipynb`, `week5_homework.ipynb`

---

### Challenges

The main challenge was making the interpretation cells genuinely useful rather than just restating the output. It's easy to write "Dovetail has the highest average rating (4.12)" — it's harder to add the next sentence that explains why that matters or what caveat a reader should keep in mind. That second sentence is where the C7 judgment actually lives.

---

### Where I want to grow next

C5 felt partial this week because the "visualizations" were tabular summaries rather than charts. Next, I want to produce actual plots — bar charts, histograms, or scatter plots — using matplotlib or seaborn, with proper axis labels and titles. That would make the C5 demonstration more complete and would be useful for any future MP work where data needs to be communicated visually to an audience rather than just read in a notebook.
