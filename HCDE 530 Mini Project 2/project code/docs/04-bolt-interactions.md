# IdeaFlow — Bolt Interaction Rules

## App Structure
The app has four distinct phases. Always track the current phase in state and gate UI accordingly.

```
Phase 0: Entry         → user chooses Path A or Path B
Phase 1A: User context → target user + age range input (Path A only, before pain points)
Phase 1B: HMW         → pain point input → HMW generation → HMW selection (Path A)
                      → direct HMW input (Path B)
Phase 2: Crazy 8s     → timed session, 8 rounds, one prompt per round
Phase 3: Summary      → 8 idea cards, export option
```

---

## Phase Transitions

### Rules
- A phase transition should only trigger on explicit user action (button click), never automatically
- Each transition should animate: fade out current phase, fade in next (300ms ease-out)
- Always validate before transitioning — do not allow empty inputs to proceed
- Provide a clear back affordance from Phase 1 → Phase 0 only; once Crazy 8s starts, do not allow going back mid-session

### Transition triggers
| From | To | Trigger |
|------|----|---------|
| Phase 0 | Phase 1A (Path A) | User clicks "Start from pain points" |
| Phase 0 | Phase 1B (Path B) | User clicks "I already have a HMW" |
| Phase 1A | Phase 1B | User submits target user + age range |
| Phase 1B | Phase 2 | User confirms their HMW selection or input |
| Phase 2 | Phase 3 | Final round timer completes OR user ends session early |

---

## Conditional Logic

### Path A vs Path B
```
if (entryPath === "A") {
  // user context → pain points → HMW generation + builder → pre-session setup
} else {
  // direct HMW input → validate → go to Crazy 8s
}
```

### HMW builder gate
- "Confirm HMW" button is disabled until the builder field:
  - Starts with "How might we" (case-insensitive)
  - Is between 30–120 characters
- Show a length hint below the field:
  - Under 30 chars: "Your HMW might be too broad — try adding more detail"
  - Over 120 chars: "Your HMW might be too specific — try simplifying"
  - In range: no hint shown
- Never block silently — always explain why the button is unavailable

### Input validation
- Pain point input: minimum 20 characters before allowing submission
- Direct HMW input (Path B): must start with "How might we" (case-insensitive) or show a gentle inline warning
- Never block silently — always explain why the action is unavailable

---

## HMW Drag-to-Builder Interaction

### How it works
Each word in every HMW card is a draggable token. When dropped into the builder field, it appends as plain text.

```javascript
// Make each word a draggable token
function renderHMWCard(question) {
  return question.text.split(' ').map(word => `
    <span
      draggable="true"
      class="hmw-token"
      ondragstart="handleTokenDragStart(event, '${word}')"
    >${word}</span>
  `).join(' ');
}

// Store dragged word in dataTransfer
function handleTokenDragStart(event, word) {
  event.dataTransfer.setData('text/plain', word);
  event.dataTransfer.effectAllowed = 'copy';
}

// Drop into builder field — append at cursor or end
builderField.addEventListener('drop', (event) => {
  event.preventDefault();
  const word = event.dataTransfer.getData('text/plain');
  const pos = builderField.selectionStart;
  const current = builderField.value;
  const needsSpace = current.length > 0 && !current.endsWith(' ');
  builderField.value =
    current.slice(0, pos) +
    (needsSpace ? ' ' : '') + word +
    current.slice(pos);
  builderField.focus();
});

builderField.addEventListener('dragover', (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
});
```

### Visual rules
- Draggable tokens: subtle underline or dashed border on hover to signal draggability
- On drag start: token gets 0.5 opacity, cursor becomes `grabbing`
- Builder field: highlighted border (`--color-primary`) when a drag is in progress over it
- Dropping outside the builder field cancels — no action, no error
- Original HMW cards are never modified by dragging — read-only reference

### Regenerate button rules
- Always visible on the HMW generation screen
- Show confirmation inline before regenerating: "This will replace your current questions."
- On confirm: call API again with same inputs, replace cards, clear builder field
- Track regeneration count in state — hide button after 3 attempts
- After 3: show message "Try editing your insights for different results"

```javascript
const sessionState = {
  ...
  regenerateCount: 0, // increment on each regenerate
}
```

---

## Timer Logic

### Crazy 8s session structure
- 8 rounds total
- Round duration is chosen by the user before the session starts (see Timer Presets below)
- Between rounds: **open-ended debrief break** — no time limit, user advances manually
- Display: `MM:SS` format, monospace font

### Timer Presets
Show a preset selector before the session starts — not during. Store the choice in state.

```javascript
const TIMER_PRESETS = [
  { label: "Quick (60s)", value: 60 },
  { label: "Standard (90s)", value: 90 },
  { label: "Extended (120s)", value: 120 }
];

// Default to Standard
const ROUND_DURATION = selectedPreset; // set by user before session
const BREAK_DURATION = 30; // always 30s — needed for idea capture
```

Display presets as three selectable option cards, not a dropdown. Make the default (90s) visually pre-selected.

