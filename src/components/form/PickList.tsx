'use client';

import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUp,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/cn';

export type PickListValue<T> = { source: T[]; target: T[] };

/**
 * Two lists with transfer controls between them — pick some of a set, and order
 * what you picked.
 *
 * CONTROLLED on `{ source, target }` as one value rather than two, because every
 * operation here moves an item between them: two props would let a caller update
 * one and forget the other, and the failure mode is an item existing in both
 * lists or in neither.
 *
 * Selection is per-list and INTERNAL. It is a transient pointer at rows you are
 * about to move, not part of the value — hoisting it would make every consumer
 * hold state it never reads. Clicking toggles; Shift-click extends a run, which
 * is the whole reason a list like this beats a set of checkboxes.
 *
 * Reordering applies to the TARGET only, and is opt-in. Order rarely means
 * anything on the left ("everything you have not picked") and almost always
 * means something on the right ("the order these will run in").
 */
export default function PickList<T>({
  value,
  onChange,
  getId,
  renderItem,
  sourceHeader = 'Available',
  targetHeader = 'Selected',
  filterable = false,
  reorderable = true,
  emptyLabel = 'Nothing here',
  listClassName = 'h-64',
  className,
}: {
  value: PickListValue<T>;
  onChange: (next: PickListValue<T>) => void;
  getId: (item: T) => string | number;
  /** Row content. Falls back to `String(item)` when omitted. */
  renderItem?: (item: T) => React.ReactNode;
  sourceHeader?: React.ReactNode;
  targetHeader?: React.ReactNode;
  filterable?: boolean;
  /** Reorder controls beside the target list. */
  reorderable?: boolean;
  emptyLabel?: string;
  /** Height of each list box. Both lists share it so the columns line up. */
  listClassName?: string;
  className?: string;
}) {
  const [selected, setSelected] = useState<{ source: Array<string | number>; target: Array<string | number> }>({
    source: [],
    target: [],
  });
  const [anchor, setAnchor] = useState<{ source: number | null; target: number | null }>({
    source: null,
    target: null,
  });
  const [query, setQuery] = useState({ source: '', target: '' });

  const label = (item: T) => (renderItem ? renderItem(item) : String(item));
  const text = (item: T) => String(renderItem ? '' : item) || String(getId(item));

  const shown = (side: 'source' | 'target') => {
    const q = query[side].trim().toLowerCase();
    const list = value[side];
    if (!q) return list;
    return list.filter((i) => `${text(i)} ${String(getId(i))}`.toLowerCase().includes(q));
  };

  const click = (side: 'source' | 'target', index: number, item: T, shift: boolean) => {
    const list = shown(side);
    const id = getId(item);
    const start = anchor[side];

    if (shift && start !== null) {
      const [a, b] = start < index ? [start, index] : [index, start];
      const run = list.slice(a, b + 1).map(getId);
      setSelected({ ...selected, [side]: [...new Set([...selected[side], ...run])] });
      return;
    }

    setAnchor({ ...anchor, [side]: index });
    setSelected({
      ...selected,
      [side]: selected[side].includes(id) ? selected[side].filter((s) => s !== id) : [...selected[side], id],
    });
  };

  /** Moving always clears the selection on the side items left — they are gone. */
  const move = (from: 'source' | 'target', ids: Array<string | number>) => {
    if (ids.length === 0) return;
    const to = from === 'source' ? 'target' : 'source';
    const set = new Set(ids);
    const moving = value[from].filter((i) => set.has(getId(i)));
    onChange({
      ...value,
      [from]: value[from].filter((i) => !set.has(getId(i))),
      [to]: [...value[to], ...moving],
    } as PickListValue<T>);
    setSelected({ ...selected, [from]: [] });
  };

  /**
   * Reorder within the target.
   *
   * Selected rows move as a BLOCK and keep their relative order; a step stops at
   * the edge rather than wrapping. `to`/`bottom` lift the whole block out and
   * reinsert it, which is what makes a multi-row jump land contiguously instead
   * of interleaving with what it passed.
   */
  const reorder = (direction: 'top' | 'up' | 'down' | 'bottom') => {
    const ids = new Set(selected.target);
    if (ids.size === 0) return;
    const list = value.target;
    const picked = list.filter((i) => ids.has(getId(i)));
    const rest = list.filter((i) => !ids.has(getId(i)));

    if (direction === 'top') return onChange({ ...value, target: [...picked, ...rest] });
    if (direction === 'bottom') return onChange({ ...value, target: [...rest, ...picked] });

    const next = [...list];
    const indexes = next.map((i, n) => (ids.has(getId(i)) ? n : -1)).filter((n) => n >= 0);
    // Step the leading edge first, or rows overwrite each other mid-run.
    const ordered = direction === 'up' ? indexes : [...indexes].reverse();
    for (const at of ordered) {
      const swap = direction === 'up' ? at - 1 : at + 1;
      if (swap < 0 || swap >= next.length || ids.has(getId(next[swap]))) continue;
      [next[at], next[swap]] = [next[swap], next[at]];
    }
    onChange({ ...value, target: next });
  };

  const List = ({ side, header }: { side: 'source' | 'target'; header: React.ReactNode }) => {
    const items = shown(side);
    return (
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="panel-title">{header}</span>
          <span className="text-[10px] text-slate-400">{value[side].length}</span>
        </div>

        {filterable && (
          <div className="relative mb-1.5">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={query[side]}
              onChange={(e) => setQuery({ ...query, [side]: e.target.value })}
              placeholder="Filter…"
              aria-label={`Filter ${side} list`}
              className="field-input pl-8"
            />
          </div>
        )}

        <ul
          className={cn(
            'custom-scrollbar overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700',
            listClassName,
          )}
        >
          {items.length === 0 ? (
            <li className="px-3 py-2 text-[11px] text-slate-400">{emptyLabel}</li>
          ) : (
            items.map((item, index) => {
              const id = getId(item);
              const on = selected[side].includes(id);
              return (
                <li key={id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={(e) => click(side, index, item, e.shiftKey)}
                    className={cn(
                      'flex w-full items-center px-3 py-1.5 text-left text-xs transition-colors',
                      on
                        ? 'bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/60',
                    )}
                  >
                    {label(item)}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    );
  };

  const ctrl =
    'rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800';

  return (
    <div className={cn('flex items-stretch gap-3', className)}>
      <List side="source" header={sourceHeader} />

      <div className="flex shrink-0 flex-col justify-center gap-1.5">
        <button onClick={() => move('source', selected.source)} disabled={selected.source.length === 0} className={ctrl} aria-label="Move selected to target">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => move('source', value.source.map(getId))} disabled={value.source.length === 0} className={ctrl} aria-label="Move all to target">
          <ChevronsRight className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => move('target', selected.target)} disabled={selected.target.length === 0} className={ctrl} aria-label="Move selected to source">
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => move('target', value.target.map(getId))} disabled={value.target.length === 0} className={ctrl} aria-label="Move all to source">
          <ChevronsLeft className="h-3.5 w-3.5" />
        </button>
      </div>

      <List side="target" header={targetHeader} />

      {reorderable && (
        <div className="flex shrink-0 flex-col justify-center gap-1.5">
          {(
            [
              ['top', ChevronsUp, 'Move to top'],
              ['up', ChevronUp, 'Move up'],
              ['down', ChevronDown, 'Move down'],
              ['bottom', ChevronsDown, 'Move to bottom'],
            ] as const
          ).map(([dir, Icon, aria]) => (
            <button
              key={dir}
              onClick={() => reorder(dir)}
              disabled={selected.target.length === 0}
              className={ctrl}
              aria-label={aria}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
