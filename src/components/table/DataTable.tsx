'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import EmptyState from '@/components/layout/EmptyState';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import Pagination from './Pagination';
import { nextSort, type SortState } from '@/lib/sort';

export type Column<T> = {
  key: string;
  header: React.ReactNode;
  /** Cell content. Omit `sortValue` for a column that should not sort. */
  cell: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number | null;
  align?: 'left' | 'right';
  width?: string;
  /** Pin this column while the table scrolls sideways. First column only. */
  sticky?: boolean;
};

/**
 * The table most admin screens actually need: sorting, optional row selection,
 * optional pagination, and the empty state — all in one place so a new screen is
 * a column array rather than another hand-rolled `<table>`.
 *
 * Sorting and paging are UNCONTROLLED by default and become controlled the
 * moment you pass `sort`/`page`. That matters because small tables sort a local
 * array and large ones sort on the server, and a component that only supports
 * one of those gets copied and diverged — which is how this library ended up
 * with five paginations.
 */
export default function DataTable<T>({
  rows,
  columns,
  getRowId,
  selectable = false,
  selected,
  onSelectedChange,
  sort: controlledSort,
  onSortChange,
  pageSize: initialPageSize = 0,
  emptyTitle = 'Nothing here yet',
  emptyHint,
  className,
}: {
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string | number;
  selectable?: boolean;
  selected?: Array<string | number>;
  onSelectedChange?: (next: Array<string | number>) => void;
  sort?: SortState;
  onSortChange?: (next: SortState) => void;
  /** 0 disables paging — the table renders every row. */
  pageSize?: number;
  emptyTitle?: string;
  emptyHint?: string;
  className?: string;
}) {
  const [localSort, setLocalSort] = useState<SortState>(null);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(initialPageSize);

  const sort = controlledSort !== undefined ? controlledSort : localSort;
  const setSort = (next: SortState) => {
    if (onSortChange) onSortChange(next);
    else setLocalSort(next);
    setPage(1);
  };

  // Only sort locally when the caller has NOT taken control — otherwise it is
  // sorting server-side and re-sorting here would fight it.
  const sorted = useMemo(() => {
    if (controlledSort !== undefined || !sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av === bv) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return (av < bv ? -1 : 1) * dir;
    });
  }, [rows, columns, sort, controlledSort]);

  const paged = size > 0 ? sorted.slice((page - 1) * size, page * size) : sorted;

  const ids = paged.map(getRowId);
  const sel = selected ?? [];
  const allOnPage = ids.length > 0 && ids.every((id) => sel.includes(id));
  const toggleAll = () =>
    onSelectedChange?.(allOnPage ? sel.filter((id) => !ids.includes(id)) : [...new Set([...sel, ...ids])]);

  if (rows.length === 0) {
    return (
      <div className={cn('panel panel-solid p-8', className)}>
        <EmptyState title={emptyTitle} hint={emptyHint} />
      </div>
    );
  }

  return (
    <div className={cn('panel panel-solid flex min-h-0 flex-col', className)}>
      <div className="min-h-0 flex-1 overflow-auto custom-scrollbar">
        <table className="data-table">
          <thead>
            <tr>
              {selectable && (
                <th className="w-10 px-3">
                  <input
                    type="checkbox"
                    checked={allOnPage}
                    onChange={toggleAll}
                    aria-label="Select all rows on this page"
                    className="accent-indigo-600"
                  />
                </th>
              )}
              {columns.map((c) =>
                c.sortValue ? (
                  <SortableTh
                    key={c.key}
                    columnKey={c.key}
                    sort={sort}
                    onSort={setSort}
                    align={c.align}
                    className={cn('px-3', c.sticky && 'sticky-col')}
                  >
                    {c.header}
                  </SortableTh>
                ) : (
                  <th
                    key={c.key}
                    style={c.width ? { width: c.width } : undefined}
                    className={cn('px-3', c.align === 'right' && 'text-right', c.sticky && 'sticky-col')}
                  >
                    {c.header}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {paged.map((row) => {
              const id = getRowId(row);
              const checked = sel.includes(id);
              return (
                <tr
                  key={id}
                  className={cn(
                    'hover:bg-slate-50 dark:hover:bg-slate-800/50',
                    checked && 'bg-indigo-50/60 dark:bg-indigo-500/10',
                  )}
                >
                  {selectable && (
                    <td className="px-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          onSelectedChange?.(checked ? sel.filter((s) => s !== id) : [...sel, id])
                        }
                        aria-label="Select row"
                        className="accent-indigo-600"
                      />
                    </td>
                  )}
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn('px-3', c.align === 'right' && 'text-right', c.sticky && 'sticky-col')}
                    >
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {size > 0 && (
        <Pagination
          totalItems={sorted.length}
          itemsPerPage={size}
          currentPage={page}
          onPageChange={setPage}
          onItemsPerPageChange={(n) => {
            setSize(n);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}

/**
 * A sortable column header.
 *
 * Private to this file. It was a catalogued component, but nothing except
 * DataTable ever used it and it is meaningless outside a `<table>` — a public
 * entry for it was an API surface with no callers.
 *
 * The whole `th` is the button, not a small chevron beside the label — a header
 * cell is a wide target whose only job is to sort, so a 12px hit area would be
 * the one part of it that worked.
 *
 * The indicator is always rendered, at `opacity-0` when the column is unsorted,
 * so a header never changes width on click and the row cannot reflow under the
 * cursor.
 */
function SortableTh({
  columnKey,
  sort,
  onSort,
  children,
  className,
  align = 'left',
}: {
  columnKey: string;
  sort: SortState;
  onSort: (next: SortState) => void;
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
}) {
  const active = sort?.key === columnKey;

  return (
    <th className={cn('p-0', className)} aria-sort={active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => onSort(nextSort(sort, columnKey))}
        title={active ? (sort!.dir === 'asc' ? 'Sorted A–Z — click for Z–A' : 'Sorted Z–A — click to clear') : 'Click to sort'}
        className={cn(
          'group/sort flex w-full items-center gap-1 px-4 py-2.5 leading-4 text-left uppercase transition-colors hover:text-slate-800 dark:hover:text-slate-100',
          align === 'right' && 'justify-end',
          active && 'text-slate-800 dark:text-slate-100',
        )}
      >
        {children}
        <span
          aria-hidden
          className={cn(
            'shrink-0 transition-opacity',
            active ? 'opacity-100' : 'opacity-0 group-hover/sort:opacity-40',
          )}
        >
          {active ? (
            sort!.dir === 'asc' ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            )
          ) : (
            <ChevronsUpDown className="w-3 h-3" />
          )}
        </span>
      </button>
    </th>
  );
}
