'use client';

import { useRef, useState } from 'react';
import { Eye, EyeOff, GripVertical, Lock, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { FieldType } from '@/lib/fields';
import { TOOLBAR_BADGE_CLASS, toolbarButtonClass } from '@/lib/toolbar';
import { useDismiss } from '@/lib/use-dismiss';
import SortableList from '@/components/table/SortableList';
import { FieldTypeIcon } from './FieldEditor';

/** A column as the panel needs to name it. */
export type FieldColumn = {
  key: string;
  label: string;
  /** Drives the icon beside the name. Absent, the row has none. */
  type?: FieldType;
  /** The primary column: pinned first, always shown, set apart by a divider. */
  locked?: boolean;
  /** A column whose TYPE the app owns — shown with a lock. Its name and
   *  options can still be edited, and it can be hidden and moved. */
  fixed?: boolean;
};

/**
 * How a view lays its columns out, as overrides on the caller's column array:
 * an order, the keys it hides, and the labels it renames. Empty means "as
 * declared", so a column added later appears without anybody migrating a
 * saved view to mention it.
 */
export type FieldLayout = {
  order: string[];
  hidden: string[];
  labels: Record<string, string>;
};

export const EMPTY_LAYOUT: FieldLayout = { order: [], hidden: [], labels: {} };

/**
 * The columns in layout order: locked ones first, then the ones the layout
 * names, then any it does not know about in declared order. Unknown keys in
 * `order` are dropped — a column removed from the code must not leave a hole.
 */
export function arrangeColumns<C extends { key: string; locked?: boolean }>(columns: C[], layout: FieldLayout): C[] {
  const byKey = new Map(columns.map((c) => [c.key, c]));
  const locked = columns.filter((c) => c.locked);
  const named = layout.order.map((k) => byKey.get(k)).filter((c): c is C => !!c && !c.locked);
  const rest = columns.filter((c) => !c.locked && !layout.order.includes(c.key));
  return [...locked, ...named, ...rest];
}

/**
 * The Lark Base "Fields" panel — a searchable list of every column with its
 * type icon, an eye to show or hide it, a grip to reorder it, and "New field"
 * at the foot.
 *
 * ── Commits immediately ─────────────────────────────────────────────────────
 *
 * An eye is one deliberate act with one visible outcome: the column appears
 * or goes. A draft here would mean toggling an eye and watching nothing
 * happen until Apply. The same goes for a drag.
 *
 * ── Opening a field ─────────────────────────────────────────────────────────
 *
 * Clicking a name (`onEdit`) and "New field" (`onNewField`) hand back the
 * panel's own rect, so the caller can open the field editor BESIDE it. The
 * panel stays open while that form is in use — a click in the form is not a
 * click outside the panel — and one Escape closes the form, not both.
 *
 * ── Searching ───────────────────────────────────────────────────────────────
 *
 * A wide table can have forty columns; the box narrows the list by name.
 * Dragging is off while it is narrowed, because a drop between two rows of a
 * filtered list has no honest position in the full one.
 */
export default function FieldsPanel({
  columns,
  layout,
  onChange,
  onEdit,
  onNewField,
  title = 'Fields',
  width = 320,
  className,
}: {
  columns: FieldColumn[];
  layout: FieldLayout;
  onChange: (layout: FieldLayout) => void;
  /** A name was clicked. The rect is the panel's, for placing an editor beside it. */
  onEdit?: (key: string, panel: DOMRect) => void;
  /** Present, the foot offers "New field". */
  onNewField?: (panel: DOMRect) => void;
  title?: string;
  width?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const close = () => {
    setOpen(false);
    setQuery('');
  };
  useDismiss(root, open, close, close, true);

  const labelOf = (c: FieldColumn) => layout.labels[c.key] || c.label;
  const arranged = arrangeColumns(columns, layout);
  const locked = arranged.filter((c) => c.locked);
  const movable = arranged.filter((c) => !c.locked);
  const hiddenCount = layout.hidden.filter((k) => movable.some((c) => c.key === k)).length;

  const needle = query.trim().toLowerCase();
  const matches = (c: FieldColumn) => !needle || labelOf(c).toLowerCase().includes(needle);

  const toggle = (key: string) =>
    onChange({ ...layout, hidden: layout.hidden.includes(key) ? layout.hidden.filter((k) => k !== key) : [...layout.hidden, key] });

  const rect = () => panel.current!.getBoundingClientRect();

  const row = (c: FieldColumn, handleProps?: { onPointerDown: () => void; onPointerUp: () => void }, dragging = false) => {
    const hidden = !c.locked && layout.hidden.includes(c.key);
    const editable = Boolean(onEdit);
    return (
      <div
        className={cn(
          'group/field relative flex items-center gap-2 rounded-lg py-1.5 pl-6 pr-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60',
          dragging && 'bg-slate-100 dark:bg-slate-700',
        )}
      >
        {handleProps && (
          <button
            type="button"
            aria-label={`Drag to reorder ${labelOf(c)}`}
            {...handleProps}
            className="absolute left-0.5 top-1/2 -translate-y-1/2 cursor-grab touch-none rounded p-0.5 text-slate-300 opacity-0 hover:text-slate-500 group-hover/field:opacity-100 active:cursor-grabbing dark:text-slate-600"
          >
            <GripVertical className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
        {c.type && <FieldTypeIcon type={c.type} className={cn('h-4 w-4 shrink-0', hidden ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400')} />}
        <button
          type="button"
          disabled={!editable}
          onClick={() => onEdit?.(c.key, rect())}
          title={editable ? `Edit ${labelOf(c)}` : undefined}
          className={cn(
            'flex min-w-0 items-center gap-1.5 text-left text-xs',
            hidden ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200',
            editable && 'hover:text-indigo-600 dark:hover:text-indigo-300',
          )}
        >
          <span className="truncate">{labelOf(c)}</span>
          {(c.locked || c.fixed) && (
            <Lock
              className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600"
              aria-label={c.locked ? 'Primary column — always shown' : 'Type set by the app'}
            />
          )}
        </button>
        <button
          type="button"
          disabled={c.locked}
          aria-label={c.locked ? `${labelOf(c)} is always shown` : hidden ? `Show ${labelOf(c)}` : `Hide ${labelOf(c)}`}
          aria-pressed={!hidden}
          title={c.locked ? 'Always shown' : hidden ? 'Show' : 'Hide'}
          onClick={() => toggle(c.key)}
          className={cn(
            'ml-auto shrink-0 rounded p-1 hover:bg-slate-100 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:hover:bg-slate-700',
            c.locked ? 'text-indigo-200 dark:text-indigo-500/40' : hidden ? 'text-slate-300 dark:text-slate-600' : 'text-indigo-500 dark:text-indigo-400',
          )}
        >
          {hidden ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </button>
      </div>
    );
  };

  const shownMovable = movable.filter(matches);
  const label = hiddenCount ? `${title}, ${hiddenCount} hidden` : title;

  return (
    <div ref={root} className={cn('relative inline-block', className)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        title={label}
        onClick={() => (open ? close() : setOpen(true))}
        className={toolbarButtonClass(open || hiddenCount > 0)}
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
        {hiddenCount > 0 && <span className={TOOLBAR_BADGE_CLASS}>{hiddenCount}</span>}
      </button>

      {open && (
        <div
          ref={panel}
          // An obstacle for an AnchoredPanel's placement, so the field editor
          // opens beside this panel rather than over it.
          data-overlay="menu"
          style={{ width }}
          className="absolute left-0 top-full z-50 mt-1 flex max-h-[min(36rem,80vh)] max-w-[calc(100vw-2rem)] origin-top-left flex-col overflow-hidden panel panel-solid p-0 animate-scale-in"
        >
          <div className="shrink-0 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search columns"
                aria-label="Search columns"
                className="field-input py-1.5 pl-8 text-xs"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-1">
            {locked.filter(matches).map((c) => (
              <div key={c.key}>{row(c)}</div>
            ))}
            {locked.some(matches) && shownMovable.length > 0 && <div className="my-1 border-t border-slate-100 dark:border-slate-700" />}
            {needle ? (
              shownMovable.map((c) => <div key={c.key}>{row(c)}</div>)
            ) : (
              <SortableList
                group="field-layout"
                items={movable}
                getId={(c) => c.key}
                onReorder={(next) => onChange({ ...layout, order: next.map((c) => c.key) })}
                renderItem={(c, { isDragging, handleProps }) => row(c, handleProps, isDragging)}
              />
            )}
            {needle && shownMovable.length === 0 && !locked.some(matches) && (
              <p className="px-2 py-4 text-center text-xs text-slate-400">No column matches “{query.trim()}”.</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 border-t border-slate-100 px-2 py-1.5 dark:border-slate-700">
            {onNewField && (
              <button
                type="button"
                onClick={() => onNewField(rect())}
                className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
              >
                <Plus className="h-4 w-4" aria-hidden /> New field
              </button>
            )}
            {hiddenCount > 0 && (
              <button type="button" onClick={() => onChange({ ...layout, hidden: [] })} className="ml-auto btn-ghost text-xs">
                Show all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
