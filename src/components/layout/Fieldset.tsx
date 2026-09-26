'use client';

import { useEffect, useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface FieldsetProps {
  /** The group's caption. Rendered in a real `<legend>`, so it names the group for a screen reader. */
  legend: React.ReactNode;
  /** Turns the legend into a button that collapses and expands the content. */
  toggleable?: boolean;
  /** Controlled collapsed state. Leave undefined to let the fieldset own it. */
  collapsed?: boolean;
  /** Initial state when uncontrolled. */
  defaultCollapsed?: boolean;
  /** Fires with the NEXT collapsed state. */
  onToggle?: (collapsed: boolean) => void;
  /** Disables every control inside — the native `<fieldset disabled>` behaviour, not a restyle. */
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * A bordered group of related controls under a caption.
 *
 * A real `<fieldset>`/`<legend>` rather than a div with a label on it: the
 * legend becomes the group's accessible name, so each radio or input inside is
 * announced with the question it answers ("Notifications, Email, checkbox"),
 * and `disabled` switches off every control in one attribute.
 *
 * When `toggleable`, the button goes INSIDE the legend rather than replacing
 * it — the legend still names the group, and the button is what takes focus.
 * The collapse animates height through a `grid-template-rows` 1fr→0fr
 * transition, which needs no measuring; the collapsed body is also `inert`, so
 * Tab cannot land on a control nobody can see.
 */
export default function Fieldset({
  legend,
  toggleable = false,
  collapsed,
  defaultCollapsed = false,
  onToggle,
  disabled = false,
  className,
  children,
}: FieldsetProps) {
  const bodyId = useId();
  const [internal, setInternal] = useState(defaultCollapsed);
  // Only a toggleable fieldset can be collapsed; a stray `collapsed` on a
  // static one would otherwise hide content with no way to bring it back.
  const isCollapsed = toggleable && (collapsed ?? internal);

  // The body clips while collapsed AND for the length of the expand
  // animation — without the second, the content spills over whatever follows
  // while the row is still growing. It stops clipping once open, so a dropdown
  // inside an open fieldset is never cut off. A timer rather than
  // `transitionend`, because under reduced motion no transition runs and that
  // event never fires.
  const [opening, setOpening] = useState(false);
  const [prevCollapsed, setPrevCollapsed] = useState(isCollapsed);
  if (prevCollapsed !== isCollapsed) {
    setPrevCollapsed(isCollapsed);
    setOpening(!isCollapsed);
  }
  useEffect(() => {
    if (!opening) return;
    const t = setTimeout(() => setOpening(false), 250);
    return () => clearTimeout(t);
  }, [opening]);

  const toggle = () => {
    const next = !isCollapsed;
    if (collapsed === undefined) setInternal(next);
    onToggle?.(next);
  };

  return (
    <fieldset
      disabled={disabled}
      className={cn(
        'min-w-0 rounded-lg border border-slate-200 px-4 dark:border-slate-700',
        // The legend sits ON the top border; the bottom padding shrinks with
        // the body so a collapsed fieldset is a tidy single rule, not a box.
        isCollapsed ? 'pb-1' : 'pb-4',
        className,
      )}
    >
      <legend className="px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
        {toggleable ? (
          <button
            type="button"
            onClick={toggle}
            aria-expanded={!isCollapsed}
            aria-controls={bodyId}
            className={cn(
              '-mx-1 flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors',
              'hover:text-indigo-600 dark:hover:text-indigo-400',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
            )}
          >
            <ChevronDown
              className={cn('h-3.5 w-3.5 text-slate-400 transition-transform dark:text-slate-500', isCollapsed && '-rotate-90')}
              aria-hidden
            />
            {legend}
          </button>
        ) : (
          legend
        )}
      </legend>

      <div
        id={bodyId}
        inert={isCollapsed}
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none',
          isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]',
        )}
      >
        {/* `min-h-0` is what lets the 0fr row actually reach zero. */}
        <div className={cn('min-h-0', (isCollapsed || opening) && 'overflow-hidden')}>
          <div className="pt-2 text-xs text-slate-600 dark:text-slate-300">{children}</div>
        </div>
      </div>
    </fieldset>
  );
}
