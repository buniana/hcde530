import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { useSession } from '../context/SessionContext';
import { generateHMWs } from '../api/openai';

type Step = 1 | 2 | 3 | 4 | 5;

const TOTAL = 5;

const QUESTIONS: Record<Step, string> = {
  1: 'Who are you designing for?',
  2: 'What age range are they?',
  3: 'What did you observe or learn?',
  4: 'What outcome do users want?',
  5: 'What is the scope or context?',
};

const PLACEHOLDERS: Record<Step, string> = {
  1: 'e.g. first-time home buyers',
  2: 'e.g. 25–40',
  3: 'Describe the core problem or friction you observed — be specific about what users said or did...',
  4: 'What would success look like for your user — what are they trying to achieve or feel?...',
  5: 'Where and when does this problem occur — what constraints or context should shape solutions?...',
};

const MIN_CHARS: Partial<Record<Step, number>> = { 3: 20, 4: 20, 5: 10 };

function isTextStep(step: Step): step is 3 | 4 | 5 {
  return step >= 3;
}

export function IntakeFlowScreen() {
  const { session, setScreen, updateSession } = useSession();
  const [step, setStep] = useState<Step>(1);

  const [targetUser, setTargetUser] = useState(session.targetUser);
  const [ageRange, setAgeRange] = useState(session.ageRange);
  const [insight, setInsight] = useState(session.insight);
  const [desiredOutcome, setDesiredOutcome] = useState(session.desiredOutcome);
  const [scope, setScope] = useState(session.scope);

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const values: Record<Step, string> = {
    1: targetUser,
    2: ageRange,
    3: insight,
    4: desiredOutcome,
    5: scope,
  };

  const setters: Record<Step, (v: string) => void> = {
    1: setTargetUser,
    2: setAgeRange,
    3: setInsight,
    4: setDesiredOutcome,
    5: setScope,
  };

  const minLen = MIN_CHARS[step];
  const currentValue = values[step];
  const isValid = minLen
    ? currentValue.trim().length >= minLen
    : currentValue.trim().length > 0;

  function handleBack() {
    if (step === 1) {
      setScreen('entry');
    } else {
      setStep((s) => (s - 1) as Step);
    }
  }

  async function handleContinue() {
    if (!isValid) return;
    if (step < TOTAL) {
      setStep((s) => (s + 1) as Step);
      return;
    }
    // Step 5: trigger HMW generation
    setApiError('');
    setLoading(true);
    try {
      const themes = await generateHMWs(
        targetUser.trim(),
        ageRange.trim(),
        insight.trim(),
        desiredOutcome.trim(),
        scope.trim()
      );
      updateSession({
        targetUser: targetUser.trim(),
        ageRange: ageRange.trim(),
        insight: insight.trim(),
        desiredOutcome: desiredOutcome.trim(),
        scope: scope.trim(),
        generatedHMWs: themes,
      });
      setScreen('hmwGeneration');
    } catch {
      setApiError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !isTextStep(step) && isValid) {
      handleContinue();
    }
  }

  const showContext = step >= 3 && (targetUser.trim() || ageRange.trim());

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-12 phase-enter">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-10">
          <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(step / TOTAL) * 100}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-text-muted whitespace-nowrap">
            Step {step} of {TOTAL}
          </span>
        </div>

        {/* Question heading */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text leading-tight mb-3">
            {QUESTIONS[step]}
          </h1>
          {showContext && (
            <p className="text-sm text-text-muted">
              For:{' '}
              <span className="font-semibold">{targetUser.trim() || '—'}</span>
              {ageRange.trim() && (
                <>, age <span className="font-semibold">{ageRange.trim()}</span></>
              )}
            </p>
          )}
        </div>

        {/* Field */}
        {isTextStep(step) ? (
          <Textarea
            key={step}
            id={`intake-step-${step}`}
            label=""
            placeholder={PLACEHOLDERS[step]}
            value={currentValue}
            onChange={(e) => setters[step](e.target.value)}
            onVoiceTranscript={setters[step]}
            charCount={currentValue.trim().length}
            minChars={minLen}
            rows={5}
            autoFocus
            disabled={loading}
          />
        ) : (
          <Input
            key={step}
            id={`intake-step-${step}`}
            label=""
            placeholder={PLACEHOLDERS[step]}
            value={currentValue}
            onChange={(e) => setters[step](e.target.value)}
            onVoiceTranscript={setters[step]}
            onKeyDown={handleKeyDown}
            autoFocus
            disabled={loading}
          />
        )}

        {apiError && (
          <p role="alert" className="mt-3 text-sm text-danger font-medium">{apiError}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleBack}
            disabled={loading}
            className="flex items-center gap-1 text-text-muted hover:text-text transition-colors text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary rounded shrink-0"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back
          </button>
          <Button
            onClick={handleContinue}
            size="lg"
            className="flex-1"
            loading={loading}
            disabled={!isValid}
          >
            {step === TOTAL
              ? loading
                ? 'Generating your How Might We questions...'
                : 'Generate How Might We questions'
              : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
