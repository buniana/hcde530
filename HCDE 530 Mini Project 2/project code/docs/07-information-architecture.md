# IdeaFlow — Information Architecture

## Overview
IdeaFlow is a single-session linear tool with no persistent navigation. Screens are gated by phase — the user cannot jump ahead or revisit previous screens mid-session. All screens live at the top level; there are no nested routes.

---

## Screen Inventory

### 1. Entry Screen
**Primary screen — always first**
- Logo + app name + two-line description
- Two path cards (side by side on desktop, stacked on mobile):
  - "Start from pain points" → Path A (`IntakeFlowScreen`)
  - "I already have a HMW" → Path B (`DirectHMWScreen`)
- Each card has an icon, headline, description, and inline CTA link
- No back navigation from here

---

### 2A. Intake Flow Screen *(Path A only)*
**Single screen — 5 sequential steps, one question at a time**

A progress bar ("Step X of 5") tracks position across all five steps. Steps 1–2 use a single-line text input; steps 3–5 use a textarea with a minimum character count. A context bar ("For: [targetUser], age [ageRange]") appears below the question heading from step 3 onward.

| Step | Question | Input type | Validation |
|------|----------|-----------|------------|
| 1 | "Who are you designing for?" | Text input | Non-empty; Enter key advances |
| 2 | "What age range are they?" | Text input | Non-empty; Enter key advances |
| 3 | "What did you observe or learn?" | Textarea | Min 20 chars |
| 4 | "What outcome do users want?" | Textarea | Min 20 chars |
| 5 | "What is the scope or context?" | Textarea | Min 10 chars |

- CTA on steps 1–4: "Continue" → advances to next step
- CTA on step 5: "Generate How Might We questions" → triggers API call → HMW Generation screen
- Back on step 1: returns to Entry screen
- Back on steps 2–5: returns to the previous step within the same screen
- Voice input available on all fields via mic button

---

### 2B. Direct HMW Input Screen *(Path B only)*
**Primary screen**
- Page title: "What's your design challenge?"
- Single text input — placeholder: "How might we..."
- Inline validation: must begin with "How might we" (case-insensitive)
- Error messages: "Your question should start with 'How might we'" / "Please enter your How Might We question"
- CTA: "Start ideation" → Pre-session Setup screen
- Back: returns to Entry screen

---

### 3A. HMW Generation Screen *(Path A only)*
**Primary screen — Browse sub-step**
- Page title: "Your How Might We questions"
- Target user + age range shown as context bar at top
- AI-generated HMW cards grouped by theme
- Multi-select via checkboxes on each card
- Hover on card reveals a "Regenerate" icon button — triggers confirmation dialog before replacing that card with a new API call
- CTA adapts to selection count:
  - 0 selected: disabled
  - 1 selected: "Edit my HMW"
  - 2+ selected: "Combine HMWs and Edit"
- CTA navigates to HMW Editor screen
- Back: returns to Intake Flow screen (step 5)

---

### 3B. HMW Editor Screen *(Path A only)*
**Primary screen — Compose sub-step**
- Single editable textarea pre-seeded with selected/combined HMW text
- Inline validation:
  - Must start with "How might we" (case-insensitive)
  - Must be ≥ 30 characters
  - Error messages: "Start with 'How might we'" / "Add more detail — your HMW is too short"
- Auto-rotating tip messages (5 tips, rotated every 6s)
- Collapsible side panel: all generated HMWs grouped as "Selected" and "Other HMWs" for reference
- CTA: "Confirm HMW" (disabled until validation passes) → Pre-session Setup screen
- Back: returns to HMW Generation screen

---

### 4. Pre-Session Setup Screen
**Primary screen — both paths converge here**
- Selected HMW + target user shown as context bar at top
- Three timer preset cards (single select):
  - 60s
  - 90s — marked "Default" (pre-selected)
  - 120s
- CTA: "Begin Crazy 8s" → calls `generateCrazy8sPrompts` API, initializes session state, navigates to Crazy 8s screen
- Back: returns to HMW Editor (Path A) or Direct HMW (Path B)

---

### 5. Crazy 8s Session Screen
**Primary screen — repeats for 8 rounds**
- Round progress indicator: 8 segment bar + "Round X of 8" label
- Selected HMW shown as persistent context bar at top
- Large countdown timer (color-coded: normal → amber at ≤30s → red at ≤10s, with pulse animation)
- Round prompt card (AI-generated, shown below timer)
- Inline idea textarea ("Your idea") with placeholder text
  - Saved automatically when the round ends (timer hits zero) or when advancing manually
- Idea Queue: visible as a side panel on desktop (≥lg), or as a floating button + slide-up drawer on mobile

#### 5a. AI Suggest
- "AI suggest" button in the idea input header
- Opens a modal overlay — timer continues running
- Modal shows AI-generated title + description
- Actions:
  - "Keep this" — saves to Idea Queue with AI badge; draft textarea is untouched
  - "Edit this" — copies AI description into draft textarea; closes modal
  - "Dismiss" — closes modal with no changes
- "Regenerate" button available in modal header once a suggestion is shown

#### 5b. Pause / Resume
- Button labeled "Pause" (Pause icon) / "Resume" (Play icon) — toggles timer freeze
- Timer stops ticking while paused; resumes exactly where it left off

