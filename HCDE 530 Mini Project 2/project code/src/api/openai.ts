const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const MOCK_API = import.meta.env.VITE_MOCK_API === 'true';

function delay(ms = 900): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  const data = await res.json();
  return data.result;
}

export interface HMWTheme {
  label: string;
  questions: string[];
}

export async function generateHMWs(
  targetUser: string,
  ageRange: string,
  insight: string,
  desiredOutcome: string,
  scope: string
): Promise<HMWTheme[]> {
  if (MOCK_API) {
    await delay(1100);
    return [
      {
        label: 'Discovery & Awareness',
        questions: [
          'How might we help users discover relevant information before they even know they need it?',
          'How might we surface hidden patterns that users overlook in their daily workflow?',
          'How might we reduce the cognitive load of finding the right starting point?',
        ],
      },
      {
        label: 'Trust & Confidence',
        questions: [
          'How might we give users confidence that the system understands their intent?',
          'How might we make errors feel recoverable rather than catastrophic?',
          'How might we build trust incrementally without slowing users down?',
        ],
      },
      {
        label: 'Collaboration & Sharing',
        questions: [
          'How might we make it effortless to share progress with teammates at any stage?',
          'How might we capture individual insights without disrupting group flow?',
          'How might we let people contribute asynchronously without losing context?',
        ],
      },
      {
        label: 'Personalization & Control',
        questions: [
          'How might we let power users customize their experience without overwhelming newcomers?',
          'How might we remember user preferences without requiring explicit configuration?',
          'How might we give users a sense of ownership over their workspace?',
        ],
      },
    ];
  }

  const result = await callEdgeFunction({
    flow: 'hmw_generation',
    targetUser,
    ageRange,
    insight,
    desiredOutcome,
    scope,
  });
  const parsed = JSON.parse(result);
  return parsed.themes;
}

export async function regenerateSingleHMW(
  targetUser: string,
  ageRange: string,
  insight: string,
  desiredOutcome: string,
  scope: string
): Promise<string> {
  if (MOCK_API) {
    await delay(700);
    const options = [
      'How might we help users feel more in control of their experience from the very first interaction?',
      'How might we make the transition between steps feel completely seamless?',
      'How might we surface the most relevant option without requiring any search?',
      'How might we let users undo any action without fear of losing their work?',
      'How might we encourage exploration without overwhelming first-time users?',
    ];
    return options[Math.floor(Math.random() * options.length)];
  }

  const result = await callEdgeFunction({
    flow: 'hmw_single',
    targetUser,
    ageRange,
    insight,
    desiredOutcome,
    scope,
  });
  return result.trim();
}

export async function combineHMWs(questions: string[]): Promise<string> {
  if (MOCK_API) {
    await delay(900);
    const stripped = questions.map((q) => q.replace(/^how might we /i, ''));
    return `How might we ${stripped.join(' and ')}`;
  }

  const result = await callEdgeFunction({ flow: 'hmw_combine', hmwQuestions: questions });
  return result.trim();
}

export async function generateCrazy8sPrompts(selectedHMW: string): Promise<string[]> {
  if (MOCK_API) {
    await delay(800);
    return [
      'The most obvious solution, executed perfectly',
      'What if money and time were no object?',
      'The opposite of what users expect',
      'A solution borrowed from a completely different industry',
      'The simplest possible version — one screen, one action',
      'A solution that works without any technology',
      'What a first-time user would intuitively reach for',
      'The version you would pitch to a skeptical executive',
    ];
  }

  const result = await callEdgeFunction({ flow: 'crazy8s_prompts', selectedHMW });
  const parsed = JSON.parse(result);
  return parsed.prompts;
}

