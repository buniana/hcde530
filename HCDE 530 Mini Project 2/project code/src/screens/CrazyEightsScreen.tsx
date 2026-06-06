import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, ArrowRight, X, Check, Lightbulb, Trash2, RefreshCw, Play, Pause, Package } from 'lucide-react';
import { Button } from '../components/Button';
import { ContextBar } from '../components/ContextBar';
import { Spinner } from '../components/Spinner';
import { MicButton } from '../components/MicButton';
import { useSession } from '../context/SessionContext';
import { generateFullIdea, generateHelperQuestion } from '../api/openai';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function FigureSvg() {
  return (
    <svg
      width="20"
      height="28"
      viewBox="0 0 20 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="10" cy="5" r="4" fill="currentColor" />
      <line x1="10" y1="9" x2="10" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="3" y1="13" x2="17" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="10" y1="19" x2="5" y2="27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="10" y1="19" x2="15" y2="27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function CrazyEightsScreen() {
  const { session, setScreen, updateSession, appendIdea } = useSession();
  const { selectedHMW, targetUser, ageRange, roundDuration, crazyEightsPrompts, currentRound, ideas } = session;

  const [secondsLeft, setSecondsLeft] = useState(roundDuration);
  const [isPaused, setIsPaused] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const draftText = session.draftText;

  // AI suggest state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ title: string; description: string } | null>(null);

  // Helper question state — persists across rounds intentionally
  const [helperQuestion, setHelperQuestion] = useState<string | null>(null);
  const [helperLoading, setHelperLoading] = useState(false);
  const [helperError, setHelperError] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showHelperDrawer, setShowHelperDrawer] = useState(false);
  // Track whether the sticky has been shown at least once this session
  const [helperEverShown, setHelperEverShown] = useState(false);

  // Mobile queue drawer
  const [showQueueDrawer, setShowQueueDrawer] = useState(false);

  // Round transition
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isEntering, setIsEntering] = useState(true);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const roundPrompt = crazyEightsPrompts[currentRound - 1] ?? '';

  const timerColor =
    secondsLeft <= 10
      ? 'text-danger'
      : secondsLeft <= 30
      ? 'text-[#E07A10]'
      : 'text-primary';

  const shouldPulse = secondsLeft <= 10 && !isPaused;

  const autoSaveRound = useCallback((roundIndex: number, draft: string) => {
    appendIdea({
      id: genId(),
      roundCaptured: roundIndex,
      description: draft.trim(),
      title: '',
      aiGenerated: false,
      isDraft: true,
    });
    updateSession({ draftText: '' });
  }, [appendIdea, updateSession]);

  const advanceRound = useCallback((roundIndex: number, draft: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    autoSaveRound(roundIndex, draft);
    if (roundIndex >= 8) {
      setScreen('summary');
    } else {
      if (!prefersReducedMotion()) {
        setIsTransitioning(true);
        if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = setTimeout(() => {
          setIsTransitioning(false);
          setIsEntering(true);
          updateSession({ currentRound: roundIndex + 1 });
          setScreen('crazyEights');
        }, 320);
      } else {
        updateSession({ currentRound: roundIndex + 1 });
        setScreen('crazyEights');
      }
    }
  }, [setScreen, autoSaveRound, updateSession]);

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          advanceRound(currentRound, session.draftText);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, advanceRound, currentRound, session.draftText]);

  // Reset only timer/UI state on round change — helper question intentionally NOT reset
  useEffect(() => {
    setSecondsLeft(roundDuration);
    setIsPaused(false);
    setShowAiModal(false);
    setAiSuggestion(null);
    setAiError('');
    setShowEndConfirm(false);
    setShowSkipConfirm(false);
    setShowQueueDrawer(false);
    // Trigger enter animation on new round
    setIsEntering(true);
    const t = setTimeout(() => setIsEntering(false), 400);
    return () => clearTimeout(t);
  }, [currentRound, roundDuration]);

  async function fetchAiSuggestion() {
    setAiLoading(true);
    setAiError('');
    setAiSuggestion(null);
    try {
      const idea = await generateFullIdea(selectedHMW, targetUser, ageRange, roundPrompt);
      setAiSuggestion(idea);
    } catch {
      setAiError('Something went wrong. Please try again.');
      setShowAiModal(false);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleAiSuggest() {
    setShowAiModal(true);
    await fetchAiSuggestion();
  }

  function handleAiKeep() {
    if (!aiSuggestion) return;
    appendIdea({
      id: genId(),
      roundCaptured: currentRound,
      description: aiSuggestion.description,
      title: aiSuggestion.title,
      aiGenerated: true,
      isDraft: false,
    });
    setShowAiModal(false);
  }

  function handleAiEditThis() {
    if (!aiSuggestion) return;
    updateSession({ draftText: aiSuggestion.description });
    setShowAiModal(false);
  }

  function handleRemoveIdea(id: string) {
    updateSession({ ideas: ideas.filter((i) => i.id !== id) });
  }

  function handleNextRoundClick() {
    setShowSkipConfirm((p) => !p);
  }

  function handleSkipRound() {
    setShowSkipConfirm(false);
    advanceRound(currentRound, session.draftText);
  }

  function handleEndEarly() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (session.draftText.trim()) {
      autoSaveRound(currentRound, session.draftText);
    } else {
      updateSession({ draftText: '' });
    }
    setScreen('summary');
  }

  async function handleBoxClick() {
    if (helperLoading) return;

    if (!prefersReducedMotion()) {
      setIsAnimating(true);
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
      animTimeoutRef.current = setTimeout(() => setIsAnimating(false), 600);
    }

    setHelperEverShown(true);
    setShowHelperDrawer(true);
    setHelperLoading(true);
    setHelperError(false);

    const ideasText = ideas.length > 0
      ? ideas.map((i) => i.description || '(no description)').join('\n')
      : 'No ideas yet';

    try {
      const question = await generateHelperQuestion(selectedHMW, currentRound, ideasText);
      setHelperQuestion(question);
    } catch {
      setHelperError(true);
      setHelperQuestion(null);
    } finally {
      setHelperLoading(false);
    }
  }

  const roundsLeft = 8 - currentRound;
  const isDraftEmpty = !draftText.trim();

  return (
    <div className="min-h-screen bg-bg flex flex-col phase-enter">
      {/* Top bar — HMW only */}
      <div className="border-b border-border bg-surface px-4 py-3">
        <div className="max-w-5xl mx-auto">
          <ContextBar hmw={selectedHMW} targetUser={targetUser || undefined} />
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Left area — sticky note(s), desktop only, no panel chrome */}
        <div className="hidden lg:flex flex-col items-start justify-center w-64 shrink-0 px-4 py-6">
          {helperEverShown && (
            <div
              className="relative p-4"
              style={{
                background: 'var(--color-accent)',
                transform: 'rotate(-1.5deg)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
              }}
            >
              {/* Tape strip */}
              <div
                className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-10 h-5 rounded-sm"
                style={{ background: 'rgba(255,255,255,0.55)', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}
                aria-hidden="true"
              />
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: 'var(--color-text-muted)' }}>
                Think about it this way...
              </p>
              {helperLoading ? (
                <div className="space-y-2">
                  <div className="h-2.5 rounded animate-pulse w-full" style={{ background: 'rgba(0,0,0,0.12)' }} />
                  <div className="h-2.5 rounded animate-pulse w-4/5" style={{ background: 'rgba(0,0,0,0.12)' }} />
                  <div className="h-2.5 rounded animate-pulse w-3/5" style={{ background: 'rgba(0,0,0,0.12)' }} />
                </div>
              ) : helperError ? (
                <button onClick={handleBoxClick} className="text-left w-full">
                  <p className="text-xs italic leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                    Couldn't generate a hint — tap to try again.
                  </p>
                </button>
              ) : helperQuestion ? (
                <>
                  <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--color-text)' }}>
                    {helperQuestion}
                  </p>
                  <button
                    onClick={handleBoxClick}
                    className="mt-3 flex items-center gap-1 text-[10px] transition-colors"
                    style={{ color: 'var(--color-text-muted)' }}
                    aria-label="Generate another hint"
                  >
                    <RefreshCw className="w-3 h-3" aria-hidden="true" />
                    Another angle
                  </button>
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Main panel */}
        <div
          className={[
            'flex-1 flex flex-col items-center justify-center px-4 py-8',
            isTransitioning ? 'round-exit' : isEntering ? 'round-enter' : '',
          ].join(' ')}
        >
          <div className="w-full max-w-lg">
            {/* Round progress */}
            <div
              role="status"
              aria-label={`Round ${currentRound} of 8`}
              className="flex items-center justify-between mb-6"
            >
              <div className="flex gap-1.5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className={[
                      'h-2 rounded-full transition-all duration-300',
                      i < currentRound - 1
                        ? 'bg-primary w-6'
                        : i === currentRound - 1
                        ? 'bg-secondary w-8'
                        : 'bg-border w-6',
                    ].join(' ')}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-text-muted">Round {currentRound} of 8</span>
            </div>

            {/* Timer */}
            <div className="text-center mb-6">
              <div
                role="timer"
                aria-live={secondsLeft <= 10 ? 'assertive' : 'polite'}
                aria-label={`${formatTime(secondsLeft)} remaining`}
                className={[
                  'font-mono font-bold leading-none mb-2 transition-colors duration-500',
                  'text-[64px] md:text-[80px]',
                  timerColor,
                  shouldPulse ? 'timer-pulse' : '',
                ].join(' ')}
              >
                {formatTime(secondsLeft)}
              </div>
              {secondsLeft <= 10 && !isPaused && (
                <p className="text-danger text-sm font-semibold" aria-live="assertive">
                  Time running out!
                </p>
              )}
              {secondsLeft > 10 && secondsLeft <= 30 && (
                <p className="text-[#E07A10] text-sm font-semibold">Wrapping up...</p>
              )}
            </div>

            {/* Idea input */}
            <div className="bg-surface border border-border rounded-card p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="draft-idea" className="text-xs font-bold text-text-muted uppercase tracking-widest">
                  Your idea
                </label>
                <div className="flex items-center gap-1 -mr-1">
                  <div className="relative">
                    {isAnimating && (
                      <span
                        className="absolute -top-7 left-1/2 -translate-x-1/2 text-tertiary-pink figure-pop pointer-events-none"
                        aria-hidden="true"
                      >
                        <FigureSvg />
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBoxClick}
                      disabled={helperLoading}
                      className={['text-text-muted', isAnimating ? 'box-shake' : ''].join(' ')}
                      aria-label="Get a thinking hint"
                      title="Get a thinking hint"
                    >
                      <Package className="w-4 h-4 text-tertiary-pink" aria-hidden="true" />
                      Hint
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAiSuggest}
                    disabled={aiLoading}
                    className="text-text-muted"
                  >
                    <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
                    AI suggest
                  </Button>
                </div>
              </div>
              <div className="relative">
                <textarea
                  id="draft-idea"
                  value={draftText}
                  onChange={(e) => updateSession({ draftText: e.target.value })}
                  placeholder="Describe an idea for this round..."
                  rows={3}
                  className="w-full resize-none text-sm text-text bg-bg border border-border rounded-input px-3 py-2 pr-10 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-text-disabled"
                />
                <div className="absolute right-2 top-2">
                  <MicButton
                    onTranscript={(t) => updateSession({ draftText: draftText ? `${draftText} ${t}` : t })}
                  />
                </div>
              </div>
              <p className="text-xs text-text-disabled mt-2">
                Your idea is saved automatically when the round ends.
              </p>
              {aiError && <p className="text-xs text-danger mt-1">{aiError}</p>}
            </div>

            {/* Pause / Next round */}
            <div className="flex gap-2 mb-4">
              <Button
                variant="ghost"
                onClick={() => setIsPaused((p) => !p)}
                className="flex-1"
                aria-label={isPaused ? 'Resume timer' : 'Pause timer'}
              >
                {isPaused ? (
                  <><Play className="w-4 h-4" aria-hidden="true" /> Resume</>
                ) : (
                  <><Pause className="w-4 h-4" aria-hidden="true" /> Pause</>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={handleNextRoundClick}
                className="flex-1"
              >
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
                Next round
              </Button>
            </div>

            {/* Next round confirmation */}
            {showSkipConfirm && (
              <div className="bg-surface border border-border rounded-card p-4 mb-4 phase-enter">
                {isDraftEmpty ? (
                  <>
                    <p className="text-sm font-medium text-text mb-1">Your idea box is empty.</p>
                    <p className="text-sm text-text-muted mb-3">
                      This round will be saved without an idea. You can use AI to fill it in later on the summary screen.
                    </p>
                  </>
                ) : (
                  <p className="text-sm font-medium text-text mb-3">
                    Move to the next round now?
                  </p>
                )}
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={handleSkipRound} className="flex-1">
                    <Check className="w-4 h-4" aria-hidden="true" />
                    {isDraftEmpty ? 'Skip anyway' : 'Yes, next round'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowSkipConfirm(false)} className="flex-1">
                    {isDraftEmpty ? 'Keep writing' : 'Keep going'}
                  </Button>
                </div>
              </div>
            )}

            {/* End early */}
            <div className="text-center">
              <button
                onClick={() => setShowEndConfirm((p) => !p)}
                className="text-sm text-text-muted hover:text-danger transition-colors underline focus-visible:outline-2 focus-visible:outline-primary rounded"
              >
                End session early
              </button>
            </div>

            {showEndConfirm && (
              <div className="bg-surface border border-danger/30 rounded-card p-4 mt-3 phase-enter">
                <p className="text-sm font-medium text-text mb-3">
                  Are you sure? You'll skip to the summary with {ideas.length} idea{ideas.length !== 1 ? 's' : ''} captured.
                  {roundsLeft > 0 && ` ${roundsLeft} round${roundsLeft !== 1 ? 's' : ''} remaining.`}
                </p>
                <div className="flex gap-2">
                  <Button variant="destructive" size="sm" onClick={handleEndEarly} className="flex-1">
                    <X className="w-4 h-4" aria-hidden="true" /> Yes, end session
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowEndConfirm(false)} className="flex-1">
                    Keep going
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop sidebar — idea queue */}
        <aside className="hidden lg:flex flex-col w-72 shrink-0 border-l border-border bg-surface px-4 py-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-text uppercase tracking-widest">Idea Queue</h2>
            <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {ideas.length} {ideas.length === 1 ? 'idea' : 'ideas'}
            </span>
          </div>
          {ideas.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-10">
              <Lightbulb className="w-8 h-8 text-border mb-3" aria-hidden="true" />
              <p className="text-sm text-text-disabled">Your ideas will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ideas.map((idea) => (
                <div key={idea.id} className="bg-bg border border-border rounded-btn px-3 py-2.5 flex items-start gap-2 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-xs font-semibold text-primary">R{idea.roundCaptured}</p>
                      {idea.aiGenerated && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] bg-secondary/10 text-secondary font-semibold px-1.5 py-0.5 rounded-full leading-none">
                          <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
                          AI
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text leading-snug line-clamp-3">
                      {idea.description || <span className="text-text-disabled italic">No text yet</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveIdea(idea.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-text-disabled hover:text-danger mt-0.5 shrink-0"
                    aria-label="Remove idea"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      {/* Mobile floating queue button */}
      <button
        onClick={() => setShowQueueDrawer(true)}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-white shadow-card-hover flex items-center justify-center z-40 hover:bg-primary/90 transition-colors"
        aria-label={`Open idea queue (${ideas.length} ideas)`}
      >
        <Lightbulb className="w-6 h-6" aria-hidden="true" />
        {ideas.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-secondary text-white text-xs font-bold flex items-center justify-center">
            {ideas.length}
          </span>
        )}
      </button>

      {/* Mobile queue drawer */}
      {showQueueDrawer && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowQueueDrawer(false)}
          />
          <div className="absolute inset-x-0 bottom-0 bg-surface rounded-t-card p-5 max-h-[70vh] flex flex-col slide-up-panel">
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-bold text-text">Idea Queue</span>
              <button
                onClick={() => setShowQueueDrawer(false)}
                className="text-text-muted hover:text-text transition-colors"
                aria-label="Close queue"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {ideas.length} {ideas.length === 1 ? 'idea' : 'ideas'}
                </span>
              </div>
              {ideas.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-10">
                  <Lightbulb className="w-8 h-8 text-border mb-3" aria-hidden="true" />
                  <p className="text-sm text-text-disabled">Your ideas will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {ideas.map((idea) => (
                    <div key={idea.id} className="bg-bg border border-border rounded-btn px-3 py-2.5 flex items-start gap-2 group">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-xs font-semibold text-primary">R{idea.roundCaptured}</p>
                          {idea.aiGenerated && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] bg-secondary/10 text-secondary font-semibold px-1.5 py-0.5 rounded-full leading-none">
                              <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
                              AI
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text leading-snug line-clamp-3">
                          {idea.description || <span className="text-text-disabled italic">No text yet</span>}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveIdea(idea.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-text-disabled hover:text-danger mt-0.5 shrink-0"
                        aria-label="Remove idea"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile helper hint drawer */}
      {showHelperDrawer && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowHelperDrawer(false)}
          />
          <div className="absolute inset-x-0 bottom-0 bg-surface rounded-t-card p-5 max-h-[60vh] flex flex-col slide-up-panel">
            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-bold text-text flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" aria-hidden="true" />
                Thinking hint
              </span>
              <button
                onClick={() => setShowHelperDrawer(false)}
                className="text-text-muted hover:text-text transition-colors"
                aria-label="Close hint"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">
                💡 Think about it this way...
              </p>
              {helperLoading ? (
                <div className="space-y-2">
                  <div className="h-3 bg-border rounded animate-pulse w-full" />
                  <div className="h-3 bg-border rounded animate-pulse w-4/5" />
                  <div className="h-3 bg-border rounded animate-pulse w-2/3" />
                </div>
              ) : helperError ? (
                <button onClick={handleBoxClick} className="text-left w-full">
                  <p className="text-sm text-text-muted italic hover:text-text transition-colors">
                    Couldn't generate a hint — tap to try again.
                  </p>
                </button>
              ) : helperQuestion ? (
                <>
                  <p className="text-sm font-medium text-text leading-relaxed">{helperQuestion}</p>
                  <button
                    onClick={handleBoxClick}
                    className="mt-4 flex items-center gap-1 text-xs text-text-disabled hover:text-primary transition-colors"
                    aria-label="Generate another hint"
                  >
                    <RefreshCw className="w-3 h-3" aria-hidden="true" />
                    Another angle
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* AI Suggestion Modal */}
      {showAiModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-modal-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => !aiLoading && setShowAiModal(false)} />
          <div className="relative bg-surface border border-border rounded-t-card sm:rounded-card shadow-card-hover w-full sm:max-w-md p-6 slide-up-panel">
            <div className="flex items-center justify-between mb-1">
              <h2 id="ai-modal-title" className="text-lg font-bold text-text flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
                AI suggestion
              </h2>
              {aiSuggestion && !aiLoading && (
                <button
                  onClick={fetchAiSuggestion}
                  className="flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors px-2 py-1 rounded hover:bg-primary/5"
                  aria-label="Regenerate AI suggestion"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate
                </button>
              )}
            </div>
            <p className="text-xs text-text-muted mb-4">Timer is still running</p>

            {aiLoading ? (
              <div className="py-6 flex justify-center">
                <Spinner message="Generating idea..." />
              </div>
            ) : aiSuggestion ? (
              <>
                <div className="bg-bg border border-border rounded-btn p-4 mb-5">
                  <p className="text-sm font-bold text-text mb-1">{aiSuggestion.title}</p>
                  <p className="text-sm text-text-muted leading-relaxed">{aiSuggestion.description}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="primary" onClick={handleAiKeep} className="w-full">
                    <Check className="w-4 h-4" aria-hidden="true" />
                    Keep this
                  </Button>
                  <Button variant="secondary" onClick={handleAiEditThis} className="w-full">
                    Edit this
                  </Button>
                  <Button variant="ghost" onClick={() => setShowAiModal(false)} className="w-full">
                    Dismiss
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
