import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-dark active:scale-[0.97] disabled:bg-text-disabled disabled:cursor-not-allowed',
  secondary:
    'bg-surface text-primary border-2 border-primary hover:bg-primary/10 active:scale-[0.97] disabled:border-text-disabled disabled:text-text-disabled disabled:cursor-not-allowed',
  ghost:
    'bg-transparent text-primary hover:bg-primary/10 active:scale-[0.97] disabled:text-text-disabled disabled:cursor-not-allowed',
  destructive:
    'bg-danger text-white hover:bg-red-800 active:scale-[0.97] disabled:bg-text-disabled disabled:cursor-not-allowed',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-btn font-body font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-primary',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <>
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
