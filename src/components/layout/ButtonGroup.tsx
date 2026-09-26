'use client';

import { useRef } from 'react';
import { cn } from '@/lib/cn';

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Stack the buttons top-to-bottom instead of side by side. */
  vertical?: boolean;
  /** Names the group for a screen reader ("Text alignment", "Pagination"). */
  'aria-label'?: string;
}

/**
 * Joins adjacent buttons into one control: shared borders, only the outer
 * corners rounded.
 *
 * It restyles its CHILDREN through `>` selectors rather than asking each
 * button for a `position` prop, so it works on the kit's `<Button>`, a plain
 * `<button>` or a link without any of them knowing they are grouped. The
 * selectors are `:not(:first-child)` / `:not(:last-child)`, and that choice is
 * load-bearing: `cn()` does not merge classes, so the group has to beat the
 * child's own `rounded-lg` on specificity — the pseudo-class adds the point a
 * bare `> *` would not have.
 *
 * Neighbours overlap by a pixel so two 1px borders read as one. A focused
 * button is lifted with `z-10` so its ring is not painted under the next
 * button; `isolate` keeps that z-index local, where it would otherwise tie
 * with a sticky table header in the 1–20 band.
 */
export default function ButtonGroup({ vertical = false, className, children, ...rest }: ButtonGroupProps) {
  return (
    <div
      role="group"
      className={cn(
        'isolate inline-flex',
        '[&>*:focus-visible]:relative [&>*:focus-visible]:z-10',
        vertical
          ? cn(
              'flex-col',
              '[&>*:not(:first-child)]:-mt-px [&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none',
            )
          : '[&>*:not(:first-child)]:-ml-px [&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export type SegmentedOption<T extends string = string> = {
  value: T;
  label: React.ReactNode;
  /** An icon component, sized by the control. */
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  /** Accessible name, for an icon-only option. */
  'aria-label'?: string;
};

const SEG_SIZE = {
  sm: 'px-2 py-0.5 text-[11px] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
} as const;

/**
 * A single-choice toggle group — list/grid, day/week/month.
 *
 * Radio semantics, not buttons with `aria-pressed`: exactly one option is
 * chosen, so it is a `radiogroup`, and the ARIA radio pattern is what screen
 * readers announce as "2 of 3". That pattern also dictates the keyboard: the
 * group is ONE Tab stop (roving tabindex on the checked option) and the arrow
 * keys move AND select, skipping disabled options — same as native radios.
 */
export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: keyof typeof SEG_SIZE;
  className?: string;
  /** Names the choice ("View", "Range"). Required in practice — a radiogroup needs a name. */
  'aria-label'?: string;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  // With no option matching `value`, the first enabled one takes the Tab stop
  // so the group is still reachable.
  const tabStop = options.some((o) => o.value === value && !o.disabled)
    ? value
    : options.find((o) => !o.disabled)?.value;

  const onKey = (e: React.KeyboardEvent) => {
    const usable = options.filter((o) => !o.disabled);
    if (!usable.length) return;
    const i = usable.findIndex((o) => o.value === value);
    let next: SegmentedOption<T> | undefined;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = usable[(i + 1) % usable.length];
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = usable[(i - 1 + usable.length) % usable.length];
    else if (e.key === 'Home') next = usable[0];
    else if (e.key === 'End') next = usable[usable.length - 1];
    if (!next) return;
    e.preventDefault();
    onChange(next.value);
    refs.current[next.value]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={onKey}
      className={cn('inline-flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800', className)}
    >
      {options.map((o) => {
        const on = o.value === value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[o.value] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o['aria-label']}
            tabIndex={o.value === tabStop ? 0 : -1}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex items-center justify-center rounded-md font-medium leading-none transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
              'disabled:cursor-not-allowed disabled:opacity-40',
              SEG_SIZE[size],
              on
                ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-indigo-300'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100',
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
