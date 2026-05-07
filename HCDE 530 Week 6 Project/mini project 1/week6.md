# Mini Project 1 — Competency Claim: C1, C3, C5, C7

## Observations

This project was the most structurally complex data work I have done in the course so far. Rather than starting with a single clean CSV, I had to work with a dataset spread across 35 student folders and 7 separate file types — each with different formats, timestamp conventions, and data quality issues. Before writing a single line of pandas code, I had to understand the dataset deeply enough to design a cleaning plan, decide which data streams were relevant to my three analytical questions, and figure out how to merge them into a structure that could actually answer those questions. The analysis itself — comparing stress across course groups and testing whether physical activity or sleep quality is a stronger predictor of student stress — only became possible once that foundation was in place.

---

### C3: Data handling through multi-file loading, cleaning, and merging

The most technically demanding part of this project was the data pipeline in Section 2. The SSAQS dataset has 35 student folders, each containing up to 7 CSV files. Loading all of them required iterating over student IDs and using `os.path.exists()` to handle students who were missing certain files — particularly students 3, 12, and 14, who had only a `daily_questions.csv` and no sensor data at all. These students were retained for the course-level stress comparison (Q1) but excluded from any analysis requiring sensor streams.

The timestamp problem was the most concrete challenge. Two different formats were present across the dataset: `daily_questions.csv` stored timestamps as Unix epoch seconds, while all sensor files (activity, sleep, oxygen, stress) used ISO 8601 strings — but even within ISO 8601, some files included milliseconds (e.g., `2025-05-12T07:59:28.463Z`) while others did not. These required different `pd.to_datetime()` arguments (`unit='s'` for epoch, `format='ISO8601'` for sensor files) and both were converted to UTC date for consistent daily-level merging.

Beyond timestamps, two other cleaning steps were required. First, oxygen SpO2 readings below 80% were identified as physiologically implausible sensor dropout and filtered out — roughly 22% of all raw oxygen readings. Second, the `stress.csv` files include a `CALCULATION_FAILED` flag, and a meaningful share of rows across students had this set to True (e.g., 10 out of 28 rows for Student 1). These were dropped before any device-computed stress values were used.

The final merge combined `daily_questions`, `activity_level`, and `sleep` data into a single per-day DataFrame using student ID and UTC date as join keys. Activity data required an additional reshaping step — computing the proportion of active minutes per day from minute-by-minute level records before it could be merged at the daily level. The result was a unified `daily` DataFrame with one row per student per day, ready for analysis in Section 3.

---

### C5: Visualization — producing labeled, finding-first charts

Section 4 produced two visualizations, each designed to communicate a finding rather than just display data.

The first chart is a grouped bar chart showing average self-reported stress and anxiety by course group (A1, A2, B). I chose a grouped bar chart because it makes two comparisons simultaneously visible: stress versus anxiety within each course, and each course against the others. The y-axis is fixed to 0–100 to reflect the actual survey scale and avoid visually inflating small differences. The chart demonstrates that course context is a real factor in student stress — the groups do not all share the same baseline.

The second chart is a line chart that plots average stress score across activity quartiles and sleep quartiles on the same axes, using color to distinguish the two behavioral predictors. This chart was specifically designed to answer the central question — which daily behavior is more strongly associated with lower stress — in a single visual. A steeper downward slope from Q1 to Q4 indicates a stronger association. Putting both lines on the same chart makes the comparison direct rather than requiring the reader to mentally compare two separate figures. Both charts include labeled axes, descriptive titles that state the finding, and interactive tooltips through Plotly.

---

### C1: Vibecoding and rapid prototyping

Vibecoding was present throughout this project, but in a more deliberate form than generating code from scratch. Before writing any pandas code, I used Claude to think through the data cleaning plan — describing the structure of the dataset (35 folders, 7 file types, inconsistent timestamps, incomplete participants) and working out which issues needed to be addressed and in what order. This planning conversation shaped the entire structure of Section 2: the decision to exclude students 3, 12, and 14 from sensor analyses, the order of loading and cleaning steps, and the logic for the daily-level merge all came out of that planning phase.

Once the plan was clear, I implemented it in Jupyter cell by cell — using the AI-generated structure as a blueprint and verifying that each step produced the expected output before moving on. This reflects a more mature use of vibecoding than simply asking for code: I described the problem, reasoned through the approach with AI support, and then took responsibility for the implementation and validation. The result is a notebook where the cleaning logic is documented, purposeful, and traceable back to specific data quality problems rather than being generated all at once without inspection.

---

### C7: Critical evaluation and professional judgment

The most important judgment calls in this project happened before any analysis ran. I had to evaluate the dataset carefully — understanding what each file contained, which columns were meaningful for my questions, and which data quality issues were significant enough to require cleaning versus minor enough to ignore. The decision to use self-reported stress from `daily_questions.csv` rather than the device-computed `STRESS_SCORE` from `stress.csv` was a deliberate one: too many rows had `CALCULATION_FAILED = True` for the device score to be reliable as a primary signal, while the self-reported scores were complete for all students.

Choosing which data streams to merge also required judgment. Seven file types were available, but only three — daily questions, activity level, and sleep — were directly relevant to my three analytical questions. Including the others would have added complexity without adding analytical value.

In the interpretation cells, I consistently flagged the difference between correlation and causation. A negative r between sleep score and stress could mean better sleep reduces stress, but it could equally mean that less-stressed students happen to sleep better — the data cannot distinguish between these. I also noted that the 35-student sample from a single institution limits how broadly the findings can be generalized. These are not disclaimers added for form — they reflect a genuine understanding that the value of an analysis depends on how honestly its limitations are communicated alongside its findings.

---

### Concrete practices that helped

- **Plan before coding:** Working out the cleaning logic in plain language before writing pandas code prevented structural mistakes that would have been harder to fix mid-pipeline.
- **Inspect each file type before loading all of them:** Checking one student's files first revealed the timestamp inconsistency and the CALCULATION_FAILED issue early, rather than discovering them as errors mid-run.
- **Reset index before merging:** Adding `reset_index(drop=True)` before cumulative operations avoided index mismatch errors that arose from chained groupby operations.
- **Use `os.path.exists()` for robustness:** Because not all students have all files, checking for file existence before loading prevented crashes and made the loading loop generalizable.

### Challenges

The biggest challenge was reasoning through the merge logic before implementing it. The dataset has multiple levels of granularity — minute-level activity records, daily sleep scores, and survey timestamps in epoch seconds — and all of them needed to land on a common date key before they could be combined. Getting this right required thinking carefully about what "the same day" means across different timezones and timestamp formats, and making the deliberate choice to normalize everything to UTC date rather than trying to handle timezone offsets per student.

### Where I want to grow next

The correlations in this project are cross-sectional — they compare stress and behavior on the same day. I want to explore lagged analyses next: does higher sleep quality on Monday predict lower stress on Tuesday? That would be a stronger argument for sleep as a causal factor rather than just a correlate. I also want to grow in **C6 (ML Evaluation)** — fitting a simple regression or classifier to predict stress from behavioral features would turn this exploratory analysis into a predictive one, and would give a more precise answer to the central question of which behavior matters most.
