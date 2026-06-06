# IdeaFlow — User Flow

## Overview
IdeaFlow has two entry paths that converge into a shared Crazy 8s session, followed by a summary screen. The flow is linear with two escape hatches: "Next round" (manual advance) and "End session early."

---

## Full Flow

```
[Open IdeaFlow]
       │
       ▼
[Entry screen]
Choose entry path
       │
   ┌───┴──────────────────────────┐
   │                              │
   ▼                              ▼
PATH A                          PATH B
(from pain points)              (direct HMW)
   │                              │
   ▼                              │
[User Context screen]             │
Target user + age range           │
(both required)                   │
   │                              │
   ▼                              │
[Insights Input screen]           │
3 research fields                 │
(all required)                    │
   │                              │
   ▼                              │
[HMW Generation screen]           │
AI clusters HMWs by theme         │
Multi-select checkboxes           │
   │                              │
   ▼                              │
[HMW Editor screen]               │
Edit / combine selected HMWs      │
Validation: starts "How might we" │
   │                              ▼
   │                    [Direct HMW screen]
   │                    Type HMW directly
   │                    Validation: starts "How might we"
   │                              │
   └──────────────┬───────────────┘
                  │
                  ▼
     [Pre-session Setup screen]
     Choose timer: 60s / 90s (default) / 120s
     AI generates 8 round prompts
                  │
                  ▼
     ┌─────────────────────────────┐
     │  Crazy 8s Session           │ ◄──── repeats × 8
     │  Timer running              │
     │  AI round prompt shown      │
     │                             │
     │  Inline idea textarea       │
     │  (auto-saved on advance)    │
     │                             │
     │  [AI suggest] ──► modal     │
     │  Timer keeps running        │
     │  Keep / Edit / Dismiss      │
     │                             │
     │  [Pause] / [Resume]         │
     │  Freezes / resumes timer    │
     │                             │
     │  [Next round] ──► inline    │
     │  confirmation               │
     │  Empty draft: warn + skip   │
     │  Non-empty: confirm + save  │
     │                             │
     │  [End session early] ──►    │
     │  inline confirmation        │
     │  Empty draft: discard round │
     │  Non-empty: save + exit     │
     └─────────────────────────────┘
                  │
                  ▼ (round 8 done or end early)
     [Summary screen]
     • Selected HMW + context at top
     • Idea cards grid (round badge, title, description)
     • AI badge on AI-generated ideas
     • "empty" badge on blank rounds
     • "Fill with AI" banner if any rounds are empty
     • Per-card AI fill button on empty cards
     • Per-card Edit + Discard controls
     • [Export as .txt] → client-side download
     • [New session] → resets all state
```

---

## Screen-by-Screen Summary

| Screen | Path | Required inputs | Outputs |
|--------|------|----------------|---------|
| Entry | Both | Path choice (A or B) | — |
| User Context | A only | Target user, age range (both required) | Stored in session state |
| Insights Input | A only | 3 research fields (min chars each) | Stored in session state |
| HMW Generation | A only | Select 1+ HMW cards | Selected HMWs passed to editor |
| HMW Editor | A only | Valid "How might we" text ≥ 30 chars | selectedHMW stored |
| Direct HMW | B only | Valid "How might we" text | selectedHMW stored |
| Pre-session Setup | Both | Timer preset (60/90/120s) | roundDuration + 8 AI prompts stored |
| Crazy 8s | Both | — | 8 auto-saved round entries |
| Summary | Both | — | Idea cards displayed, .txt export |

---

## Key Interaction Rules

### Setup phase
- **Path A only:** User Context screen appears before Insights Input — always required, never skippable
- **Path B:** Skips directly to Direct HMW input — no User Context screen, no AI generation
- **HMW validation:** Both Path A (editor) and Path B (direct) require the text to start with "How might we" before the CTA activates

### Crazy 8s session
- **Timer color coding:** Normal (primary) → amber at ≤30s → red at ≤10s with pulse animation
- **Pause / Resume:** Available at any point — freezes the countdown; resumes exactly where it stopped
- **AI suggest:** Opens a non-blocking modal — timer keeps running. Accepts "Keep this" (saved with AI badge, draft untouched), "Edit this" (copies into draft), or "Dismiss"
- **Next round — with text:** Shows "Move to the next round now?" — confirm saves draft and advances
- **Next round — empty draft:** Shows a warning: "Your idea box is empty. This round will be saved without an idea. You can use AI to fill it in later." — "Skip anyway" advances; "Keep writing" cancels
- **Timer hits zero:** Draft auto-saved (empty or not) — round always produces one entry
- **End session early — with text:** Saves current round draft, then navigates to Summary
- **End session early — empty draft:** Discards the current round (no empty entry saved), navigates to Summary
- **No back navigation** once the session has started

### Summary screen
- **Empty rounds:** Cards show an "empty" badge; the round prompt was still saved so AI has context to fill them
- **"Fill with AI" banner:** Appears when any cards are empty — fills all at once using each round's original prompt
- **Per-card AI fill:** Each empty card has its own "AI fill" button for individual filling
- **Skeleton loader:** Shown while AI is generating; replaced by title + description + AI badge on completion
- **Title auto-generation:** On arrival at Summary, any card with a description but no title gets an AI-generated title automatically
- **Export:** Client-side only — no API call, always available

---

## State That Persists Across the Session

```javascript
{
  entryPath,           // "A" | "B"
  targetUser,          // string (Path A; empty string on Path B)
  ageRange,            // string (Path A; empty string on Path B)
  insight,             // string (Path A)
  desiredOutcome,      // string (Path A)
  scope,               // string (Path A)
  generatedHMWs,       // array of { label, questions[] } (Path A)
  selectedHMW,         // string — carried through entire session
  selectedHMWs,        // array of strings (Path A multi-select)
  roundDuration,       // 60 | 90 | 120
  crazyEightsPrompts,  // array of 8 strings — pre-generated before session
  currentRound,        // 1–8
  isSessionActive,     // boolean
  ideas,               // array of { id, roundCaptured, description, title, aiGenerated, isDraft }
  draftText,           // string — live text in the current round's idea textarea
}
```
