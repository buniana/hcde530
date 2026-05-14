# Mini Project 1 — Competency Claim: C1, C3, C5, C7

## Observations

This project was the most structurally complex data work I have done in the course so far. Rather than starting with a single clean CSV, I had to work with a dataset spread across 35 student folders and 7 separate file types — each with different formats, timestamp conventions, and data quality issues. Before writing a single line of pandas code, I had to understand the dataset deeply enough to design a cleaning plan, decide which data streams were relevant to my three analytical questions, and figure out how to merge them into a structure that could actually answer those questions. The analysis itself revealed that Course B students report roughly 10 points higher stress than A1 or A2 students (39.18 vs 29.28 and 27.49), while neither same-day physical activity (r = +0.082) nor same-day sleep quality (r = +0.018) showed a meaningful negative association with stress — a null result that raised its own interpretive questions about reverse causality and time-window effects.

---

### C3: Data handling through multi-file loading, cleaning, and merging

The most technically demanding part of this project was the data pipeline in Section 2. The SSAQS dataset has 35 student folders, each containing up to 7 CSV files. Loading all of them required iterating over student IDs and using `os.path.exists()` to handle students who were missing certain files — particularly students 3, 12, and 14, who had only a `daily_questions.csv` and no sensor data at all. These students were retained for the course-level stress comparison (Q1) but excluded from any analysis requiring sensor streams.

The timestamp problem was the most concrete challenge. Two different formats were present across the dataset: `daily_questions.csv` stored timestamps as Unix epoch seconds, while all sensor files (activity, sleep, oxygen, stress) used ISO 8601 strings — but even within ISO 8601, some files included milliseconds (e.g., `2025-05-12T07:59:28.463Z`) while others did not. These required different `pd.to_datetime()` arguments (`unit='s'` for epoch, `format='ISO8601'` for sensor files) and both were converted to UTC date for consistent daily-level merging.

Beyond timestamps, two other cleaning steps were required. First, oxygen SpO2 readings below 80% were identified as physiologically implausible sensor dropout and filtered out — roughly 22% of all raw oxygen readings. Second, the `stress.csv` files include a `CALCULATION_FAILED` flag, and a meaningful share of rows across students had this set to True (e.g., 10 out of 28 rows for Student 1). These were dropped before any device-computed stress values were used.

The final merge combined `daily_questions`, `activity_level`, and `sleep` data into a single per-day DataFrame using student ID and UTC date as join keys. Activity data required an additional reshaping step — computing the proportion of active minutes per day from minute-by-minute level records before it could be merged at the daily level. The result was a unified `daily` DataFrame with one row per student per day, ready for analysis in Section 3.

---

### C5: Visualization — producing labeled, finding-first charts

Section 4 produced two visualizations, each designed to communicate the actual finding rather than confirm an expectation.

The first chart is a grouped bar chart showing average self-reported stress and anxiety by course group (A1, A2, B). The chart makes the Course B gap immediately legible: its bars sit roughly 10 points above A1 and A2 on both measures, while A1 and A2 are nearly identical. The y-axis is fixed to 0–100 to reflect the actual survey scale and avoid visually exaggerating the differences. The title states the finding directly: "Course B Students Report ~10 Points Higher Stress and Anxiety Than A1 or A2."

The second chart is a line chart plotting average stress across activity quartiles and sleep quartiles on the same axes. The chart's title was revised from a directional claim to reflect the actual result: "Neither Daily Activity nor Sleep Quality Shows a Clear Same-Day Stress Association." Both lines are relatively flat and irregular rather than sloping downward — which visually confirms the near-zero Pearson correlations (r = +0.082 for activity, r = +0.018 for sleep). The chart rationale in the notebook explains that a flat or upward-trending line is itself the finding, not a visualization failure. Both charts include labeled axes, finding-first titles, and interactive Plotly tooltips, and were exported as static PNGs using kaleido for submission.

---

### Chart Justification

#### Chart 1 — Grouped bar chart: Stress and anxiety by course group (Q1)

**Research question answered:** How does stress differ by course context?

A grouped bar chart was the right choice here because Q1 involves comparing two separate numeric measures — stress and anxiety — across three categorical groups (A1, A2, B). Grouping the bars side by side makes two comparisons immediately readable at a glance: how stress and anxiety relate within each course, and how each course stacks up against the others. The y-axis is fixed to 0–100 to match the actual survey scale and prevent visually inflating differences.

This chart directly answers Q1 by showing that Course B has substantially higher average stress (39.18) and anxiety (38.48) than A1 (29.28 / 31.87) and A2 (27.49 / 30.16), while A1 and A2 are nearly identical to each other. The visual gap between Course B and the other two groups establishes that course context is a meaningful factor in student stress — not just individual variation.

#### Chart 2 — Multi-line chart: Average stress by behavioral quartile (Q2 + Q3)

**Research question answered:** Do same-day physical activity or sleep quality associate with lower student stress?

A line chart with markers was chosen because the x-axis represents an ordered scale (quartiles from lowest to highest behavior), and the slope of each line is itself the finding. Plotting both behavioral predictors on the same axes makes the comparison direct without requiring separate figures.

