import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useSession } from '../context/SessionContext';

export function DirectHMWScreen() {
  const { session, setScreen, updateSession } = useSession();
  const [hmw, setHmw] = useState(session.selectedHMW);
  const [error, setError] = useState('');

  function validate(value: string): boolean {
    if (!value.trim()) {
      setError('Please enter your How Might We question.');
      return false;
    }
    if (!value.trim().toLowerCase().startsWith('how might we')) {
      setError('Your question should start with "How might we".');
      return false;
    }
    setError('');
    return true;
  }

  function handleContinue() {
    if (!validate(hmw)) return;
    updateSession({ selectedHMW: hmw.trim() });
    setScreen('preSession');
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-12 phase-enter">
      <div className="w-full max-w-lg">
        <button
          onClick={() => setScreen('entry')}
          className="flex items-center gap-1 text-text-muted hover:text-text transition-colors text-sm font-medium mb-8 focus-visible:outline-2 focus-visible:outline-primary rounded"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back
        </button>

        <div className="mb-8">
          <p className="text-sm font-semibold text-secondary uppercase tracking-wide mb-2">Path B</p>
          <h1 className="text-3xl font-bold text-text mb-3">What's your design challenge?</h1>
          <p className="text-text-muted">
            Type your How Might We question directly and jump straight into Crazy 8s.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <Input
            id="direct-hmw"
            label="Your How Might We question"
            placeholder="How might we..."
            hint='Must start with "How might we"'
            value={hmw}
            onChange={(e) => {
              setHmw(e.target.value);
              if (error) validate(e.target.value);
            }}
            onBlur={() => validate(hmw)}
            error={error}
            required
            autoFocus
          />

          <Button
            onClick={handleContinue}
            size="lg"
            className="w-full mt-2"
            disabled={!hmw.trim()}
          >
            Start ideation
          </Button>
        </div>
      </div>
    </div>
  );
}
