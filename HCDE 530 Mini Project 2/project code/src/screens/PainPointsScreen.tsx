import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { Textarea } from '../components/Textarea';
import { useSession } from '../context/SessionContext';
import { generateHMWs } from '../api/openai';

export function PainPointsScreen() {
  const { session, setScreen, updateSession } = useSession();
  const [insight, setInsight] = useState(session.insight);
  const [desiredOutcome, setDesiredOutcome] = useState(session.desiredOutcome);
  const [scope, setScope] = useState(session.scope);
  const [errors, setErrors] = useState({ insight: '', desiredOutcome: '', scope: '' });
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const MIN_INSIGHT = 20;
  const MIN_OUTCOME = 20;
  const MIN_SCOPE = 10;

  const allValid =
    insight.trim().length >= MIN_INSIGHT &&
    desiredOutcome.trim().length >= MIN_OUTCOME &&
    scope.trim().length >= MIN_SCOPE;

  function validateField(field: 'insight' | 'desiredOutcome' | 'scope', value: string) {
    const min = field === 'scope' ? MIN_SCOPE : MIN_INSIGHT;
    if (value.trim().length < min) {
      setErrors((prev) => ({ ...prev, [field]: `Please enter at least ${min} characters.` }));
    } else {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  }

  async function handleGenerate() {
    if (!allValid) return;
    setApiError('');
    setLoading(true);
    try {
      const themes = await generateHMWs(
        session.targetUser,
        session.ageRange,
        insight.trim(),
        desiredOutcome.trim(),
        scope.trim()
      );
      updateSession({
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

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-12 phase-enter">
      <div className="w-full max-w-lg">
        <button
          onClick={() => setScreen('userContext')}
          className="flex items-center gap-1 text-text-muted hover:text-text transition-colors text-sm font-medium mb-8 focus-visible:outline-2 focus-visible:outline-primary rounded"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back
        </button>

        <div className="mb-8">
          <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-2">Path A · Step 2 of 3</p>
          <h1 className="text-3xl font-bold text-text mb-3">Share your research insights</h1>
          <p className="text-text-muted">
            For: <span className="font-semibold">{session.targetUser}</span>, age {session.ageRange}
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <Textarea
            id="insight"
            label="What did you observe or learn?"
            placeholder="Describe the core problem or friction you observed — be specific about what users said or did..."
            value={insight}
            onChange={(e) => {
              setInsight(e.target.value);
              if (errors.insight && e.target.value.trim().length >= MIN_INSIGHT) {
                setErrors((prev) => ({ ...prev, insight: '' }));
              }
            }}
            onBlur={() => validateField('insight', insight)}
            error={errors.insight}
            charCount={insight.trim().length}
            minChars={MIN_INSIGHT}
            required
            rows={4}
            autoFocus
            disabled={loading}
          />

          <Textarea
            id="desiredOutcome"
            label="What outcome do users want?"
            placeholder="What would success look like for your user — what are they trying to achieve or feel?..."
            value={desiredOutcome}
            onChange={(e) => {
              setDesiredOutcome(e.target.value);
              if (errors.desiredOutcome && e.target.value.trim().length >= MIN_OUTCOME) {
                setErrors((prev) => ({ ...prev, desiredOutcome: '' }));
              }
            }}
            onBlur={() => validateField('desiredOutcome', desiredOutcome)}
            error={errors.desiredOutcome}
            charCount={desiredOutcome.trim().length}
            minChars={MIN_OUTCOME}
            required
            rows={4}
            disabled={loading}
          />

          <Textarea
            id="scope"
            label="What is the scope or context?"
            placeholder="Where and when does this problem occur — what constraints or context should shape solutions?..."
            value={scope}
            onChange={(e) => {
              setScope(e.target.value);
              if (errors.scope && e.target.value.trim().length >= MIN_SCOPE) {
                setErrors((prev) => ({ ...prev, scope: '' }));
              }
            }}
            onBlur={() => validateField('scope', scope)}
            error={errors.scope}
            charCount={scope.trim().length}
            minChars={MIN_SCOPE}
            required
            rows={3}
            disabled={loading}
          />
        </div>

        {apiError && (
          <p role="alert" className="mt-4 text-sm text-danger font-medium">{apiError}</p>
        )}

        <Button
          onClick={handleGenerate}
          size="lg"
          className="w-full mt-6"
          loading={loading}
          disabled={!allValid}
        >
          {loading ? 'Generating your How Might We questions...' : 'Generate How Might We questions'}
        </Button>
      </div>
    </div>
  );
}