The chart communicates a null result: neither line slopes consistently downward from Q1 to Q4. The activity line (orange) rises from Q1 to Q3 before dipping slightly at Q4, and the sleep line (teal) is essentially flat with a slight bump at Q3 — matching the near-zero Pearson correlations from the analysis (r = +0.082 for activity, r = +0.018 for sleep). The title was deliberately set to reflect the actual data: "Neither Daily Activity nor Sleep Quality Shows a Clear Same-Day Stress Association." Reporting a null result clearly and visually is itself an act of professional judgment — the finding is that same-day measurement is insufficient, and a lagged design would be needed to answer the original question.

---

### C1: Vibecoding and rapid prototyping

Vibecoding was present throughout this project, but in a more deliberate form than generating code from scratch. Before writing any pandas code, I used Claude to think through the data cleaning plan — describing the structure of the dataset (35 folders, 7 file types, inconsistent timestamps, incomplete participants) and working out which issues needed to be addressed and in what order. This planning conversation shaped the entire structure of Section 2: the decision to exclude students 3, 12, and 14 from sensor analyses, the order of loading and cleaning steps, and the logic for the daily-level merge all came out of that planning phase.

Once the plan was clear, I implemented it in Jupyter cell by cell — using the AI-generated structure as a blueprint and verifying that each step produced the expected output before moving on. This reflects a more mature use of vibecoding than simply asking for code: I described the problem, reasoned through the approach with AI support, and then took responsibility for the implementation and validation. The result is a notebook where the cleaning logic is documented, purposeful, and traceable back to specific data quality problems rather than being generated all at once without inspection.

---

### C7: Critical evaluation and professional judgment

The most important judgment calls in this project happened before any analysis ran. I had to evaluate the dataset carefully — understanding what each file contained, which columns were meaningful for my questions, and which data quality issues were significant enough to require cleaning versus minor enough to ignore. The decision to use self-reported stress from `daily_questions.csv` rather than the device-computed `STRESS_SCORE` from `stress.csv` was a deliberate one: 19.2% of all device stress rows had `CALCULATION_FAILED = True`, making it unreliable as a primary signal, while the self-reported scores were complete for all 35 students.

The behavioral analyses in Q2 and Q3 produced null results — neither same-day activity (r = +0.082) nor same-day sleep quality (r = +0.018) predicted lower stress. Reporting this honestly, rather than selectively framing the weakly positive correlations as "almost negative," required professional judgment. The interpretation cells explain why the null result is still meaningful: it rules out same-day behavioral association as a simple explanation and points toward lagged effects and reverse causality as better hypotheses. The least active days actually had the lowest average stress (32.91 vs 36–37 for more active quartiles), which is a finding worth explaining rather than ignoring.

I also flagged that the Course B effect from Q1 could be confounding Q2 and Q3 — if Course B students are both more stressed and differently active than A1/A2 students, the between-group difference would contaminate a cross-group correlation. This kind of confounding is the reason why within-person or course-stratified analyses would be a necessary next step.

---

---

### Process Reflection — How I arrived at this project

**Why this topic:**
I chose to investigate student stress because it was something I experienced intensely during my own time in college. My starting questions were personal ones: does sleep quality actually help with stress, and are stress and anxiety connected to how students perform academically? Those questions drove the dataset search more than any technical criteria did.

**Finding the dataset:**
I found the SSAQS dataset (Garcia-Ceja et al., 2026) on Kaggle. It stood out because it combined two things most stress datasets have separately: real wearable sensor data and self-reported survey responses from the same students, collected over a full semester. Most datasets I looked at had one or the other — either objective signals or subjective reports — but not both linked at the individual level. That combination felt meaningful for the kind of questions I wanted to answer.

**Understanding the structure before writing any code:**
Once I extracted the ZIP archive, the dataset was more complex than I expected — 35 separate student folders, each with up to 7 different CSV files, each with its own timestamp format and data quality issues. Before writing a single line of pandas, I used Claude to work through what the cleaning plan should be: which students had incomplete data, what the two timestamp formats were and how to handle them, which of the 7 file types were actually relevant to my three questions, and in what order the steps needed to happen. That planning conversation became the blueprint for Section 2.

**The unexpected pivot — null results:**
The most significant moment in the project came after the analysis ran. I had expected both correlations — activity vs stress and sleep vs stress — to be negative, meaning more activity and better sleep would associate with lower stress. This is what most prior research suggests. Instead, both were near zero and slightly positive (r = +0.082 for activity, r = +0.018 for sleep). My first instinct was that something had gone wrong in the code. After checking the pipeline, the result held. Working through the interpretation with Claude, the likely explanation became clear: high-stress days may naturally involve more movement (walking to class, errands, campus busyness), making the same-day activity signal a consequence of stress rather than a remedy for it. Similarly, sleep effects on stress may be lagged — yesterday's sleep predicting today's stress — rather than same-day.

This required a full pivot in the framing. The chart titles changed from directional claims ("Sleep Quality Associates More Strongly with Lower Stress") to honest null findings ("Neither Daily Activity nor Sleep Quality Shows a Clear Same-Day Stress Association"). The Section 5 conclusions were rewritten to explain what the null result means rather than paper over it. That pivot — recognizing a null result, explaining it rather than dismissing it, and updating every part of the submission to reflect it — ended up being the most substantive C7 moment in the project.

**What I still want to know:**
One question I came in with — whether stress and anxiety are related to academic performance — couldn't be answered because the dataset has no grade or assignment data. That remains something I'd want to explore with a dataset that links behavioral and survey signals to actual course outcomes. I also want to run the analysis with a one-day lag (does sleep on day N predict stress on day N+1?) to test whether the null same-day result holds when the time window is shifted.

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
