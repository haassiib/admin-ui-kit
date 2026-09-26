'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useDismiss } from '@/lib/use-dismiss';

export type CascadeOption = {
  /** Unique across the whole tree — it is what `onChange` reports for a leaf. */
  value: string;
  label: string;
  icon?: React.ReactNode;
  /** Present and non-empty makes this a group: it opens a submenu and cannot itself be selected. */
  children?: CascadeOption[];
};

const hasKids = (o: CascadeOption | undefined): o is CascadeOption & { children: CascadeOption[] } =>
  !!o?.children && o.children.length > 0;

/** Index path from the roots to the leaf with `value`, or null. */
function findPath(options: CascadeOption[], value: string | null): number[] | null {
  if (value == null) return null;
  for (let i = 0; i < options.length; i++) {
    const o = options[i];
    if (!hasKids(o)) {
      if (o.value === value) return [i];
      continue;
    }
    const rest = findPath(o.children, value);
    if (rest) return [i, ...rest];
  }
  return null;
}

/** The option at each step of an index path. */
function walk(options: CascadeOption[], path: number[]): CascadeOption[] {
  const out: CascadeOption[] = [];
  let level: CascadeOption[] | undefined = options;
  for (const i of path) {
    const o: CascadeOption | undefined = level?.[i];
    if (!o) break;
    out.push(o);
    level = o.children;
  }
  return out;
}

export interface CascadeSelectProps {
  options: CascadeOption[];
  /** The selected LEAF's value. */
  value: string | null;
  /** Called with the leaf's value and the labels from root to leaf, e.g. `['Canada', 'Ontario', 'Toronto']`. */
  onChange: (value: string, pathLabels: string[]) => void;
  placeholder?: string;
  /** Show the whole path (`Canada / Ontario / Toronto`) on the trigger instead of just the leaf. */
  showPath?: boolean;
  disabled?: boolean;
  /** Lands on the trigger, so `<Field>`'s `<label for>` reaches it. */
  id?: string;
  className?: string;
}

/**
 * Single select over a tree, as flyout menus: the first level drops down, and
 * each group opens its children in a submenu beside it. Only leaves are
 * selectable — a group is a route, not an answer.
 *
 * State is one array, `trail`: the highlighted index in each open column. The
 * last entry is where focus is; every column after the first exists because the
 * entry before it is a group. `expandLast` covers the one case the trail cannot
 * — hovering a group shows its submenu while focus stays on the group row, so
 * the pointer can travel into the submenu without the keyboard jumping there.
 *
 * Hover moves real focus, so the mouse and the arrow keys can never disagree
 * about which row Enter would pick.
 */
