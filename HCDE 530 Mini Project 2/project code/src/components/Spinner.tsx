interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const sizeClasses = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };

export function Spinner({ size = 'md', message }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center gap-3" aria-live="polite" aria-busy="true">
      <div
        className={`${sizeClasses[size]} border-4 border-primary/20 border-t-primary rounded-full animate-spin`}
        aria-hidden="true"
      />
      {message && <p className="text-text-muted text-sm font-medium">{message}</p>}
    </div>
  );
}
