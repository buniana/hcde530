import { useState, useEffect, useRef } from 'react';
import { Download, FileCode, Sparkles, RotateCcw, Trash2, RefreshCw, Upload, ImageOff } from 'lucide-react';
import { Button } from '../components/Button';
import { ContextBar } from '../components/ContextBar';
import { useSession } from '../context/SessionContext';
import { generateIdeaTitle, generateFullIdea, generateSketch } from '../api/openai';
import { Idea } from '../types';

function exportAsHTML(
  selectedHMW: string,
  targetUser: string,
  ageRange: string,
  roundDuration: number,
  ideas: Idea[],
  sketchImages: Record<string, string>,
  crazyEightsPrompts: string[]
) {
  const ideasHTML = ideas.map((idea, i) => {
    const sketchUrl = sketchImages[idea.id];
    const sketchHTML = sketchUrl
      ? `<img src="${sketchUrl}" alt="Sketch for idea ${i + 1}" style="width:100%;border-radius:8px;margin-top:12px;" />`
      : '';
    return `
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:16px;">
        <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">Round ${idea.roundCaptured}${idea.aiGenerated ? ' · AI' : ''}</div>
        <div style="font-size:11px;color:#9ca3af;margin-bottom:12px;">${crazyEightsPrompts[idea.roundCaptured - 1] || ''}</div>
        <h2 style="font-size:18px;font-weight:700;margin:0 0 8px;">${idea.title || '(untitled)'}</h2>
        <p style="font-size:14px;color:#374151;margin:0;">${idea.description || '(no description)'}</p>
        ${sketchHTML}
      </div>
    `;
  }).join('');

  const metaUser = targetUser ? ` · ${targetUser}${ageRange ? `, age ${ageRange}` : ''}` : '';
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>IdeaFlow Session Export</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; padding: 32px; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
    .meta { font-size: 14px; color: #6b7280; margin-bottom: 8px; }
    .hmw { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 15px; color: #374151; }
    .hmw-label { font-size: 11px; font-weight: 600; color: #f97316; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
  </style>
</head>
<body>
  <h1>Your ideas</h1>
  <div class="meta">${ideas.length} ideas · ${roundDuration}s per round${metaUser} · ${new Date().toLocaleDateString()}</div>
  <div class="hmw">
    <div class="hmw-label">Design challenge</div>
    ${selectedHMW}
  </div>
  ${ideasHTML}
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ideaflow-session.html';
  a.click();
  URL.revokeObjectURL(url);
}

function exportAsText(
  selectedHMW: string,
  targetUser: string,
  ageRange: string,
  roundDuration: number,
  ideas: Idea[]
) {
  const lines: string[] = [];
  lines.push('IdeaFlow Session Export');
  lines.push('='.repeat(40));
  lines.push(`Design challenge: ${selectedHMW}`);
  if (targetUser) lines.push(`Target user: ${targetUser}${ageRange ? `, age ${ageRange}` : ''}`);
  lines.push(`Timer: ${roundDuration}s per round · 8 rounds`);
  lines.push(`Date: ${new Date().toLocaleDateString()}`);
  lines.push(`Ideas captured: ${ideas.length}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  ideas.forEach((idea, i) => {
    lines.push(`Idea ${i + 1}${idea.aiGenerated ? ' [AI]' : ''} (Round ${idea.roundCaptured}): ${idea.title || '(untitled)'}`);
    lines.push(`Description: ${idea.description || '(no description)'}`);
    lines.push('');
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ideaflow-session.txt';
  a.click();
  URL.revokeObjectURL(url);
}

export function SummaryScreen() {
  const { session, resetSession, updateIdeaById } = useSession();
  const { selectedHMW, targetUser, ageRange, roundDuration, crazyEightsPrompts } = session;

  const [localIdeas, setLocalIdeas] = useState<Idea[]>(() => session.ideas);
  const [generatingTitles, setGeneratingTitles] = useState<Set<string>>(new Set());
  const [fillingEmpty, setFillingEmpty] = useState<Set<string>>(new Set());
  const [isFillAllRunning, setIsFillAllRunning] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Sketch state
  const [sketchImages, setSketchImages] = useState<Record<string, string>>(() => {
    try {
      const saved = sessionStorage.getItem('ideaflow-sketches');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [sketchLoading, setSketchLoading] = useState<Set<string>>(new Set());
  const [sketchErrors, setSketchErrors] = useState<Set<string>>(new Set());
  const uploadRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const hasRunRef = useRef(false);

  const emptyIdeas = localIdeas.filter((i) => i.isDraft && !i.description.trim());

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    const needsTitles = session.ideas.filter(
      (idea) => idea.description.trim() && !idea.title.trim() && !idea.aiGenerated
    );
    if (needsTitles.length > 0) {
      setGeneratingTitles(new Set(needsTitles.map((i) => i.id)));
      needsTitles.forEach(async (idea) => {
        try {
          const title = await generateIdeaTitle(selectedHMW, idea.description);
          setLocalIdeas((prev) =>
            prev.map((i) => (i.id === idea.id ? { ...i, title } : i))
          );
          updateIdeaById(idea.id, { title });
        } catch {
          // leave title empty on failure
        } finally {
          setGeneratingTitles((prev) => {
            const next = new Set(prev);
            next.delete(idea.id);
            return next;
          });
        }
      });
    }

    // Auto-generate sketches for all non-empty ideas that don't already have one
const toSketch = session.ideas.filter((i) => 
  (i.title.trim() || i.description.trim()) && !sketchImages[i.id]
);
    if (toSketch.length > 0) {
      setSketchLoading(new Set(toSketch.map((i) => i.id)));
      toSketch.forEach(async (idea) => {
        try {
          const url = await generateSketch(
            idea.title || idea.description.slice(0, 60),
            idea.description
          );
          setSketchImages((prev) => {
            const next = { ...prev, [idea.id]: url };
            sessionStorage.setItem('ideaflow-sketches', JSON.stringify(next));
            return next;
          });
          setSketchErrors((prev) => {
            const next = new Set(prev);
            next.delete(idea.id);
            return next;
          });
        } catch {
          setSketchErrors((prev) => new Set(prev).add(idea.id));
        } finally {
          setSketchLoading((prev) => {
            const next = new Set(prev);
            next.delete(idea.id);
            return next;
          });
        }
      });
    }
  }, []);

  async function regenerateSketch(idea: Idea) {
    setSketchLoading((prev) => new Set(prev).add(idea.id));
    setSketchErrors((prev) => {
      const next = new Set(prev);
      next.delete(idea.id);
      return next;
    });
    try {
      const url = await generateSketch(
        idea.title || idea.description.slice(0, 60),
        idea.description
      );
      setSketchImages((prev) => {
        const next = { ...prev, [idea.id]: url };
        sessionStorage.setItem('ideaflow-sketches', JSON.stringify(next));
        return next;
      });
    } catch {
      setSketchErrors((prev) => new Set(prev).add(idea.id));
    } finally {
      setSketchLoading((prev) => {
        const next = new Set(prev);
        next.delete(idea.id);
        return next;
      });
    }
  }

  function handleUploadClick(id: string) {
    uploadRefs.current[id]?.click();
  }

  function handleFileChange(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSketchImages((prev) => ({ ...prev, [id]: reader.result as string }));
      setSketchErrors((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function fillEmptyIdea(idea: Idea) {
    const roundPrompt = crazyEightsPrompts[idea.roundCaptured - 1] ?? '';
    setFillingEmpty((prev) => new Set(prev).add(idea.id));
    try {
      const result = await generateFullIdea(selectedHMW, targetUser, ageRange, roundPrompt);
      setLocalIdeas((prev) =>
        prev.map((i) =>
          i.id === idea.id
            ? { ...i, title: result.title, description: result.description, aiGenerated: true, isDraft: false }
            : i
        )
      );
      updateIdeaById(idea.id, { title: result.title, description: result.description, aiGenerated: true, isDraft: false });
    } catch {
      // silently fail; card stays empty
    } finally {
      setFillingEmpty((prev) => {
        const next = new Set(prev);
        next.delete(idea.id);
        return next;
      });
    }
  }

  async function handleFillAllEmpty() {
    setIsFillAllRunning(true);
    await Promise.all(emptyIdeas.map(fillEmptyIdea));
    setIsFillAllRunning(false);
  }

  function startEdit(id: string) {
    const idea = localIdeas.find((i) => i.id === id);
    setEditTitle(idea?.title ?? '');
    setEditDesc(idea?.description ?? '');
    setEditingId(id);
  }

  function saveEdit(id: string) {
    const trimmedTitle = editTitle.trim();
    const trimmedDesc = editDesc.trim();
    setLocalIdeas((prev) =>
      prev.map((idea) =>
        idea.id === id
          ? { ...idea, title: trimmedTitle, description: trimmedDesc, isDraft: false }
          : idea
      )
    );
    updateIdeaById(id, { title: trimmedTitle, description: trimmedDesc });
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function discardIdea(id: string) {
    setLocalIdeas((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="min-h-screen bg-bg px-4 py-10 phase-enter">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-text mb-4">Your ideas</h1>
          <ContextBar hmw={selectedHMW} targetUser={targetUser || undefined} />
          <div className="flex items-center gap-4 mt-3">
            <span className="text-sm text-text-muted">
              8 rounds · {roundDuration}s per round
            </span>
            <span className="text-sm font-semibold text-secondary">
              {localIdeas.length} idea{localIdeas.length !== 1 ? 's' : ''} captured
            </span>
          </div>
        </div>

        {/* Export + New Session */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <Button
            variant="primary"
            onClick={() => exportAsText(selectedHMW, targetUser, ageRange, roundDuration, localIdeas)}
            aria-label="Export ideas as text file"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Export as .txt
          </Button>
          <Button
            variant="secondary"
            onClick={() => exportAsHTML(selectedHMW, targetUser, ageRange, roundDuration, localIdeas, sketchImages, crazyEightsPrompts)}
            aria-label="Export ideas as HTML file"
          >
            <FileCode className="w-4 h-4" aria-hidden="true" />
            Export as .html
          </Button>
          <Button variant="ghost" onClick={resetSession}>
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            New session
          </Button>
        </div>

        {/* AI fill empty banner */}
        {emptyIdeas.length > 0 && (
          <div className="bg-surface border border-border rounded-card px-5 py-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-text">
                {emptyIdeas.length} round{emptyIdeas.length !== 1 ? 's' : ''} without an idea
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                Let AI fill in the blanks based on each round's prompt.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleFillAllEmpty}
              disabled={isFillAllRunning}
              aria-label="Fill empty ideas with AI"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              {isFillAllRunning ? 'Filling...' : 'Fill with AI'}
            </Button>
          </div>
        )}

        {/* Sketch generation progress banner */}
        {sketchLoading.size > 0 && (
          <div className="bg-surface border border-border rounded-card px-5 py-3 mb-6 flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" aria-hidden="true" />
            <p className="text-sm text-text-muted">
              Generating AI sketches for {sketchLoading.size} idea{sketchLoading.size !== 1 ? 's' : ''}...
            </p>
          </div>
        )}

        {/* Idea grid */}
        {localIdeas.length === 0 ? (
          <div className="bg-surface border border-dashed border-border rounded-card p-10 text-center">
            <p className="text-text-disabled text-sm">No ideas were captured this session.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localIdeas.map((idea) => {
              const isEditing = editingId === idea.id;
              const isDraftEmpty = idea.isDraft && !idea.description;
              const isGeneratingTitle = generatingTitles.has(idea.id);
              const isFilling = fillingEmpty.has(idea.id);
              const isSketchLoading = sketchLoading.has(idea.id);
              const sketchImage = sketchImages[idea.id];
              const hasSketchError = sketchErrors.has(idea.id);
              const hasContent = !!(idea.title.trim() || idea.description.trim());

              return (
                <div
                  key={idea.id}
                  className="bg-surface border border-border rounded-card p-5 transition-all duration-150"
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center justify-center h-6 px-2 rounded-full bg-primary/10 text-primary text-xs font-bold">
                        R{idea.roundCaptured}
                      </span>
                      {idea.aiGenerated && (
                        <span className="inline-flex items-center gap-1 text-xs bg-secondary/10 text-secondary font-semibold px-2 py-0.5 rounded-full">
                          <Sparkles className="w-3 h-3" aria-hidden="true" />
                          AI
                        </span>
                      )}
                      {isDraftEmpty && !isFilling && (
                        <span className="text-xs text-text-disabled font-medium px-1.5 py-0.5 border border-border rounded-full">
                          empty
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!isEditing && !isFilling && !isDraftEmpty && (
                        <button
                          onClick={() => startEdit(idea.id)}
                          className="text-xs text-text-muted hover:text-primary transition-colors underline focus-visible:outline-2 focus-visible:outline-primary rounded"
                        >
                          Edit
                        </button>
                      )}
                      {!isEditing && !isFilling && isDraftEmpty && (
                        <button
                          onClick={() => fillEmptyIdea(idea)}
                          className="text-xs text-text-muted hover:text-secondary transition-colors flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-primary rounded"
                          aria-label="Fill this idea with AI"
                        >
                          <Sparkles className="w-3 h-3" aria-hidden="true" />
                          AI fill
                        </button>
                      )}
                      {!isEditing && !isFilling && (
                        <button
                          onClick={() => discardIdea(idea.id)}
                          className="text-text-disabled hover:text-danger transition-colors focus-visible:outline-2 focus-visible:outline-danger rounded"
                          aria-label="Discard idea"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  {isFilling ? (
                    <div>
                      <div className="h-5 w-2/3 bg-border/50 rounded animate-pulse mb-2" aria-label="Generating idea..." />
                      <div className="h-3 w-full bg-border/30 rounded animate-pulse mb-1.5" />
                      <div className="h-3 w-5/6 bg-border/30 rounded animate-pulse mb-1.5" />
                      <div className="h-3 w-4/6 bg-border/30 rounded animate-pulse" />
                    </div>
                  ) : isEditing ? (
                    <div className="flex flex-col gap-3">
                      <div>
                        <label htmlFor={`edit-title-${idea.id}`} className="text-xs font-semibold text-text-muted uppercase tracking-wide block mb-1">
                          Title
                        </label>
                        <input
                          id={`edit-title-${idea.id}`}
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Give this idea a title..."
                          className="w-full border border-border rounded-input px-3 py-2 text-sm text-text bg-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-text-disabled"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label htmlFor={`edit-desc-${idea.id}`} className="text-xs font-semibold text-text-muted uppercase tracking-wide block mb-1">
                          Description
                        </label>
                        <textarea
                          id={`edit-desc-${idea.id}`}
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="Describe your idea..."
                          rows={3}
                          className="w-full border border-border rounded-input px-3 py-2 text-sm text-text bg-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y placeholder:text-text-disabled"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="primary" size="sm" onClick={() => saveEdit(idea.id)} className="flex-1">
                          Save
                        </Button>
                        <Button variant="ghost" size="sm" onClick={cancelEdit} className="flex-1">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {isGeneratingTitle ? (
                        <div className="h-5 w-2/3 bg-border/50 rounded animate-pulse mb-1" aria-label="Generating title..." />
                      ) : idea.title ? (
                        <p className="text-base font-bold text-text mb-1">{idea.title}</p>
                      ) : (
                        <p className="text-base font-bold text-text-disabled mb-1 italic">Untitled idea</p>
                      )}
                      {idea.description ? (
                        <p className="text-sm text-text-muted leading-relaxed">{idea.description}</p>
                      ) : (
                        <p className="text-sm text-text-disabled italic leading-relaxed">No description — click Edit to fill this in.</p>
                      )}

                      {/* AI Sketch area */}
                      {hasContent && (
                        <div className="mt-4 pt-4 border-t border-border">
                          {isSketchLoading ? (
                            <div className="rounded-lg overflow-hidden bg-border/10 aspect-square flex items-center justify-center">
                              <div className="text-center">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" aria-hidden="true" />
                                <p className="text-xs text-text-disabled">Generating sketch...</p>
                              </div>
                            </div>
                          ) : sketchImage ? (
                            <>
                              <img
                                src={sketchImage}
                                alt={`AI sketch for: ${idea.title || 'idea'}`}
                                className="w-full rounded-lg border border-border object-cover"
                              />
                              <div className="flex gap-3 mt-2">
                                <button
                                  onClick={() => regenerateSketch(idea)}
                                  className="flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-primary rounded"
                                >
                                  <RefreshCw className="w-3 h-3" aria-hidden="true" />
                                  Regenerate
                                </button>
                                <button
                                  onClick={() => handleUploadClick(idea.id)}
                                  className="flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-primary rounded"
                                >
                                  <Upload className="w-3 h-3" aria-hidden="true" />
                                  Upload your own
                                </button>
                              </div>
                            </>
                          ) : hasSketchError ? (
                            <div className="rounded-lg border border-dashed border-border p-4 text-center">
                              <ImageOff className="w-5 h-5 text-text-disabled mx-auto mb-1" aria-hidden="true" />
                              <p className="text-xs text-text-disabled mb-2">Couldn't generate a sketch — try again</p>
                              <div className="flex justify-center gap-3">
                                <button
                                  onClick={() => regenerateSketch(idea)}
                                  className="flex items-center gap-1 text-xs text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary rounded"
                                >
                                  <RefreshCw className="w-3 h-3" aria-hidden="true" />
                                  Retry
                                </button>
                                <button
                                  onClick={() => handleUploadClick(idea.id)}
                                  className="flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-primary rounded"
                                >
                                  <Upload className="w-3 h-3" aria-hidden="true" />
                                  Upload your own
                                </button>
                              </div>
                            </div>
                          ) : null}
                          <input
                            ref={(el) => { uploadRefs.current[idea.id] = el; }}
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            aria-hidden="true"
                            tabIndex={-1}
                            onChange={(e) => handleFileChange(idea.id, e)}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={resetSession}>
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Start a new session
          </Button>
        </div>
      </div>
    </div>
  );
}
