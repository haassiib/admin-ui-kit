'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronsUpDown,
  Columns3,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useDismiss } from '@/lib/use-dismiss';
import { nextSort, sortRows, type SortState } from '@/lib/sort';
import EmptyState from '@/components/layout/EmptyState';
import Skeleton from '@/components/data/Skeleton';
import Pagination from './Pagination';

export type ColumnPin = 'left' | 'right';

export type Column<T> = {
  key: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  /** Omit to make the column unsortable. */
  sortValue?: (row: T) => string | number | null;
  /**
   * Plain text for this cell, used by the global search. Cells render nodes, and
   * you cannot match a string against JSX — so a column is searchable only if it
   * can say what its text is.
   */
  filterValue?: (row: T) => string;
  align?: 'left' | 'right';
  /**
   * Width in pixels. Required in practice for a PINNED column: the sticky
   * offset of everything after it is the sum of the widths before it, and a
   * column whose width is "whatever the content needs" has no such number.
   * Pinned columns without one fall back to `DEFAULT_WIDTH`.
   */
  width?: number;
  minWidth?: number;
  pin?: ColumnPin;
  /** Keep out of the column-visibility menu, so it can never be hidden. */
  alwaysVisible?: boolean;
};

const DEFAULT_WIDTH = 160;
const MIN_WIDTH = 64;

/**
 * The table most admin screens actually need: sorting, filtering, search,
 * selection, pinned rows and columns, resizable columns, column visibility and
 * paging — all from a column array, so a new screen is data rather than another
 * hand-rolled `<table>`.
 *
 * Two things are worth knowing before extending it.
 *
 * The BODY SCROLLS, so every menu it opens is PORTALLED to `<body>` and
 * positioned fixed. An absolutely-positioned menu inside a scroll container is
 * clipped by it — the menu opens and is painted away. This is the same rule the
 * rest of the library follows; see the popover note in the README.
 *
 * Sorting and paging are UNCONTROLLED until you pass `sort` or take over, then
 * controlled. Small tables sort a local array and large ones sort on the server,
 * and a component that supports only one of those gets copied and diverged —
 * which is how this library ended up with five paginations.
 */
