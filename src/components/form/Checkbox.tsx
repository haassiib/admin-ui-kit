'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { InfoTooltip } from '@/components/overlay/Tooltip';

/**
 * A checkbox that keeps a real <input> underneath, so labels and focus work.
 *
 * `hint` is unchanged as an API but no longer renders as a second line under the
 * label — it becomes an ⓘ tooltip beside it, which is what keeps a long list of
 * permissions or roles readable as a list. The ⓘ is a SIBLING of the <label>,
 * not a child: nested inside, its click would activate the label and toggle the
 * box on the way past.
 */
export default function Checkbox({
  id,
  name,
  checked,
  onChange,
  label,
  hint,
  disabled = false,
  className,
}: {
  id: string;
  /**
   * Form field name. Came across from marketing-stats' `StyledCheckbox`: without
   * it this cannot participate in an uncontrolled `<form>` post, which is how
   * several settings pages submit.
   */
  name?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  hint?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'flex items-start gap-1.5 text-xs',
        disabled && 'opacity-50',
        className,
      )}
    >
      <label
        htmlFor={id}
        className={cn(
          'flex items-start gap-2 min-w-0',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        )}
      >
        <span className="relative flex items-center justify-center w-4 h-4 shrink-0 mt-0.5">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
            name={name}
            className="sr-only peer"
          />
          <span
            className={cn(
              'w-4 h-4 rounded border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-400',
              checked
                ? 'bg-indigo-600 border-indigo-600'
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600',
            )}
          />
          {checked && <Check className="w-3 h-3 text-white absolute" strokeWidth={3} />}
        </span>
        <span className="min-w-0 font-medium text-slate-700 dark:text-slate-200">{label}</span>
      </label>

      {hint && <InfoTooltip content={hint} className="mt-0.5" iconClassName="w-3 h-3" />}
    </span>
  );
}
