'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDown, ArrowUp, Check, ChevronDown, ChevronUp, EyeOff, ExternalLink, FoldVertical, Group, Layers, Maximize2, Pencil, Pin, PinOff, Plus, Search, Snowflake, UnfoldVertical, X, ArrowLeftToLine, ArrowRightToLine, ArrowDownAZ, ArrowUpZA } from 'lucide-react';
import { cn } from '@/lib/cn';
import { filterRows, type Condition, type FilterField, type FilterFieldOption, type FilterKind, type MatchMode, type RowReader } from '@/lib/conditions';
import { resolveRowColors, type ColorRule } from '@/lib/coloring';
import { applyCollapse, flattenGroups, headerIds, type GroupLevel } from '@/lib/grouping';
import { SORT_DIRECTION_LABELS, sortRowsBy, type SortKind, type SortLevel } from '@/lib/sort';
import { CELL_TINT, ROW_TINT } from '@/lib/tones';
import { coerceValue, fieldTypeOfKind, isMultiType, kindOfFieldType, type FieldDef, type FieldType } from '@/lib/fields';
import { useDismiss } from '@/lib/use-dismiss';
import EmptyState from '@/components/layout/EmptyState';
import OptionPill, { OptionPills, optionTone } from '@/components/data/OptionPill';
import FilterPanel from '@/components/form/FilterPanel';
import GroupPanel from '@/components/form/GroupPanel';
import SortPanel from '@/components/form/SortPanel';
import ColorRulesPanel from '@/components/form/ColorRulesPanel';
import FieldsPanel, { EMPTY_LAYOUT, arrangeColumns, type FieldLayout } from '@/components/form/FieldsPanel';
import FieldEditor, { FieldTypeIcon } from '@/components/form/FieldEditor';
import type { Anchor } from '@/components/overlay/AnchoredPanel';
import Drawer from '@/components/overlay/Drawer';
import Tabs from '@/components/layout/Tabs';
import { relativeTime } from '@/lib/events';
import { initialsFor } from '@/lib/initials';
import GroupBandRow from './GroupBandRow';

/**
 * One column of the grid. `kind` decides the filter operators, the sort
 * comparison, the grouping key, the default cell AND the editor — one fact,
 * five behaviours.
 */
export type GridColumn<T> = {
  key: string;
  label: string;
  kind: FilterKind;
  /**
   * The finer field type, for the header icon, the cell (a currency has two
   * decimals, a URL is a link) and the field editor. Optional: a column
   * declared with only a `kind` gets a type inferred from it, and the editor
   * then shows that type as fixed. `columnFromField` always sets it.
   */
  type?: FieldType;
  /** Fixed choices for a `select` or `ref` column: the value picker in the
   *  filter, the pills in the cell, the editor's list, and the ORDER bands
   *  and sorts follow. */
  options?: FilterFieldOption[];
  /** The raw value: what filter, sort, group and colour rules read, and what
   *  the default cell renders. An array is a multi-select. */
  value: (row: T) => unknown;
  /**
   * Writes a value back into a row and returns the new row. Present — and
   * with `onRowChange` on the grid — the column is EDITABLE: double-click,
   * Enter or typing on a selected cell opens an editor chosen by `kind`. The
   * grid never mutates a row; it hands the caller the replacement.
   */
  set?: (row: T, value: unknown) => T;
  /** A custom cell. Absent, the value is rendered by kind. */
  cell?: (row: T) => ReactNode;
  /** Pixels. Columns are fixed-width, as in Lark Base, so a long value clips
   *  inside its cell rather than reflowing the whole table. */
  width?: number;
  align?: 'left' | 'right';
  sortable?: boolean;
  groupable?: boolean;
};

/** One recorded edit: which field of which row went from what to what, when, and by whom. */
export type HistoryEntry = {
  id: string;
  rowId: string | number;
  field: string;
  label: string;
  from: unknown;
  to: unknown;
  /** ISO timestamp. */
  at: string;
  by?: string;
};

/** Everything a saved view holds. */
export type GridView = {
  /** A table, or a board of cards stacked by a single-select column. Default `grid`. */
  mode?: 'grid' | 'board';
  /** The single-select column a board stacks its lanes by. */
  boardBy?: string;
  conditions: Condition[];
  match: MatchMode;
  groups: GroupLevel[];
  sorts: SortLevel[];
  colors: ColorRule[];
  /** Column order, hidden columns and renamed labels. Optional so a view
   *  saved before columns could be arranged still loads as "as declared". */
  fields?: FieldLayout;
  /** How many data columns are frozen at the left, the primary included. Default 1. */
  frozen?: number;
  /** Columns frozen at the RIGHT edge, in order. They sit after every other column. */
  frozenEnd?: string[];
  /** Row ids pinned to the top, in pin order. They stay put while the rest scroll. */
  pinnedRows?: (string | number)[];
  /** Widths the reader dragged, in pixels, keyed by column. Beats the column's own `width`. */
  widths?: Record<string, number>;
};

export const EMPTY_VIEW: GridView = { conditions: [], match: 'all', groups: [], sorts: [], colors: [], fields: EMPTY_LAYOUT };

const DEFAULT_WIDTH = 160;
const INDEX_WIDTH = 64;
const ADD_WIDTH = 44;
const MIN_WIDTH = 60;
const MAX_WIDTH = 800;

/** A frozen cell's surface. Opaque, or the cells scrolling under it show through. */
const FROZEN = 'sticky bg-slate-50 dark:bg-slate-900';
/** The right edge of the frozen block, so where it ends reads at a glance. */
const FROZEN_EDGE = 'border-r border-slate-200 shadow-[2px_0_4px_-2px_rgba(15,23,42,0.08)] dark:border-slate-700';
const FROZEN_END_EDGE = 'border-l border-slate-200 shadow-[-2px_0_4px_-2px_rgba(15,23,42,0.08)] dark:border-slate-700';

type CellAddress = { rowId: string | number; key: string };

/**
 * A Lark Base style grid: the view bar (search, fields, filter, group, sort,
 * colour) over a table with frozen first column, group bands that collapse,
 * conditional row and cell tints, and in-place cell editing — all evaluated
 * in the browser over the rows in hand.
 *
 * ── What it owns and what it does not ───────────────────────────────────────
 *
 * The VIEW (filter, groups, sorts, colours, column layout) is controlled when
 * `view` and `onViewChange` are passed — the caller persists it, keys it to
 * a URL, or shares it between grids — and internal otherwise. The ROWS are
 * always the caller's: an edit calls `onRowChange` with the replacement row
 * that the column's `set` built, and the caller decides whether that is a
 * state update, an optimistic save, or a rejection. A record is opened
 * through `onRowOpen`, which the caller answers with whatever surface fits —
 * a Drawer for a full record, an `AnchoredPanel` for a quick edit.
 *
 * ── Editing ─────────────────────────────────────────────────────────────────
 *
 * A click on an editable cell SELECTS it and opens its editor at once
 * (`editOn="click"`, the default); `editOn="doubleClick"` makes a click only
 * select, the spreadsheet way. Either way the arrow keys and Tab move the
 * selection, Enter or F2 edits the selected cell, and a printable key edits
 * it seeded with that character — the first keystroke both opens and types. The editor is chosen by kind: an
 * input for text, number and date; a list for a select (a checklist when
 * the value is an array); a checkbox toggles on click with no editor at all.
 * Enter and blur commit, Escape cancels, Delete clears. Only a column with
 * `set` is editable, so a computed column stays read-only by omission rather
 * than by a flag.
 *
 * ── One evaluator ───────────────────────────────────────────────────────────
 *
 * Filter conditions and colouring rules are the same predicate
 * (`lib/conditions`' `matches`) with a different consequence, so a rule that
 * filters a row and a rule that tints it cannot disagree about what
 * "contains" means. Sorting and grouping read the same column `value`, with
 * a `select` column ranked by its OPTION ORDER — so bands appear in the order
 * the options were defined, which is the order somebody chose, rather than
 * alphabetically.
 *
 * ── Arranging columns ───────────────────────────────────────────────────────
 *
 * The Fields panel (and "Hide column" in a header's menu) reorders, hides and
 * renames columns as part of the VIEW, never by editing `columns`. The first
 * declared column is the primary one: it cannot be hidden or moved, because
 * it is the frozen column that names each row. A hidden column is still
 * offered to filter, sort and group — hiding is about what you look at, not
 * what the view may ask — but search reads only what is on screen, or a row
 * would match on text nobody can see.
 *
 * ── Frozen columns and tints ────────────────────────────────────────────────
 *
 * The index column and the first data column are sticky. A sticky cell needs
 * an opaque background or the cells scrolling under it show through, which
 * means a ROW tint does not reach the frozen columns; the same trade the
 * reference makes.
 */