export default function CascadeSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  showPath = false,
  disabled = false,
  id,
  className,
}: CascadeSelectProps) {
  const [open, setOpen] = useState(false);
  const [trail, setTrail] = useState<number[]>([0]);
  const [expandLast, setExpandLast] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const items = useRef(new Map<string, HTMLButtonElement>());
  const baseId = useId();

  const selectedPath = useMemo(() => findPath(options, value), [options, value]);
  const selected = useMemo(() => (selectedPath ? walk(options, selectedPath) : []), [options, selectedPath]);
  const leaf = selected[selected.length - 1];

  const close = useCallback((refocus: boolean) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }, []);

  // Escape steps back one column before it closes anything — the same thing
  // ArrowLeft does, so a person three levels deep is not thrown out entirely.
  const onEscape = useCallback(() => {
    if (trail.length > 1) {
      setTrail((t) => t.slice(0, -1));
      setExpandLast(false);
    } else close(true);
  }, [trail.length, close]);
  useDismiss(ref, open, () => close(false), onEscape);

  // Reopening lands on the current selection with its whole path unfolded, so
  // changing Toronto to Ottawa is one step, not a re-navigation from the top.
  const openMenu = () => {
    setTrail(selectedPath ?? [0]);
    setExpandLast(false);
    setOpen(true);
  };

  // Focus follows the trail. preventScroll + scrollIntoView('nearest') so
  // moving focus into a flyout never scrolls the whole page to it.
  useEffect(() => {
    if (!open) return;
    const k = trail.length - 1;
    const el = items.current.get(`${k}:${trail[k]}`);
    el?.focus({ preventScroll: true });
    el?.scrollIntoView({ block: 'nearest' });
  }, [open, trail]);

  const pick = (path: number[]) => {
    const chain = walk(options, path);
    const target = chain[chain.length - 1];
    if (!target || hasKids(target)) return;
    onChange(target.value, chain.map((o) => o.label));
    close(true);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // The trigger handles its own keys; this delegate is for the menu rows.
    if (e.target === triggerRef.current) return;
    const k = trail.length - 1;
    const column = k === 0 ? options : walk(options, trail.slice(0, k))[k - 1]?.children ?? [];
    const i = trail[k];
    const current = column[i];
    if (column.length === 0) return;
    const move = (to: number) => {
      e.preventDefault();
      setTrail([...trail.slice(0, k), (to + column.length) % column.length]);
      setExpandLast(false);
    };
    switch (e.key) {
      case 'ArrowDown': return move(i + 1);
      case 'ArrowUp': return move(i - 1);
      case 'Home': return move(0);
      case 'End': return move(column.length - 1);
      case 'ArrowRight':
      case 'Enter':
      case ' ':
        // preventDefault on Enter also stops a surrounding <form> submitting.
        e.preventDefault();
        if (hasKids(current)) {
          setTrail([...trail, 0]);
          setExpandLast(false);
        } else if (e.key !== 'ArrowRight') {
          pick(trail);
        }
        return;
      case 'ArrowLeft':
        e.preventDefault();
        if (trail.length > 1) {
          setTrail(trail.slice(0, -1));
          setExpandLast(false);
        }
        return;
      case 'Tab':
        // Let focus leave, but not with a menu left hanging over the next field.
        setOpen(false);
        return;
    }
  };

  const renderColumn = (column: CascadeOption[], depth: number): React.ReactNode => (
    <div
      role="menu"
      id={depth === 0 ? `${baseId}-menu` : undefined}
      aria-label={depth === 0 ? 'Options' : undefined}
      // No max-height / overflow here, deliberately: each submenu is nested
      // INSIDE its parent row, so a scrolling column would clip its own flyout
      // (the clipping trap in ui-conventions). Columns grow instead.
      className={cn(
        'absolute z-50 panel panel-solid min-w-[11rem] w-max p-1 text-xs',
        depth === 0 ? 'left-0 top-full mt-1 animate-fade-in' : 'left-full top-0 -mt-1 ml-1.5',
      )}
    >
      {column.map((o, i) => {
        const inTrail = trail[depth] === i;
        const isFocus = inTrail && depth === trail.length - 1;
        const group = hasKids(o);
        const childOpen = group && inTrail && (depth < trail.length - 1 || expandLast);
        const onSelectedPath = selectedPath?.[depth] === i && selectedPath.slice(0, depth).every((n, d) => n === trail[d]);
        const isSelectedLeaf = !group && onSelectedPath && depth === selectedPath!.length - 1;
        return (
          <div key={o.value} className="relative">
            <button
              ref={(el) => {
                const key = `${depth}:${i}`;
                if (el) items.current.set(key, el);
                else items.current.delete(key);
              }}
              type="button"
              tabIndex={-1}
              role={group ? 'menuitem' : 'menuitemradio'}
              aria-haspopup={group ? 'menu' : undefined}
              aria-expanded={group ? childOpen : undefined}
              aria-checked={group ? undefined : isSelectedLeaf}
              onMouseEnter={() => {
                setTrail([...trail.slice(0, depth), i]);
                setExpandLast(group);
              }}
              onClick={() => {
                if (group) {
                  // A click on a group opens it (for touch, where there is no
                  // hover) and moves focus into it, like ArrowRight.
                  setTrail([...trail.slice(0, depth), i, 0]);
                  setExpandLast(false);
                } else pick([...trail.slice(0, depth), i]);
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left leading-none outline-none transition-colors',
                isFocus
                  ? 'bg-indigo-600 text-white'
                  : inTrail
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                    : onSelectedPath
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-700 dark:text-slate-200',
              )}
            >
              {o.icon && <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center [&>svg]:h-3.5 [&>svg]:w-3.5" aria-hidden>{o.icon}</span>}
              <span className="flex-1 truncate py-0.5">{o.label}</span>
              {group ? (
                <ChevronRight aria-hidden className={cn('h-3.5 w-3.5 shrink-0', isFocus ? 'text-white' : 'text-slate-400')} />
              ) : (
                <Check aria-hidden className={cn('h-3.5 w-3.5 shrink-0', isSelectedLeaf ? 'opacity-100' : 'opacity-0')} />
              )}
            </button>
            {childOpen && renderColumn(o.children!, depth + 1)}
          </div>
        );
      })}
    </div>
  );

  const shown = showPath ? selected.map((o) => o.label).join(' / ') : leaf?.label;

  return (
    <div ref={ref} className={cn('relative', className)} onKeyDown={open ? onKeyDown : undefined}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${baseId}-menu` : undefined}
        onClick={() => (open ? close(false) : openMenu())}
        onKeyDown={(e) => {
          if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault();
            openMenu();
          }
        }}
        className="field-input flex items-center gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60"
      >
        {leaf?.icon && <span className="flex shrink-0 items-center text-slate-500 dark:text-slate-400 [&>svg]:h-3.5 [&>svg]:w-3.5" aria-hidden>{leaf.icon}</span>}
        <span className={cn('flex-1 truncate', !leaf && 'text-slate-400 dark:text-slate-500')}>{shown ?? placeholder}</span>
        <ChevronDown aria-hidden className={cn('h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && options.length > 0 && renderColumn(options, 0)}
    </div>
  );
}
