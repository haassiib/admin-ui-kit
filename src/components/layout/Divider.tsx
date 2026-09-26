import { cn } from '@/lib/cn';

const TYPE = {
  solid: 'border-solid',
  dashed: 'border-dashed',
  dotted: 'border-dotted',
} as const;

/*
 * Where the content sits, as the flex-grow of the rule on each side of it. A
 * short fixed stub on the near side rather than no rule at all, so a
 * left-aligned label still reads as sitting ON the line, not beside it.
 */
const ALIGN = {
  left: ['w-4 shrink-0', 'flex-1'],
  top: ['h-3 shrink-0', 'flex-1'],
  center: ['flex-1', 'flex-1'],
  right: ['flex-1', 'w-4 shrink-0'],
  bottom: ['flex-1', 'h-3 shrink-0'],
} as const;

export interface DividerProps {
  /** `vertical` stretches to the height of its flex row — put it between inline items. */
  layout?: 'horizontal' | 'vertical';
  type?: keyof typeof TYPE;
  /**
   * Position of the content along the rule. `left|center|right` for
   * horizontal, `top|center|bottom` for vertical; a value from the other axis
   * falls back to `center`.
   */
  align?: keyof typeof ALIGN;
  className?: string;
  /** Optional label on the rule ("OR", a section name, an icon). */
  children?: React.ReactNode;
}

/**
 * A rule between sections, optionally carrying a label.
 *
 * `role="separator"` with `aria-orientation`, on the element that draws the
 * rule. The ARIA separator role makes its children presentational, so a label
 * written as a plain string is ALSO passed as `aria-label` — otherwise "Or
 * continue with" is flattened away and the separator is announced nameless.
 *
 * The rules are borders, not backgrounds, because `border-style` is the only
 * way to get dashed and dotted variants that stay crisp at 1px.
 */
export default function Divider({
  layout = 'horizontal',
  type = 'solid',
  align = 'center',
  className,
  children,
}: DividerProps) {
  const vertical = layout === 'vertical';
  const has = children != null && children !== false && children !== '';
  const label = typeof children === 'string' ? children : undefined;
  const line = cn(
    'border-slate-200 dark:border-slate-700',
    TYPE[type],
    vertical ? 'border-l' : 'border-t',
  );

  if (!has) {
    return (
      <div
        role="separator"
        aria-orientation={layout}
        className={cn(line, vertical ? 'mx-3 self-stretch' : 'my-4 w-full', className)}
      />
    );
  }

  const valid = vertical ? ['top', 'center', 'bottom'] : ['left', 'center', 'right'];
  const [before, after] = ALIGN[valid.includes(align) ? align : 'center'];

  return (
    <div
      role="separator"
      aria-orientation={layout}
      aria-label={label}
      className={cn(
        'flex items-center',
        vertical ? 'mx-3 flex-col self-stretch gap-1.5' : 'my-4 w-full gap-2',
        className,
      )}
    >
      <span className={cn(line, before)} aria-hidden />
      <span className="shrink-0 text-[11px] font-medium text-slate-500 dark:text-slate-400">{children}</span>
      <span className={cn(line, after)} aria-hidden />
    </div>
  );
}
