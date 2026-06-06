import React, { createContext, useContext, useState, useEffect } from 'react';
import { SessionState, initialSessionState, Screen, Idea } from '../types';

interface SessionContextValue {
  session: SessionState;
  screen: Screen;
  setScreen: (screen: Screen) => void;
  updateSession: (updates: Partial<SessionState>) => void;
  appendIdea: (idea: Idea) => void;
  updateIdeaById: (id: string, updates: Partial<Idea>) => void;
  resetSession: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const STORAGE_KEY = 'ideaflow_session_v1';
const RESTORABLE_SCREENS: Screen[] = ['crazyEights', 'summary'];

function loadPersistedState(): { session: SessionState; screen: Screen } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.screen || !parsed?.session) return null;
    if (!RESTORABLE_SCREENS.includes(parsed.screen)) return null;
    return { session: parsed.session as SessionState, screen: parsed.screen as Screen };
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const persisted = loadPersistedState();
  const [session, setSession] = useState<SessionState>(persisted?.session ?? initialSessionState);
  const [screen, setScreen] = useState<Screen>(persisted?.screen ?? 'entry');

  useEffect(() => {
    if (RESTORABLE_SCREENS.includes(screen)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ session, screen }));
    }
  }, [session, screen]);

  function updateSession(updates: Partial<SessionState>) {
    setSession((prev) => ({ ...prev, ...updates }));
  }

  function appendIdea(idea: Idea) {
    setSession((prev) => ({
      ...prev,
      ideas: [...prev.ideas, idea],
    }));
  }

  function updateIdeaById(id: string, updates: Partial<Idea>) {
    setSession((prev) => ({
      ...prev,
      ideas: prev.ideas.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    }));
  }

  function resetSession() {
    localStorage.removeItem(STORAGE_KEY);
    setSession(initialSessionState);
    setScreen('entry');
  }

  return (
    <SessionContext.Provider
      value={{ session, screen, setScreen, updateSession, appendIdea, updateIdeaById, resetSession }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
