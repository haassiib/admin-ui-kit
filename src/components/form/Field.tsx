'use client';

import { useId } from 'react';
import { cn } from '@/lib/cn';
import { InfoTooltip } from '@/components/overlay/Tooltip';

/**
 * Label + control + error, wired together.
 *
 * The id is generated here and handed to the child through a render prop, which
 * is what actually connects `<label for>`, `aria-describedby` and the error
 * message. Passing them by hand is the step everyone skips, and the result is a
 * form that a screen reader reads as a row of unlabelled boxes.
 */
export function Field({
  label,
  hint,
  error,
  required = false,
  className,
  children,
}: {
  label: React.ReactNode;
  /** Rendered behind an ⓘ beside the label, not under the control. */
  hint?: React.ReactNode;
  error?: string | null;
  required?: boolean;
  className?: string;
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => React.ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={cn('flex flex-col', className)}>
      <label htmlFor={id} className="field-label flex items-center gap-1">
        {label}
        {required && <span className="text-rose-500" aria-hidden>*</span>}
        {hint && <InfoTooltip content={hint} iconClassName="w-3 h-3" />}
      </label>
      {children({ id, 'aria-describedby': error ? errorId : undefined, 'aria-invalid': !!error })}
      {error && (
        <p id={errorId} className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={cn('field-input', props['aria-invalid'] && 'border-rose-400 focus:ring-rose-400/40', props.className)} />
);

export const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} className={cn('field-input resize-y', props['aria-invalid'] && 'border-rose-400 focus:ring-rose-400/40', props.className)} />
);

export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={cn('field-input', props['aria-invalid'] && 'border-rose-400 focus:ring-rose-400/40', props.className)} />
);

export default Field;