### Timer implementation
```javascript
const ROUND_DURATION = selectedPreset;
const MIN_BREAK_WAIT = 15; // seconds before "Complete session" button activates

let secondsLeft = ROUND_DURATION;
let currentRound = 1;
let isBreak = false;
let breakWaitElapsed = 0;

const tick = setInterval(() => {
  if (!isBreak) {
    secondsLeft -= 1;

    if (secondsLeft <= 0) {
      // Round ends — enter open-ended break
      isBreak = true;
      breakWaitElapsed = 0;
      showIdeaCapturePanel(currentRound);
      clearInterval(tick); // stop the round timer
    }
  }

  updateTimerDisplay(secondsLeft, currentRound, isBreak);
}, 1000);

// Separate interval for minimum break wait
let breakWaitTick;
function startBreak() {
  breakWaitTick = setInterval(() => {
    breakWaitElapsed += 1;
    if (breakWaitElapsed >= MIN_BREAK_WAIT) {
      enableCompleteSessionButton();
      clearInterval(breakWaitTick);
    }
  }, 1000);
}

// Called when user clicks "Complete session"
function completeSession() {
  hideIdeaCapturePanel();
  if (currentRound < 8) {
    currentRound += 1;
    secondsLeft = ROUND_DURATION;
    isBreak = false;
    startRoundTimer(); // restart the round tick
  } else {
    transitionToSummary();
  }
}
```

### Timer color states
- Default: `--color-primary`
- Warning (last 30s of a round): `--color-warning`
- Critical (last 10s of a round): `--color-danger` + pulse animation
- Break period: neutral grey — no urgency styling during idea capture

### Timer controls
- **Pause/Resume:** allowed during a round, not during breaks
- **Skip round:** allowed (with confirmation prompt), jumps to next round immediately
- **End session early:** allowed (with confirmation), goes to summary with whatever was captured

---

## State Management

Keep all session state in a single object for clarity:

```javascript
const sessionState = {
  entryPath: null,           // "A" or "B"
  targetUser: "",            // e.g. "first-time home buyers" (Path A only)
  ageRange: "",              // e.g. "25–40" (Path A only)
  insight: "",               // what the user observed or heard (Path A only)
  desiredOutcome: "",        // what the user should feel/achieve (Path A only)
  scope: "",                 // what this should NOT solve (Path A only)
  generatedHMWs: [],         // array of theme objects from API
  selectedHMW: null,         // string — the chosen HMW question
  regenerateCount: 0,        // max 3
  roundDuration: 90,         // set by user via preset selector (60 / 90 / 120)
  crazyEightsPrompts: [],    // array of 8 prompt strings from API
  currentRound: 1,
  isSessionActive: false,
  isBreak: false,
  ideas: [
    // One entry per round, populated during rounds and breaks
    // { round: 1, description: "", title: "", aiGenerated: false }
  ]
};
```

---

## In-Round AI Suggestion

Available as a button during an active round ("AI suggest one for me").

### Flow
1. User clicks the button while the timer is running
2. Timer continues — do not pause
3. A slide-up panel appears with a loading state
4. API returns a title + description (see Flow 4 in API rules)
5. Suggestion is shown in the panel — user can accept, edit, or dismiss
6. If accepted, it pre-fills the idea capture panel for the upcoming break
7. If dismissed, panel closes and nothing is saved

### Rules
- Never pause the timer for an AI suggestion — it is a nudge, not a break
- If the user already has content typed for that round, confirm before overwriting
- Show a subtle label "AI suggested" on the idea card in the summary if used
- Limit to one AI suggestion call per round — hide the button after it's been used

---

## Idea Capture Panel (Break Phase)

Shown after each round ends. No time limit — the user advances when they are ready.

### Flow
1. Round timer hits zero — panel slides in, round timer stops
2. User reflects and types a brief description of their idea (1–3 sentences)
3. When description is 20+ characters, a "Generate title" button activates
4. User clicks — API generates a short title (3–6 words)
5. Title appears in an editable text field, pre-filled by AI
6. User can also click "AI fill this for me" if the round was a blank — fills both fields
7. After 15 seconds, the **"Complete session"** button activates
8. User clicks "Complete session" when ready — panel saves and closes, next round starts
9. On the final round, "Complete session" transitions to the summary screen

### Rules
- "Complete session" button is visually disabled for the first 15 seconds — show a subtle countdown hint ("Available in 12s...")
- Once 15 seconds have elapsed, enable the button — no further time pressure
- Never auto-advance the break — the user is always in control
- Save idea data when "Complete session" is clicked, even if fields are incomplete
- Show a subtle round counter during the break: "Round 3 of 8 complete"
- Title field is always editable — AI output is a suggestion, not final

---

## Loading States
- Show a spinner or skeleton UI whenever an API call is in progress
- Disable all interactive elements during loading — prevent double-submissions
- Loading message for HMW generation: "Generating your How Might We questions..."
- Loading message for Crazy 8s prompts: "Preparing your session..."

---

## Summary Screen

Shown after the session ends (all 8 rounds complete or user ends early).

### Contents
- The selected HMW question at the top
- 8 idea cards in a grid — each showing round number, round prompt, title, and description
- Empty rounds show a placeholder ("No idea captured")
- AI-generated ideas are labelled with a subtle "AI" badge
- Export button: "Export as .txt" — triggers client-side download, no API call

### Export rules
- Always available, even if some ideas are empty
- File name: `ideaflow-session.txt`
- See Flow 5 in API rules for implementation

---

## Do Not
- Call the API inside a timer tick or interval
- Pause the timer for any AI suggestion — suggestions are async and non-blocking
- Allow phase transitions with empty or invalid inputs
- Auto-advance phases without user confirmation
- Show raw API error messages to the user
- Use `alert()` or `confirm()` — build inline UI for confirmations instead
- Skip the target user + age range screen for Path A — it is required, not optional
- Send session data to the API for export — export is always client-side
