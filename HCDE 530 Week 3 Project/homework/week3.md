# Week 3 — Competency Claim: C3 Data Handling and C7 Critical Evaluation

## Observations

This week helped me understand debugging and the basic structure of Python code more clearly, especially what a function does and what `return` means in practice.

### C3: Data handling through cleaning and iteration

In this week’s assignment, I used vibe-coding to build and improve Python scripts for cleaning messy CSV data. I practiced handling missing values, normalizing text fields, and fixing value format issues that caused scripts to break.

The buggy example was especially useful for C3. The first bug was a `ValueError` caused by the value `"fifteen"` being stored as a string instead of an integer — when `int()` tried to convert it, it threw a `ValueError` and broke the script. To fix this, I wrote a new helper function that normalizes inputs (whether they come in as text or integers) into actual integers before passing them into the original function. The second bug was the top 5 scores not returning the highest values, which I fixed in the same commit by correcting the sort logic.

These bugs showed me that AI-generated cleaning steps can still introduce subtle errors. I learned I need to read both the function logic and the dataset more carefully before trusting the output.

### C7: Critical evaluation and professional judgment

The homework trained me to read code first and form a rough debugging plan before asking AI to generate fixes. I used AI support to explain errors and suggest changes, but I also checked whether the code behavior actually matched the goal.

I was able to catch mistakes in AI-generated fixes, such as approaches that were too hard-coded. This made me more careful about evaluating whether a fix is robust, not just whether it runs once.

### Concrete practices that helped

- **Read the failing line first:** I traced errors to exact lines and checked input values before changing code.
- **Review function intent:** I asked what each function should do, then compared that intent to actual output.
- **Validate AI suggestions:** I accepted help for explanation and speed, but manually checked assumptions and edge cases.

### Challenges

A key challenge was balancing speed and understanding. AI could generate fixes quickly, but I still needed to understand what each change meant and whether it was generalizable to future data.

### Where I want to grow next

Next, I want to build competency in **C4 (API Use)** because API skills are important for using external tools and live data sources. I also want to grow in **C8 (Building and deploying a complete tool)** with stronger connection to HCI concepts and real user value.