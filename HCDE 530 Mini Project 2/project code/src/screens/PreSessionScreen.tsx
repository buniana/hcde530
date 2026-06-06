import { useState } from 'react';
import { ArrowLeft, Timer } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ContextBar } from '../components/ContextBar';
import { Spinner } from '../components/Spinner';
import { useSession } from '../context/SessionContext';
import { generateCrazy8sPrompts } from '../api/openai';

const PRESETS: { label: string; sublabel: string; value: 60 | 90 | 120 }[] = [
  { label: '60s', sublabel: 'Quick', value: 60 },
  { label: '90s', sublabel: 'Standard', value: 90 },
  { label: '120s', sublabel: 'Extended', value: 120 },
];

export function PreSessionScreen() {
  const { session, setScreen, updateSession } = useSession();
  const [duration, setDuration] = useState<60 | 90 | 120>(session.roundDuration);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const prevScreen = session.entryPath === 'A' ? 'hmwGeneration' : 'directHMW';

  function handleKeyDown(e: React.KeyboardEvent, value: 60 | 90 | 120) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setDuration(value);
    }
  }

  async function handleBegin() {
    setLoading(true);
    setError('');
    try {
      const prompts = await generateCrazy8sPrompts(session.selectedHMW);
      updateSession({ roundDuration: duration, crazyEightsPrompts: prompts, currentRound: 1, isSessionActive: true, ideas: [] });
      setScreen('crazyEights');
    } catch {
      setError('Something went wrong preparing your session. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-12 phase-enter">
      <div className="w-full max-w-lg">
        <button
          onClick={() => setScreen(prevScreen)}
          className="flex items-center gap-1 text-text-muted hover:text-text transition-colors text-sm font-medium mb-8 focus-visible:outline-2 focus-visible:outline-primary rounded"
          disabled={loading}
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-text mb-4">Set your round timer</h1>
          <ContextBar hmw={session.selectedHMW} targetUser={session.targetUser || undefined} />
        </div>

        <fieldset className="mb-8">
          <legend className="text-sm font-semibold text-text mb-3">Timer preset</legend>
          <div className="grid grid-cols-3 gap-3" role="radiogroup">
            {PRESETS.map((p) => {
              const isSelected = duration === p.value;
              return (
                <Card
                  key={p.value}
                  selectable
                  selected={isSelected}
                  onClick={() => setDuration(p.value)}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(e, p.value)}
                  className="text-center p-4"
                >
                  <div className="flex items-center justify-center mb-2">
                    <Timer className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-text-muted'}`} aria-hidden="true" />
                  </div>
                  <p className={`text-2xl font-bold mb-1 ${isSelected ? 'text-primary' : 'text-text'}`}>{p.label}</p>
                  <p className="text-xs text-text-muted font-medium">{p.sublabel}</p>
                  {p.value === 90 && (
                    <span className="inline-block mt-2 text-xs bg-primary/10 text-primary font-semibold rounded-full px-2 py-0.5">
                      Default
                    </span>
                  )}
                </Card>
              );
            })}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="text-sm text-danger font-medium mb-4">{error}</p>
        )}

        {loading ? (
          <div className="flex justify-center py-4">
            <Spinner message="Preparing your session..." />
          </div>
        ) : (
          <Button onClick={handleBegin} size="lg" className="w-full">
            Begin Crazy 8s
          </Button>
        )}
      </div>
    </div>
  );
}