export default function BaseGrid<T>({
  columns,
  rows,
  getRowId,
  view: controlledView,
  onViewChange,
  defaultView,
  search = true,
  onRowOpen,
  onRowChange,
  editOn = 'click',
  onFieldAdd,
  onFieldChange,
  onFieldDelete,
  history: controlledHistory,
  onHistoryAdd,
  actor = 'You',
  toolbarEnd,
  noun = 'record',
  maxHeight = 520,
  className,
}: {
  columns: GridColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string | number;
  /** Controlled view state. Pass with `onViewChange`, or leave both out. */
  view?: GridView;
  onViewChange?: (view: GridView) => void;
  /** The starting view when uncontrolled. */
  defaultView?: Partial<GridView>;
  /** The search box, across every text and select column. */
  search?: boolean;
  /**
   * A row's open affordance, for a caller with its own record surface.
   * Absent, and with `onRowChange`, the grid opens its own record panel — a
   * drawer with every field as an editable row.
   */
  onRowOpen?: (row: T, anchor: DOMRect) => void;
  /** An edited row, as the column's `set` rebuilt it, and the row it replaces.
   *  Absent, no cell is editable. */
  onRowChange?: (next: T, prev: T) => void;
  /**
   * What opens a cell's editor. `click` (default): one click edits — the
   * fastest path when editing is the main job. `doubleClick`: a click only
   * selects, for a grid mostly read and navigated by keyboard, where a stray
   * click should not open an input.
   */
  editOn?: 'click' | 'doubleClick';
  /**
   * A field added through the "+" at the end of the header, as the editor
   * defined it. Present, the "+" shows. Turn the definition into a column
   * with `columnFromField` and append it to `columns`.
   */
  onFieldAdd?: (field: FieldDef) => void;
  /** A column's definition edited from its header menu. Present, the menu
   *  offers "Edit field". */
  onFieldChange?: (key: string, field: FieldDef) => void;
  /** Present, the field editor offers Delete (behind a confirm). */
  onFieldDelete?: (key: string) => void;
  /**
   * The change log the record panel's History and Log tabs read. Controlled
   * when passed (with `onHistoryAdd`), so a caller can load it from the
   * server and keep it across grids; kept internally otherwise, from this
   * grid's own edits.
   */
  history?: HistoryEntry[];
  onHistoryAdd?: (entry: HistoryEntry) => void;
  /** Who an edit made here is recorded as. */
  actor?: string;
  /** Right end of the view bar — a "New record" button, typically. */
  toolbarEnd?: ReactNode;
  /** What one row is called: in the count and in group bands. */
  noun?: string;
  /** The scroll box's height. The page around the grid does not scroll for it. */
  maxHeight?: number | string;
  className?: string;
}) {
  const [innerView, setInnerView] = useState<GridView>({ ...EMPTY_VIEW, ...defaultView });
  const view = controlledView ?? innerView;
  const setView = (patch: Partial<GridView>) => {
    const next = { ...view, ...patch };
    if (onViewChange) onViewChange(next);
    if (!controlledView) setInnerView(next);
  };

  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const [selected, setSelected] = useState<CellAddress | null>(null);
  const [editing, setEditing] = useState<(CellAddress & { seed?: string; via?: 'click' | 'key' }) | null>(null);
  const [fieldEditor, setFieldEditor] = useState<{ anchor: Anchor; field: FieldDef | null; typeLocked: boolean; placement: 'beside' | 'below' } | null>(null);
  const [recordId, setRecordId] = useState<string | number | null>(null);
  const [innerHistory, setInnerHistory] = useState<HistoryEntry[]>([]);
  const history = controlledHistory ?? innerHistory;
  const [dragWidth, setDragWidth] = useState<{ key: string; width: number } | null>(null);
  const [dragCol, setDragCol] = useState<string | null>(null);
  const [dropAt, setDropAt] = useState<{ key: string; side: 'before' | 'after' } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const thead = useRef<HTMLTableSectionElement>(null);
  const pinnedEls = useRef(new Map<string | number, HTMLTableRowElement>());
  const [pinTops, setPinTops] = useState<number[]>([]);

  const layout = view.fields ?? EMPTY_LAYOUT;
  const primary = columns[0]?.key;
  /** Every column, with this view's labels. What the panels name. */
  const labelled = useMemo(
    () => columns.map((c) => (layout.labels[c.key] ? { ...c, label: layout.labels[c.key] } : c)),
    [columns, layout.labels],
  );
  /** The columns on screen, in the view's order. What the table renders. */
  const shownColumns = useMemo(() => {
    const shown = arrangeColumns(labelled.map((c) => ({ ...c, locked: c.key === primary })), layout).filter(
      (c) => c.locked || !layout.hidden.includes(c.key),
    );
    // Columns frozen at the right edge leave their place and sit last, in
    // the order they were frozen.
    const end = (view.frozenEnd ?? []).filter((k) => k !== primary && shown.some((c) => c.key === k));
    return [...shown.filter((c) => !end.includes(c.key)), ...end.map((k) => shown.find((c) => c.key === k)!)];
  }, [labelled, layout, primary, view.frozenEnd]);

  const byKey = useMemo(() => new Map(labelled.map((c) => [c.key, c])), [labelled]);
  const fields: FilterField[] = useMemo(
    () => labelled.map((c) => ({ id: c.key, label: c.label, kind: c.kind, ...(c.options?.length ? { options: c.options } : {}) })),
    [labelled],
  );

  const reader = (row: T): RowReader => ({
    valueOf: (id) => byKey.get(id)?.value(row),
    kindOf: (id) => byKey.get(id)?.kind ?? 'text',
  });

  /** A select column sorts and groups by OPTION ORDER, not by label. */
  const sortValueOf = (row: T, key: string): unknown => {
    const col = byKey.get(key);
    if (!col) return undefined;
    const raw = col.value(row);
    if (col.options?.length && raw != null && raw !== '') {
      const first = Array.isArray(raw) ? raw[0] : raw;
      const at = col.options.findIndex((o) => o.value === String(first));
      return at === -1 ? col.options.length : at;
    }
    return Array.isArray(raw) ? raw.join(', ') : raw;
  };
  const sortKindOf = (key: string): SortKind => {
    const col = byKey.get(key);
    if (!col) return 'text';
    if (col.options?.length) return 'number';
    return col.kind === 'number' ? 'number' : col.kind === 'date' ? 'date' : col.kind === 'bool' ? 'boolean' : 'text';
  };

  const groupKeyOf = (row: T, by: string): string => {
    const raw = byKey.get(by)?.value(row);
    if (raw == null || raw === '') return '';
    return Array.isArray(raw) ? raw.map(String).join(', ') : String(raw);
  };
  const groupLabelOf = (by: string, key: string): string => {
    const col = byKey.get(by);
    if (key === '') return `No ${col?.label.toLowerCase() ?? 'value'}`;
    if (col?.kind === 'bool') return key === 'true' || key === '1' ? 'Checked' : 'Unchecked';
    if (col?.options?.length) {
      return key.split(', ').map((v) => col.options!.find((o) => o.value === v)?.label ?? v).join(', ');
    }
    return key;
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const searched = q
      ? rows.filter((r) =>
          shownColumns.some((c) => {
            const raw = c.value(r);
            const text = Array.isArray(raw) ? raw.join(' ') : String(raw ?? '');
            const labels = c.options?.filter((o) => (Array.isArray(raw) ? raw.map(String).includes(o.value) : String(raw) === o.value)).map((o) => o.label) ?? [];
            return [text, ...labels].some((s) => s.toLowerCase().includes(q));
          }),
        )
      : rows;
    const filtered = filterRows(searched, view.conditions, view.match, reader);
    // Group levels order the rows first, so bands are contiguous; the sort
    // levels then order rows WITHIN a band. Stable, so ties keep arrival order.
    const order: SortLevel[] = [...view.groups.map((g) => ({ key: g.by, dir: g.dir })), ...view.sorts];
    return sortRowsBy(filtered, order, sortValueOf, sortKindOf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, shownColumns, query, view]);

  // Pinned rows leave the body and sit above it, in pin order. They still
  // answer to the search and the filter: a pin keeps a row in view, it does
  // not exempt it from the question the view is asking.
  const pinnedRows = useMemo(() => {
    const byId = new Map(visible.map((r) => [getRowId(r), r]));
    return (view.pinnedRows ?? []).map((id) => byId.get(id)).filter((r): r is T => r !== undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, view.pinnedRows]);
  const bodyRows = useMemo(() => {
    const pinned = new Set(view.pinnedRows ?? []);
    return pinned.size ? visible.filter((r) => !pinned.has(getRowId(r))) : visible;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, view.pinnedRows]);

  const items = useMemo(() => flattenGroups(bodyRows, view.groups, groupKeyOf, groupLabelOf), [bodyRows, view.groups]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = useMemo(() => applyCollapse(items, collapsed), [items, collapsed]);
  const shownRows = useMemo(() => [...pinnedRows, ...shown.flatMap((i) => (i.kind === 'row' ? [i.row] : []))], [pinnedRows, shown]);
  const allIds = useMemo(() => headerIds(items), [items]);
  const allCollapsed = allIds.length > 0 && allIds.every((id) => collapsed.has(id));

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const sortOf = (key: string) => view.sorts.find((s) => s.key === key);
  const setSort = (key: string, dir: 'asc' | 'desc' | null) =>
    setView({ sorts: dir ? [{ key, dir }, ...view.sorts.filter((s) => s.key !== key)].slice(0, 3) : view.sorts.filter((s) => s.key !== key) });

  const hide = (key: string) => setView({ fields: { ...layout, hidden: [...layout.hidden.filter((k) => k !== key), key] } });

  /* ── Fields ──────────────────────────────────────────────────────────── */

  /** A column as the field editor sees it. A column with no declared `type`
   *  gets one inferred from its kind and the shape of its first value. */
  const typeOf = (col: GridColumn<T>): FieldType => col.type ?? fieldTypeOfKind(col.kind, rows.some((r) => Array.isArray(col.value(r))));
  const defOf = (col: GridColumn<T>): FieldDef => ({
    key: col.key,
    label: col.label,
    type: typeOf(col),
    ...(col.options ? { options: col.options } : {}),
  });

  const openFieldEditor = (anchor: DOMRect, col: GridColumn<T> | null, placement: 'beside' | 'below' = 'below') =>
    setFieldEditor({
      anchor: { top: anchor.top, left: anchor.left, right: anchor.right, bottom: anchor.bottom },
      field: col ? defOf(col) : null,
      typeLocked: Boolean(col && !col.type),
      placement,
    });

  /* ── Layout: widths, frozen columns, pinned rows ─────────────────────── */

  const widthOf = (col: { key: string; width?: number }) =>
    dragWidth?.key === col.key ? dragWidth.width : view.widths?.[col.key] ?? col.width ?? DEFAULT_WIDTH;
  const setWidth = (key: string, width: number | null) => {
    const next = { ...view.widths };
    if (width === null) delete next[key];
    else next[key] = Math.round(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width)));
    setView({ widths: next });
  };

  // The primary column is always frozen; the reader can freeze more.
  const endKeys = (view.frozenEnd ?? []).filter((k) => shownColumns.some((c) => c.key === k) && k !== primary);
  const endCount = endKeys.length;
  const leftGroup = shownColumns.length - endCount;
  const frozenCount = Math.max(1, Math.min(view.frozen ?? 1, leftGroup));
  const lefts = shownColumns.reduce<number[]>((acc, c, i) => [...acc, i === 0 ? INDEX_WIDTH : acc[i - 1] + widthOf(shownColumns[i - 1])], []);
  /** `right` offsets for the end-frozen columns, the last one flush with the edge. */
  const rights = shownColumns.map((_, i) => {
    if (i < leftGroup) return 0;
    let r = onFieldAdd ? ADD_WIDTH : 0;
    for (let j = i + 1; j < shownColumns.length; j += 1) r += widthOf(shownColumns[j]);
    return r;
  });
  const isEnd = (i: number) => i >= leftGroup;

  /**
   * Move a column next to another — what a header drop, "Move left/right"
   * and "Freeze at start" all come down to. The result is written as ONE
   * view change: the new order over EVERY column (hidden ones keep their
   * slots, so hiding a column later does not lose where it was), how many
   * columns are frozen at the left, and which are frozen at the right.
   *
   * Dropping INTO a frozen block freezes the column there; dragging one OUT
   * unfreezes it — the frozen edge stays where the reader can see it rather
   * than silently growing or shrinking under the drop. The primary column
   * never moves.
   */
  const place = (from: string, target: string, side: 'before' | 'after', force?: 'start') => {
    if (from === primary || from === target) return;
    const shownKeys = shownColumns.map((c) => c.key);
    const fromEnd = endKeys.includes(from);
    const targetEnd = force ? false : endKeys.includes(target);
    const fromFrozen = !fromEnd && shownKeys.indexOf(from) < frozenCount;

    const list = shownKeys.filter((k) => k !== from);
    const at = Math.max(1, list.indexOf(target) + (side === 'after' ? 1 : 0));
    list.splice(at, 0, from);

    const nextEnd = list.filter((k) => (k === from ? targetEnd : endKeys.includes(k)));
    const leftList = list.filter((k) => !nextEnd.includes(k));
    const remaining = frozenCount - (fromFrozen ? 1 : 0);
    const idx = leftList.indexOf(from);
    const inFrozen = idx !== -1 && (force === 'start' || idx < remaining || (idx === remaining && fromFrozen));
    const frozen = Math.max(1, remaining + (inFrozen ? 1 : 0));

    // Shown keys, in their new order, poured back into the slots shown
    // columns occupied in the full list — hidden columns stay where they were.
    const all = arrangeColumns(labelled.map((c) => ({ ...c, locked: c.key === primary })), layout).map((c) => c.key);
    let j = 0;
    const order = all.map((k) => (shownKeys.includes(k) ? list[j++] : k));

    setView({ fields: { ...layout, order: order.filter((k) => k !== primary) }, frozen, frozenEnd: nextEnd });
  };

  const dropColumn = (target: string, side: 'before' | 'after') => {
    const from = dragCol;
    setDragCol(null);
    setDropAt(null);
    if (from) place(from, target, side);
  };

  /** One step left or right, within the column's own group (left or end-frozen). */
  const moveColumn = (key: string, dir: -1 | 1) => {
    const i = shownColumns.findIndex((c) => c.key === key);
    const group = isEnd(i) ? [leftGroup, shownColumns.length - 1] : [1, leftGroup - 1];
    const n = i + dir;
    if (n < group[0] || n > group[1]) return;
    place(key, shownColumns[n].key, dir < 0 ? 'before' : 'after');
  };
  const freezeAtStart = (key: string) => {
    const last = shownColumns[frozenCount - 1]?.key;
    if (last) place(key, last, 'after', 'start');
  };
  const freezeAtEnd = (key: string) => {
    const i = shownColumns.findIndex((c) => c.key === key);
    setView({
      frozenEnd: [...endKeys.filter((k) => k !== key), key],
      frozen: Math.max(1, frozenCount - (i > 0 && i < frozenCount ? 1 : 0)),
    });
  };
  const unfreeze = (key: string) => {
    const i = shownColumns.findIndex((c) => c.key === key);
    if (endKeys.includes(key)) setView({ frozenEnd: endKeys.filter((k) => k !== key) });
    else if (i > 0 && i < frozenCount) setView({ frozen: Math.max(1, i) });
  };

  const pinnedIds = view.pinnedRows ?? [];
  const isPinned = (id: string | number) => pinnedIds.includes(id);
  const togglePin = (id: string | number) =>
    setView({ pinnedRows: isPinned(id) ? pinnedIds.filter((x) => x !== id) : [...pinnedIds, id] });

  /* ── Editing ─────────────────────────────────────────────────────────── */

  const canEdit = (col: GridColumn<T>) => Boolean(onRowChange && col.set);

  const commit = (row: T, col: GridColumn<T>, value: unknown) => {
    if (!onRowChange || !col.set) return;
    const next = col.set(row, value);
    if (next === row) return;
    const from = col.value(row);
    const to = col.value(next);
    onRowChange(next, row);
    // An edit that changed nothing a reader could see is not history.
    if (JSON.stringify(from ?? null) === JSON.stringify(to ?? null)) return;
    const entry: HistoryEntry = {
      id: `h${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      rowId: getRowId(row),
      field: col.key,
      label: col.label,
      from,
      to,
      at: new Date().toISOString(),
      by: actor,
    };
    if (onHistoryAdd) onHistoryAdd(entry);
    if (!controlledHistory) setInnerHistory((prev) => [entry, ...prev]);
  };

  const finishEditing = () => {
    setEditing(null);
    // Focus returns to the scroll box so the arrow keys keep working.
    box.current?.focus({ preventScroll: true });
  };

  const startEditing = (row: T, col: GridColumn<T>, seed?: string, via: 'click' | 'key' = 'key') => {
    if (!canEdit(col)) return;
    if (col.kind === 'bool') {
      // A checkbox has no editor: the act of editing IS the toggle.
      commit(row, col, !isTruthy(col.value(row)));
      return;
    }
    setEditing({ rowId: getRowId(row), key: col.key, seed, via });
  };

  // A selected cell whose row left the screen (a filter, a collapse, a hidden
  // column) drops its selection rather than pointing at nothing.
  useEffect(() => {
    if (!selected) return;
    if (!shownRows.some((r) => getRowId(r) === selected.rowId) || !shownColumns.some((c) => c.key === selected.key)) setSelected(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownRows, shownColumns]);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (editing || !selected) return;
    const rowAt = shownRows.findIndex((r) => getRowId(r) === selected.rowId);
    const colAt = shownColumns.findIndex((c) => c.key === selected.key);
    if (rowAt === -1 || colAt === -1) return;
    const row = shownRows[rowAt];
    const col = shownColumns[colAt];

    const move = (dr: number, dc: number) => {
      const nr = Math.max(0, Math.min(shownRows.length - 1, rowAt + dr));
      const nc = Math.max(0, Math.min(shownColumns.length - 1, colAt + dc));
      setSelected({ rowId: getRowId(shownRows[nr]), key: shownColumns[nc].key });
      e.preventDefault();
    };

    switch (e.key) {
      case 'ArrowUp': return move(-1, 0);
      case 'ArrowDown': return move(1, 0);
      case 'ArrowLeft': return move(0, -1);
      case 'ArrowRight': return move(0, 1);
      case 'Tab': return move(0, e.shiftKey ? -1 : 1);
      case 'Escape': setSelected(null); return;
      case 'Enter':
      case 'F2':
        e.preventDefault();
        return startEditing(row, col);
      case ' ':
        if (col.kind === 'bool') { e.preventDefault(); startEditing(row, col); }
        return;
      case 'Backspace':
      case 'Delete':
        if (canEdit(col) && col.kind !== 'bool') { e.preventDefault(); commit(row, col, Array.isArray(col.value(row)) ? [] : null); }
        return;
      default:
        // A printable key opens the editor seeded with itself.
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && canEdit(col) && (col.kind === 'text' || col.kind === 'number')) {
          e.preventDefault();
          startEditing(row, col, e.key);
        }
    }
  };

  // Each pinned row sticks just under the header and the pinned rows above
  // it. Measured rather than assumed, because the density setting decides
  // how tall a row is.
  const pinKey = pinnedRows.map(getRowId).join('|');
  useLayoutEffect(() => {
    const measure = () => {
      // One pixel under the header, so no seam of scrolling rows shows between them.
      let at = Math.max(0, (thead.current?.offsetHeight ?? 0) - 1);
      const tops = pinnedRows.map((r) => {
        const top = at;
        at += pinnedEls.current.get(getRowId(r))?.offsetHeight ?? 0;
        return top;
      });
      setPinTops((prev) => (prev.length === tops.length && prev.every((v, i) => v === tops[i]) ? prev : tops));
    };
    measure();
    if (typeof ResizeObserver === 'undefined' || !thead.current) return;
    const ro = new ResizeObserver(measure);
    ro.observe(thead.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinKey]);

  const recordRow = recordId === null ? null : rows.find((r) => getRowId(r) === recordId) ?? null;
  const openRecord = (row: T, rect: DOMRect) => {
    if (onRowOpen) onRowOpen(row, rect);
    else setRecordId(getRowId(row));
  };
  const canOpen = Boolean(onRowOpen || onRowChange);

  /* ── Board ───────────────────────────────────────────────────────────── */

  const mode = view.mode ?? 'grid';
  /** What a board can stack by: a single choice per row, so a card sits in one lane. */
  const stackable = labelled.filter((c) => c.options?.length && ['select', 'user'].includes(typeOf(c)));
  const stackBy = stackable.find((c) => c.key === view.boardBy) ?? stackable[0];

  const columnCount = shownColumns.length + 1 + (onFieldAdd ? 1 : 0);
  let rowIndex = 0;

  /** One data row — the body's, or a pinned one with its sticky `top`. */
  const renderRow = (row: T, index: number, pinTop?: number, lastPinned = false) => {
    const id = getRowId(row);
    const colors = resolveRowColors(view.colors, reader(row));
    const pinned = pinTop !== undefined;
    const pinStyle = pinned ? { top: pinTop } : {};
    return (
      <tr
        key={`${pinned ? 'p' : 'r'}:${id}`}
        ref={pinned ? (el) => { if (el) pinnedEls.current.set(id, el); else pinnedEls.current.delete(id); } : undefined}
        className={cn(
          'group/row transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60',
          !pinned && colors.row && ROW_TINT[colors.row],
          // A border does not travel with a sticky cell in a collapsed table;
          // an inset shadow does.
          lastPinned && '[&>td]:shadow-[inset_0_-2px_0_0_#c7d2fe] dark:[&>td]:shadow-[inset_0_-2px_0_0_rgba(99,102,241,0.4)]',
        )}
      >
        <td style={{ left: 0, ...pinStyle }} className={cn(FROZEN, pinned ? 'z-[6]' : 'z-[1]', '!px-0 text-center text-[11px] tabular-nums text-slate-400')}>
          <span className="flex items-center justify-center gap-0.5">
            <span className={cn('min-w-5 text-center', (onRowChange || canOpen) && 'group-hover/row:hidden')}>{index}</span>
            {pinned && <Pin className="h-3 w-3 shrink-0 text-indigo-500 group-hover/row:hidden" aria-label="Pinned" />}
            <button
              type="button"
              aria-label={pinned ? `Unpin ${noun} ${index}` : `Pin ${noun} ${index}`}
              title={pinned ? 'Unpin row' : 'Pin row to the top'}
              onClick={() => togglePin(id)}
              className="hidden h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 group-hover/row:inline-flex dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
            >
              {pinned ? <PinOff className="h-3.5 w-3.5" aria-hidden /> : <Pin className="h-3.5 w-3.5" aria-hidden />}
            </button>
            {canOpen && (
              <button
                type="button"
                aria-label={`Open ${noun} ${index}`}
                title={`Open ${noun}`}
                onClick={(e) => openRecord(row, e.currentTarget.getBoundingClientRect())}
                className="hidden h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 group-hover/row:inline-flex dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
              >
                {onRowOpen ? <ExternalLink className="h-3.5 w-3.5" aria-hidden /> : <Maximize2 className="h-3.5 w-3.5" aria-hidden />}
              </button>
            )}
          </span>
        </td>
        {shownColumns.map((c, i) => {
          const tone = colors.cells[c.key];
          const isSelected = selected?.rowId === id && selected.key === c.key;
          const isEditing = editing?.rowId === id && editing.key === c.key;
          const editable = canEdit(c);
          const frozen = i < frozenCount;
          const end = isEnd(i);
          return (
            <td
              key={c.key}
              style={{ ...(frozen ? { left: lefts[i] } : {}), ...(end ? { right: rights[i] } : {}), ...pinStyle }}
              onMouseDown={() => setSelected({ rowId: id, key: c.key })}
              onDoubleClick={() => { if (!isEditing) startEditing(row, c, undefined, 'click'); }}
              onClick={(e) => {
                if (!editable || isEditing) return;
                // A click inside a cell's own control (a link, a button in a
                // custom cell) is that control's, not an edit.
                if ((e.target as HTMLElement).closest('a, button')) return;
                if (c.kind === 'bool' || editOn === 'click') startEditing(row, c, undefined, 'click');
              }}
              className={cn(
                'truncate px-3',
                c.align === 'right' && 'text-right tabular-nums',
                (frozen || end) && cn(FROZEN, pinned ? 'z-[6]' : 'z-[1]'),
                !frozen && !end && pinned && 'sticky z-[5] bg-white dark:bg-slate-950',
                frozen && i === frozenCount - 1 && FROZEN_EDGE,
                end && i === leftGroup && FROZEN_END_EDGE,
                tone && CELL_TINT[tone],
                editable && 'cursor-cell',
                isSelected && 'ring-2 ring-inset ring-indigo-500',
              )}
              title={isEditing ? undefined : cellTitle(c, row)}
            >
              {isEditing ? (
                <CellEditor
                  column={c}
                  value={c.value(row)}
                  seed={editing?.seed}
                  via={editing?.via}
                  onCommit={(v) => { commit(row, c, v); finishEditing(); }}
                  onCancel={finishEditing}
                />
              ) : c.cell ? (
                c.cell(row)
              ) : (
                <DefaultCell column={c} row={row} />
              )}
            </td>
          );
        })}
        {onFieldAdd && (
          <td
            aria-hidden
            style={{ ...pinStyle, ...(endCount ? { right: 0 } : {}) }}
            className={cn(endCount ? cn(FROZEN, pinned ? 'z-[6]' : 'z-[1]') : pinned && 'sticky z-[5] bg-white dark:bg-slate-950')}
          />
        )}
      </tr>
    );
  };

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      {/* THE VIEW BAR. Every control is tinted while it is doing something, so
          "what is this view showing me" is a single look. */}
      <div className="flex flex-wrap items-center gap-1.5 pb-2">
        {search && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search rows"
              className="field-input h-8 w-48 py-1 pl-8 pr-7 text-xs"
            />
            {query && (
              <button type="button" aria-label="Clear search" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
        <FieldsPanel
          columns={columns.map((c) => ({ key: c.key, label: c.label, type: typeOf(c), locked: c.key === primary, fixed: !c.type }))}
          layout={layout}
          onChange={(next) => setView({ fields: next })}
          onEdit={onFieldChange ? (key, rect) => { const col = columns.find((c) => c.key === key); if (col) openFieldEditor(rect, col, 'beside'); } : undefined}
          onNewField={onFieldAdd ? (rect) => openFieldEditor(rect, null, 'beside') : undefined}
        />
        <FilterPanel fields={fields} conditions={view.conditions} match={view.match} onApply={(conditions, match) => setView({ conditions, match })} />
        {mode === 'board' && stackable.length > 0 && (
          <label className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            Stack by
            <select
              value={stackBy?.key}
              onChange={(e) => setView({ boardBy: e.target.value })}
              className="field-input h-8 w-auto py-1 text-xs"
            >
              {stackable.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </label>
        )}
        {mode === 'grid' && <GroupPanel
          levels={view.groups}
          onChange={(groups) => setView({ groups })}
          options={labelled.filter((c) => c.groupable !== false).map((c) => c.key)}
          labelOf={(key) => byKey.get(key)?.label ?? key}
          requireApply
        />}
        <SortPanel
          sorts={view.sorts}
          columns={labelled.filter((c) => c.sortable !== false).map((c) => ({ key: c.key, label: c.label, kind: sortKindOf(c.key) }))}
          onChange={(sorts) => setView({ sorts })}
        />
        <ColorRulesPanel fields={fields} rules={view.colors} onChange={(colors) => setView({ colors })} />
        {mode === 'grid' && view.groups.length > 0 && (
          <button
            type="button"
            onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(allIds))}
            title={allCollapsed ? 'Expand all groups' : 'Collapse all groups'}
            aria-label={allCollapsed ? 'Expand all groups' : 'Collapse all groups'}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-100"
          >
            {allCollapsed ? <UnfoldVertical className="h-4 w-4" aria-hidden /> : <FoldVertical className="h-4 w-4" aria-hidden />}
          </button>
        )}
        <span className="ml-auto text-[11px] text-slate-500 dark:text-slate-400">
          {visible.length === rows.length ? `${rows.length} ${noun}${rows.length === 1 ? '' : 's'}` : `${visible.length} of ${rows.length} ${noun}s`}
        </span>
        {toolbarEnd}
      </div>

      <div
        ref={box}
        tabIndex={0}
        onKeyDown={onKeyDown}
        style={{ maxHeight }}
        className="min-h-0 overflow-auto rounded-xl border border-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-slate-700"
      >
        {mode === 'board' ? (
          stackBy ? (
            <Board
              rows={visible}
              stack={stackBy}
              cardColumns={shownColumns.filter((c) => c.key !== primary && c.key !== stackBy.key).slice(0, 4)}
              primary={shownColumns[0]}
              getRowId={getRowId}
              tintOf={(row) => resolveRowColors(view.colors, reader(row)).row}
              canMove={canEdit(stackBy)}
              onMove={(row, value) => commit(row, stackBy, value)}
              onOpen={canOpen ? openRecord : undefined}
              noun={noun}
            />
          ) : (
            <EmptyState title="Nothing to stack by" hint="A board needs a single-select column. Add one with New field." />
          )
        ) : visible.length === 0 ? (
          <EmptyState title={`No ${noun}s`} hint={rows.length ? 'Nothing matches the search and filter. Clear them to see every row.' : undefined} />
        ) : (
          <table className="data-table min-w-max table-fixed">
            <colgroup>
              <col style={{ width: INDEX_WIDTH }} />
              {shownColumns.map((c) => (
                <col key={c.key} style={{ width: widthOf(c) }} />
              ))}
              {onFieldAdd && <col style={{ width: ADD_WIDTH }} />}
            </colgroup>
            <thead ref={thead}>
              <tr>
                <th style={{ left: 0 }} className="z-20 !px-0 text-center text-slate-400">#</th>
                {shownColumns.map((c, i) => (
                  <HeaderCell
                    key={c.key}
                    column={{ ...c, type: typeOf(c) }}
                    sort={sortOf(c.key)}
                    frozen={i < frozenCount}
                    frozenEdge={i === frozenCount - 1}
                    left={lefts[i]}
                    end={isEnd(i)}
                    endEdge={i === leftGroup}
                    right={rights[i]}
                    sortLabels={SORT_DIRECTION_LABELS[sortKindOf(c.key) === 'number' && c.options?.length ? 'text' : sortKindOf(c.key)]}
                    onMoveLeft={c.key === primary || i === 1 || i === leftGroup ? undefined : () => moveColumn(c.key, -1)}
                    onMoveRight={c.key === primary || i === leftGroup - 1 || i === shownColumns.length - 1 ? undefined : () => moveColumn(c.key, 1)}
                    onFreezeStart={c.key === primary || (i < frozenCount && !isEnd(i)) ? undefined : () => freezeAtStart(c.key)}
                    onFreezeEnd={c.key === primary || isEnd(i) ? undefined : () => freezeAtEnd(c.key)}
                    width={widthOf(c)}
                    onResizing={(w) => setDragWidth({ key: c.key, width: Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, w)) })}
                    onResized={(w) => { setDragWidth(null); setWidth(c.key, w); }}
                    onResetWidth={() => setWidth(c.key, null)}
                    draggable={c.key !== primary}
                    dragging={dragCol === c.key}
                    dropSide={dragCol && dropAt?.key === c.key ? dropAt.side : null}
                    onColumnDragStart={() => setDragCol(c.key)}
                    onColumnDragOver={(side) => {
                      if (!dragCol) return;
                      const next = c.key === primary ? 'after' : side;
                      if (dropAt?.key !== c.key || dropAt.side !== next) setDropAt({ key: c.key, side: next });
                    }}
                    onColumnDrop={() => dropAt && dropColumn(dropAt.key, dropAt.side)}
                    onColumnDragEnd={() => { setDragCol(null); setDropAt(null); }}
                    onFreeze={isEnd(i) || i + 1 === frozenCount ? undefined : () => setView({ frozen: i + 1 })}
                    onUnfreeze={(i > 0 && i < frozenCount) || isEnd(i) ? () => unfreeze(c.key) : undefined}
                    onSort={c.sortable === false ? undefined : (dir) => setSort(c.key, dir)}
                    onGroup={c.groupable === false ? undefined : () => setView({ groups: [{ by: c.key, dir: 'asc' }] })}
                    grouped={view.groups.some((g) => g.by === c.key)}
                    onHide={c.locked ? undefined : () => hide(c.key)}
                    onEdit={onFieldChange ? (anchor) => openFieldEditor(anchor, columns.find((x) => x.key === c.key) ?? c) : undefined}
                  />
                ))}
                {onFieldAdd && (
                  <th style={endCount ? { right: 0 } : undefined} className={cn('!px-0 text-center', endCount > 0 && 'z-20')}>
                    <button
                      type="button"
                      aria-label="Add field"
                      title="Add field"
                      onClick={(e) => openFieldEditor(e.currentTarget.getBoundingClientRect(), null)}
                      className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-indigo-600 dark:hover:bg-slate-700 dark:hover:text-indigo-300"
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                    </button>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {pinnedRows.map((row, i) => renderRow(row, ++rowIndex, pinTops[i] ?? 0, i === pinnedRows.length - 1))}
              {shown.map((item) => {
                if (item.kind === 'header') {
                  return (
                    <GroupBandRow
                      key={`h:${item.id}`}
                      label={item.label}
                      count={item.count}
                      depth={item.depth}
                      collapsed={collapsed.has(item.id)}
                      onToggle={() => toggle(item.id)}
                      columnCount={columnCount}
                      noun={noun}
                    />
                  );
                }
                return renderRow(item.row, ++rowIndex);
              })}
            </tbody>
          </table>
        )}
      </div>

      {(onFieldAdd || onFieldChange) && (
        <FieldEditor
          open={fieldEditor !== null}
          anchor={fieldEditor?.anchor ?? null}
          field={fieldEditor?.field ?? null}
          typeLocked={fieldEditor?.typeLocked}
          placement={fieldEditor?.placement}
          existingKeys={columns.map((c) => c.key)}
          onSave={(def) => {
            if (fieldEditor?.field) onFieldChange?.(fieldEditor.field.key, def);
            else onFieldAdd?.(def);
            setFieldEditor(null);
          }}
          onDelete={onFieldDelete ? (key) => { onFieldDelete(key); setFieldEditor(null); } : undefined}
          onClose={() => setFieldEditor(null)}
        />
      )}

      {!onRowOpen && onRowChange && (
        <RecordPanel
          row={recordRow}
          columns={arrangeColumns(labelled.map((c) => ({ ...c, locked: c.key === primary })), layout)}
          hidden={layout.hidden}
          typeOf={typeOf}
          noun={noun}
          history={recordRow ? history.filter((h) => h.rowId === getRowId(recordRow)) : []}
          byKey={byKey}
          onChange={(row, col, value) => commit(row, col, value)}
          onClose={() => setRecordId(null)}
        />
      )}
    </div>
  );
}

/**
 * A column built from a field DEFINITION — what `onFieldAdd` hands back —
 * over rows that keep such values in a bag the caller can read and write.
 * `coerceValue` sits on both sides, so a value stored under an earlier type
 * still reads as the current one, and an edit is stored in the type's own
 * shape.
 */
export function columnFromField<T>(
  field: FieldDef,
  extra: { get: (row: T, key: string) => unknown; set: (row: T, key: string, value: unknown) => T },
): GridColumn<T> {
  const kind = kindOfFieldType(field.type);
  const numeric = field.type === 'number' || field.type === 'currency';
  return {
    key: field.key,
    label: field.label,
    kind,
    type: field.type,
    ...(field.options ? { options: field.options } : {}),
    value: (row) => coerceValue(field.type, extra.get(row, field.key)),
    set: (row, value) => extra.set(row, field.key, coerceValue(field.type, value)),
    width: field.type === 'checkbox' ? 90 : numeric ? 110 : field.type === 'date' ? 120 : field.type === 'longtext' ? 260 : 160,
    ...(numeric ? { align: 'right' as const } : {}),
    ...(numeric || field.type === 'date' || field.type === 'longtext' ? { groupable: false } : {}),
  };
}

const isTruthy = (v: unknown) => v === true || v === 'true' || v === 1 || v === '1';

function cellTitle<T>(column: GridColumn<T>, row: T): string | undefined {
  const raw = column.value(row);
  if (raw == null || raw === '') return undefined;
  if (column.options?.length) {
    const picked = Array.isArray(raw) ? raw.map(String) : [String(raw)];
    return picked.map((v) => column.options!.find((o) => o.value === v)?.label ?? v).join(', ');
  }
  return Array.isArray(raw) ? raw.join(', ') : String(raw);
}

/** The value rendered by kind: pills for choices, a check for a checkbox, a
 *  formatted day for a date, a localised number. */
function DefaultCell<T>({ column, row }: { column: GridColumn<T>; row: T }) {
  return <ValueView column={column} raw={column.value(row)} />;
}

/** A raw value drawn the way its column's cell draws it — for a cell, and for
 *  the from/to of a history entry, so a pill stays a pill in the log. */
function ValueView<T>({ column, raw }: { column: GridColumn<T>; raw: unknown }) {
  if (raw == null || raw === '' || (Array.isArray(raw) && raw.length === 0)) {
    return <span className="text-slate-300 dark:text-slate-600">—</span>;
  }
  if (column.options?.length) return <OptionPills value={raw} options={column.options} />;
  if (column.type === 'currency' && typeof raw === 'number') {
    return <>{raw.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>;
  }
  if (column.type === 'url' || column.type === 'email') {
    const text = String(raw);
    const href = column.type === 'email' ? `mailto:${text}` : /^https?:\/\//i.test(text) ? text : `https://${text}`;
    return (
      <a href={href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-indigo-600 hover:underline dark:text-indigo-400">
        {text}
      </a>
    );
  }
  switch (column.kind) {
    case 'bool':
      return isTruthy(raw) ? (
        <Check className="inline h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-label="Checked" />
      ) : (
        <span className="text-slate-300 dark:text-slate-600">—</span>
      );
    case 'date': {
      const d = raw instanceof Date ? raw : new Date(String(raw));
      if (Number.isNaN(d.getTime())) return <>{String(raw)}</>;
      const utcDay = typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw);
      return <>{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', ...(utcDay ? { timeZone: 'UTC' } : {}) })}</>;
    }
    case 'number':
      return <>{typeof raw === 'number' ? raw.toLocaleString() : String(raw)}</>;
    default:
      return <>{Array.isArray(raw) ? raw.join(', ') : String(raw)}</>;
  }
}

/**
 * The in-place editor, chosen by kind. An `<input>` sits INSIDE the cell at
 * the cell's own padding, so opening it moves nothing; a choice list is
 * portalled and fixed, because the cell lives in a scroll box that would clip
 * a list hanging below the last row.
 */
function CellEditor<T>({
  column,
  value,
  seed,
  via = 'key',
  onCommit,
  onCancel,
}: {
  column: GridColumn<T>;
  value: unknown;
  seed?: string;
  via?: 'click' | 'key';
  onCommit: (value: unknown) => void;
  onCancel: () => void;
}) {
  if (column.options?.length) {
    return <ChoiceEditor options={column.options} value={value} onCommit={onCommit} onCancel={onCancel} />;
  }
  return <InputEditor kind={column.kind} value={value} seed={seed} via={via} onCommit={onCommit} onCancel={onCancel} />;
}

function InputEditor({
  kind,
  value,
  seed,
  via,
  onCommit,
  onCancel,
}: {
  kind: FilterKind;
  value: unknown;
  seed?: string;
  via: 'click' | 'key';
  onCommit: (value: unknown) => void;
  onCancel: () => void;
}) {
  const initial = seed ?? (value == null ? '' : kind === 'date' ? String(value).slice(0, 10) : String(value));
  const [text, setText] = useState(initial);
  // Blur fires after Enter and after Escape both; the first verdict wins.
  const done = useRef(false);

  const commit = () => {
    if (done.current) return;
    done.current = true;
    if (kind === 'number') onCommit(text.trim() === '' ? null : Number(text));
    else if (kind === 'date') onCommit(text === '' ? null : text);
    else onCommit(text);
  };
  const cancel = () => {
    if (done.current) return;
    done.current = true;
    onCancel();
  };

  return (
    <input
      autoFocus
      type={kind === 'number' ? 'number' : kind === 'date' ? 'date' : 'text'}
      value={text}
      onChange={(e) => setText(e.target.value)}
      // A seeded editor keeps the caret after the seed; an unseeded one
      // selects everything, so typing replaces and Enter keeps.
      // Opened by a click, the caret goes to the end — the reader pointed at
      // the text to change it, not to retype it. Opened by Enter or F2, the
      // whole value is selected, the spreadsheet bargain where typing replaces.
      // A seeded editor keeps the caret after its seed character.
      onFocus={(e) => {
        const el = e.currentTarget;
        if ((seed || via === 'click') && el.type !== 'number' && el.type !== 'date') el.setSelectionRange?.(text.length, text.length);
        else if (!(via === 'click' && (el.type === 'number' || el.type === 'date'))) el.select();
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
        else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
        // The arrows and Tab belong to the input while it is open.
        e.stopPropagation();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      className={cn('w-full bg-transparent text-xs text-slate-800 outline-none dark:text-slate-100', kind === 'number' && 'text-right tabular-nums')}
    />
  );
}

/**
 * The choice list for a select column — the cell becomes a chip box (each
 * picked option as a pill with its own ×, a caret at the right) and a list
 * drops under it AT THE COLUMN'S WIDTH, so the list reads as the cell
 * opened rather than as a menu that appeared near it. A single-select
 * commits on the first pick; a multi-select toggles, and both commit what
 * the chips show when the list closes (outside click, Escape or Enter),
 * because several picks are one edit.
 */
function ChoiceEditor({
  options,
  value,
  onCommit,
  onCancel,
}: {
  options: FilterFieldOption[];
  value: unknown;
  onCommit: (value: unknown) => void;
  onCancel: () => void;
}) {
  const multi = Array.isArray(value);
  const initial = multi ? value.map(String) : value == null || value === '' ? [] : [String(value)];
  const [picked, setPicked] = useState<string[]>(initial);
  const [query, setQuery] = useState('');
  const cell = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const done = useRef(false);
  // `picked` as the dismiss listener will see it — the hook binds once.
  const latest = useRef(picked);
  latest.current = picked;

  const finish = (next: string[]) => {
    if (done.current) return;
    done.current = true;
    const same = next.length === initial.length && next.every((v, i) => v === initial[i]);
    if (same) onCancel();
    else onCommit(multi ? next : (next[0] ?? null));
  };

  useEffect(() => {
    const r = cell.current?.parentElement?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 2, left: r.left, width: r.width });
  }, []);

  useDismiss([cell, panel], true, () => finish(latest.current));

  const choose = (v: string) => {
    if (multi) setPicked((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
    else finish([v]);
  };
  const remove = (v: string) => setPicked((prev) => prev.filter((x) => x !== v));

  const needle = query.trim().toLowerCase();
  const rows = needle ? options.filter((o) => o.label.toLowerCase().includes(needle)) : options;

  return (
    <span ref={cell} className="flex items-center gap-1 overflow-hidden whitespace-nowrap text-xs">
      <span className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
        {picked.length === 0 && <span className="text-slate-400">Select…</span>}
        {picked.map((v) => {
          const at = options.findIndex((o) => o.value === v);
          const o = at >= 0 ? options[at] : undefined;
          return <OptionPill key={v} label={o?.label ?? v} tone={o ? optionTone(o, at) : 'slate'} onRemove={() => remove(v)} className="shrink-0" />;
        })}
      </span>
      <ChevronUp className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
      {pos && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={panel}
              role="listbox"
              aria-multiselectable={multi}
              style={{ top: pos.top, left: pos.left, width: pos.width }}
              className="fixed z-[200] flex flex-col overflow-hidden panel panel-solid p-0"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="shrink-0 border-b border-slate-200 px-2.5 py-2 dark:border-slate-700">
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Select an option"
                  className="w-full bg-transparent text-xs outline-none placeholder-slate-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') { e.preventDefault(); finish(picked); }
                    else if (e.key === 'Enter') { e.preventDefault(); if (rows[0] && needle) choose(rows[0].value); else finish(picked); }
                    else if (e.key === 'Backspace' && query === '' && picked.length) { setPicked((prev) => prev.slice(0, -1)); }
                    e.stopPropagation();
                  }}
                />
              </div>
              <ul className="max-h-72 overflow-y-auto p-1.5">
                {rows.length === 0 && <li className="px-2 py-3 text-center text-xs text-slate-400">No match.</li>}
                {rows.map((o) => {
                  const checked = picked.includes(o.value);
                  return (
                    <li
                      key={o.value}
                      role="option"
                      aria-selected={checked}
                      onMouseDown={(e) => { e.preventDefault(); choose(o.value); }}
                      className={cn(
                        'flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-indigo-50/60 dark:hover:bg-indigo-500/10',
                        checked && 'bg-slate-100 dark:bg-slate-700/60',
                      )}
                    >
                      <OptionPill label={o.label} tone={optionTone(o, options.indexOf(o))} />
                      {checked && <Check className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />}
                    </li>
                  );
                })}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}

/**
 * The board — the same rows as cards, in one lane per option of a
 * single-select column, plus "No value" when any row has none. The view's
 * search, filter and sort still apply; grouping does not, because the lanes
 * ARE the grouping.
 *
 * Dragging a card to another lane is an EDIT: it sets the stacked column to
 * that lane's option through the column's `set`, so it is recorded in the
 * history like any other change. A card opens its record on click.
 */
function Board<T>({
  rows,
  stack,
  cardColumns,
  primary,
  getRowId,
  tintOf,
  canMove,
  onMove,
  onOpen,
  noun,
}: {
  rows: T[];
  stack: GridColumn<T>;
  cardColumns: GridColumn<T>[];
  primary: GridColumn<T> | undefined;
  getRowId: (row: T) => string | number;
  tintOf: (row: T) => keyof typeof ROW_TINT | null;
  canMove: boolean;
  onMove: (row: T, value: string | null) => void;
  onOpen?: (row: T, rect: DOMRect) => void;
  noun: string;
}) {
  const [dragId, setDragId] = useState<string | number | null>(null);
  const [overLane, setOverLane] = useState<string | null>(null);
  const options = stack.options ?? [];
  const laneOf = (row: T) => {
    const v = stack.value(row);
    const key = v == null || v === '' ? '' : String(Array.isArray(v) ? v[0] : v);
    return options.some((o) => o.value === key) ? key : '';
  };
  const lanes = [
    ...options.map((o, i) => ({ value: o.value, label: o.label, tone: optionTone(o, i) })),
    ...(rows.some((r) => laneOf(r) === '') ? [{ value: '', label: `No ${stack.label.toLowerCase()}`, tone: 'slate' }] : []),
  ];

  return (
    <div className="flex min-h-[18rem] gap-3 overflow-x-auto p-3">
      {lanes.map((lane) => {
        const cards = rows.filter((r) => laneOf(r) === lane.value);
        return (
          <section
            key={lane.value || '__none'}
            aria-label={lane.label}
            onDragOver={(e) => {
              if (dragId === null) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (overLane !== lane.value) setOverLane(lane.value);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverLane(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              const row = rows.find((r) => getRowId(r) === dragId);
              setDragId(null);
              setOverLane(null);
              if (row && laneOf(row) !== lane.value) onMove(row, lane.value || null);
            }}
            className={cn(
              'flex w-72 shrink-0 flex-col rounded-xl bg-slate-100/70 dark:bg-slate-800/40',
              overLane === lane.value && 'ring-2 ring-inset ring-indigo-400',
            )}
          >
            <header className="flex items-center gap-2 px-3 py-2">
              <OptionPill label={lane.label} tone={lane.tone} />
              <span className="text-[11px] text-slate-400">{cards.length}</span>
            </header>
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
              {cards.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-[11px] text-slate-400 dark:border-slate-600">
                  {canMove ? `Drop a ${noun} here` : `No ${noun}s`}
                </p>
              )}
              {cards.map((row) => {
                const id = getRowId(row);
                const tint = tintOf(row);
                return (
                  <article
                    key={id}
                    draggable={canMove}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', String(id));
                      setDragId(id);
                    }}
                    onDragEnd={() => { setDragId(null); setOverLane(null); }}
                    onClick={(e) => onOpen?.(row, e.currentTarget.getBoundingClientRect())}
                    className={cn(
                      'rounded-lg border border-slate-200 bg-white p-2.5 text-left shadow-sm transition-shadow dark:border-slate-700 dark:bg-slate-900',
                      tint && ROW_TINT[tint],
                      onOpen && 'cursor-pointer hover:shadow-md',
                      canMove && 'active:cursor-grabbing',
                      dragId === id && 'opacity-40',
                    )}
                  >
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-100">
                      {primary ? String(primary.value(row) ?? '') || `Untitled ${noun}` : String(id)}
                    </p>
                    {cardColumns.length > 0 && (
                      <dl className="mt-2 space-y-1">
                        {cardColumns.map((c) => (
                          <div key={c.key} className="flex items-center gap-2 text-[11px]">
                            <dt className="w-16 shrink-0 truncate text-slate-400">{c.label}</dt>
                            <dd className="min-w-0 flex-1 truncate text-slate-600 dark:text-slate-300">
                              <ValueView column={c} raw={c.value(row)} />
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/**
 * The record panel — one row as a form, in a drawer beside the grid, with
 * three tabs:
 *
 *   Details  every field as an editable line, committing as it is left
 *            (blur, Enter, a pick) through the same `set` the cells use, so
 *            the grid behind updates live and there is no Save to forget.
 *            Hidden columns are listed under their own heading: hiding is
 *            about what the GRID shows, and a record is where you go to see
 *            the rest. A column with no `set` is read-only.
 *   History  the record's edits as a timeline, newest first, each value
 *            drawn the way its cell draws it (pills stay pills).
 *   Log      the same edits as a table — time, field, from, to, by — for
 *            reading many at once or copying out.
 */
function RecordPanel<T>({
  row,
  columns,
  hidden,
  typeOf,
  noun,
  history,
  byKey,
  onChange,
  onClose,
}: {
  row: T | null;
  columns: (GridColumn<T> & { locked?: boolean })[];
  hidden: string[];
  typeOf: (col: GridColumn<T>) => FieldType;
  noun: string;
  history: HistoryEntry[];
  byKey: Map<string, GridColumn<T>>;
  onChange: (row: T, col: GridColumn<T>, value: unknown) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState('details');
  const primary = columns[0];
  const title = row && primary ? String(primary.value(row) ?? '') || `Untitled ${noun}` : '';
  const shown = columns.filter((c) => c.locked || !hidden.includes(c.key));
  const rest = columns.filter((c) => !c.locked && hidden.includes(c.key));

  // A new record opens on its details, not on whichever tab the last one was left on.
  useEffect(() => setTab('details'), [row === null]); // eslint-disable-line react-hooks/exhaustive-deps

  const line = (c: GridColumn<T>) =>
    row && (
      <div key={c.key} className="grid grid-cols-[9.5rem_minmax(0,1fr)] items-start gap-3 py-2">
        <span className="flex items-center gap-1.5 pt-1.5 text-xs text-slate-500 dark:text-slate-400">
          <FieldTypeIcon type={typeOf(c)} className="shrink-0 text-slate-400" />
          <span className="truncate">{c.label}</span>
        </span>
        <RecordField column={c} type={typeOf(c)} value={c.value(row)} row={row} onCommit={c.set ? (v) => onChange(row, c, v) : undefined} />
      </div>
    );

  const valueOf = (h: HistoryEntry, v: unknown) => {
    const col = byKey.get(h.field);
    return col ? <ValueView column={col} raw={v} /> : <span>{String(v ?? '—')}</span>;
  };

  return (
    <Drawer open={row !== null} onClose={onClose} title={title} subtitle={noun.charAt(0).toUpperCase() + noun.slice(1)} initialWidth={560} backdrop={false}>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'details', label: 'Details' },
          { id: 'history', label: 'History', badge: history.length || undefined },
          { id: 'log', label: 'Log' },
        ]}
      >
        {(active) =>
          active === 'details' ? (
            <div className="pt-2">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">{shown.map(line)}</div>
              {rest.length > 0 && (
                <div className="mt-4">
                  <p className="panel-title mb-1">Hidden in this view</p>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">{rest.map(line)}</div>
                </div>
              )}
            </div>
          ) : history.length === 0 ? (
            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-6 text-center text-xs text-slate-400 dark:bg-slate-900/40">
              No changes yet. Edits made in the grid or on the Details tab are recorded here.
            </p>
          ) : active === 'history' ? (
            <ol className="relative mt-3 space-y-4 border-l border-slate-200 pl-5 dark:border-slate-700">
              {history.map((h) => (
                <li key={h.id} className="relative">
                  <span
                    className="absolute -left-[31px] top-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[9px] font-semibold text-indigo-700 ring-2 ring-white dark:bg-indigo-500/20 dark:text-indigo-200 dark:ring-slate-900"
                    aria-hidden
                  >
                    {initialsFor(h.by ?? '?', '?')}
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{h.by ?? 'Someone'}</span> changed{' '}
                    <span className="font-medium text-slate-800 dark:text-slate-100">{h.label}</span>
                    <span className="ml-1.5 text-[11px] text-slate-400" title={new Date(h.at).toLocaleString()}>{relativeTime(h.at)}</span>
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="max-w-[45%] truncate text-slate-400 line-through decoration-slate-300">{valueOf(h, h.from)}</span>
                    <span className="text-slate-300" aria-hidden>→</span>
                    <span className="max-w-[45%] truncate text-slate-800 dark:text-slate-100">{valueOf(h, h.to)}</span>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="px-3">When</th>
                    <th className="px-3">Field</th>
                    <th className="px-3">From</th>
                    <th className="px-3">To</th>
                    <th className="px-3">By</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td className="whitespace-nowrap px-3 tabular-nums text-slate-500">{new Date(h.at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                      <td className="whitespace-nowrap px-3 font-medium">{h.label}</td>
                      <td className="max-w-[9rem] truncate px-3">{valueOf(h, h.from)}</td>
                      <td className="max-w-[9rem] truncate px-3">{valueOf(h, h.to)}</td>
                      <td className="whitespace-nowrap px-3">{h.by ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </Tabs>
    </Drawer>
  );
}

/**
 * The record form's select — single or multiple — as a real dropdown rather
 * than every option laid out as a pill: a field box showing the chosen
 * option(s) as pills (each with its own × when several may be chosen), and a
 * searchable list below it in the options' own colours.
 *
 * A single select picks and closes; a multi-select toggles and stays open,
 * since several picks are one edit. Both commit as they go — the record form
 * has no Save.
 *
 * PORTALLED and fixed, and marked `data-overlay="popover"`: the form lives in
 * a drawer whose body scrolls, which would clip an in-flow list, and the
 * marker is what makes Escape close the list rather than the whole record.
 */
function RecordSelect({
  label,
  options,
  value,
  multi,
  onCommit,
}: {
  label: string;
  options: FilterFieldOption[];
  value: unknown;
  multi: boolean;
  onCommit: (value: unknown) => void;
}) {
  const picked = Array.isArray(value) ? value.map(String) : value == null || value === '' ? [] : [String(value)];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const trigger = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);

  const close = () => {
    setOpen(false);
    setQuery('');
  };
  useDismiss([trigger, panel], open, close);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = trigger.current?.getBoundingClientRect();
      if (!r) return;
      const below = window.innerHeight - r.bottom - 12;
      const above = r.top - 12;
      const up = below < 220 && above > below;
      const maxHeight = Math.min(300, up ? above : below);
      setPos({ top: up ? r.top - 4 - Math.min(maxHeight, panel.current?.offsetHeight ?? maxHeight) : r.bottom + 4, left: r.left, width: r.width, maxHeight });
    };
    place();
    const frame = requestAnimationFrame(place);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, picked.length]);

  const needle = query.trim().toLowerCase();
  const rows = needle ? options.filter((o) => o.label.toLowerCase().includes(needle)) : options;

  const choose = (v: string) => {
    if (multi) onCommit(picked.includes(v) ? picked.filter((x) => x !== v) : [...picked, v]);
    else {
      onCommit(v);
      close();
    }
  };
  const remove = (v: string) => onCommit(multi ? picked.filter((x) => x !== v) : null);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(rows.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (rows[active]) choose(rows[active].value); }
    else if (e.key === 'Escape') {
      // Stopped here: React removes the list before this key reaches the
      // drawer's own listener, which would then see no popover open and close
      // the whole record too.
      e.preventDefault();
      e.stopPropagation();
      close();
      trigger.current?.focus();
    }
    else if (e.key === 'Backspace' && query === '' && picked.length) remove(picked[picked.length - 1]);
  };

  return (
    <>
      <div
        ref={trigger}
        role="combobox"
        tabIndex={0}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        onKeyDown={(e) => {
          if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) { e.preventDefault(); setOpen(true); }
        }}
        className={cn('field-input flex min-h-8 cursor-pointer items-center gap-1 py-1 text-xs', open && 'ring-2 ring-indigo-500/30')}
      >
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {picked.length === 0 && <span className="text-slate-400">{multi ? 'Select options' : 'Select an option'}</span>}
          {picked.map((v) => {
            const at = options.findIndex((o) => o.value === v);
            const o = at >= 0 ? options[at] : undefined;
            return <OptionPill key={v} label={o?.label ?? v} tone={o ? optionTone(o, at) : 'slate'} onRemove={() => remove(v)} />;
          })}
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} aria-hidden />
      </div>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={panel}
              role="listbox"
              aria-label={label}
              aria-multiselectable={multi}
              data-overlay="popover"
              style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width: pos?.width, maxHeight: pos?.maxHeight }}
              className="fixed z-[200] flex flex-col overflow-hidden panel panel-solid p-0"
            >
              <div className="shrink-0 border-b border-slate-200 px-2.5 py-2 dark:border-slate-700">
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                  onKeyDown={onKey}
                  placeholder="Search"
                  aria-label={`Search ${label}`}
                  className="w-full bg-transparent text-xs outline-none placeholder-slate-400"
                />
              </div>
              <ul className="min-h-0 flex-1 overflow-y-auto p-1.5">
                {rows.length === 0 && <li className="px-2 py-3 text-center text-xs text-slate-400">No match.</li>}
                {rows.map((o, i) => {
                  const checked = picked.includes(o.value);
                  return (
                    <li
                      key={o.value}
                      role="option"
                      aria-selected={checked}
                      onMouseEnter={() => setActive(i)}
                      // `mousedown`: taken before the search box blurs, so a multi pick keeps the list open.
                      onMouseDown={(e) => { e.preventDefault(); choose(o.value); }}
                      className={cn(
                        'flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1.5',
                        i === active && 'bg-indigo-50/70 dark:bg-indigo-500/10',
                        checked && 'bg-slate-100 dark:bg-slate-700/60',
                      )}
                    >
                      <OptionPill label={o.label} tone={optionTone(o, options.indexOf(o))} />
                      {checked && <Check className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />}
                    </li>
                  );
                })}
              </ul>
              {multi && picked.length > 0 && (
                <div className="flex shrink-0 justify-between border-t border-slate-200 p-1 dark:border-slate-700">
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); onCommit([]); }} className="btn-ghost text-xs">Clear</button>
                  <button type="button" onMouseDown={(e) => { e.preventDefault(); close(); }} className="btn-primary">Done</button>
                </div>
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

/** One field of the record panel, chosen by type. Uncontrolled and keyed on
 *  the value, so an edit made in the grid behind re-seeds it. */
function RecordField<T>({
  column,
  type,
  value,
  row,
  onCommit,
}: {
  column: GridColumn<T>;
  type: FieldType;
  value: unknown;
  row: T;
  onCommit?: (value: unknown) => void;
}) {
  const box = 'field-input py-1.5 text-xs';
  if (!onCommit) {
    return (
      <div className="min-h-8 py-1.5 text-xs text-slate-700 dark:text-slate-200">
        {column.cell ? column.cell(row) : <ValueView column={column} raw={value} />}
      </div>
    );
  }

  if (column.options?.length) {
    return (
      <RecordSelect
        label={column.label}
        options={column.options}
        value={value}
        multi={type === 'multiselect' || Array.isArray(value)}
        onCommit={onCommit}
      />
    );
  }

  if (type === 'checkbox' || column.kind === 'bool') {
    const on = isTruthy(value);
    return (
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={column.label}
        onClick={() => onCommit(!on)}
        className={cn('mt-1 inline-flex h-5 w-9 items-center rounded-full transition-colors', on ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600')}
      >
        <span className={cn('h-4 w-4 rounded-full bg-white shadow transition-transform', on ? 'translate-x-4' : 'translate-x-0.5')} />
      </button>
    );
  }

  const text = value == null ? '' : type === 'date' ? String(value).slice(0, 10) : String(value);
  const commitText = (raw: string) => {
    if (raw === text) return;
    if (type === 'number' || type === 'currency' || column.kind === 'number') onCommit(raw.trim() === '' ? null : Number(raw));
    else if (type === 'date') onCommit(raw || null);
    else onCommit(raw);
  };

  if (type === 'longtext') {
    return <textarea key={text} defaultValue={text} rows={3} onBlur={(e) => commitText(e.target.value)} className={cn(box, 'resize-y')} />;
  }
  return (
    <input
      key={text}
      type={type === 'date' ? 'date' : type === 'number' || type === 'currency' ? 'number' : type === 'email' ? 'email' : type === 'url' ? 'url' : 'text'}
      step={type === 'currency' ? '0.01' : undefined}
      defaultValue={text}
      onBlur={(e) => commitText(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur(); }}
      className={cn(box, (type === 'number' || type === 'currency') && 'tabular-nums')}
    />
  );
}

type MenuAction = { icon: React.ComponentType<{ className?: string }>; label: string; run: () => void; active?: boolean };

/**
 * A column header's menu, in the reference's groups — the field itself,
 * its position, freezing, then sort and group — with a hairline between
 * groups and no empty group drawn. An action absent for this column (the
 * primary cannot move or hide) is simply not in its list.
 */
function ColumnMenu({
  groups,
  item,
  close,
}: {
  groups: (MenuAction | false | null | undefined)[][];
  item: string;
  close: () => void;
  sort?: SortLevel;
  sortLabels: { asc: string; desc: string };
}) {
  const live = groups.map((g) => g.filter((a): a is MenuAction => Boolean(a))).filter((g) => g.length > 0);
  return (
    <>
      {live.map((group, gi) => (
        <div key={gi} className={cn(gi > 0 && 'mt-1 border-t border-slate-100 pt-1 dark:border-slate-700')}>
          {group.map((a) => (
            <button
              key={a.label}
              type="button"
              role="menuitem"
              className={cn(item, a.active && 'text-indigo-600 dark:text-indigo-300')}
              onClick={() => {
                close();
                a.run();
              }}
            >
              <a.icon className={cn('h-3.5 w-3.5', a.active ? 'text-indigo-500' : 'text-slate-400')} /> {a.label}
            </button>
          ))}
        </div>
      ))}
    </>
  );
}

/**
 * A column header: the label, the sort arrow, and a caret menu with the
 * column's quick actions. The menu is PORTALLED and fixed, like DataTable's:
 * the header is sticky inside a scroll box, and an in-flow menu under a short
 * table would be clipped by the box's bottom edge.
 */
function HeaderCell<T>({
  column,
  sort,
  frozen,
  frozenEdge,
  left,
  width,
  grouped,
  onSort,
  onGroup,
  onHide,
  onEdit,
  onResizing,
  onResized,
  onResetWidth,
  onFreeze,
  onUnfreeze,
  end = false,
  endEdge = false,
  right = 0,
  sortLabels = { asc: 'A → Z', desc: 'Z → A' },
  onMoveLeft,
  onMoveRight,
  onFreezeStart,
  onFreezeEnd,
  draggable = false,
  dragging = false,
  dropSide = null,
  onColumnDragStart,
  onColumnDragOver,
  onColumnDrop,
  onColumnDragEnd,
}: {
  /** Frozen at the right edge. */
  end?: boolean;
  endEdge?: boolean;
  right?: number;
  /** What the two sort directions mean for this column's kind: "A → Z", "Old → New". */
  sortLabels?: { asc: string; desc: string };
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  /** Freeze this column at the start (left), after the ones already frozen there. */
  onFreezeStart?: () => void;
  /** Freeze this column at the end (right edge). */
  onFreezeEnd?: () => void;
  /** The header can be dragged to a new position. False for the primary column. */
  draggable?: boolean;
  dragging?: boolean;
  /** Where a drag hovering this header would land, for the drop line. */
  dropSide?: 'before' | 'after' | null;
  onColumnDragStart?: () => void;
  onColumnDragOver?: (side: 'before' | 'after') => void;
  onColumnDrop?: () => void;
  onColumnDragEnd?: () => void;
  column: GridColumn<T>;
  sort: SortLevel | undefined;
  frozen: boolean;
  /** The last frozen column, which draws the frozen block's right edge. */
  frozenEdge: boolean;
  left: number;
  width: number;
  onResizing: (width: number) => void;
  onResized: (width: number) => void;
  onResetWidth: () => void;
  /** Freeze every column up to and including this one. */
  onFreeze?: () => void;
  onUnfreeze?: () => void;
  grouped: boolean;
  onSort?: (dir: 'asc' | 'desc' | null) => void;
  onGroup?: () => void;
  /** Absent for the primary column, which is always shown. */
  onHide?: () => void;
  /** Opens the field editor, anchored to the header cell. */
  onEdit?: (anchor: DOMRect) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  useDismiss([trigger, menu], open, () => setOpen(false));

  const th = useRef<HTMLTableCellElement>(null);
  const openMenu = () => {
    const r = trigger.current!.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: Math.max(8, Math.min(r.right - 176, window.innerWidth - 184)) });
    setOpen(true);
  };

  const item = 'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700';

  /**
   * Drag the right edge to resize. The width is reported live through
   * `onResizing` (a local draft in the grid) and committed once through
   * `onResized`, so a controlled view is not asked to persist every pixel of
   * a drag. Double-click restores the declared width; arrow keys nudge it.
   */
  // Set while the resize grip is held, so the header's own drag-to-reorder
  // does not start from the same gesture.
  const resizing = useRef(false);
  const startResize = (e: React.PointerEvent) => {
    resizing.current = true;
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    let last = width;
    const move = (ev: PointerEvent) => {
      last = width + ev.clientX - startX;
      onResizing(last);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      resizing.current = false;
      onResized(last);
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  return (
    <th
      ref={th}
      style={frozen ? { left } : end ? { right } : undefined}
      draggable={draggable}
      onDragStart={(e) => {
        if (!draggable || resizing.current) { e.preventDefault(); return; }
        e.dataTransfer.effectAllowed = 'move';
        // Firefox refuses to start a drag unless something is set.
        e.dataTransfer.setData('text/plain', column.key);
        onColumnDragStart?.();
      }}
      onDragOver={(e) => {
        if (!onColumnDragOver) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const r = e.currentTarget.getBoundingClientRect();
        onColumnDragOver(e.clientX < r.left + r.width / 2 ? 'before' : 'after');
      }}
      onDrop={(e) => { e.preventDefault(); onColumnDrop?.(); }}
      onDragEnd={() => onColumnDragEnd?.()}
      className={cn(
        'group/th px-3 font-semibold',
        column.align === 'right' && 'text-right',
        (frozen || end) && 'z-20',
        frozenEdge && FROZEN_EDGE,
        endEdge && FROZEN_END_EDGE,
        draggable && 'cursor-grab active:cursor-grabbing',
        dragging && 'opacity-40',
        // The drop line: a 2px inset bar on the side the column would land.
        dropSide === 'before' && 'shadow-[inset_2px_0_0_0_#6366f1]',
        dropSide === 'after' && 'shadow-[inset_-2px_0_0_0_#6366f1]',
      )}
    >
      <span className="flex items-center gap-1">
        <button
          type="button"
          disabled={!onSort}
          onClick={() => onSort?.(sort?.dir === 'asc' ? 'desc' : sort?.dir === 'desc' ? null : 'asc')}
          className={cn('inline-flex min-w-0 items-center gap-1 truncate', onSort && 'hover:text-indigo-600 dark:hover:text-indigo-300')}
          title={column.label}
        >
          {column.type && <FieldTypeIcon type={column.type} className="h-3 w-3 shrink-0 text-slate-400" />}
          <span className="truncate">{column.label}</span>
          {sort?.dir === 'asc' && <ArrowUp className="h-3 w-3 shrink-0 text-indigo-500" aria-label="Sorted ascending" />}
          {sort?.dir === 'desc' && <ArrowDown className="h-3 w-3 shrink-0 text-indigo-500" aria-label="Sorted descending" />}
          {grouped && <Group className="h-3 w-3 shrink-0 text-amber-500" aria-label="Grouped by this column" />}
        </button>
        {(onSort || onGroup || onHide || onEdit || onFreeze || onUnfreeze || onMoveLeft || onMoveRight || onFreezeStart || onFreezeEnd) && (
          <button
            ref={trigger}
            type="button"
            aria-label={`${column.label} column options`}
            aria-expanded={open}
            onClick={() => (open ? setOpen(false) : openMenu())}
            className={cn(
              'ml-auto shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700',
              open ? 'opacity-100' : 'opacity-0 group-hover/th:opacity-100 focus-visible:opacity-100',
            )}
          >
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </span>

      {/* The resize grip. `th` is sticky, so it is the containing block. */}
      <span
        role="separator"
        aria-orientation="vertical"
        aria-label={`Resize ${column.label}`}
        aria-valuenow={Math.round(width)}
        tabIndex={0}
        onPointerDown={startResize}
        onDoubleClick={onResetWidth}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            e.stopPropagation();
            onResized(width + (e.key === 'ArrowRight' ? 16 : -16));
          }
        }}
        className="absolute right-0 top-0 z-[1] h-full w-1.5 cursor-col-resize touch-none outline-none hover:bg-indigo-400/50 focus-visible:bg-indigo-500 active:bg-indigo-500"
      />

      {open && pos && typeof document !== 'undefined'
        ? createPortal(
            <div ref={menu} role="menu" data-overlay="menu" style={{ top: pos.top, left: pos.left }} className="fixed z-[200] w-52 panel panel-solid p-1 normal-case tracking-normal">
              <ColumnMenu
                item={item}
                close={() => setOpen(false)}
                sort={sort}
                sortLabels={sortLabels}
                groups={[
                  [
                    onEdit && { icon: Pencil, label: 'Edit field', run: () => onEdit(th.current!.getBoundingClientRect()) },
                    onHide && { icon: EyeOff, label: 'Hide field', run: onHide },
                  ],
                  [
                    onMoveLeft && { icon: ArrowLeftToLine, label: 'Move left', run: onMoveLeft },
                    onMoveRight && { icon: ArrowRightToLine, label: 'Move right', run: onMoveRight },
                  ],
                  [
                    onFreeze && { icon: Snowflake, label: 'Freeze up to this column', run: onFreeze },
                    onFreezeStart && { icon: ArrowLeftToLine, label: 'Freeze at start', run: onFreezeStart },
                    onFreezeEnd && { icon: ArrowRightToLine, label: 'Freeze at end', run: onFreezeEnd },
                    onUnfreeze && { icon: Snowflake, label: 'Unfreeze', run: onUnfreeze },
                  ],
                  [
                    onSort && { icon: ArrowDownAZ, label: `Sort ${sortLabels.asc}`, run: () => onSort('asc'), active: sort?.dir === 'asc' },
                    onSort && { icon: ArrowUpZA, label: `Sort ${sortLabels.desc}`, run: () => onSort('desc'), active: sort?.dir === 'desc' },
                    onSort && sort && { icon: X, label: 'Clear sort', run: () => onSort(null) },
                    onGroup && { icon: Layers, label: grouped ? 'Grouped by this field' : 'Group by this field', run: onGroup, active: grouped },
                  ],
                ]}
              />
            </div>,
            document.body,
          )
        : null}
    </th>
  );
}
