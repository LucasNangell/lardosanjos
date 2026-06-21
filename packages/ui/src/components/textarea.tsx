import * as React from 'react';
import { cn } from '../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-brand-brown">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'flex min-h-[80px] w-full rounded-lg border border-brand-secondary/40 bg-white px-3 py-2 text-sm focus-ring',
            error && 'border-red-500',
            className,
          )}
          aria-invalid={!!error}
          {...props}
        />
        {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
