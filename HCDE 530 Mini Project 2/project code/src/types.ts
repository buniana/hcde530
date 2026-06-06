export type EntryPath = 'A' | 'B';

export type Screen =
  | 'entry'
  | 'intake'
  | 'userContext'
  | 'painPoints'
  | 'hmwGeneration'
  | 'hmwEditor'
  | 'directHMW'
  | 'preSession'
  | 'crazyEights'
  | 'summary';

export interface HMWTheme {
  label: string;
  questions: string[];
}

export interface Idea {
  id: string;
  roundCaptured: number;
  description: string;
  title: string;
  aiGenerated: boolean;
  isDraft?: boolean;
}

export interface SessionState {
  entryPath: EntryPath | null;
  targetUser: string;
  ageRange: string;
  insight: string;
  desiredOutcome: string;
  scope: string;
  generatedHMWs: HMWTheme[];
  selectedHMW: string;
  selectedHMWs: string[];
  roundDuration: 60 | 90 | 120;
  crazyEightsPrompts: string[];
  currentRound: number;
  isSessionActive: boolean;
  ideas: Idea[];
  draftText: string;
}

export const initialSessionState: SessionState = {
  entryPath: null,
  targetUser: '',
  ageRange: '',
  insight: '',
  desiredOutcome: '',
  scope: '',
  generatedHMWs: [],
  selectedHMW: '',
  selectedHMWs: [],
  roundDuration: 90,
  crazyEightsPrompts: [],
  currentRound: 1,
  isSessionActive: false,
  ideas: [],
  draftText: '',
};
