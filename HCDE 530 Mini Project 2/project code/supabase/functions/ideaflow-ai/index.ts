import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";

async function callOpenAI(systemPrompt: string, userPrompt: string, jsonMode = true): Promise<string> {
  const body: Record<string, unknown> = {
    model: "gpt-4o",
    max_tokens: 1200,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };

  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const {
      flow,
      targetUser,
      ageRange,
      insight,
      desiredOutcome,
      scope,
      selectedHMW,
      description,
      title,
      roundPrompt,
      hmwQuestions,
      currentRound,
      ideasInQueue,
      rawText,
      audioBase64,
      mimeType,
    } = await req.json();

    let result = "";

    if (flow === "hmw_generation") {
      const systemPrompt = `You are a UX design facilitator running an ideation session. Generate How Might We questions and respond ONLY with valid JSON in the exact format requested.`;
      const userPrompt = `Target user: ${targetUser}, age range: ${ageRange}

The user has shared structured research insights:

Observation: "${insight}"
Desired outcome: "${desiredOutcome}"
Scope / context: "${scope}"

Generate 6–8 "How Might We" (HMW) questions based on these insights.

Rules:
- Each HMW must start with "How might we..."
- Be specific to the target user — reference who they are and their age range where relevant
- Draw directly from the observation, desired outcome, and scope — do not generate generic HMWs
- Vary the framing: some should be broad, some narrow, some provocative
- Group them into 2–3 loose themes (label each theme with 1–3 words)
- Do not explain or justify the questions — just output them

Respond ONLY in this JSON format:
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
}`;
      result = await callOpenAI(systemPrompt, userPrompt, true);

    } else if (flow === "hmw_single") {
      const systemPrompt = `You are a UX design facilitator. Generate a single fresh "How Might We" question. Respond with ONLY the question — no JSON, no explanation, no extra text.`;
      const userPrompt = `Target user: ${targetUser}, age range: ${ageRange}

Observation: "${insight}"
Desired outcome: "${desiredOutcome}"
Scope / context: "${scope}"

Generate one new "How Might We" question based on these insights. It must:
- Start with "How might we..."
- Be specific to the target user and insights
- Be between 30 and 120 characters
- Not repeat a common framing — be fresh and distinct

Respond with ONLY the question. Nothing else.`;
      result = await callOpenAI(systemPrompt, userPrompt, false);

    } else if (flow === "crazy8s_prompts") {
      const systemPrompt = `You are a UX design facilitator running a Crazy 8s ideation session. Generate design prompts and respond ONLY with valid JSON in the exact format requested.`;
      const userPrompt = `The design challenge is:
"""
${selectedHMW}
"""

Generate exactly 8 short design prompts to spark divergent thinking across 8 rounds.

Rules:
- Each prompt should push the designer to think differently — vary the angle each time
- Use different lenses: constraints, analogies, opposites, user emotions, technology, simplicity, boldness
- Each prompt should be 1–2 sentences max — punchy and actionable
- Do not number them — just list them
- Do not repeat similar ideas

Respond ONLY in this JSON format:
{
  "prompts": [
    "Prompt one here.",
    "Prompt two here.",
    "Prompt three here.",
    "Prompt four here.",
    "Prompt five here.",
    "Prompt six here.",
    "Prompt seven here.",
    "Prompt eight here."
  ]
}`;
      result = await callOpenAI(systemPrompt, userPrompt, true);

    } else if (flow === "generate_title") {
      const systemPrompt = `You are a UX design facilitator. Generate a concise, punchy title for a design idea. Respond with ONLY the title — no JSON, no explanation, no punctuation at the end.`;
      const userPrompt = `Given this idea description for the design challenge "${selectedHMW}":
"${description}"

Generate a short, punchy title for this idea. Maximum 10 words. No punctuation at the end. Just the title, nothing else.`;
      result = await callOpenAI(systemPrompt, userPrompt, false);

    } else if (flow === "ai_suggest") {
      const systemPrompt = `You are a UX design facilitator helping a designer during a Crazy 8s ideation session. Generate one complete design idea and respond ONLY with valid JSON in the exact format requested.`;
      const userPrompt = `Design challenge: "${selectedHMW}"
Target user: ${targetUser || "not specified"}, age ${ageRange || "not specified"}
Round prompt: "${roundPrompt}"

Generate one complete design idea for this round.

Respond ONLY in this JSON format:
{
  "title": "Short punchy title (3–6 words)",
  "description": "One or two sentences describing the idea concretely. Make it specific and actionable."
}`;
      result = await callOpenAI(systemPrompt, userPrompt, true);

    } else if (flow === "helper_question") {
      const systemPrompt = `You are a UX design facilitator. Generate a single short reframing question to help a designer think differently. Respond with ONLY the question — no JSON, no explanation, no extra text.`;
      const userPrompt = `The user is in a Crazy 8s ideation session.
Design challenge: "${selectedHMW}"
Current round: ${currentRound} of 8
Ideas in the queue so far: ${ideasInQueue || "No ideas yet"}

Generate one short reframing question (max 15 words) that helps the user think about the design challenge from a different angle than what they have already explored. Do not suggest a solution. Just return the question, nothing else.`;
      result = await callOpenAI(systemPrompt, userPrompt, false);

    } else if (flow === "hmw_combine") {
      const questions: string[] = hmwQuestions ?? [];
      const systemPrompt = `You are a UX design facilitator. Combine multiple "How Might We" questions into one cohesive question. Respond with ONLY the combined question — no JSON, no explanation, no extra text.`;
      const userPrompt = `Combine these "How Might We" questions into a single, cohesive HMW question:

${questions.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n")}

Rules:
- The result must start with "How might we..."
- Preserve as much of the original wording from both questions as possible — minimize changes
- Merge the core intent of all questions into one clear, focused question
- Do not add new ideas or concepts not present in the originals
- Respond with ONLY the combined question. Nothing else.`;
      result = await callOpenAI(systemPrompt, userPrompt, false);

} else if (flow === "generate_sketch") {
      const imageRes = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-image-1-mini",
          prompt: `A hand-drawn UX wireframe sketch on white paper, rough pencil lines, no color, no shading, no fill — just simple black outlines. Sketchy and imperfect like a designer's notebook doodle. Illustrating this concept: "${title}. ${description}". No text, no labels, no UI chrome.`,
          n: 1,
          size: "1024x1024",
          quality: "low",
        }),
      });
      if (!imageRes.ok) {
        const err = await imageRes.text();
        throw new Error(`Image error: ${imageRes.status} ${err}`);
      }
      const imageData = await imageRes.json();
      const b64 = imageData.data[0].b64_json;
      result = `data:image/png;base64,${b64}`;

    } else if (flow === "clean_transcript") {
      const systemPrompt = `You are a transcript editor. Clean up spoken text by removing filler words and fixing minor grammar. Respond with ONLY the cleaned text — no explanations, no quotes, no extra content.`;
      const userPrompt = `Clean up this spoken transcript. Remove filler words (um, uh, like, you know, so, er, hmm, ah) and fix minor grammatical errors. Do not summarize, paraphrase, or change the meaning. Preserve the original phrasing as much as possible. Keep it roughly the same length.

Transcript:
"${rawText}"

Respond with ONLY the cleaned text. Do not wrap it in quotes. Do not add any punctuation that was not in the original.`;
      result = await callOpenAI(systemPrompt, userPrompt, false);

    } else if (flow === "transcribe") {
      // Decode base64 audio and send to Whisper
      const binaryStr = atob(audioBase64 as string);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const audioMime: string = mimeType ?? "audio/webm";
      const formData = new FormData();
      formData.append("file", new Blob([bytes], { type: audioMime }), "recording.webm");
      formData.append("model", "whisper-1");
      const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: formData,
      });
      if (!whisperRes.ok) {
        const err = await whisperRes.text();
        throw new Error(`Whisper error: ${whisperRes.status} ${err}`);
      }
      const whisperData = await whisperRes.json();
      result = whisperData.text ?? "";

    } else if (flow === "normalize_age") {
      const systemPrompt = `Extract only the age or age range from the text. Respond with ONLY the number or range (e.g. "25", "25-40", "30s"). Nothing else.`;
      const userPrompt = `Extract the age or age range from this text: "${rawText}"`;
      result = await callOpenAI(systemPrompt, userPrompt, false);

    } else {
      return new Response(JSON.stringify({ error: "Unknown flow" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("ideaflow-ai error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
