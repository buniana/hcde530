import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useSession } from '../context/SessionContext';

export function UserContextScreen() {
  const { session, setScreen, updateSession } = useSession();
  const [targetUser, setTargetUser] = useState(session.targetUser);
  const [ageRange, setAgeRange] = useState(session.ageRange);
  const [errors, setErrors] = useState({ targetUser: '', ageRange: '' });

  function validate() {
    const newErrors = {
      targetUser: targetUser.trim() ? '' : 'Please describe your target user',
      ageRange: ageRange.trim() ? '' : 'Please enter an age range',
    };
    setErrors(newErrors);
    return !newErrors.targetUser && !newErrors.ageRange;
  }

  function handleContinue() {
    if (!validate()) return;
    updateSession({ targetUser: targetUser.trim(), ageRange: ageRange.trim() });
    setScreen('painPoints');
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
          <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-2">Path A · Step 1 of 3</p>
          <h1 className="text-3xl font-bold text-text mb-3">Who are you designing for?</h1>
          <p className="text-text-muted">
            This helps AI tailor the How Might We questions to the right audience.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <Input
            id="target-user"
            label="Target user"
            placeholder="e.g. first-time home buyers"
            hint="Who is experiencing this problem?"
            value={targetUser}
            onChange={(e) => setTargetUser(e.target.value)}
            onBlur={() => {
              if (!targetUser.trim()) setErrors((p) => ({ ...p, targetUser: 'Please describe your target user' }));
              else setErrors((p) => ({ ...p, targetUser: '' }));
            }}
            error={errors.targetUser}
            required
            autoFocus
          />
          <Input
            id="age-range"
            label="Age range"
            placeholder="e.g. 25–40"
            hint="Approximate age range of your target users"
            value={ageRange}
            onChange={(e) => setAgeRange(e.target.value)}
            onBlur={() => {
              if (!ageRange.trim()) setErrors((p) => ({ ...p, ageRange: 'Please enter an age range' }));
              else setErrors((p) => ({ ...p, ageRange: '' }));
            }}
            error={errors.ageRange}
            required
          />

          <Button onClick={handleContinue} size="lg" className="w-full mt-2">
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
