'use client';

import { cloneElement, useId, type ReactElement } from 'react';
import { cn } from '@/lib/cn';

type ControlProps = { id?: string; className?: string; 'aria-invalid'?: boolean };

export interface IftaLabelProps {
  label: React.ReactNode;
  /** Exactly one `<input>`, `<textarea>` or `<select>` (or a component that forwards `id` and `className` to one). */
  children: ReactElement<ControlProps>;
  /** Small text on the right of the label row — a unit, a character count. */
  aside?: React.ReactNode;
  /** Rose border and label, for a field that failed validation. */
  invalid?: boolean;
  className?: string;
}

/**
 * "Infield top-aligned" label: the label sits small at the top INSIDE the
 * bordered box, the control below it in the same box.
 *
 * The border and focus ring belong to the wrapper, not the control — the box
 * the eye reads as "the field" includes the label, so a ring around just the
 * input would draw a second, smaller box inside it. `focus-within` gives the
 * whole box the same ring `.field-input` draws, and clicking the label still
 * focuses the control through `htmlFor`.
 */
export default function IftaLabel({ label, children, aside, invalid = false, className }: IftaLabelProps) {
  const autoId = useId();
  const id = children.props.id ?? autoId;

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border bg-white/80 dark:bg-slate-900/60 transition-shadow',
        'focus-within:ring-2 has-[:disabled]:opacity-60',
        invalid
          ? 'border-rose-400 dark:border-rose-500 focus-within:ring-rose-400/40'
          : 'border-slate-300 dark:border-slate-700 focus-within:border-indigo-500 focus-within:ring-indigo-500/40',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 pt-1.5">
        <label
          htmlFor={id}
          className={cn(
            'text-[10px] font-semibold leading-none',
            invalid ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400',
          )}
        >
          {label}
        </label>
        {aside && <span className="text-[10px] leading-none text-slate-400 dark:text-slate-500">{aside}</span>}
      </div>
      {cloneElement(children, {
        id,
        'aria-invalid': invalid || undefined,
        // Strip the control's own chrome. These are utilities, so they beat a
        // `.field-input` on the child (components layer) — the kit's `<Input>`
        // drops in as readily as a bare `<input>`.
        className: cn(
          children.props.className,
          'w-full min-w-0 border-0 bg-transparent px-3 pb-1.5 pt-1 text-xs text-slate-800 dark:text-slate-100',
          'placeholder-slate-400 dark:placeholder-slate-500 shadow-none outline-none ring-0 focus:ring-0 focus:outline-none',
          'disabled:cursor-not-allowed',
        ),
      })}
    </div>
  );
}
