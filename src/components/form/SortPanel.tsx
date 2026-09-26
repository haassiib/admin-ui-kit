'use client';

/* Origin: ticket-management (96S2) `tickets/SortPanel.tsx`. */

import { useEffect, useRef, useState } from 'react';
import { ArrowUpDown, GripVertical, Plus, X } from 'lucide-react';
import { MAX_SORT_LEVELS, SORT_DIRECTION_LABELS, type SortKind, type SortLevel } from '@/lib/sort';
import { cn } from '@/lib/cn';
import {
  PANEL_EMPTY_CLASS,
  PANEL_GRIP_CLASS,
  PANEL_REMOVE_CLASS,
  TOOLBAR_BADGE_CLASS,
  TOOLBAR_PANEL_CLASS,
  panelAddButtonClass,
  segmentClass,
  toolbarButtonClass,
} from '@/lib/toolbar';
import { useDismiss } from '@/lib/use-dismiss';
import { InfoTooltip } from '@/components/overlay/Tooltip';
import SortableList from '@/components/table/SortableList';

/** A sortable column, as the panel needs to name it. */
export type SortableColumn = { key: string; label: string; kind?: SortKind };

/**
 * Sort by several columns at once, each with its own direction — the Lark
 * Base sort builder.
 *
 * ── The direction control says what it MEANS ────────────────────────────────
 *
 * "A → Z" on a name, "Old → New" on a date, never "asc/desc". The direction of
 * a sort is the one thing a person double-checks, and asc/desc makes them
 * translate it against the column's type every time. A column's `kind` is
 * where that lives (`SORT_DIRECTION_LABELS` in `lib/sort`), so the label and
 * the comparison are derived from one fact.
 *
 * ── A DRAFT, and an Apply button ────────────────────────────────────────────
 *
 * Nothing reaches `onChange` until Apply is clicked; closing any other way —
 * outside click, Escape, the trigger again — reverts the draft. Dragging
 * reorders the LEVELS, and the order is the whole meaning: status-then-date
 * and date-then-status are different views of the same rows.
 */
export default function SortPanel({
  sorts,
  columns,
  onChange,
  title = 'Sort by',
  width = 420,
  className,
}: {
  sorts: SortLevel[];
  columns: SortableColumn[];
  onChange: (sorts: SortLevel[]) => void;
  title?: string;
  width?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<SortLevel[]>(sorts);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(sorts);
  }, [sorts]);

  const revertAndClose = () => {
    setDraft(sorts);
    setOpen(false);
  };
  useDismiss(root, open, revertAndClose);

  const apply = () => {
    onChange(draft);
    setOpen(false);
  };

  const byKey = new Map(columns.map((c) => [c.key, c]));
  /** A column already sorted on would be a level that can never break a tie. */
  const unused = columns.filter((c) => !draft.some((s) => s.key === c.key));

  const setAt = (i: number, patch: Partial<SortLevel>) =>
    setDraft((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  const label = sorts.length
    ? `Sorted by ${sorts.map((s) => byKey.get(s.key)?.label ?? s.key).join(', then ')}`
    : 'Sort';

  return (
    <div ref={root} className={cn('relative inline-block', className)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        title={label}
        onClick={() => (open ? revertAndClose() : setOpen(true))}
        className={toolbarButtonClass(open || sorts.length > 0)}
      >
        <ArrowUpDown className="h-4 w-4" aria-hidden />
        {sorts.length > 0 && <span className={TOOLBAR_BADGE_CLASS}>{sorts.length}</span>}
      </button>

      {open && (
        <div style={{ width }} className={TOOLBAR_PANEL_CLASS}>
          <p className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-200">{title}</p>

          {draft.length === 0 && <p className={PANEL_EMPTY_CLASS}>Not sorted. Rows appear in the order they arrived.</p>}

          <SortableList
            group="sort-levels"
            items={draft}
            getId={(s) => s.key}
            onReorder={setDraft}
            className="space-y-1.5"
            renderItem={(s, { isDragging, handleProps }) => {
              const i = draft.findIndex((x) => x.key === s.key);
              const labels = SORT_DIRECTION_LABELS[byKey.get(s.key)?.kind ?? 'text'];
              return (
                <div className={cn('flex items-center gap-1.5 rounded', isDragging && 'bg-slate-100 dark:bg-slate-700')}>
                  <button type="button" aria-label="Drag to reorder this sort level" {...handleProps} className={PANEL_GRIP_CLASS}>
                    <GripVertical className="h-3.5 w-3.5" aria-hidden />
                  </button>

                  <span className="w-8 shrink-0 text-right text-[11px] text-slate-400">{i === 0 ? 'By' : 'then'}</span>

                  <select value={s.key} onChange={(e) => setAt(i, { key: e.target.value })} className="field-input min-w-0 flex-1 py-1.5 text-xs">
                    {columns
                      .filter((c) => c.key === s.key || unused.some((u) => u.key === c.key))
                      .map((c) => (
                        <option key={c.key} value={c.key}>{c.label}</option>
                      ))}
                  </select>

                  <div className="flex shrink-0 overflow-hidden rounded-lg border border-slate-300 dark:border-slate-700">
                    {(['asc', 'desc'] as const).map((dir) => (
                      <button key={dir} type="button" onClick={() => setAt(i, { dir })} className={segmentClass(s.dir === dir)}>
                        {labels[dir]}
                      </button>
                    ))}
                  </div>

                  <button type="button" aria-label="Remove this sort level" onClick={() => setDraft((prev) => prev.filter((_, j) => j !== i))} className={PANEL_REMOVE_CLASS}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            }}
          />

          <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-2 dark:border-slate-700">
            <button
              type="button"
              onClick={() => unused[0] && setDraft((prev) => [...prev, { key: unused[0].key, dir: 'asc' }])}
              disabled={draft.length >= MAX_SORT_LEVELS || unused.length === 0}
              className={panelAddButtonClass()}
            >
              <Plus className="h-3.5 w-3.5" /> Add a level
            </button>
            {draft.length >= MAX_SORT_LEVELS && <InfoTooltip content={`${MAX_SORT_LEVELS} levels is the limit.`} label="Why can't I add more?" iconClassName="w-3 h-3" />}
            {draft.length > 0 && (
              <button type="button" onClick={() => setDraft([])} className="ml-auto btn-ghost text-xs">
                Clear sort
              </button>
            )}
            <button type="button" onClick={apply} className="ml-auto btn-primary">
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
