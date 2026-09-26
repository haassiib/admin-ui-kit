'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronRight, Info, ListFilter, Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useDismiss } from '@/lib/use-dismiss';

/** One value a leaf list offers. */
export type MultilevelMenuOption = { value: string; label: string; disabled?: boolean };

/**
 * A row in the menu. With `children` it opens another level; with `options`
 * it opens a list of values to pick from; with neither it is an action and
 * runs `onSelect`.
 */
export type MultilevelMenuNode = {
  key: string;
  label: string;
  icon?: ReactNode;
  children?: MultilevelMenuNode[];
  options?: MultilevelMenuOption[];
  /** For an option list: pick several (the default) or exactly one. */
  multiple?: boolean;
  /** The note above an option list. Defaults to "You can select multiple items" for a multiple list. */
  hint?: ReactNode;
  /** Show a search box on this node's level. Default: when it has more than `searchFrom` rows. */
  searchable?: boolean;
  /** This node's level's width in px. */
  width?: number;
  disabled?: boolean;
  onSelect?: () => void;
};

/** What is picked: option values per option-list key. */
export type MultilevelMenuValue = Record<string, string[]>;

/** Every option list with something picked, in menu order — the data for a row of filter chips. */
export function selectedLists(nodes: MultilevelMenuNode[], value: MultilevelMenuValue) {
  const out: Array<{ node: MultilevelMenuNode; path: string[]; options: MultilevelMenuOption[] }> = [];
  const walk = (list: MultilevelMenuNode[], path: string[]) => {
    for (const n of list) {
      if (n.options && value[n.key]?.length) {
        const picked = new Set(value[n.key]);
        out.push({ node: n, path: [...path, n.label], options: n.options.filter((o) => picked.has(o.value)) });
      }
      if (n.children) walk(n.children, [...path, n.label]);
    }
  };
  walk(nodes, []);
  return out;
}

/** Option-list keys at or under a node, for its Clear and its count. */
function listKeys(n: MultilevelMenuNode): string[] {
  return [...(n.options ? [n.key] : []), ...(n.children ?? []).flatMap(listKeys)];
}

const countUnder = (n: MultilevelMenuNode, value: MultilevelMenuValue) =>
  listKeys(n).reduce((s, k) => s + (value[k]?.length ?? 0), 0);

const ROW =
  'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs text-slate-700 outline-none transition-colors hover:bg-slate-100 focus-visible:bg-slate-100 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent dark:text-slate-200 dark:hover:bg-slate-700/60 dark:focus-visible:bg-slate-700/60';
const LINK =
  'text-[11px] font-medium text-slate-500 hover:text-indigo-600 disabled:pointer-events-none disabled:opacity-40 dark:text-slate-400 dark:hover:text-indigo-300';
const GAP = 6;
const MARGIN = 8;
const HOVER_DELAY = 120;

/**
 * A dropdown of dropdowns — the "Add filter" menu of a reporting page. Each
 * level opens BESIDE the one before, level with the row that opened it, so the
 * whole route (Filters › Offer › these offers) stays on screen at once and a
 * person can back up one level by moving the pointer left instead of hunting
 * a back button. Levels end in lists of values to tick.
 *
 * ── Why a cascade and not a drill-down ──────────────────────────────────────
 *
 * A drill-down (one panel that replaces its content) hides where you came
 * from, and hopping from "Offer" to "Channel" costs back-then-forward. Here
 * the parent stays visible and hovering its next row swaps the level beside
 * it. Hover opens after a short pause, so a pointer crossing rows on its way
 * diagonally into the open level does not flip it to every row it grazes.
 *
 * ── Keyboard ────────────────────────────────────────────────────────────────
 *
 * Arrows move within a level; Right or Enter opens a row's level and moves
 * into it; Left or Escape closes the deepest level and returns to its row;
 * Escape on the first level closes the menu. A search box, where there is
 * one, takes focus when its level opens and Down moves from it into the list.
 *
 * Levels are portalled and placed in viewport coordinates, flipping to the
 * left of their parent at the right edge of the screen and sliding up at the
 * bottom, so a menu opened inside a clipped card or a table toolbar is never
 * cut off.
 */