#### 5c. Next Round
- Button labeled "Next round" (ArrowRight icon)
- Clicking opens an inline confirmation below the button
- **If draft is empty:** "Your idea box is empty. This round will be saved without an idea. You can use AI to fill it in later on the summary screen." — buttons: "Skip anyway" / "Keep writing"
- **If draft has text:** "Move to the next round now?" — buttons: "Yes, next round" / "Keep going"
- On confirm: saves current draft (even if empty) and advances to round + 1, or to Summary after round 8

#### 5d. End Session Early
- "End session early" link (underline style, below the main action buttons)
- Clicking expands an inline confirmation panel (danger border)
- Message: "Are you sure? You'll skip to the summary with X idea(s) captured. Y round(s) remaining."
- Actions: "Yes, end session" (destructive) / "Keep going"
- On confirm:
  - If draft has text: saves the current round before navigating to Summary
  - If draft is empty: discards the current round (does NOT save an empty entry), navigates to Summary
- No back navigation once the session has started

#### 5e. Auto-advance (timer hits zero)
- Current draft is auto-saved (empty or not) as a round entry
- Advances to the next round, or to Summary after round 8

---

### 6. Summary Screen
**Primary screen — session end**
- Page title: "Your ideas"
- Selected HMW + target user shown as context bar
- Session stats: rounds · timer preset
- Idea count label
- Export + New Session actions at top

#### 6a. AI Fill Empty Banner
- Appears when one or more rounds were saved with no idea text
- Message: "X round(s) without an idea — Let AI fill in the blanks based on each round's prompt."
- "Fill with AI" button (Sparkles icon): fills all empty cards simultaneously
- While filling: animated skeleton loader shown on each empty card
- After filling: card shows AI-generated title + description + AI badge; "empty" label removed

#### 6b. Idea Cards (grid layout)
- Round badge (R1–R8) + AI badge (if AI-generated)
- "empty" badge on cards with no description
- Empty cards show "No description — click Edit to fill this in" in italic
- **Individual "AI fill" button** (Sparkles icon) on each empty card header — fills only that card
- **"Edit" button** on non-empty, non-filling cards — opens inline edit form with Title + Description fields + Save / Cancel
- **Trash icon** — discards the idea from the session (removes card entirely)
- Title auto-generated by AI on session end for any card that has a description but no title (animated skeleton while generating)

---

## Content Hierarchy per Screen

| Screen | H1 (Page title) | Key fields / content | Primary action |
|--------|----------------|----------------------|----------------|
| Entry | "IdeaFlow" | Two path cards | Start from pain points · I already have a HMW |
| Intake Flow (step 1) | "Who are you designing for?" | Text input | Continue |
| Intake Flow (step 2) | "What age range are they?" | Text input | Continue |
| Intake Flow (step 3) | "What did you observe or learn?" | Textarea (min 20) | Continue |
| Intake Flow (step 4) | "What outcome do users want?" | Textarea (min 20) | Continue |
| Intake Flow (step 5) | "What is the scope or context?" | Textarea (min 10) | Generate HMWs |
| HMW generation | "Your How Might We questions" | Theme-grouped HMW cards, multi-select | Edit / Combine HMW |
| HMW editor | (HMW text) | Single editable textarea + side panel reference | Confirm HMW |
| Direct HMW | "What's your design challenge?" | Single input + validation | Start ideation |
| Pre-session | "Set your round timer" | 3 preset cards | Begin Crazy 8s |
| Crazy 8s | "Round X of 8" | Timer, prompt, idea textarea, queue | Pause · Next round |
| Summary | "Your ideas" | Idea card grid, AI fill banner | Export as .txt |

---

## Navigation Rules

- **Forward only** during a session — no back navigation from Crazy 8s onward
- **Back allowed** on setup screens: Entry → Intake Flow (step 1 returns to Entry; steps 2–5 return to previous step) → HMW Generation → HMW Editor → Pre-session
- **No global nav** — IdeaFlow has no persistent header navigation, sidebar, or menu
- **No auth** — no login, no accounts, no saved sessions between visits
- **Context bar** — selected HMW + target user persists as a non-interactive banner from Pre-session Setup through to Summary
- **Persistence** — session state is saved to `localStorage` only on the Crazy 8s and Summary screens (key: `ideaflow_session_v1`)

---

## Information That Persists Across Screens

| Data | First captured | Shown again on |
|------|---------------|----------------|
| Target user + age range | Intake Flow (steps 1–2) | Intake Flow step 3+ (context), HMW Generation, Pre-session, Crazy 8s, Summary |
| Insight + outcome + scope | Intake Flow (steps 3–5) | HMW Generation (context) |
| Selected HMW | HMW Editor / Direct input | Pre-session, Crazy 8s, Summary |
| Timer preset | Pre-session setup | Summary (session stats) |
| Crazy 8s prompts | Pre-generated at session start | Crazy 8s (current round), Summary (each card), AI fill (round context) |
| Draft text | Crazy 8s (live) | Persisted in session state; cleared on round advance |
| Ideas (title + description + aiGenerated) | Crazy 8s (auto-save per round) | Summary |