export default function DataTable<T>({
  rows,
  columns,
  getRowId,
  selectable = false,
  selected,
  onSelectedChange,
  selectionActions,
  sort: controlledSort,
  onSortChange,
  pageSize: initialPageSize = 0,
  searchable = false,
  searchPlaceholder = 'Search…',
  resizable = false,
  columnToggle = false,
  pinnedRowIds,
  loading = false,
  stripedRows = false,
  header,
  footer,
  emptyTitle = 'Nothing here yet',
  emptyHint,
  maxHeight,
  className,
}: {
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string | number;
  selectable?: boolean;
  selected?: Array<string | number>;
  onSelectedChange?: (next: Array<string | number>) => void;
  /** Rendered in the bar that appears while rows are selected. */
  selectionActions?: (selected: Array<string | number>) => React.ReactNode;
  sort?: SortState;
  onSortChange?: (next: SortState) => void;
  /** 0 disables paging — every row renders. */
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  resizable?: boolean;
  /** Adds the column-visibility menu. */
  columnToggle?: boolean;
  /** Rows kept above the scroll, in the order given. */
  pinnedRowIds?: Array<string | number>;
  loading?: boolean;
  /**
   * Alternating row backgrounds. Selection and pinning still win over the stripe.
   *
   * The only banding option, deliberately. Vertical gridlines solve the same
   * problem — following one row across a wide table — and offering both invites
   * tables that use each in different places for no reason. Row height is not
   * here either: that is the app-wide density setting, and a per-table size
   * prop would be a second control for one thing.
   */
  stripedRows?: boolean;
  /** A bar above the table, beside the search and column controls. */
  header?: React.ReactNode;
  /** A bar below the table, above the pagination. */
  footer?: React.ReactNode;
  emptyTitle?: string;
  emptyHint?: string;
  /** Caps the scroll box, e.g. `'24rem'`. Without it the table grows. */
  maxHeight?: string;
  className?: string;
}) {
  const [localSort, setLocalSort] = useState<SortState>(null);
  const [page, setPage] = useState(1);
  const [pageSizeState, setPageSizeState] = useState(initialPageSize);
  const [query, setQuery] = useState('');
  const [hidden, setHidden] = useState<string[]>([]);
  const [widths, setWidths] = useState<Record<string, number>>({});
  const [headHeight, setHeadHeight] = useState(0);

  const headRef = useRef<HTMLTableSectionElement>(null);
  const sort = controlledSort !== undefined ? controlledSort : localSort;

  const setSort = (next: SortState) => {
    if (onSortChange) onSortChange(next);
    else setLocalSort(next);
    setPage(1);
  };

  // Pinned rows sit under the sticky header, so they need its exact height.
  // Measured rather than assumed: it changes with density and with wrapping.
  useLayoutEffect(() => {
    const el = headRef.current;
    if (!el) return;
    const measure = () => setHeadHeight(el.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const visibleColumns = useMemo(
    () => columns.filter((c) => !hidden.includes(c.key)),
    [columns, hidden],
  );

  const widthOf = (c: Column<T>) => widths[c.key] ?? c.width ?? (c.pin ? DEFAULT_WIDTH : undefined);

  /**
   * Sticky offsets for pinned columns: each one starts where the pinned columns
   * before it end. The checkbox column is pinned too when selection is on, so it
   * seeds the left offset.
   */
  const offsets = useMemo(() => {
    const left: Record<string, number> = {};
    const right: Record<string, number> = {};
    let acc = selectable ? 40 : 0;
    for (const c of visibleColumns) {
      if (c.pin !== 'left') continue;
      left[c.key] = acc;
      acc += widthOf(c) ?? DEFAULT_WIDTH;
    }
    acc = 0;
    for (const c of [...visibleColumns].reverse()) {
      if (c.pin !== 'right') continue;
      right[c.key] = acc;
      acc += widthOf(c) ?? DEFAULT_WIDTH;
    }
    return { left, right };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleColumns, widths, selectable]);

  /**
   * One search box across every column that can say what its text is.
   *
   * Deliberately not per-column filter menus as well: two filtering mechanisms
   * on one table means two places to look when the rows on screen are not the
   * rows you expected, and a menu buried in a header is the one people forget
   * they left set.
   */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      columns.some((c) => c.filterValue && c.filterValue(r).toLowerCase().includes(q)),
    );
  }, [rows, columns, query]);

  // Sort locally only while the caller has NOT taken over — otherwise it is
  // sorting server-side and re-sorting here would fight it.
  const sorted = useMemo(() => {
    if (controlledSort !== undefined || !sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return filtered;
    // The kind is read off the first row that has a value — `sortValue` is
    // untyped per column, and guessing "number" from a string column is how
    // "10" ends up before "9". Missing values sort last in both directions.
    const read = col.sortValue;
    let sample: string | number | null = null;
    for (const r of filtered) {
      const v = read(r);
      if (v !== null && v !== undefined && v !== '') { sample = v; break; }
    }
    return sortRows(filtered, sort, (r) => read(r), () => (typeof sample === 'number' ? 'number' : 'text'));
  }, [filtered, columns, sort, controlledSort]);

  const pinnedSet = new Set(pinnedRowIds ?? []);
  const pinnedRows = (pinnedRowIds ?? [])
    .map((id) => rows.find((r) => getRowId(r) === id))
    .filter((r): r is T => !!r);
  const bodyRows = sorted.filter((r) => !pinnedSet.has(getRowId(r)));
  const paged =
    pageSizeState > 0 ? bodyRows.slice((page - 1) * pageSizeState, page * pageSizeState) : bodyRows;

  const ids = paged.map(getRowId);
  const sel = selected ?? [];
  const allOnPage = ids.length > 0 && ids.every((id) => sel.includes(id));
  const toggleAll = () =>
    onSelectedChange?.(
      allOnPage ? sel.filter((id) => !ids.includes(id)) : [...new Set([...sel, ...ids])],
    );

  const colStyle = (c: Column<T>): React.CSSProperties => {
    const w = widthOf(c);
    return {
      ...(w ? { width: w, minWidth: w } : {}),
      ...(c.pin === 'left' ? { left: offsets.left[c.key] } : {}),
      ...(c.pin === 'right' ? { right: offsets.right[c.key] } : {}),
    };
  };

  const pinClass = (c: Column<T>) =>
    c.pin &&
    cn(
      'sticky z-[2] bg-white dark:bg-slate-900',
      c.pin === 'left' ? 'border-r border-slate-200 dark:border-slate-700' : 'border-l border-slate-200 dark:border-slate-700',
    );

  if (!loading && rows.length === 0) {
    return (
      <div className={cn('panel panel-solid p-8', className)}>
        <EmptyState title={emptyTitle} hint={emptyHint} />
      </div>
    );
  }

  const hasToolbar = searchable || columnToggle || !!header;

  return (
    <div className={cn('panel panel-solid flex min-h-0 flex-col', className)}>
      {hasToolbar && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-700">
          {header}
          {searchable && (
            <div className="relative min-w-48 flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="field-input pl-8"
              />
            </div>
          )}
          {columnToggle && (
            <HeaderMenu label="Columns" icon={<Columns3 className="h-3.5 w-3.5" />}>
              {columns.map((c) => {
                const on = !hidden.includes(c.key);
                const locked = c.alwaysVisible;
                return (
                  <button
                    key={c.key}
                    disabled={locked}
                    onClick={() =>
                      setHidden(on ? [...hidden, c.key] : hidden.filter((k) => k !== c.key))
                    }
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-800"
                  >
                    <span
                      className={cn(
                        'grid h-3.5 w-3.5 shrink-0 place-items-center rounded border',
                        on
                          ? 'border-indigo-600 bg-indigo-600'
                          : 'border-slate-300 dark:border-slate-600',
                      )}
                    >
                      {on && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                    </span>
                    <span className="truncate">{c.header}</span>
                  </button>
                );
              })}
            </HeaderMenu>
          )}
        </div>
      )}

      <div
        className="custom-scrollbar min-h-0 flex-1 overflow-auto"
        style={maxHeight ? { maxHeight } : undefined}
      >
        <table className="data-table" style={{ tableLayout: resizable ? 'fixed' : 'auto' }}>
          <thead ref={headRef}>
            <tr>
              {selectable && (
                <th
                  className="sticky left-0 z-[3] w-10 bg-slate-50 px-3 dark:bg-slate-900"
                  style={{ width: 40, minWidth: 40 }}
                >
                  <input
                    type="checkbox"
                    checked={allOnPage}
                    onChange={toggleAll}
                    aria-label="Select all rows on this page"
                    className="accent-indigo-600"
                  />
                </th>
              )}
              {visibleColumns.map((c) => (
                <th
                  key={c.key}
                  style={colStyle(c)}
                  aria-sort={
                    sort?.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'
                  }
                  className={cn('relative p-0', c.pin && 'z-[3]', pinClass(c))}
                >
                  <div className={cn('flex items-center', c.align === 'right' && 'justify-end')}>
                    <SortButton
                      column={c}
                      sort={sort}
                      onSort={setSort}
                      disabled={!c.sortValue}
                    />
                    {resizable && (
                      <ResizeHandle
                        width={widthOf(c) ?? DEFAULT_WIDTH}
                        min={c.minWidth ?? MIN_WIDTH}
                        onResize={(w) => setWidths((prev) => ({ ...prev, [c.key]: w }))}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {pinnedRows.length > 0 && (
            <tbody className="border-b-2 border-indigo-200 dark:border-indigo-500/40">
              {pinnedRows.map((row) => (
                <Row
                  key={getRowId(row)}
                  row={row}
                  columns={visibleColumns}
                  getRowId={getRowId}
                  selectable={selectable}
                  selected={sel}
                  onSelectedChange={onSelectedChange}
                  colStyle={colStyle}
                  pinClass={pinClass}
                  stickyTop={headHeight}
                />
              ))}
            </tbody>
          )}

          <tbody>
            {loading ? (
              Array.from({ length: 4 }, (_, i) => (
                <tr key={`skeleton-${i}`}>
                  {selectable && <td className="px-3" />}
                  {visibleColumns.map((c) => (
                    <td key={c.key} className="px-3">
                      <Skeleton />
                    </td>
                  ))}
                </tr>
              ))
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + (selectable ? 1 : 0)} className="px-3 py-8">
                  <EmptyState title="No rows match" hint="Clear the search to see everything." />
                </td>
              </tr>
            ) : (
              paged.map((row) => (
                <Row
                  key={getRowId(row)}
                  row={row}
                  columns={visibleColumns}
                  getRowId={getRowId}
                  selectable={selectable}
                  selected={sel}
                  onSelectedChange={onSelectedChange}
                  colStyle={colStyle}
                  pinClass={pinClass}
                  striped={stripedRows}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectable && sel.length > 0 && (
        <div className="flex shrink-0 items-center gap-3 border-t border-slate-200 bg-indigo-50/60 px-4 py-2 text-xs dark:border-slate-700 dark:bg-indigo-500/10">
          <span className="font-semibold text-indigo-700 dark:text-indigo-300">
            {sel.length} selected
          </span>
          <div className="ml-auto flex items-center gap-2">
            {selectionActions?.(sel)}
            <button onClick={() => onSelectedChange?.([])} className="btn-ghost">
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </div>
      )}

      {footer && (
        <div className="shrink-0 border-t border-slate-200 px-4 py-2 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300">
          {footer}
        </div>
      )}

      {pageSizeState > 0 && (
        <Pagination
          totalItems={bodyRows.length}
          itemsPerPage={pageSizeState}
          currentPage={page}
          onPageChange={setPage}
          onItemsPerPageChange={(n) => {
            setPageSizeState(n);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Row<T>({
  row,
  columns,
  getRowId,
  selectable,
  selected,
  onSelectedChange,
  colStyle,
  pinClass,
  striped,
  stickyTop,
}: {
  row: T;
  columns: Column<T>[];
  getRowId: (row: T) => string | number;
  selectable: boolean;
  selected: Array<string | number>;
  onSelectedChange?: (next: Array<string | number>) => void;
  colStyle: (c: Column<T>) => React.CSSProperties;
  pinClass: (c: Column<T>) => string | false | undefined;
  striped?: boolean;
  /** Set for a pinned row: how far under the header it sticks. */
  stickyTop?: number;
}) {
  const id = getRowId(row);
  const checked = selected.includes(id);
  const pinned = stickyTop !== undefined;

  // A sticky ROW is really sticky CELLS — `position: sticky` on a `<tr>` is
  // ignored, so each cell carries it, and each needs its own background or the
  // rows scrolling underneath show straight through.
  const cellBase = pinned ? 'sticky z-[1] bg-indigo-50/70 dark:bg-indigo-500/10' : '';
  const cellStyle = pinned ? { top: stickyTop } : undefined;

  return (
    <tr
      className={cn(
        // Order matters: a selected row must still read as selected inside a
        // striped table, so the stripe is declared first and overridden.
        striped && !pinned && 'odd:bg-slate-50/70 dark:odd:bg-slate-800/30',
        !pinned && 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
        checked && !pinned && 'bg-indigo-50/60 dark:bg-indigo-500/10',
      )}
    >
      {selectable && (
        <td className={cn('px-3', cellBase, pinned && 'left-0 z-[2]')} style={cellStyle}>
          <input
            type="checkbox"
            checked={checked}
            onChange={() =>
              onSelectedChange?.(checked ? selected.filter((s) => s !== id) : [...selected, id])
            }
            aria-label="Select row"
            className="accent-indigo-600"
          />
        </td>
      )}
      {columns.map((c) => (
        <td
          key={c.key}
          style={{ ...colStyle(c), ...cellStyle }}
          className={cn(
            'truncate px-3',
            c.align === 'right' && 'text-right',
            pinClass(c),
            cellBase,
            c.pin && pinned && 'z-[2]',
          )}
        >
          {c.cell(row)}
        </td>
      ))}
    </tr>
  );
}

function SortButton<T>({
  column,
  sort,
  onSort,
  disabled,
}: {
  column: Column<T>;
  sort: SortState;
  onSort: (next: SortState) => void;
  disabled: boolean;
}) {
  const active = sort?.key === column.key;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSort(nextSort(sort, column.key))}
      title={disabled ? undefined : 'Click to sort'}
      className={cn(
        'group/sort flex min-w-0 flex-1 items-center gap-1 px-3 py-2.5 text-left uppercase leading-4 transition-colors',
        !disabled && 'hover:text-slate-800 dark:hover:text-slate-100',
        disabled && 'cursor-default',
        column.align === 'right' && 'justify-end',
        active && 'text-slate-800 dark:text-slate-100',
      )}
    >
      <span className="truncate">{column.header}</span>
      {!disabled && (
        // Always rendered, at zero opacity when unsorted, so the header never
        // changes width on click and the row cannot reflow under the cursor.
        <span
          aria-hidden
          className={cn(
            'shrink-0 transition-opacity',
            active ? 'opacity-100' : 'opacity-0 group-hover/sort:opacity-40',
          )}
        >
          {active ? (
            sort!.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
          ) : (
            <ChevronsUpDown className="h-3 w-3" />
          )}
        </span>
      )}
    </button>
  );
}

function ResizeHandle({
  width,
  min,
  onResize,
}: {
  width: number;
  min: number;
  onResize: (width: number) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const start = useRef({ x: 0, w: 0 });

  useEffect(() => {
    if (!dragging) return;
    // On `window`, not the handle: the pointer routinely leaves a 4px target
    // mid-drag, and a handle-scoped listener drops the gesture when it does.
    const move = (e: PointerEvent) =>
      onResize(Math.max(min, start.current.w + (e.clientX - start.current.x)));
    const stop = () => setDragging(false);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    const prev = document.body.style.cursor;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      document.body.style.cursor = prev;
      document.body.style.userSelect = '';
    };
  }, [dragging, min, onResize]);

  return (
    <span
      role="separator"
      aria-orientation="vertical"
      onPointerDown={(e) => {
        e.preventDefault();
        start.current = { x: e.clientX, w: width };
        setDragging(true);
      }}
      className={cn(
        'absolute inset-y-0 right-0 w-1 cursor-col-resize transition-colors',
        dragging ? 'bg-indigo-500' : 'hover:bg-indigo-400',
      )}
    />
  );
}

/**
 * A menu anchored to its trigger and PORTALLED to `<body>`.
 *
 * The table body is a scroll container, and an absolutely-positioned menu inside
 * one is clipped by it — the menu opens and is painted away. Portalling with
 * `position: fixed` is the only arrangement that survives, and it also clears
 * the sticky header and pinned columns without a z-index race.
 */
function HeaderMenu({
  label,
  icon,
  active,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; maxHeight: number } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const el = trigger.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const width = 224;
      const EDGE = 8;
      const GAP = 4;
      // Below the trigger when the menu fits there, above when it only fits
      // above — a table near the foot of the window otherwise opens its menu
      // off-screen. Either way it is capped to the room it has and scrolls.
      const wanted = Math.min(panel.current?.scrollHeight ?? 288, 288);
      const below = window.innerHeight - r.bottom - GAP - EDGE;
      const above = r.top - GAP - EDGE;
      const up = below < wanted && above > below;
      const room = Math.max(120, up ? above : below);
      const height = Math.min(wanted, room);
      setPos({
        top: up ? r.top - GAP - height : r.bottom + GAP,
        left: Math.min(Math.max(r.left, EDGE), Math.max(EDGE, window.innerWidth - width - EDGE)),
        maxHeight: room,
      });
    };
    place();
    // Once more after the menu has mounted, with its real height.
    const frame = requestAnimationFrame(place);
    // Capture phase: a scroll inside the table's own box does not bubble.
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open]);

  useDismiss([trigger, panel], open, () => setOpen(false));

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        aria-expanded={open}
        className={cn(
          'shrink-0 rounded-md p-1.5 transition-colors',
          active
            ? 'text-indigo-600 dark:text-indigo-400'
            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
        )}
      >
        {icon}
      </button>
      {open &&
        pos &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={panel}
            style={{ top: pos.top, left: pos.left, width: 224, maxHeight: Math.min(288, pos.maxHeight) }}
            // The portalled-overlay band (see globals.css): above sticky table
            // chrome and every in-flow popover.
            className="custom-scrollbar fixed z-[200] overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-800"
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
