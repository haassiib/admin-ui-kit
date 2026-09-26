import { cn } from '@/lib/cn';

export interface InputGroupAddonProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

/**
 * A grey cap for text or an icon ("https://", "$", a search glass) beside the
 * input. Same border and height as `field-input`, so it reads as part of the
 * control rather than a label floating next to it.
 */
export function InputGroupAddon({ children, className, ...rest }: InputGroupAddonProps) {
  return (
    <span
      {...rest}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg border px-2.5 text-xs leading-none',
        'border-slate-300 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400',
        '[&>svg]:h-3.5 [&>svg]:w-3.5',
        className,
      )}
    >
      {children}
    </span>
  );
}

export interface InputGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Addons, inputs, selects and buttons, in visual order. Each keeps its own
   * classes — the group only squares the inner corners and overlaps the borders.
   */
  children: React.ReactNode;
}

/**
 * Joins addons, inputs and buttons into one control with a single outline.
 *
 * It works on the children's OWN borders instead of drawing a frame around
 * them: every child but the first loses its left radius and is pulled 1px left
 * so two borders collapse into one, and every child but the last loses its
 * right radius. The selectors are `:not(:first-child)` / `:not(:last-child)`
 * rather than plain `first:`, because the extra pseudo-class out-specifies a
 * child's own `rounded-lg` — `cn()` does not merge classes, so winning on
 * specificity is the only way to override a `<Button>`'s corners from outside.
 *
 * The focused child is lifted one level above its neighbours (not into the
 * z-index bands — it only has to beat its siblings), or the right half of its
 * focus ring would be painted over by the addon that follows it.
 *
 * Inputs grow to fill; a `<select>` keeps whatever width its own classes give
 * it, so pass `w-auto` to one used as an addon-style picker.
 */
export default function InputGroup({ children, className, ...rest }: InputGroupProps) {
  return (
    <div
      role="group"
      {...rest}
      className={cn(
        'flex w-full items-stretch',
        '[&>*]:relative [&>*:focus]:z-[1] [&>*:focus-within]:z-[1]',
        '[&>*:not(:first-child)]:-ml-px [&>*:not(:first-child)]:rounded-l-none',
        '[&>*:not(:last-child)]:rounded-r-none',
        '[&>input]:min-w-0 [&>input]:flex-1',
        className,
      )}
    >
      {children}
    </div>
  );
}
