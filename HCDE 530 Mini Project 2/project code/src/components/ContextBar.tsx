interface ContextBarProps {
  hmw: string;
  targetUser?: string;
}

export function ContextBar({ hmw, targetUser }: ContextBarProps) {
  return (
    <div className="w-full bg-primary/10 border border-primary/20 rounded-btn px-4 py-3">
      <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Design Challenge</p>
      <p className="text-sm font-medium text-text leading-relaxed">{hmw}</p>
      {targetUser && (
        <p className="text-xs text-text-muted mt-1">For: {targetUser}</p>
      )}
    </div>
  );
}
