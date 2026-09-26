'use client';

import { cloneElement, useId, type ReactElement } from 'react';
import { cn } from '@/lib/cn';

type ControlProps = { id?: string; className?: string; placeholder?: string };

/*
 * Each variant is two class sets for the label: FLOATED (the base classes) and
 * RESTING (sitting in the field like a placeholder). Resting is expressed as
 *
 *   peer-[:placeholder-shown:not(:focus)]:…
 *
 * i.e. "the control before me shows its placeholder and is not focused" — which
 * is exactly "empty and idle". The trick that makes it work uncontrolled: the
 * control is given `placeholder=" "`. A single space is invisible, but it makes
 * `:placeholder-shown` true precisely while the field is empty and false the
 * moment it holds a character, whether React owns the value or the DOM does.
 * No onChange, no state, no ref reading `.value`.
 *
 * The compound selector also outranks the base classes on specificity (three
 * classes/pseudo-classes against one), so resting reliably wins while it
 * applies without depending on the order Tailwind happens to emit variants in.
 *
 * A <select> never matches `:placeholder-shown`, so its label stays floated —
 * correct, since a select always displays some option.
 *
 * Every class string below is a literal because Tailwind's scanner only sees
 * literals; composing the variant prefix at runtime would purge the rules.
 */
const VARIANT = {
  // Floats ABOVE the box; the wrapper reserves the row it floats into.
  over: {
    wrapper: 'pt-5',
    control: '',
    floated: 'left-0 top-0 -translate-y-[calc(100%+4px)] text-[11px] font-semibold text-slate-600 dark:text-slate-300',
    resting: 'peer-[:placeholder-shown:not(:focus)]:left-3 peer-[:placeholder-shown:not(:focus)]:text-xs peer-[:placeholder-shown:not(:focus)]:font-normal peer-[:placeholder-shown:not(:focus)]:text-slate-400 dark:peer-[:placeholder-shown:not(:focus)]:text-slate-500',
  },
  // Floats to the top INSIDE the box; the control grows top padding to make room.
  in: {
    wrapper: '',
    control: 'pt-5 pb-1.5',
    floated: 'left-3 top-1.5 translate-y-0 text-[10px] font-medium text-slate-500 dark:text-slate-400',
    resting: 'peer-[:placeholder-shown:not(:focus)]:text-xs peer-[:placeholder-shown:not(:focus)]:font-normal peer-[:placeholder-shown:not(:focus)]:text-slate-400 dark:peer-[:placeholder-shown:not(:focus)]:text-slate-500',
  },
  // Sits ON the border line. The patch behind the text must hide the border,
  // so it has to be opaque — and to be invisible as a patch it has to be the
  // field's own colour. `.field-input` is translucent (it shows the ground
  // through), so this variant makes the control opaque in the same colour as
  // the patch; the pair then match in both schemes whatever sits behind them.
  // Utilities outrank `.field-input` (it lives in the components layer), so
  // the plain `bg-*` here wins without `!important`.
  on: {
    wrapper: '',
    control: 'bg-white dark:bg-slate-900',
    floated: 'left-2 top-0 -translate-y-1/2 px-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900',
    resting: 'peer-[:placeholder-shown:not(:focus)]:left-3 peer-[:placeholder-shown:not(:focus)]:px-0 peer-[:placeholder-shown:not(:focus)]:text-xs peer-[:placeholder-shown:not(:focus)]:font-normal peer-[:placeholder-shown:not(:focus)]:text-slate-400 dark:peer-[:placeholder-shown:not(:focus)]:text-slate-500 peer-[:placeholder-shown:not(:focus)]:bg-transparent',
  },
} as const;

// Where a resting label sits: centred on a one-line control, on the first line
// of a textarea (centring it in a tall box reads as a floating caption).
const REST_AT = {
  line: 'peer-[:placeholder-shown:not(:focus)]:top-1/2 peer-[:placeholder-shown:not(:focus)]:-translate-y-1/2',
  multiline: 'peer-[:placeholder-shown:not(:focus)]:top-2 peer-[:placeholder-shown:not(:focus)]:translate-y-0',
} as const;

export interface FloatLabelProps {
  label: React.ReactNode;
  /** `over` floats above the box, `in` to the top inside it, `on` onto the border line. */
  variant?: keyof typeof VARIANT;
  /** Exactly one `<input>`, `<textarea>` or `<select>` (or a component that forwards `id`, `className` and `placeholder` to one). Its own `placeholder` is replaced — the label is the placeholder. */
  children: ReactElement<ControlProps>;
  /** Rest the label on the first line instead of centred. Defaults to true for a `<textarea>` child. */
  multiline?: boolean;
  className?: string;
}

/**
 * A label that sits inside an empty field as its placeholder and floats clear
 * when the field is focused or filled. Pure CSS — see the note on `VARIANT`.
 */
export default function FloatLabel({ label, variant = 'over', children, multiline, className }: FloatLabelProps) {
  const autoId = useId();
  const id = children.props.id ?? autoId;
  const v = VARIANT[variant];
  const isMultiline = multiline ?? children.type === 'textarea';

  return (
    <div className={cn(v.wrapper, className)}>
      <div className="relative">
        {cloneElement(children, {
          id,
          placeholder: ' ',
          // `peer` must sit on the control, and the control must come BEFORE
          // the label: CSS sibling selectors only look forwards.
          className: cn(children.props.className, 'peer', v.control),
        })}
        <label
          htmlFor={id}
          className={cn(
            // pointer-events-none so a click on the resting label lands on the
            // control underneath rather than on text that merely looks like it.
            'pointer-events-none absolute max-w-[calc(100%-1.5rem)] truncate leading-none transition-all duration-150 ease-out',
            'peer-focus:text-indigo-600 dark:peer-focus:text-indigo-400',
            v.floated,
            v.resting,
            isMultiline ? REST_AT.multiline : REST_AT.line,
          )}
        >
          {label}
        </label>
      </div>
    </div>
  );
}
