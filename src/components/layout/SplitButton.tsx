'use client';

import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useDismiss } from '@/lib/use-dismiss';
import Button from './Button';

export type SplitButtonAction = {
  label: React.ReactNode;
  /** An icon component (a lucide icon, say), sized by the menu. */
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  disabled?: boolean;
  /** Rose text, for the irreversible entry. */
  danger?: boolean;
  separator?: false;
};

/** A rule between groups of actions. */
export type SplitButtonSeparator = { separator: true };

export type SplitButtonItem = SplitButtonAction | SplitButtonSeparator;

/*
 * The seam between the halves, per variant. The filled variants get a
 * translucent white hairline; `secondary` already has a border on both halves,
 * so the caret drops its left one and the main button's right border is the
 * seam; `ghost` has none, so it borrows the slate rule.
 */
const SEAM = {
  primary: 'border-l border-white/25',
  secondary: 'border-l-0',
  ghost: 'border-l border-slate-200 dark:border-slate-700',
  danger: 'border-l border-white/25',
} as const;

const CARET_PAD = { sm: 'px-1.5', md: 'px-2', lg: 'px-2.5' } as const;

export interface SplitButtonProps {
  /** The primary action's label. */
  label: React.ReactNode;
  /** The primary action. */
  onClick?: () => void;
  /** Secondary actions, shown in the caret's menu. */
  items: SplitButtonItem[];
  variant?: keyof typeof SEAM;
  size?: keyof typeof CARET_PAD;
  /** Icon component shown before the label. */
  icon?: React.ComponentType<{ className?: string }>;
  /** Disables both halves. */
  disabled?: boolean;
  /** Spinner on the primary half; the menu stays usable. */
  loading?: boolean;
  /**
   * Which edge of the button the menu lines up with. `auto` (default) lines
   * up with the right edge, and flips to the left when that would push the
   * menu out past the edge of its scrolling container or the window — where
   * it would be clipped, or painted under the sidebar beside it.
   */
  menuAlign?: 'left' | 'right' | 'auto';
  /** Accessible name for the caret button. */
  menuLabel?: string;
  className?: string;
}

/**
 * A primary action joined to a caret that opens its secondary actions —
 * "Save" beside "Save as draft / Save and close".
 *
 * Two real buttons, not one with a hot zone: the main action and "show more"
 * are different operations, and each needs its own focus stop and name.
 *
 * The menu follows the ARIA menu-button pattern. Opening from the keyboard
 * (Enter/Space/ArrowDown, or ArrowUp for the last item) puts focus on an item;
 * opening with the mouse leaves focus on the caret. Arrow keys cycle the
 * enabled items, Escape closes and returns focus to the caret, and Tab closes
 * and lets focus move on — a menu that holds Tab is a trap.
 *
 * In-flow and absolute at z-50, like every other dropdown here. It is exposed
 * to an `overflow-hidden` ancestor; a SplitButton inside a table shell wants a
 * portalled menu instead (see ContextMenu).
 */
export default function SplitButton({
  label,
  onClick,
  items,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled = false,
  loading = false,
  menuAlign = 'auto',
  menuLabel = 'More actions',
  className,
}: SplitButtonProps) {
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const [autoAlign, setAutoAlign] = useState<'left' | 'right'>('right');

  // Measured after the menu renders, before paint, against the nearest
  // ancestor that clips (or the window).
  useLayoutEffect(() => {
    if (!open || menuAlign !== 'auto') return;
    const root = rootRef.current;
    const menu = menuRef.current;
    if (!root || !menu) return;
    let bound = 0;
    for (let el = root.parentElement; el; el = el.parentElement) {
      const o = getComputedStyle(el).overflowX;
      if (o !== 'visible') { bound = el.getBoundingClientRect().left; break; }
    }
    const r = root.getBoundingClientRect();
    setAutoAlign(r.right - menu.offsetWidth < bound + 8 ? 'left' : 'right');
  }, [open, menuAlign]);
  const align = menuAlign === 'auto' ? autoAlign : menuAlign;

  const close = useCallback(() => setOpen(false), []);
  const escape = useCallback(() => {
    setOpen(false);
    caretRef.current?.focus();
  }, []);
  useDismiss(rootRef, open, close, escape);

  const enabled = () =>
    items
      .map((it, i) => (!it.separator && !it.disabled ? i : -1))
      .filter((i) => i !== -1);

  // Focus after the menu has rendered — the item buttons do not exist yet on
  // the same tick as `setOpen(true)`.
  const focusItem = (which: 'first' | 'last') => {
    requestAnimationFrame(() => {
      const list = enabled();
      const i = which === 'first' ? list[0] : list[list.length - 1];
      if (i !== undefined) itemRefs.current[i]?.focus();
    });
  };

  const onCaretKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      focusItem(e.key === 'ArrowDown' ? 'first' : 'last');
    }
  };

  const onMenuKey = (e: React.KeyboardEvent) => {
    const list = enabled();
    const current = itemRefs.current.findIndex((el) => el === document.activeElement);
    const pos = list.indexOf(current);
    let next: number | undefined;
    if (e.key === 'ArrowDown') next = list[(pos + 1) % list.length];
    else if (e.key === 'ArrowUp') next = list[(pos - 1 + list.length) % list.length];
    else if (e.key === 'Home') next = list[0];
    else if (e.key === 'End') next = list[list.length - 1];
    else if (e.key === 'Tab') setOpen(false);
    if (next === undefined) return;
    e.preventDefault();
    itemRefs.current[next]?.focus();
  };

  const run = (it: SplitButtonAction) => {
    setOpen(false);
    // Back to the caret before the action runs, so focus is not stranded on
    // an unmounted item — and an action that opens a modal can take it from
    // there.
    caretRef.current?.focus();
    it.onClick?.();
  };

  return (
    <div ref={rootRef} className={cn('relative inline-flex', className)}>
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={disabled}
        loading={loading}
        onClick={onClick}
        className="rounded-r-none focus-visible:relative focus-visible:z-10"
      >
        {Icon && !loading && <Icon className="h-3.5 w-3.5" aria-hidden />}
        {label}
      </Button>
      <Button
        ref={caretRef}
        type="button"
        variant={variant}
        size={size}
        disabled={disabled}
        aria-label={menuLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={(e) => {
          const next = !open;
          setOpen(next);
          // `detail === 0` is a click synthesised by Enter/Space: a keyboard
          // user gets focus on the first item, a mouse user keeps it here.
          if (next && e.detail === 0) focusItem('first');
        }}
        onKeyDown={onCaretKey}
        className={cn('rounded-l-none focus-visible:relative focus-visible:z-10', SEAM[variant], CARET_PAD[size])}
      >
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} aria-hidden />
      </Button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-orientation="vertical"
          onKeyDown={onMenuKey}
          className={cn(
            'panel panel-solid absolute top-full z-50 mt-1 min-w-44 p-1',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((it, i) =>
            it.separator ? (
              <div key={i} role="separator" className="my-1 h-px bg-slate-200 dark:bg-slate-700" />
            ) : (
              <button
                key={i}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                type="button"
                role="menuitem"
                tabIndex={-1}
                disabled={it.disabled}
                onClick={() => run(it)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors',
                  'focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40',
                  it.danger
                    ? 'text-rose-600 hover:bg-rose-50 focus:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 dark:focus:bg-rose-500/10'
                    : 'text-slate-700 hover:bg-slate-100 focus:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:bg-slate-800',
                )}
              >
                {it.icon && <it.icon className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />}
                <span className="min-w-0 flex-1 truncate">{it.label}</span>
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
