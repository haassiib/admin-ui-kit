'use client';

import { forwardRef, useId, useState } from 'react';
import { Check, Eye, EyeOff, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export type PasswordStrength = 'none' | 'weak' | 'medium' | 'strong';

export type PasswordRule = {
  label: string;
  test: (password: string) => boolean;
};

/**
 * A rough strength estimate from length and character classes.
 *
 * Deliberately simple and exported, so a server can mirror it — it is a nudge
 * toward a better password, not a security control. Anything shorter than
 * `requiredLength` is weak regardless of variety: "Ab1!" uses every class and
 * is still four characters.
 */
export function passwordStrength(password: string, requiredLength = 8): PasswordStrength {
  if (!password) return 'none';
  if (password.length < requiredLength) return 'weak';
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  // One point per character class, plus length bonuses — so a long lower-case
  // passphrase can reach "medium" without being forced to sprout a "!".
  let score = classes;
  if (password.length >= requiredLength + 4) score++;
  if (password.length >= requiredLength * 2) score++;
  return score >= 4 ? 'strong' : score === 3 ? 'medium' : 'weak';
}

const LEVEL = {
  none: { bars: 0, label: 'Strength', tone: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-400 dark:text-slate-500' },
  weak: { bars: 1, label: 'Weak', tone: 'bg-rose-500 dark:bg-rose-400', text: 'text-rose-600 dark:text-rose-400' },
  medium: { bars: 2, label: 'Medium', tone: 'bg-amber-500 dark:bg-amber-400', text: 'text-amber-600 dark:text-amber-400' },
  strong: { bars: 3, label: 'Strong', tone: 'bg-emerald-500 dark:bg-emerald-400', text: 'text-emerald-600 dark:text-emerald-400' },
} as const;

const defaultRules = (min: number): PasswordRule[] => [
  { label: `At least ${min} characters`, test: (p) => p.length >= min },
  { label: 'A number', test: (p) => /\d/.test(p) },
  { label: 'An uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'A symbol', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export interface InputPasswordProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Show the three-segment strength bar and its label under the input. */
  feedback?: boolean;
  /** `true` for the default checklist (length, number, uppercase, symbol), or your own rules. */
  requirements?: boolean | PasswordRule[];
  /**
   * The length the meter and the checklist ask for. Not passed to the input as
   * `minLength`, so it never blocks a submit on its own — add that yourself.
   */
  requiredLength?: number;
  /** Classes for the wrapper. `className` goes on the `<input>`. */
  wrapperClassName?: string;
}

/**
 * A password input with a reveal toggle and optional strength feedback.
 *
 * Works controlled or uncontrolled: the meter needs the current value either
 * way, so an uncontrolled input is mirrored into local state from its own
 * `onChange`. The meter and checklist are wired to the input through
 * `aria-describedby`, and only the level's WORD is a live region — announcing
 * the whole checklist on every keystroke would drown out the typing.
 */
const InputPassword = forwardRef<HTMLInputElement, InputPasswordProps>(function InputPassword(
  {
    feedback = false,
    requirements = false,
    requiredLength = 8,
    wrapperClassName,
    className,
    value,
    defaultValue,
    onChange,
    disabled,
    id,
    'aria-describedby': describedBy,
    ...rest
  },
  ref,
) {
  const uid = useId();
  const inputId = id ?? `${uid}-input`;
  const [visible, setVisible] = useState(false);
  const [inner, setInner] = useState(String(defaultValue ?? ''));
  const current = value !== undefined ? String(value) : inner;

  const level = LEVEL[passwordStrength(current, requiredLength)];
  const rules = requirements === true ? defaultRules(requiredLength) : requirements || [];
  const meterId = `${uid}-meter`;
  const rulesId = `${uid}-rules`;
  const describedByAll =
    [describedBy, feedback && meterId, rules.length > 0 && rulesId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('w-full', wrapperClassName)}>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          {...rest}
          type={visible ? 'text' : 'password'}
          value={value}
          defaultValue={value === undefined ? defaultValue : undefined}
          disabled={disabled}
          aria-describedby={describedByAll}
          onChange={(e) => {
            if (value === undefined) setInner(e.target.value);
            onChange?.(e);
          }}
          className={cn('field-input pr-8', className)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          // A fixed name plus `aria-pressed`, not a label that flips to "Hide":
          // changing both would announce "Hide password, pressed" — a double negative.
          aria-label="Show password"
          aria-controls={inputId}
          aria-pressed={visible}
          title={visible ? 'Hide password' : 'Show password'}
          className={cn(
            'absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1',
            'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 disabled:cursor-not-allowed',
          )}
        >
          {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>

      {feedback && (
        <div id={meterId} className="mt-1.5 flex items-center gap-2">
          <div className="flex flex-1 gap-1" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  i < level.bars ? level.tone : 'bg-slate-200 dark:bg-slate-700',
                )}
              />
            ))}
          </div>
          <span className={cn('w-14 text-right text-[11px] font-semibold', level.text)} aria-live="polite">
            {level.label}
          </span>
        </div>
      )}

      {rules.length > 0 && (
        <ul id={rulesId} className="relative mt-1.5 space-y-0.5">
          {/* `relative` anchors each rule's `sr-only` status: it is
              `position: absolute`, and unanchored it escapes a scrolling
              container and lengthens the document. */}
          {rules.map((rule) => {
            const met = rule.test(current);
            return (
              <li
                key={rule.label}
                className={cn(
                  'flex items-center gap-1.5 text-[11px]',
                  met ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400',
                )}
              >
                {met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                <span>{rule.label}</span>
                <span className="sr-only">{met ? '(met)' : '(not met)'}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});

export default InputPassword;
