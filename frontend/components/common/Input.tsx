import React, { useId } from 'react';
import { cn } from '@/lib/util/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
  suffix?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, required, suffix, id: idProp, ...props }, ref) => {
    const generatedId = useId();
    const inputId = idProp ?? generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div className="space-y-3 w-full">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-bold text-text-main block">
            {label} {required && <span className="text-status-urgent">*</span>}
          </label>
        )}
        <div className="relative group">
          <input
            id={inputId}
            className={cn(
              'w-full h-12 px-4 bg-bg-sub/50 hover:bg-bg-sub border border-transparent focus:border-brand-primary/30 focus:bg-bg-main rounded-xl outline-none transition-all placeholder:text-text-muted text-sm font-bold text-text-main disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-status-urgent focus:border-status-urgent',
              suffix && 'pr-10',
              className
            )}
            ref={ref}
            {...props}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
          />
          {suffix && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-text-main pointer-events-none">
              {suffix}
            </span>
          )}
        </div>
        {error && (
          <p id={errorId} className="text-[11px] text-status-urgent font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, error, required, id: idProp, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = idProp ?? generatedId;
    const errorId = `${textareaId}-error`;

    return (
      <div className="space-y-3 w-full">
        {label && (
          <label htmlFor={textareaId} className="text-[13px] font-bold text-text-main block">
            {label} {required && <span className="text-status-urgent">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            'w-full px-4 py-3 bg-bg-sub/50 hover:bg-bg-sub border border-transparent focus:border-brand-primary/30 focus:bg-bg-main rounded-xl outline-none transition-all placeholder:text-text-muted text-sm font-bold text-text-main resize-none disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-status-urgent focus:border-status-urgent',
            className
          )}
          ref={ref}
          {...props}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
        {error && (
          <p id={errorId} className="text-[11px] text-status-urgent font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
