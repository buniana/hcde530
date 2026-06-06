# Mini Project 2 — Competency Claim: C1, C2, C7, C8

## Overview

IdeaFlow is an AI-powered ideation tool for UX designers, deployed at https://mini-project-web-app-zppa.bolt.host. It guides users through a two-phase session: generating and refining a "How Might We" design challenge question from structured research inputs, then running a Crazy 8s brainstorm with AI-generated round prompts, in-round AI suggestions, and a summary screen for review and export.

---

### C1: Vibecoding and Rapid Prototyping

IdeaFlow was built and deployed using Bolt. The first version was functional but required several significant redesigns before it matched the intended experience.

The intake form started as a single long page with one freeform text box for pain points — essentially a form that felt like a job application. After peer feedback identified this as a friction point, the entire intake was rebuilt into a Typeform-style one-question-per-page flow with five structured fields (target user, age range, observation, desired outcome, scope), each on its own step with a progress indicator. This was a full structural change, not a style adjustment.

The HMW selection screen originally used simple radio-button behavior — tap a card to select one HMW. After instructor feedback, this was replaced with a full refinement flow: an editable textarea pre-seeded with the selected HMW, a regenerate button for individual cards, a rotating tips carousel based on the five principles of good HMW writing, and a collapsible panel showing all generated HMWs for reference.

The session structure changed the most. The original version had a timed break for idea capture after every single round, which interrupted creative flow. This was redesigned so all 8 rounds run back to back — the debrief happens once at the end on a single summary screen. The break screen and summary screen were merged, eliminating a redundant step. Timer controls (pause, advance early, end session early with inline confirmation) were also added in a later iteration — the original had no user control over the timer at all.

**Key file:** `project code/src/screens/` — the full set of screens represents the final iteration after these redesigns.

---

### C2: Code Literacy and Documentation

This project required reading and understanding code — not just generating it. When Bolt ran out of context tokens mid-session, certain features were incomplete and required manual diagnosis and editing with Claude.

The most concrete example was the Whisper voice transcription encoding. The `transcribeAudio` function in `project code/src/api/openai.ts` originally used character-by-character string concatenation to convert an audio blob to base64. This silently truncated large audio files — the blob arriving at the Supabase Edge Function was only 877 bytes, far too small for real speech, which is why Whisper was returning garbage output. Reading the function carefully and understanding what the loop was doing made the bug diagnosable. The fix was switching to a chunked 8KB encoding loop that processes the audio in slices rather than one character at a time.

Beyond code editing, this project required writing and maintaining seven structured documentation files in `project code/docs/` — covering project context, design system, the AI API architecture, Bolt interaction rules, accessibility guidelines, user flow, and information architecture. These were updated each time a screen changed, keeping the spec in sync with the implementation. Writing these required understanding what the code was actually doing, not just what it was supposed to do.

**Key files:** `project code/src/api/openai.ts` (transcribeAudio function), `project code/docs/`

---

### C7: Critical Evaluation and Professional Judgment

Two distinct moments in this project required evaluating AI output carefully before trusting it.

**Diagnosing the Whisper bug through three layers.** The voice transcription was returning "you" regardless of what was spoken. The first assumption was an environment issue — Bolt's WebContainer sandbox restricts microphone access in credentialless iframes, so the original Web Speech API implementation couldn't work. Switching to Whisper seemed to fix the environment problem, but the wrong output persisted. The second assumption was that `mediaRecorder.start()` with no timeslice was collecting only one tiny audio chunk — switching to `mediaRecorder.start(250)` to collect chunks every 250ms seemed like the fix, but the problem persisted. Checking the Supabase Edge Function logs revealed the real cause: the audio blob was only 877 bytes, pointing to a client-side encoding bug rather than a recording or API issue. Fixing the encoding still didn't resolve it — the actual root cause turned out to be Microsoft Teams hijacking the system audio input device, so Chrome was recording from a silent virtual source. The diagnosis required working through environment, code, and hardware layers before reaching the real issue.

**Reviewing AI plans before implementation.** Throughout the build, Bolt's interpretation of a user flow description could diverge significantly from the intended behavior — particularly for branching logic (Path A vs. Path B) and state persistence rules (which data carries forward across which screens). The practice that prevented the most bugs was reading Bolt's implementation plan in full before confirming it, and pushing back or adding detail whenever a step didn't match the expected behavior. Accepting the first interpretation without review would have produced a working-looking but logically incorrect flow multiple times.

---

### C8: Building and Deploying a Complete Tool

IdeaFlow is deployed and publicly accessible at https://mini-project-web-app-zppa.bolt.host. It requires no login, no installation, and no setup — a designer can open it in any browser and run a full ideation session from research inputs through to an exported text file of ideas.

The tool does something real for a real HCD use case: it compresses the planning and facilitation overhead of a Crazy 8s session — generating the HMW question, writing the round prompts, filling blank rounds after the fact — so the designer can focus on the thinking rather than the logistics. Both entry paths are functional: Path A (from pain points) and Path B (direct HMW input). AI features work across all phases: HMW generation, round prompt generation, in-round idea suggestion, title generation, empty round fill, voice transcription, and sketch generation.

The most significant problem I hit was the Whisper voice transcription bug described in C7 — a layered issue that required diagnosing through the browser environment, the client-side encoding, and the system hardware before finding the real cause. The decision to keep voice input in the final build rather than remove it required confidence that the fix was actually correct and not just masking a deeper problem.

If I were to build this again, I would scope the AI suggestion feature differently at the start. The current implementation generates a full idea (title + description) on demand — which is useful but can feel like it short-circuits the creative process for a designer who is close to their own idea. A more useful version might offer a single reframing question instead of a complete idea, nudging thinking without replacing it.
