# IdeaFlow — Anthropic API Usage Rules

## Model
Always use `claude-sonnet-4-20250514`. Do not use Haiku for generation tasks — output quality matters here.

---

## API Call Structure

```javascript
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [{ role: "user", content: YOUR_PROMPT }]
  })
});
const data = await response.json();
const text = data.content[0].text;
```

---

## Flow 1 — HMW Generation

### When to call
Only when the user has submitted pain points via Path A. Never call this for Path B (direct HMW input).

### Required inputs before this call
- `targetUser` — who the design is for (e.g. "first-time home buyers", "elderly patients")
- `ageRange` — age range of the target user (e.g. "25–40", "65+")
- `painPoints` — the user's raw research findings or pain points

These are collected on the screen before pain point input — both fields are required.

### Prompt template
```
You are a UX design facilitator running an ideation session.

Target user: {TARGET_USER}, age range: {AGE_RANGE}

The user has shared the following pain points or research findings:
"""
{USER_INPUT}
"""

Generate 6–8 "How Might We" (HMW) questions based on these insights.

Rules:
- Each HMW must start with "How might we..."
- Be specific to the target user — reference who they are and their age range where relevant
- Reference the actual pain points — do not generate generic HMWs
- Vary the framing: some should be broad, some narrow, some provocative
- Group them into 2–3 loose themes (label each theme with 1–3 words)
- Do not explain or justify the questions — just output them

Respond ONLY in this JSON format, no preamble, no markdown:
{
  "themes": [
    {
      "label": "Theme name",
      "questions": [
        "How might we...",
        "How might we..."
      ]
    }
  ]
}
```

### Parsing the response
```javascript
const raw = data.content[0].text;
const parsed = JSON.parse(raw); // themes array
```

### Error handling
- If JSON.parse fails, show a friendly error and let the user retry
- If the API returns an error, do not expose the raw error — say "Something went wrong, please try again"

---

## Flow 2 — Crazy 8s Prompt Generation

### When to call
Once the user has a confirmed HMW question (either selected from generation or typed directly). Generate 8 prompts upfront before the session starts — do not call the API mid-timer.

### Prompt template
```
You are a UX design facilitator running a Crazy 8s ideation session.

The design challenge is:
"""
{SELECTED_HMW}
"""

Generate exactly 8 short design prompts to spark divergent thinking across 8 rounds.

Rules:
- Each prompt should push the designer to think differently — vary the angle each time
- Use different lenses: consider constraints, analogies, opposites, user emotions, technology, simplicity, boldness
- Each prompt should be 1–2 sentences max — punchy and actionable
- Do not number them — just list them
- Do not repeat similar ideas

Respond ONLY in this JSON format, no preamble, no markdown:
{
  "prompts": [
    "Prompt one here.",
    "Prompt two here.",
    ...
  ]
}
```

### Parsing the response
```javascript
const raw = data.content[0].text;
const parsed = JSON.parse(raw);
const prompts = parsed.prompts; // array of 8 strings
```

---

## Flow 4 — AI Fills an Idea (In-Round Nudge or Break Fallback)

### When to call
Two moments:
1. **During a round** — user clicks "AI suggest one for me" button while the timer is running
2. **During the break** — user has no description typed and clicks "AI fill this for me" as a fallback

### Prompt template
```
You are a UX design facilitator helping a designer during a Crazy 8s ideation session.

Design challenge: "{SELECTED_HMW}"
Target user: {TARGET_USER}, age {AGE_RANGE}
Round prompt: "{CURRENT_ROUND_PROMPT}"

Generate one complete design idea for this round.

Respond ONLY in this JSON format, no preamble, no markdown:
{
  "title": "Short punchy title (3–6 words)",
  "description": "One or two sentences describing the idea concretely. Make it specific and actionable."
}
```

### Parsing the response
```javascript
const raw = data.content[0].text;
const parsed = JSON.parse(raw);
// parsed.title → prefill title field (editable)
// parsed.description → prefill description field (editable)
```

### Rules
- Both title and description fields must remain editable after AI fills them
- During a round: show the suggestion in a slide-up panel without pausing the timer
- During a break: fill the idea capture panel fields directly
- If the user has already typed a description, ask "Replace your description with an AI suggestion?" before overwriting
- If the call fails, show a friendly inline error — do not block the session

---

## Flow 5 — Export Ideas as Text

### When to call
On the summary screen when the user clicks "Export as .txt".

### Implementation
No API call needed — generate the file entirely from session state in the browser.

```javascript
function exportAsText(sessionState) {
  const lines = [];
  lines.push(`IdeaFlow Session Export`);
  lines.push(`Design challenge: ${sessionState.selectedHMW}`);
  lines.push(`Target user: ${sessionState.targetUser}, age ${sessionState.ageRange}`);
  lines.push(`Date: ${new Date().toLocaleDateString()}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  sessionState.ideas.forEach((idea, i) => {
    lines.push(`Idea ${i + 1}: ${idea.title || '(untitled)'}`);
    lines.push(`Round prompt: ${sessionState.crazyEightsPrompts[i]}`);
    lines.push(`Description: ${idea.description || '(no description)'}`);
    lines.push('');
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ideaflow-session.txt';
  a.click();
  URL.revokeObjectURL(url);
}
```

### Rules
- Export should always be available on the summary screen, even if some ideas are empty
- Empty idea slots export as "(no description)" — never skip them
- Do not call the API for export — it is entirely client-side

### When to call
During the open-ended break after each round, triggered when the user clicks "Generate title" — not automatically. Only call if the user has typed a description of 20+ characters.

### Prompt template
```
Given this idea description for the design challenge "{SELECTED_HMW}":
"{USER_DESCRIPTION}"

Generate a short, punchy title for this idea. 3–6 words. No punctuation at the end. Just the title, nothing else.
```

### Parsing the response
```javascript
const title = data.content[0].text.trim();
// Render directly into an editable input field — no JSON parsing needed
```

### Rules
- Always render the result in an editable field — it is a suggestion, not final
- The break has no time limit — there is no urgency to cancel the call
- If the call fails, leave the title field empty and let the user type their own

---

## General Rules

- **Always request JSON output** — parse structured data, never extract with regex
- **Never call the API mid-timer tick** — AI suggestion during a round is triggered by user action, not the interval
- **Show a loading state** while waiting for the API — the user should never see a blank screen
- **Do not stream responses** for this project — wait for the full response before rendering
- **Never expose API errors** to the user — catch all errors and show a friendly retry message
- **Do not send conversation history** — each API call is stateless and self-contained
- **Export is client-side only** — never send session data to the API for formatting
