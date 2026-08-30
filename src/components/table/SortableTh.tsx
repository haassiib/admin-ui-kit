'use client';

/* Origin: bonus-adjustment (96S2), verbatim. */

import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { nextSort, type SortState } from '@/lib/sort';

/**
 * A sortable column header.
 *
 * The whole `th` is the button, not a small chevron beside the label — a header
 * cell is a wide target whose only job is to sort, so a 12px hit area would be
 * the one part of it that worked.
 *
 * The indicator is always rendered, at `opacity-0` when the column is unsorted,
 * so a header never changes width on click and the row cannot reflow under the
 * cursor.
 */
export default function SortableTh({
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
