'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const PAGE_SIZES = [25, 50, 100, 250];

export type PaginationVariant = 'bar' | 'pill' | 'floating';

/**
 * Page controls plus a page-size selector.
 *
 * `variant` is placement, not a different component:
 *   bar       a full-width strip with a top border — sits under a table
 *   pill      a centred rounded pill, in flow below the table
 *   floating  the same pill, fixed to the bottom of the viewport
 */
export default function Pagination({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
  itemType = 'rows',
  variant = 'bar',
}: {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (size: number) => void;
  itemType?: string;
  variant?: PaginationVariant;
}) {
  const [pageInput, setPageInput] = useState(String(currentPage));
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  useEffect(() => setPageInput(String(currentPage)), [currentPage]);

  if (totalPages <= 1 && totalItems <= itemsPerPage) return null;

  const commit = () => {
    const n = Number.parseInt(pageInput, 10);
    if (Number.isNaN(n)) setPageInput(String(currentPage));
    else onPageChange(Math.min(Math.max(n, 1), totalPages));
  };

  const rangeStart = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const rangeEnd = Math.min(currentPage * itemsPerPage, totalItems);
  const isPill = variant !== 'bar';

  const wrapper = {
    bar: 'shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-slate-200 dark:border-slate-800 px-4 py-2',
    pill: 'shrink-0 mt-3 mx-auto w-fit flex items-center gap-4 rounded-full border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-4 py-2 shadow-lg',
    floating:
      'fixed bottom-4 left-1/2 z-20 -translate-x-1/2 flex items-center gap-4 rounded-full border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-4 py-2 shadow-lg',
  }[variant];

  const nav = isPill
    ? 'p-1.5 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-90 transition disabled:opacity-40 disabled:hover:bg-transparent disabled:active:scale-100'
    : 'p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent';

  const range = (
    <div className="text-slate-600 dark:text-slate-300">
      <span className="font-semibold">{rangeStart}</span>–
      <span className="font-semibold">{rangeEnd}</span> of{' '}
      <span className="font-semibold">{totalItems}</span> {itemType}
    </div>
  );

  const controls = (
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
        Rows
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="bg-transparent border border-slate-200 dark:border-slate-700 rounded-md px-1.5 py-0.5"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-0.5">
        <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className={nav} aria-label="First page">
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className={nav} aria-label="Previous page">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 px-1">
          <input
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && commit()}
            aria-label="Page number"
            className="w-9 text-center bg-transparent border border-slate-200 dark:border-slate-700 rounded-md py-0.5"
          />
          of <span className="font-semibold">{totalPages}</span>
        </span>
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className={nav} aria-label="Next page">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className={nav} aria-label="Last page">
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className={`${wrapper} text-xs`}>
      {isPill ? <span className="hidden sm:block">{range}</span> : range}
      {controls}
    </div>
  );
}
