import React from 'react';
import { MicButton } from './MicButton';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
  id: string;
  charCount?: number;
  minChars?: number;
  onVoiceTranscript?: (text: string) => void;
}

export function Textarea({
  label,
  hint,
  error,
  id,
  charCount,
  minChars,
  className = '',
  onVoiceTranscript,
  ...props
}: TextareaProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  const currentValue = typeof props.value === 'string' ? props.value : '';

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-text">
        {label}
        {props.required && (
          <span className="text-danger ml-1" aria-hidden="true">*</span>
        )}
      </label>
      <div className="relative">
        <textarea
          id={id}
          aria-describedby={describedBy}
          aria-required={props.required}
          aria-invalid={!!error}
          className={[
            'rounded-input border px-4 py-3 text-base font-body text-text bg-surface transition-colors duration-150 resize-y min-h-[120px] w-full',
            onVoiceTranscript ? 'pr-10' : '',
            'placeholder:text-text-disabled',
            error
              ? 'border-danger focus:border-danger focus:outline-none focus:ring-2 focus:ring-danger/30'
              : 'border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
            className,
          ].join(' ')}
          {...props}
        />
        {onVoiceTranscript && (
          <div className="absolute right-2 top-3">
            <MicButton
              onTranscript={(t) => onVoiceTranscript(currentValue ? `${currentValue} ${t}` : t)}
              disabled={!!props.disabled}
            />
          </div>
        )}
      </div>
      <div className="flex justify-between items-start">
        <div>
          {hint && !error && (
            <span id={hintId} className="text-xs text-text-muted">
              {hint}
            </span>
          )}
          {error && (
            <span id={errorId} role="alert" className="text-xs text-danger">
              {error}
            </span>
          )}
        </div>
        {typeof charCount === 'number' && minChars && (
          <span className={`text-xs ml-auto ${charCount >= minChars ? 'text-secondary' : 'text-text-disabled'}`}>
            {charCount}/{minChars}
          </span>
        )}
      </div>
    </div>
  );
}
