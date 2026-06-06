import React from 'react';

interface CardProps {
  children: React.ReactNode;
  selected?: boolean;
  selectable?: boolean;
  onClick?: () => void;
  className?: string;
  role?: string;
  'aria-checked'?: boolean | 'mixed';
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export function Card({
  children,
  selected = false,
  selectable = false,
  onClick,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={[
        'bg-surface rounded-card shadow-card p-6 transition-all duration-150',
        selectable && 'cursor-pointer hover:shadow-card-hover',
        selected
          ? 'border-2 border-primary bg-primary/5'
          : selectable
          ? 'border-2 border-border hover:border-primary/40'
          : 'border border-border',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