export default function MultilevelMenu({
  nodes,
  value,
  onChange,
  title = 'Filters',
  label = 'Add filter',
  icon,
  searchFrom = 6,
  width = 232,
  className,
}: {
  nodes: MultilevelMenuNode[];
  value: MultilevelMenuValue;
  onChange: (value: MultilevelMenuValue) => void;
  /** Heading of the first level. */
  title?: string;
  /** The trigger button's text. */
  label?: string;
  icon?: ReactNode;
  /** Levels with more rows than this get a search box. */
  searchFrom?: number;
  /** Default level width in px; a node's own `width` overrides it for its level. */
  width?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  // The open row at each level: path[0] is the row open in the first level.
  const [path, setPath] = useState<string[]>([]);
  const [queries, setQueries] = useState<string[]>([]);
  const [pos, setPos] = useState<Array<{ left: number; top: number }>>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panels = useRef<Array<HTMLDivElement | null>>([]);
  const hoverTimer = useRef<number | undefined>(undefined);
  const focusNext = useRef<{ level: number; key?: string } | null>(null);
  const [, bump] = useState(0);

  // The chain of open levels: the root, then each open row's node.
  const levels: Array<{ node: MultilevelMenuNode | null; rows: MultilevelMenuNode[] }> = [{ node: null, rows: nodes }];
  for (const key of path) {
    const node = levels[levels.length - 1].rows.find((n) => n.key === key);
    if (!node || (!node.children && !node.options)) break;
    levels.push({ node, rows: node.children ?? [] });
  }

  const close = () => {
    window.clearTimeout(hoverTimer.current);
    setOpen(false);
    setPath([]);
    setQueries([]);
    setPos([]);
  };
  const back = () => {
    if (path.length === 0) {
      close();
      triggerRef.current?.focus();
      return;
    }
    focusNext.current = { level: path.length - 1, key: path[path.length - 1] };
    setPath(path.slice(0, -1));
  };
  useDismiss([rootRef, layerRef], open, close, back);

  const openAt = (level: number, key: string | null, focus = false) => {
    window.clearTimeout(hoverTimer.current);
    const next = key === null ? path.slice(0, level) : [...path.slice(0, level), key];
    if (next.join('\u0000') !== path.join('\u0000')) {
      setPath(next);
      // A new level starts unfiltered.
      setQueries((q) => q.slice(0, level + 1));
    }
    if (focus && key !== null) focusNext.current = { level: level + 1 };
  };

  // Place every level: the first under the trigger, each next one beside its
  // parent and level with the row that opened it. Measured after every
  // render, stored only when it moved, so it settles in a pass.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const trig = triggerRef.current.getBoundingClientRect();
    const out: Array<{ left: number; top: number }> = [];
    for (let i = 0; i < levels.length; i++) {
      const el = panels.current[i];
      if (!el) break;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      let left: number;
      let top: number;
      if (i === 0) {
        left = trig.left;
        top = trig.bottom + GAP;
        if (top + h > vh - MARGIN && trig.top - GAP - h > MARGIN) top = trig.top - GAP - h;
      } else {
        const parent = panels.current[i - 1]!;
        const p = out[i - 1];
        const pr = parent.getBoundingClientRect();
        const row = parent.querySelector<HTMLElement>(`[data-key="${CSS.escape(path[i - 1])}"]`)?.getBoundingClientRect();
        // The row's place in its panel, moved to where the panel is going.
        const rowTop = row ? row.top - pr.top + p.top : p.top;
        left = p.left + parent.offsetWidth + GAP;
        if (left + w > vw - MARGIN) left = p.left - w - GAP;
        top = rowTop - 10;
      }
      out.push({
        left: Math.min(Math.max(MARGIN, left), Math.max(MARGIN, vw - MARGIN - w)),
        top: Math.min(Math.max(MARGIN, top), Math.max(MARGIN, vh - MARGIN - h)),
      });
    }
    const same = out.length === pos.length && out.every((o, i) => o.left === pos[i].left && o.top === pos[i].top);
    if (!same) setPos(out);
  });

  // Scrolling the page or resizing the window moves the trigger; follow it.
  useEffect(() => {
    if (!open) return;
    const re = () => bump((n) => n + 1);
    window.addEventListener('resize', re);
    window.addEventListener('scroll', re, true);
    return () => {
      window.removeEventListener('resize', re);
      window.removeEventListener('scroll', re, true);
    };
  }, [open]);

  // Move focus where the last keyboard action asked, once that level exists.
  useEffect(() => {
    const want = focusNext.current;
    if (!want) return;
    const el = panels.current[want.level];
    // Not until the level is placed: it is `visibility: hidden` for its first
    // frame, and focusing a hidden element silently does nothing.
    if (!el || !pos[want.level]) return;
    focusNext.current = null;
    const target = want.key
      ? el.querySelector<HTMLElement>(`[data-key="${CSS.escape(want.key)}"]`)
      : el.querySelector<HTMLElement>('input[type="search"]') ?? el.querySelector<HTMLElement>('[data-row]:not(:disabled)');
    target?.focus({ preventScroll: true });
  });

  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  const total = nodes.reduce((s, n) => s + countUnder(n, value), 0);

  const clearKeys = (keys: string[]) => {
    const next = { ...value };
    for (const k of keys) delete next[k];
    onChange(next);
  };

  const onListKey = (level: number) => (e: KeyboardEvent<HTMLDivElement>) => {
    const panel = panels.current[level];
    if (!panel) return;
    const rows = [...panel.querySelectorAll<HTMLElement>('[data-row]:not(:disabled)')];
    const at = rows.indexOf(document.activeElement as HTMLElement);
    const inSearch = (document.activeElement as HTMLElement | null)?.matches('input[type="search"]');
    const move = (i: number) => rows[(i + rows.length) % rows.length]?.focus();
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        move(inSearch ? 0 : at + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (at <= 0 && panel.querySelector('input[type="search"]')) panel.querySelector<HTMLElement>('input[type="search"]')!.focus();
        else move(at - 1);
        break;
      case 'Home':
      case 'End':
        if (inSearch) return;
        e.preventDefault();
        move(e.key === 'Home' ? 0 : rows.length - 1);
        break;
      case 'ArrowRight': {
        if (inSearch) return;
        const key = (document.activeElement as HTMLElement | null)?.dataset.key;
        const node = levels[level].rows.find((n) => n.key === key);
        if (node && (node.children || node.options)) {
          e.preventDefault();
          openAt(level, node.key, true);
        }
        break;
      }
      case 'ArrowLeft':
        if (inSearch || level === 0) return;
        e.preventDefault();
        focusNext.current = { level: level - 1, key: path[level - 1] };
        setPath(path.slice(0, level - 1));
        break;
    }
  };

  const layer = open && typeof document !== 'undefined'
    ? createPortal(
        <div ref={layerRef} data-overlay="menu">
          {levels.map((lvl, i) => {
            const node = lvl.node;
            const isList = !!node?.options;
            const query = (queries[i] ?? '').trim().toLowerCase();
            const count = isList ? node!.options!.length : lvl.rows.length;
            const searchable = node?.searchable ?? count > searchFrom;
            const setQuery = (q: string) => setQueries((qs) => Object.assign([...qs], { [i]: q }));
            const heading = node ? node.label : title;
            const clearable = node ? listKeys(node) : nodes.flatMap(listKeys);
            const picked = isList ? new Set(value[node!.key] ?? []) : null;
            const multiple = isList && node!.multiple !== false;
            const shownOptions = isList ? node!.options!.filter((o) => !query || o.label.toLowerCase().includes(query)) : [];
            const shownRows = isList ? [] : lvl.rows.filter((r) => !query || r.label.toLowerCase().includes(query));
            const levelWidth = node?.width ?? (isList ? Math.max(width, 300) : width);
            const hasAny = clearable.some((k) => value[k]?.length);

            const pick = (o: MultilevelMenuOption) => {
              const cur = value[node!.key] ?? [];
              const next = multiple
                ? cur.includes(o.value)
                  ? cur.filter((v) => v !== o.value)
                  : [...cur, o.value]
                : cur[0] === o.value
                  ? []
                  : [o.value];
              const out = { ...value, [node!.key]: next };
              if (next.length === 0) delete out[node!.key];
              onChange(out);
            };

            return (
              <div
                key={node?.key ?? '__root'}
                ref={(el) => {
                  panels.current[i] = el;
                }}
                role="menu"
                aria-label={heading}
                onKeyDown={onListKey(i)}
                // Reaching a level cancels a hover still pending in the level before it.
                onPointerEnter={() => window.clearTimeout(hoverTimer.current)}
                style={{
                  width: levelWidth,
                  left: pos[i]?.left ?? 0,
                  top: pos[i]?.top ?? 0,
                  // Unplaced for one frame, while it is measured.
                  visibility: pos[i] ? undefined : 'hidden',
                }}
                className="panel panel-solid fixed z-[200] flex max-h-[min(28rem,calc(100vh-1rem))] flex-col py-1 animate-scale-in"
              >
                <div className="flex shrink-0 items-center justify-between gap-2 px-3 pb-2 pt-1.5">
                  <h3 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{heading}</h3>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {multiple && (
                      <>
                        <button
                          type="button"
                          className={LINK}
                          disabled={shownOptions.every((o) => o.disabled || picked!.has(o.value))}
                          onClick={() => {
                            // Select all that the search shows, the ones in view.
                            const add = shownOptions.filter((o) => !o.disabled).map((o) => o.value);
                            onChange({ ...value, [node!.key]: [...new Set([...(value[node!.key] ?? []), ...add])] });
                          }}
                        >
                          Select all
                        </button>
                        <span aria-hidden className="text-slate-300 dark:text-slate-600">|</span>
                      </>
                    )}
                    <button type="button" className={LINK} disabled={!hasAny} onClick={() => clearKeys(clearable)}>
                      Clear
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700" />

                {searchable && (
                  <label className="flex shrink-0 items-center gap-2 border-b border-slate-200 px-3 py-1.5 dark:border-slate-700">
                    <Search aria-hidden className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <input
                      type="search"
                      value={queries[i] ?? ''}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={`Search ${heading.toLowerCase()}`}
                      aria-label={`Search ${heading}`}
                      className="min-w-0 flex-1 bg-transparent py-1 text-xs text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
                    />
                  </label>
                )}

                {isList && (node!.hint !== undefined || multiple) && (
                  <p className="flex shrink-0 items-center gap-1.5 border-b border-slate-200 px-3 py-2 text-[11px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <Info aria-hidden className="h-3.5 w-3.5 shrink-0" />
                    {node!.hint ?? 'You can select multiple items'}
                  </p>
                )}

                <div className="min-h-0 flex-1 overflow-y-auto px-1 pt-1">
                  {isList
                    ? shownOptions.map((o) => {
                        const on = picked!.has(o.value);
                        return (
                          <button
                            key={o.value}
                            type="button"
                            data-row
                            role={multiple ? 'menuitemcheckbox' : 'menuitemradio'}
                            aria-checked={on}
                            disabled={o.disabled}
                            onClick={() => pick(o)}
                            className={cn(ROW, on && 'font-medium text-indigo-700 dark:text-indigo-300')}
                          >
                            <span
                              aria-hidden
                              className={cn(
                                'flex h-3.5 w-3.5 shrink-0 items-center justify-center border',
                                multiple ? 'rounded' : 'rounded-full',
                                on
                                  ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-400 dark:bg-indigo-400 dark:text-slate-900'
                                  : 'border-slate-300 dark:border-slate-600',
                              )}
                            >
                              {on && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                            </span>
                            <span className="min-w-0 flex-1 truncate">{o.label}</span>
                          </button>
                        );
                      })
                    : shownRows.map((r) => {
                        const opens = !!(r.children || r.options);
                        const active = path[i] === r.key;
                        const n = countUnder(r, value);
                        return (
                          <button
                            key={r.key}
                            type="button"
                            data-row
                            data-key={r.key}
                            role="menuitem"
                            aria-haspopup={opens ? 'menu' : undefined}
                            aria-expanded={opens ? active : undefined}
                            disabled={r.disabled}
                            // On MOVE, not enter: rows that re-render under a resting pointer
                            // (a search narrowing, an Escape) fire enter without anyone
                            // pointing, and would reopen the level just closed. Restarting
                            // the timer on each move opens a row once the pointer settles.
                            onPointerMove={(e) => {
                              if (e.pointerType !== 'mouse') return;
                              // Already where this row leads: its level open, or (an action row) nothing open beside it.
                              if (opens ? path[i] === r.key : path.length <= i) return;
                              window.clearTimeout(hoverTimer.current);
                              hoverTimer.current = window.setTimeout(() => openAt(i, opens ? r.key : null), HOVER_DELAY);
                            }}
                            onPointerLeave={() => window.clearTimeout(hoverTimer.current)}
                            onClick={() => {
                              if (opens) openAt(i, r.key);
                              else {
                                r.onSelect?.();
                                close();
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && opens) {
                                e.preventDefault();
                                openAt(i, r.key, true);
                              }
                            }}
                            className={cn(ROW, active && 'bg-slate-100 dark:bg-slate-700/60')}
                          >
                            {r.icon && <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center text-slate-400 [&>svg]:h-3.5 [&>svg]:w-3.5">{r.icon}</span>}
                            <span className="min-w-0 flex-1 truncate">{r.label}</span>
                            {n > 0 && (
                              <span className="rounded-full bg-indigo-50 px-1.5 text-[10px] font-semibold leading-4 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                                {n}
                              </span>
                            )}
                            {opens && <ChevronRight aria-hidden className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                          </button>
                        );
                      })}
                  {(isList ? shownOptions : shownRows).length === 0 && (
                    <p className="px-2.5 py-3 text-center text-[11px] text-slate-400">No matches</p>
                  )}
                  <div className="h-1" />
                </div>
              </div>
            );
          })}
        </div>,
        document.body,
      )
    : null;

  return (
    <div ref={rootRef} className={cn('inline-flex', className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? close() : (setOpen(true), (focusNext.current = { level: 0 })))}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
          open || total > 0
            ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/50 dark:bg-indigo-500/15 dark:text-indigo-200'
            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
        )}
      >
        {icon ?? <ListFilter aria-hidden className="h-3.5 w-3.5" />}
        {label}
        {total > 0 && (
          <span className="rounded-full bg-indigo-600 px-1.5 text-[10px] font-semibold leading-4 text-white dark:bg-indigo-400 dark:text-slate-900">
            {total}
          </span>
        )}
      </button>
      {layer}
    </div>
  );
}