export async function generateIdeaTitle(
  selectedHMW: string,
  description: string
): Promise<string> {
  if (MOCK_API) {
    await delay(600);
    const titles = [
      'Smart Context Engine',
      'Guided Discovery Flow',
      'Adaptive Trust Layer',
      'One-Tap Collaboration',
      'Silent Personalization',
      'Confidence Scaffold',
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  }

  const result = await callEdgeFunction({ flow: 'generate_title', selectedHMW, description });
  return result.trim();
}

export async function generateFullIdea(
  selectedHMW: string,
  targetUser: string,
  ageRange: string,
  roundPrompt: string
): Promise<{ title: string; description: string }> {
  if (MOCK_API) {
    await delay(1000);
    const ideas = [
      {
        title: 'Ambient Intent Detection',
        description:
          'Track micro-interactions to infer what the user is about to need, then proactively surface the right tool or content before they have to search for it.',
      },
      {
        title: 'Guided Recovery Mode',
        description:
          'When an error occurs, instantly present a step-by-step recovery path with a visual undo timeline so users never feel stuck or afraid to experiment.',
      },
      {
        title: 'Async Snapshot Sharing',
        description:
          'Let users capture a timestamped snapshot of their current state with one tap and share it as a rich preview — no export or context-switching required.',
      },
      {
        title: 'Invisible Preference Learning',
        description:
          "Silently observe repeated actions and gradually adapt the interface layout, shortcuts, and defaults to match each user's natural rhythm.",
      },
      {
        title: 'Confidence Score Indicator',
        description:
          'Show a subtle confidence score next to AI-generated suggestions, giving users enough signal to decide when to trust the output and when to verify.',
      },
      {
        title: 'Progressive Disclosure Wizard',
        description:
          'Reveal advanced options only after a user has completed the basic task successfully, reducing decision fatigue for newcomers without limiting experts.',
      },
    ];
    const index = (roundPrompt.length + Math.floor(Math.random() * 3)) % ideas.length;
    return ideas[index];
  }

  const result = await callEdgeFunction({
    flow: 'ai_suggest',
    selectedHMW,
    targetUser,
    ageRange,
    roundPrompt,
  });
  return JSON.parse(result);
}

const FILLER_RE = /\b(um+|uh+|like|you know|so|er|hmm+|ah+)\b[,.]?\s*/gi;

export async function cleanTranscript(rawText: string): Promise<string> {
  if (!rawText.trim()) return rawText;

  if (MOCK_API) {
    await delay(400);
    return rawText
      .replace(FILLER_RE, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  const result = await callEdgeFunction({ flow: 'clean_transcript', rawText });
  return result.trim() || rawText;
}

export async function generateSketch(
  title: string,
  description: string
): Promise<string> {
  if (MOCK_API) {
    await delay(1200);
    return 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=1024';
  }

  const result = await callEdgeFunction({
    flow: 'generate_sketch',
    title,
    description,
  });
  return result.trim();
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  if (MOCK_API) {
    await delay(800);
    return 'This is a mock transcript from the voice recording.';
  }

const buffer = await audioBlob.arrayBuffer();
const bytes = new Uint8Array(buffer);
const chunkSize = 8192;
let binary = '';
for (let i = 0; i < bytes.byteLength; i += chunkSize) {
  binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
}
const audioBase64 = btoa(binary);

  const result = await callEdgeFunction({
    flow: 'transcribe',
    audioBase64,
    mimeType: audioBlob.type || 'audio/webm',
  });
  return result.trim();
}

export async function generateHelperQuestion(
  selectedHMW: string,
  currentRound: number,
  ideasInQueue: string
): Promise<string> {
  if (MOCK_API) {
    await delay(700);
    const hints = [
      'What would this look like if it were invisible to the user?',
      'How might a child approach this problem?',
      'What if the constraint you assumed is actually optional?',
      'What does the opposite of your current idea look like?',
      'What would make this so simple it almost seems too obvious?',
    ];
    return hints[Math.floor(Math.random() * hints.length)];
  }

  const result = await callEdgeFunction({
    flow: 'helper_question',
    selectedHMW,
    currentRound,
    ideasInQueue,
  });
  return result.trim();
}

export async function normalizeAgeRange(rawText: string): Promise<string> {
  const result = await callEdgeFunction({ 
    flow: 'normalize_age', 
    rawText 
  });
  return result.trim();
}