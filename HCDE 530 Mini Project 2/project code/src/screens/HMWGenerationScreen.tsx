import { useState } from 'react';
import { ArrowLeft, RefreshCw, Check, X } from 'lucide-react';
import { Button } from '../components/Button';
import { Spinner } from '../components/Spinner';
import { useSession } from '../context/SessionContext';
import { regenerateSingleHMW } from '../api/openai';

interface CardState {
  id: string;
  themeLabel: string;
  text: string;
  confirmingRegenerate: boolean;
  regenerating: boolean;
}

function buildCards(themes: { label: string; questions: string[] }[]): CardState[] {
  const cards: CardState[] = [];
  for (const theme of themes) {
    for (let i = 0; i < theme.questions.length; i++) {
      cards.push({
        id: `${theme.label}::${i}`,
        themeLabel: theme.label,
        text: theme.questions[i],
        confirmingRegenerate: false,
        regenerating: false,
      });
    }
  }
  return cards;
}

export function HMWGenerationScreen() {
  const { session, setScreen, updateSession } = useSession();

  const [cards, setCards] = useState<CardState[]>(() => buildCards(session.generatedHMWs));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  function updateCard(id: string, patch: Partial<CardState>) {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function toggleSelect(id: string) {
    const card = cards.find((c) => c.id === id);
    if (!card || card.regenerating) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function handleRegenerateClick(id: string) {
    updateCard(id, { confirmingRegenerate: true });
  }

  function handleCancelRegenerate(id: string) {
    updateCard(id, { confirmingRegenerate: false });
  }

  async function handleConfirmRegenerate(id: string) {
    updateCard(id, { confirmingRegenerate: false, regenerating: true });
    try {
      const fresh = await regenerateSingleHMW(
        session.targetUser,
        session.ageRange,
        session.insight,
        session.desiredOutcome,
        session.scope
      );
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, text: fresh, regenerating: false } : c))
      );
    } catch {
      updateCard(id, { regenerating: false });
    }
  }

  function handleCTA() {
    if (selectedIds.length === 0) return;
    const texts = selectedIds
      .map((id) => cards.find((c) => c.id === id)?.text ?? '')
      .filter(Boolean);
    updateSession({ selectedHMWs: texts, selectedHMW: texts[0] });
    setScreen('hmwEditor');
  }

  const ctaLabel = selectedIds.length >= 2 ? 'Combine HMWs and Edit' : 'Edit my HMW';

  return (
    <div className="min-h-screen bg-bg px-4 py-12 phase-enter">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => setScreen('painPoints')}
          className="flex items-center gap-1 text-text-muted hover:text-text transition-colors text-sm font-medium mb-8 focus-visible:outline-2 focus-visible:outline-primary rounded"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back
        </button>

        <div className="mb-8">
          <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-2">Path A · Step 3 of 3</p>
          <h1 className="text-3xl font-bold text-text mb-2">Choose your How Might We</h1>
          <p className="text-text-muted">
            For: <span className="font-semibold">{session.targetUser}</span>, age {session.ageRange}
          </p>
        </div>

        <p className="text-sm text-text-muted mb-6">
          Select one or more questions that capture your design challenge. Selecting two or more will combine them using AI.
        </p>

        <div className="flex flex-col gap-8 mb-10">
          {session.generatedHMWs.map((theme) => {
            const themeCards = cards.filter((c) => c.themeLabel === theme.label);
            return (
              <div key={theme.label}>
                <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">
                  {theme.label}
                </h2>
                <div className="flex flex-col gap-3">
                  {themeCards.map((card) => {
                    const isSelected = selectedIds.includes(card.id);

                    return (
                      <div
                        key={card.id}
                        onClick={() => toggleSelect(card.id)}
                        role="checkbox"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleSelect(card.id);
                          }
                        }}
                        className={[
                          'relative p-4 rounded-card border-2 transition-all duration-150 cursor-pointer group',
                          card.regenerating ? 'opacity-60 pointer-events-none' : '',
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-surface hover:border-text-muted',
                        ].join(' ')}
                      >
                        {isSelected && (
                          <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-white" aria-hidden="true" />
                          </span>
                        )}

                        {card.regenerating && (
                          <span className="absolute top-3 right-3">
                            <Spinner size="sm" />
                          </span>
                        )}

                        {!isSelected && !card.regenerating && !card.confirmingRegenerate && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRegenerateClick(card.id);
                            }}
                            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-text-muted hover:text-text focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-primary"
                            aria-label="Regenerate this question"
                            title="Regenerate this question"
                          >
                            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        )}

                        <p className="text-base text-text leading-relaxed pr-8">{card.text}</p>

                        {card.confirmingRegenerate && (
                          <div
                            className="mt-3 flex items-center gap-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="text-xs text-text-muted">Regenerate this HMW?</span>
                            <button
                              onClick={() => handleConfirmRegenerate(card.id)}
                              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary rounded"
                            >
                              <Check className="w-3 h-3" aria-hidden="true" />
                              Yes
                            </button>
                            <button
                              onClick={() => handleCancelRegenerate(card.id)}
                              className="flex items-center gap-1 text-xs text-text-muted hover:text-text focus-visible:outline-2 focus-visible:outline-primary rounded"
                            >
                              <X className="w-3 h-3" aria-hidden="true" />
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <Button
          onClick={handleCTA}
          size="lg"
          className="w-full"
          disabled={selectedIds.length === 0}
        >
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}
