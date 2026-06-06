# IdeaFlow — AI API Usage

## Architecture

IdeaFlow does not call an AI API directly from the browser. All AI calls go through a **Supabase Edge Function** (`supabase/functions/ideaflow-ai/index.ts`) that acts as a secure proxy. The frontend calls the edge function; the edge function calls OpenAI.

```
Browser (src/api/openai.ts)
  └─► Supabase Edge Function (/functions/v1/ideaflow-ai)
        └─► OpenAI API (api.openai.com)
```

The OpenAI API key is stored as a Supabase environment variable (`OPENAI_API_KEY`) — it is never exposed to the browser.

---

## Models Used

| Purpose | Model | Endpoint |
|---------|-------|----------|
| Text generation (all flows) | `gpt-4o` | `/v1/chat/completions` |
| Voice transcription | `whisper-1` | `/v1/audio/transcriptions` |
| Sketch generation | `gpt-image-1-mini` | `/v1/images/generations` |

---

## Frontend → Edge Function Call Structure

All flows use the same `callEdgeFunction` helper in `src/api/openai.ts`:

```typescript
async function callEdgeFunction(payload: Record<string, unknown>): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ideaflow-ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data.result; // always a string; parse JSON where needed
}
```

Each payload includes a `flow` field that tells the edge function which AI task to run.

---

## Edge Function → OpenAI Call Structure

Text generation flows use `callOpenAI()` inside the edge function:

```typescript
async function callOpenAI(systemPrompt: string, userPrompt: string, jsonMode = true): Promise<string> {
  const body = {
    model: "gpt-4o",
    max_tokens: 1200,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return data.choices[0].message.content; // string — JSON or plain text depending on jsonMode
}
```

---

## Flows

### Flow 1 — `hmw_generation`
**Generates 6–8 HMW questions grouped into 2–3 themes.**

When called: After the user completes all 5 Intake Flow steps (Path A only).

Frontend call:
```typescript
const result = await callEdgeFunction({
  flow: 'hmw_generation', targetUser, ageRange, insight, desiredOutcome, scope
});
const parsed = JSON.parse(result);
return parsed.themes; // HMWTheme[]
```

Response format:
```json
{
  "themes": [
    { "label": "Theme name", "questions": ["How might we...", "How might we..."] }
  ]
}
```

---

### Flow 2 — `hmw_single`
**Regenerates a single HMW card on the HMW Generation screen.**

When called: User clicks the Regenerate icon on an individual HMW card.

Response: Plain text — the new HMW question string, no JSON wrapper.

---

### Flow 3 — `hmw_combine`
**Combines 2+ selected HMW questions into one cohesive question.**

When called: User selects 2+ cards and clicks "Combine HMWs and Edit" → pre-seeds the HMW Editor textarea.

Frontend call:
```typescript
const result = await callEdgeFunction({ flow: 'hmw_combine', hmwQuestions: questions });
return result.trim(); // plain text HMW string
```

Response: Plain text — the combined HMW question.

---

### Flow 4 — `crazy8s_prompts`
**Generates exactly 8 round prompts before the Crazy 8s session starts.**

When called: User clicks "Begin Crazy 8s" on the Pre-session Setup screen. All 8 prompts are generated upfront — never mid-session.

Frontend call:
```typescript
const result = await callEdgeFunction({ flow: 'crazy8s_prompts', selectedHMW });
const parsed = JSON.parse(result);
return parsed.prompts; // string[] — 8 items
```

Response format:
```json
{ "prompts": ["Prompt one.", "Prompt two.", ...] }
```

---

### Flow 5 — `ai_suggest`
**Generates a complete idea (title + description) during a Crazy 8s round.**

When called: User clicks "AI suggest" during a round. The timer keeps running — this is non-blocking.

Frontend call:
```typescript
const result = await callEdgeFunction({
  flow: 'ai_suggest', selectedHMW, targetUser, ageRange, roundPrompt
});
return JSON.parse(result); // { title: string, description: string }
```

Response format:
```json
{ "title": "Short punchy title", "description": "One or two sentences." }
```

---

### Flow 6 — `generate_title`
**Generates a short title for an idea that has a description but no title.**

When called: Automatically on Summary screen arrival, for any card that has a description but an empty title.

Frontend call:
```typescript
const result = await callEdgeFunction({ flow: 'generate_title', selectedHMW, description });
return result.trim(); // plain text title string
```

Response: Plain text — the title only, no JSON, no punctuation at end.

---

### Flow 7 — `helper_question`
**Generates a short reframing question to unblock a designer mid-round.**

When called: User triggers an in-round helper prompt during Crazy 8s.

Frontend call:
```typescript
const result = await callEdgeFunction({
  flow: 'helper_question', selectedHMW, currentRound, ideasInQueue
});
return result.trim(); // plain text question string
```

Response: Plain text — one short question (max 15 words).

---

### Flow 8 — `transcribe`
**Transcribes a voice recording to text using Whisper.**

When called: User finishes a voice recording via the mic button on any input field.

The frontend encodes the audio blob to base64 before sending:
```typescript
const result = await callEdgeFunction({
  flow: 'transcribe', audioBase64, mimeType: audioBlob.type
});
return result.trim(); // plain text transcript
```

Inside the edge function, the audio is decoded and sent to OpenAI Whisper (`whisper-1`) via `/v1/audio/transcriptions`.

---

### Flow 9 — `clean_transcript`
**Removes filler words and fixes minor grammar in a voice transcript.**

When called: After transcription, to clean up "um", "uh", "like", "you know", etc.

Response: Plain text — the cleaned transcript, same length and meaning as input.

---

### Flow 10 — `generate_sketch`
**Generates a rough wireframe sketch image for an idea.**

When called: User requests a sketch for an idea card on the Summary screen.

Uses the OpenAI Images endpoint (`gpt-image-1-mini`, `/v1/images/generations`). The edge function returns the image as a base64 data URL:

```typescript
const result = await callEdgeFunction({ flow: 'generate_sketch', title, description });
return result.trim(); // "data:image/png;base64,..."
```

---

### Flow 11 — `normalize_age`
**Extracts a clean age or age range from freeform text.**

When called: On the age range intake step to normalize inputs like "mid-twenties" → "25" or "twenty to thirty" → "20-30".

Response: Plain text — just the number or range (e.g. `"25"`, `"25-40"`, `"30s"`).

---

### Export — no API call
The "Export as .txt" action on the Summary screen is entirely client-side. It reads from session state and generates a Blob download — no API call is made.

---

## General Rules

- **Frontend never calls OpenAI directly** — all calls go through the Supabase Edge Function
- **API key stays server-side** — `OPENAI_API_KEY` is a Supabase env variable, never in the browser bundle
- **Always request JSON output** for structured flows (`jsonMode = true` sets `response_format: { type: "json_object" }`) — parse structured data, never extract with regex
- **Plain text flows** use `jsonMode = false` — no `response_format`, response is returned as-is
- **Never call the API mid-timer tick** — AI suggestion during a round is triggered by user action only
- **Show a loading state** while waiting for any AI response
- **Do not stream responses** — wait for the full response before rendering
- **Never expose API errors** to the user — catch all errors and show a friendly retry message
- **Each call is stateless** — no conversation history is sent; every prompt is self-contained
- **Mock mode** — set `VITE_MOCK_API=true` to bypass all edge function calls and use local mock data (for local development without API keys)
