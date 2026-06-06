# IdeaFlow

**Live app:** https://mini-project-web-app-zppa.bolt.host

---

## What is IdeaFlow?

IdeaFlow is an AI-powered ideation tool for UX designers. It guides you through a structured two-phase brainstorming session:

1. **How Might We generation** — you describe your research findings and target user; the tool turns them into a set of "How Might We" design challenge questions, grouped by theme. You select and refine one to carry into the session.
2. **Crazy 8s** — a timed brainstorming format where you generate one idea per round across 8 rounds. Each round has an AI-generated prompt to push your thinking in a different direction. You can ask AI for a full idea suggestion at any point, pause the timer, and end early if you're done. At the end, all your ideas are collected on a summary screen where you can edit, fill empty rounds with AI, and export everything as a plain text file.

If you already have a design challenge written, you can skip the generation phase entirely and jump straight into Crazy 8s.

---

## Who is it for?

UX designers and design students who want a structured, fast ideation session — either solo or to facilitate a small team workshop. It works especially well when you have raw research notes and need help shaping them into a focused design challenge before you start sketching.

---

## How to use it

Go to https://mini-project-web-app-zppa.bolt.host in any modern browser. No account, no installation, no login required.

**Starting from research (Path A):**
1. Click "Start from pain points"
2. Answer 5 questions about your target user and research findings — one at a time
3. Browse the AI-generated HMW questions, select the ones that resonate, and refine them in the editor
4. Choose a round timer (60, 90, or 120 seconds) and begin

**Starting with a HMW you already have (Path B):**
1. Click "I already have a HMW"
2. Type your design challenge question
3. Choose a round timer and begin

**During the session:**
- Type your idea in the text box each round — it saves automatically when time runs out
- Use "AI suggest" if you're stuck — it generates a title and description without stopping the timer
- Use "Next round →" to advance early, or "End session early" to jump to the summary

**At the end:**
- Review all 8 idea cards, edit any of them, or fill empty rounds with AI
- Export your session as a `.txt` file to take into your next design phase

---

## Tech stack

Built with Bolt using React, TypeScript, and Tailwind CSS. AI features are powered by OpenAI (`gpt-4o` for text generation, Whisper for voice transcription) via a Supabase Edge Function that keeps the API key off the client.
