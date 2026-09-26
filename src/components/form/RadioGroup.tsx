'use client';

import { useId, useRef } from 'react';
import { cn } from '@/lib/cn';
import { InfoTooltip } from '@/components/overlay/Tooltip';

export type RadioValue = string | number;

export type RadioOption = {
  value: RadioValue;
  label: React.ReactNode;
  /** Behind an ⓘ beside the label, as on `Checkbox`. */
  hint?: string;
  disabled?: boolean;
};

/**
 * One styled radio. Like `Checkbox`, a real `<input type="radio">` sits under
 * the drawn circle, so the label click, form posting and focus all come from
 * the browser. Usable on its own; `RadioGroup` is what adds the keyboard model.
 */
export function RadioButton({
  id,
  name,
  value,
  checked,
  onChange,
  label,
  hint,
  disabled = false,
  tabIndex,
  onKeyDown,
  inputRef,
  className,
}: {
  id: string;
  name?: string;
  value: RadioValue;
  checked: boolean;
  onChange: (value: RadioValue) => void;
  label: React.ReactNode;
  hint?: string;
  disabled?: boolean;
  /** Set by `RadioGroup` for its roving tab stop. */
  tabIndex?: number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: (el: HTMLInputElement | null) => void;
  className?: string;
}) {
  return (
    <span className={cn('flex items-start gap-1.5 text-xs', disabled && 'opacity-50', className)}>
      <label
        htmlFor={id}
        className={cn('flex items-start gap-2 min-w-0', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}
      >
        <span className="relative flex items-center justify-center w-4 h-4 shrink-0 mt-0.5">
          <input
            ref={inputRef}
            id={id}
            type="radio"
            name={name}
            value={String(value)}
            checked={checked}
            disabled={disabled}
            tabIndex={tabIndex}
            onKeyDown={onKeyDown}
            onChange={() => onChange(value)}
            className="sr-only peer"
          />
          <span
            className={cn(
              'w-4 h-4 rounded-full border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-400',
              checked
                ? 'bg-indigo-600 border-indigo-600'
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600',
            )}
          />
          {checked && <span className="absolute w-1.5 h-1.5 rounded-full bg-white" aria-hidden />}
        </span>
        <span className="min-w-0 font-medium text-slate-700 dark:text-slate-200">{label}</span>
      </label>

      {/* A sibling of the label, not a child — see Checkbox for why. */}
      {hint && <InfoTooltip content={hint} className="mt-0.5" iconClassName="w-3 h-3" />}
    </span>
  );
}

/**
 * A set of mutually exclusive options.
 *
 * The keyboard model is the ARIA radio-group one, implemented here rather than
 * left to the browser: the group is ONE tab stop (the checked option, or the
 * first enabled one when nothing is checked), and the arrow keys move AND select,
 * wrapping at the ends and skipping disabled options. Native radios do roughly
 * this, but which radio receives Tab with nothing checked, and whether a
 * disabled one is skipped, varies by browser — owning it makes it the same
 * everywhere.
 */
export default function RadioGroup({
  options,
  value,
  onChange,
  name,
  orientation = 'vertical',
  label,
  disabled = false,
  className,
}: {
  options: RadioOption[];
  /** `null` for no selection yet — a radio group cannot be un-selected by the user. */
  value: RadioValue | null;
  onChange: (value: RadioValue) => void;
  /** Form field name. Generated when omitted, since the browser groups radios by it. */
  name?: string;
  orientation?: 'horizontal' | 'vertical';
  /** Accessible name for the group, e.g. the question the options answer. */
  label?: string;
  disabled?: boolean;
  className?: string;
}) {
  const uid = useId();
  const groupName = name ?? `radio-${uid}`;
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const enabled = (i: number) => !disabled && !options[i].disabled;
  const checkedIndex = options.findIndex((o) => o.value === value);
  const tabStop =
    checkedIndex >= 0 && enabled(checkedIndex) ? checkedIndex : options.findIndex((_, i) => enabled(i));

  const move = (from: number, dir: 1 | -1) => {
    for (let step = 1; step <= options.length; step++) {
      const i = (from + dir * step + options.length) % options.length;
      if (enabled(i)) {
        inputs.current[i]?.focus();
        onChange(options[i].value);
        return;
      }
    }
  };

  const onKeyDown = (i: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Both axes work in either orientation, as the pattern specifies — a user
    // should not have to know how the group happens to be laid out.
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      move(i, 1);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      move(i, -1);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-orientation={orientation}
      aria-disabled={disabled || undefined}
      className={cn(
        'flex',
        orientation === 'horizontal' ? 'flex-row flex-wrap gap-x-4 gap-y-2' : 'flex-col gap-2',
        className,
      )}
    >
      {options.map((option, i) => (
        <RadioButton
          key={option.value}
          id={`${uid}-${i}`}
          name={groupName}
          value={option.value}
          checked={i === checkedIndex}
          onChange={onChange}
          label={option.label}
          hint={option.hint}
          disabled={disabled || option.disabled}
          tabIndex={i === tabStop ? 0 : -1}
          onKeyDown={onKeyDown(i)}
          inputRef={(el) => {
            inputs.current[i] = el;
          }}
        />
      ))}
    </div>
  );
}
