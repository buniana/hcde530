import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { ArrowLeft, AlertCircle, ChevronRight, X } from 'lucide-react';
import { Button } from '../components/Button';
import { Spinner } from '../components/Spinner';
import { useSession } from '../context/SessionContext';
import { combineHMWs } from '../api/openai';

const HMW_TIPS = [
  'Make sure your HMW is not too specific — it should open up many possible solutions',
  'Avoid embedding a solution — keep it open to any approach',
  'Ground it in a real observation — not a general assumption',
  'Focus on what your user should feel or achieve, not what to build',
  'Use positive language — "increase" and "create" over "reduce" or "prevent"',
];

function isValidHMW(text: string): boolean {
  return text.toLowerCase().startsWith('how might we') && text.length >= 30;
}

function getDisabledReason(text: string): string | null {
  if (!text.toLowerCase().startsWith('how might we')) return 'Start with "How might we"';
  if (text.length < 30) return 'Add more detail — your HMW is too short';
  return null;
}

function TipsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % HMW_TIPS.length);
        setAnimating(false);
      }, 600);
    }, 6000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex]);

  return (
    <div
      className="overflow-hidden rounded-lg bg-surface border border-border px-4 py-3"
      aria-live="polite"
      aria-atomic="true"
    >
      <p
        className="text-xs text-text-muted leading-relaxed"
        style={{
          transform: animating ? 'translateX(12px)' : 'translateX(0)',
          opacity: animating ? 0 : 1,
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}
      >
        <span className="font-semibold text-text-muted/70">Tip: </span>
        {HMW_TIPS[currentIndex]}
      </p>
    </div>
  );
}

export function HMWEditorScreen() {
  const { session, setScreen, updateSession } = useSession();

  const isCombining = session.selectedHMWs.length >= 2;

  const [text, setText] = useState(isCombining ? '' : session.selectedHMW);
  const [combining, setCombining] = useState(isCombining);
  const [combineError, setCombineError] = useState(false);
  const [showDisabledReason, setShowDisabledReason] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    if (!isCombining) return;
    let cancelled = false;
    combineHMWs(session.selectedHMWs).then((combined) => {
      if (cancelled) return;
      setText(combined);
      setCombining(false);
    }).catch(() => {
      if (cancelled) return;
      setText(session.selectedHMWs[0]);
      setCombining(false);
      setCombineError(true);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const valid = isValidHMW(text);
  const disabledReason = getDisabledReason(text);

  // Flatten all generated questions, then split into selected vs. other
  const allQuestions = session.generatedHMWs.flatMap((t) => t.questions);
  const selectedSet = new Set(session.selectedHMWs.map((q) => q.trim()));
  const selectedQuestions = allQuestions.filter((q) => selectedSet.has(q.trim()));
  const otherQuestions = allQuestions.filter((q) => !selectedSet.has(q.trim()));
  const totalCount = allQuestions.length;

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    setShowDisabledReason(false);
  }

  function handleConfirm() {
    if (!valid) {
      setShowDisabledReason(true);
      return;
    }
    updateSession({ selectedHMW: text.trim() });
    setScreen('preSession');
  }

  return (
    <div className="h-screen overflow-hidden bg-bg phase-enter">
      <div className="flex h-full">
        {/* Main editor column */}
        <div className="flex-1 min-w-0 overflow-y-auto px-4 py-12">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => setScreen('hmwGeneration')}
              className="flex items-center gap-1 text-text-muted hover:text-text transition-colors text-sm font-medium mb-8 focus-visible:outline-2 focus-visible:outline-primary rounded"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Back
            </button>

            <div className="mb-8">
              <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-2">Path A · Step 3 of 3</p>
              <h1 className="text-3xl font-bold text-text mb-2">Refine your How Might We</h1>
              <p className="text-text-muted">
                {isCombining
                  ? 'AI is combining your selected questions. Edit the result until it feels right.'
                  : 'Edit the question until it feels right, then confirm.'}
              </p>
            </div>

            {combining ? (
              <div className="flex flex-col items-center justify-center gap-4 py-16">
                <Spinner size="md" />
                <p className="text-sm text-text-muted">Combining your HMWs...</p>
              </div>
            ) : (
              <>
                {combineError && (
                  <p className="text-xs text-warning mb-4">
                    Could not combine automatically — pre-filled with your first selection.
                  </p>
                )}

                {/* Editor */}
                <div className={[
                  'rounded-card border-2 transition-colors duration-150',
                  valid ? 'border-primary' : 'border-border',
                ].join(' ')}>
                  <textarea
                    value={text}
                    onChange={handleChange}
                    rows={4}
                    aria-label="HMW editor"
                    className="w-full p-4 bg-transparent rounded-card text-base text-text placeholder:text-text-disabled resize-none focus:outline-none leading-relaxed"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-between mt-2 mb-5">
                  <span className="text-xs text-text-muted">
                    {text.length} characters
                  </span>
                  {totalCount > 0 && (
                    <button
                      onClick={() => setPanelOpen((v) => !v)}
                      className="flex items-center gap-1 text-xs font-medium text-text-muted hover:text-text transition-colors focus-visible:outline-2 focus-visible:outline-primary rounded"
                    >
                      {panelOpen ? (
                        <>
                          Hide all HMWs
                          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </>
                      ) : (
                        <>
                          See all HMWs ({totalCount})
                          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Tips carousel */}
                <TipsCarousel />

                {/* Disabled reason */}
                {showDisabledReason && disabledReason && (
                  <p role="alert" className="mt-4 text-sm text-danger font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                    {disabledReason}
                  </p>
                )}

                <Button
                  onClick={handleConfirm}
                  size="lg"
                  className="w-full mt-5"
                  disabled={!valid}
                >
                  Confirm HMW
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Reference side panel — persistent, no overlay */}
        {panelOpen && (
          <aside
            aria-label="All How Might We questions for reference"
            className="w-80 shrink-0 border-l border-border bg-surface flex flex-col"
            style={{ animation: 'slideInRight 0.22s ease' }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-bold text-text">All HMWs</h2>
                <p className="text-xs text-text-muted mt-0.5">For reference only</p>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="p-1.5 rounded text-text-muted hover:text-text transition-colors focus-visible:outline-2 focus-visible:outline-primary"
                aria-label="Close reference panel"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
              {/* Selected group */}
              {selectedQuestions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 px-1">
                    Selected ({selectedQuestions.length})
                  </p>
                  <div className="flex flex-col gap-2">
                    {selectedQuestions.map((q) => (
                      <div
                        key={q}
                        className="p-3.5 rounded-card border border-primary/30 bg-primary/8 relative"
                      >
                        <span className="inline-block text-[10px] font-semibold text-primary uppercase tracking-wide bg-primary/12 px-2 py-0.5 rounded-full mb-2">
                          Selected
                        </span>
                        <p className="text-sm text-text leading-relaxed">{q}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other group */}
              {otherQuestions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2 px-1">
                    Other HMWs ({otherQuestions.length})
                  </p>
                  <div className="flex flex-col gap-2">
                    {otherQuestions.map((q) => (
                      <div
                        key={q}
                        className="p-3.5 rounded-card border border-border bg-bg"
                      >
                        <p className="text-sm text-text leading-relaxed">{q}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .bg-primary\\/8 { background-color: color-mix(in srgb, var(--color-primary) 8%, transparent); }
        .bg-primary\\/12 { background-color: color-mix(in srgb, var(--color-primary) 12%, transparent); }
      `}</style>
    </div>
  );
}
