import { Lightbulb, ArrowRight, Zap } from 'lucide-react';
import { Button } from '../components/Button';
import { useSession } from '../context/SessionContext';

export function EntryScreen() {
  const { setScreen, updateSession } = useSession();

  function handlePathA() {
    updateSession({ entryPath: 'A' });
    setScreen('intake');
  }

  function handlePathB() {
    updateSession({ entryPath: 'B' });
    setScreen('directHMW');
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-12 phase-enter">
      {/* Logo + Brand */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-card">
          <Lightbulb className="w-7 h-7 text-white" aria-hidden="true" />
        </div>
        <h1 className="font-headline text-4xl text-text tracking-wide">IdeaFlow</h1>
      </div>

      <p className="text-xl text-text-muted font-medium text-center mb-2 max-w-sm">
        AI-powered ideation for UX designers
      </p>
      <p className="text-base text-text-muted text-center max-w-md mb-12 leading-relaxed">
        Generate How Might We questions from your research and run a structured Crazy 8s brainstorm — all in one session.
      </p>

      {/* Entry Cards */}
      <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Path A */}
        <button
          onClick={handlePathA}
          className="group bg-surface border-2 border-border rounded-card p-6 text-left transition-all duration-200 hover:border-primary hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-primary"
        >
          <div className="w-10 h-10 bg-primary/10 rounded-btn flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
            <Zap className="w-5 h-5 text-primary" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-text mb-2">Start from pain points</h2>
          <p className="text-sm text-text-muted leading-relaxed mb-4">
            Paste your research findings and let AI turn them into How Might We questions.
          </p>
          <div className="flex items-center gap-1 text-primary font-semibold text-sm">
            Get started <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </div>
        </button>

        {/* Path B */}
        <button
          onClick={handlePathB}
          className="group bg-surface border-2 border-border rounded-card p-6 text-left transition-all duration-200 hover:border-secondary hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-secondary"
        >
          <div className="w-10 h-10 bg-secondary/10 rounded-btn flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
            <ArrowRight className="w-5 h-5 text-secondary" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-text mb-2">I already have a HMW</h2>
          <p className="text-sm text-text-muted leading-relaxed mb-4">
            Skip directly to Crazy 8s with your own How Might We question.
          </p>
          <div className="flex items-center gap-1 text-secondary font-semibold text-sm">
            Jump in <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </div>
        </button>
      </div>

      {/* What is Crazy 8s hint */}
      <p className="text-xs text-text-disabled text-center max-w-xs">
        Crazy 8s: 8 rounds · 60–120 seconds each · one idea per round
      </p>
    </div>
  );
}
