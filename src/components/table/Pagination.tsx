'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { pageRange } from '@/lib/page-range';

const PAGE_SIZES = [25, 50, 100, 250];

export type PaginationVariant = 'bar' | 'pill' | 'floating';
export type PaginationNavigation = 'pages' | 'input';

/**
 * Page controls plus a page-size selector.
 *
 * Two axes, deliberately kept on ONE component rather than split into two.
 *
 * `navigation` is what sits in the middle:
 *   pages   numbered links with ellipsis gaps — the conventional paginator, and
 *           the only one that shows you where you are without reading a number.
 *   input   a "page N of M" box. Better past a few hundred pages, where numbered
 *           links stop being a map and start being noise.
 *
 * `variant` is placement:
 *   bar       a full-width strip with a top border — sits under a table
 *   pill      a centred rounded pill, in flow below the table
 *   floating  the same pill, fixed to the bottom of the viewport
 *
 * They were four separate components once, differing only in their wrapper.
 *
 * For a layout the props cannot express, the same control is also available as
 * COMPOSABLE PARTS on this component — `Pagination.Root`, `.Content`, `.First`,
 * `.Prev`, `.Pages`, `.Page`, `.Ellipsis`, `.Next`, `.Last`, `.Report`. Both
 * paths share the `pageRange` helper below, so they cannot disagree about where
 * the ellipsis gaps fall.
 */
export default function Pagination({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
  itemType = 'rows',
  variant = 'bar',
  navigation = 'pages',
  siblings = 1,
  edges = 1,
  showEllipsis = true,
  showRange = true,
  showPageSize = true,
}: {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (size: number) => void;
  /** Named in the range line: "1–25 of 400 members". */
  itemType?: string;
  variant?: PaginationVariant;
  navigation?: PaginationNavigation;
  /** `pages` only — how many page links either side of the current one. */
  siblings?: number;
  /** `pages` only — how many links pinned at each end. */
  edges?: number;
  /** `pages` only. With gaps off, every page is listed and `edges` is moot. */
  showEllipsis?: boolean;
  showRange?: boolean;
  showPageSize?: boolean;
}) {
  const [pageInput, setPageInput] = useState(String(currentPage));
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  useEffect(() => setPageInput(String(currentPage)), [currentPage]);

  if (totalPages <= 1 && totalItems <= itemsPerPage) return null;

  const go = (n: number) => onPageChange(Math.min(Math.max(n, 1), totalPages));

  const commit = () => {
    const n = Number.parseInt(pageInput, 10);
    if (Number.isNaN(n)) setPageInput(String(currentPage));
    else go(n);
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

  const nav = cn(
    'p-1.5 text-slate-500 dark:text-slate-400 disabled:opacity-40 disabled:hover:bg-transparent',
    isPill
      ? 'rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-90 transition disabled:active:scale-100'
      : 'rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800',
  );

  const range = (
    <div className="text-slate-600 dark:text-slate-300">
      <span className="font-semibold">{rangeStart}</span>–
      <span className="font-semibold">{rangeEnd}</span> of{' '}
      <span className="font-semibold">{totalItems}</span> {itemType}
    </div>
  );

  const pageLinks = pageRange({ page: currentPage, totalPages, siblings, edges, showEllipsis }).map(
    (token, i) =>
      token === 'ellipsis' ? (
        // Not a button: it is a gap, and a focusable one is a keyboard stop that
        // does nothing. `aria-hidden` keeps it out of the reading order too.
        <span
          // eslint-disable-next-line react/no-array-index-key
          key={`gap-${i}`}
          aria-hidden
          className="px-1 text-slate-400 select-none"
        >
          …
        </span>
      ) : (
        <button
          key={token}
          onClick={() => go(token)}
          aria-label={`Page ${token}`}
          aria-current={token === currentPage ? 'page' : undefined}
          className={cn(
            'min-w-[1.75rem] px-1.5 py-1 text-center transition-colors',
            isPill ? 'rounded-full' : 'rounded-lg',
            token === currentPage
              ? 'bg-indigo-600 font-semibold text-white'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
          )}
        >
          {token}
        </button>
      ),
  );

  const middle =
    navigation === 'pages' ? (
      <div className="flex items-center gap-0.5">{pageLinks}</div>
    ) : (
      <span className="flex items-center gap-1 px-1 text-slate-600 dark:text-slate-300">
        <input
          value={pageInput}
          onChange={(e) => setPageInput(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          aria-label="Page number"
          className="w-9 rounded-md border border-slate-200 bg-transparent py-0.5 text-center dark:border-slate-700"
        />
        of <span className="font-semibold">{totalPages}</span>
      </span>
    );

  return (
    <div className={cn(wrapper, 'text-xs')}>
      {showRange && (isPill ? <span className="hidden sm:block">{range}</span> : range)}

      <div className="flex items-center gap-3">
        {showPageSize && (
          <label className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            Rows
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="rounded-md border border-slate-200 bg-transparent px-1.5 py-0.5 dark:border-slate-700"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="flex items-center gap-0.5">
          <button onClick={() => go(1)} disabled={currentPage === 1} className={nav} aria-label="First page">
            <ChevronsLeft className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => go(currentPage - 1)} disabled={currentPage === 1} className={nav} aria-label="Previous page">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          {middle}

          <button onClick={() => go(currentPage + 1)} disabled={currentPage === totalPages} className={nav} aria-label="Next page">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => go(totalPages)} disabled={currentPage === totalPages} className={nav} aria-label="Last page">
            <ChevronsRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   COMPOSABLE PARTS.

   The prop-driven component above covers the common layout in four props. This
   is the other half of that trade: every part is a separate element you arrange
   yourself, with anything you like between them — a label, an input, a spinner.

   They live in this file rather than a second component because they are the
   same control with a different entry point. Split apart they looked like two
   components that render identically, which is a worse thing to hand someone
   than one component with two ways in.
--------------------------------------------------------------------------- */

type PaginationContextValue = {
  page: number;
  totalPages: number;
  total: number;
  itemsPerPage: number;
  rangeStart: number;
  rangeEnd: number;
  isFirst: boolean;
  isLast: boolean;
  go: (page: number) => void;
  tokens: ReturnType<typeof pageRange>;
};

const PaginationContext = createContext<PaginationContextValue | null>(null);

/**
 * Every part reads its state from here rather than taking props, which is what
 * lets them be rearranged freely. The error names the fix, because "cannot read
 * property of null" from inside a chevron button is not a useful place to land.
 */
function usePagination(part: string): PaginationContextValue {
  const ctx = useContext(PaginationContext);
  if (!ctx) throw new Error(`<Pagination.${part}> must be rendered inside <Pagination.Root>`);
  return ctx;
}

function Root({
  total,
  itemsPerPage,
  page,
  onPageChange,
  siblings = 1,
  edges = 1,
  showEllipsis = true,
  children,
}: {
  /** Total number of ITEMS, not pages. */
  total: number;
  itemsPerPage: number;
  page: number;
  onPageChange: (page: number) => void;
  /** Page links either side of the current one. */
  siblings?: number;
  /** Page links pinned at each end. */
  edges?: number;
  showEllipsis?: boolean;
  children: React.ReactNode;
}) {
  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
  // Clamped here, once, so no individual part has to guard its own arithmetic.
  const go = (next: number) => onPageChange(Math.min(Math.max(next, 1), totalPages));

  return (
    <PaginationContext.Provider
      value={{
        page,
        totalPages,
        total,
        itemsPerPage,
        rangeStart: total > 0 ? (page - 1) * itemsPerPage + 1 : 0,
        rangeEnd: Math.min(page * itemsPerPage, total),
        isFirst: page <= 1,
        isLast: page >= totalPages,
        go,
        tokens: pageRange({ page, totalPages, siblings, edges, showEllipsis }),
      }}
    >
      {children}
    </PaginationContext.Provider>
  );
}

function Content({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <nav
      aria-label="Pagination"
      className={cn('flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300', className)}
    >
      {children}
    </nav>
  );
}

const navButton =
  'inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800';

/** The four steppers differ only in target page, icon and label. */
function stepper(
  part: string,
  defaultIcon: React.ReactNode,
  target: (c: PaginationContextValue) => number,
  disabled: (c: PaginationContextValue) => boolean,
  label: string,
) {
  return function Stepper({ children, className }: { children?: React.ReactNode; className?: string }) {
    const ctx = usePagination(part);
    return (
      <button
        type="button"
        onClick={() => ctx.go(target(ctx))}
        disabled={disabled(ctx)}
        aria-label={label}
        className={cn(navButton, className)}
      >
        {children ?? defaultIcon}
      </button>
    );
  };
}

const First = stepper('First', <ChevronsLeft className="h-3.5 w-3.5" />, () => 1, (c) => c.isFirst, 'First page');
const Prev = stepper('Prev', <ChevronLeft className="h-3.5 w-3.5" />, (c) => c.page - 1, (c) => c.isFirst, 'Previous page');
const Next = stepper('Next', <ChevronRight className="h-3.5 w-3.5" />, (c) => c.page + 1, (c) => c.isLast, 'Next page');
const Last = stepper('Last', <ChevronsRight className="h-3.5 w-3.5" />, (c) => c.totalPages, (c) => c.isLast, 'Last page');

function Page({
  page,
  children,
  className,
}: {
  page: number;
  children?: React.ReactNode;
  className?: string;
}) {
  const ctx = usePagination('Page');
  const active = page === ctx.page;
  return (
    <button
      type="button"
      onClick={() => ctx.go(page)}
      aria-label={`Page ${page}`}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'min-w-[1.75rem] rounded-lg px-1.5 py-1 text-center transition-colors',
        active
          ? 'bg-indigo-600 font-semibold text-white'
          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
        className,
      )}
    >
      {children ?? page}
    </button>
  );
}

function Ellipsis({ children, className }: { children?: React.ReactNode; className?: string }) {
  // Not a button. A focusable gap is a keyboard stop that does nothing, and
  // `aria-hidden` keeps it out of the reading order as well.
  return (
    <span aria-hidden className={cn('select-none px-1 text-slate-400', className)}>
      {children ?? '…'}
    </span>
  );
}

function Pages({
  children,
  className,
}: {
  /** Render prop for one page link. Omit for the default `<Pagination.Page>`. */
  children?: (page: number) => React.ReactNode;
  className?: string;
}) {
  const ctx = usePagination('Pages');
  return (
    <span className={cn('flex items-center gap-0.5', className)}>
      {ctx.tokens.map((token, i) =>
        token === 'ellipsis' ? (
          // eslint-disable-next-line react/no-array-index-key
          <Ellipsis key={`gap-${i}`} />
        ) : children ? (
          <span key={token}>{children(token)}</span>
        ) : (
          <Page key={token} page={token} />
        ),
      )}
    </span>
  );
}

function Report({
  children,
  className,
}: {
  /** Render prop over the current numbers. Omit for "1–25 of 480". */
  children?: (state: {
    page: number;
    totalPages: number;
    total: number;
    rangeStart: number;
    rangeEnd: number;
  }) => React.ReactNode;
  className?: string;
}) {
  const { page, totalPages, total, rangeStart, rangeEnd } = usePagination('Report');
  return (
    <span className={cn('px-1', className)}>
      {children ? (
        children({ page, totalPages, total, rangeStart, rangeEnd })
      ) : (
        <>
          <span className="font-semibold">{rangeStart}</span>–
          <span className="font-semibold">{rangeEnd}</span> of{' '}
          <span className="font-semibold">{total}</span>
        </>
      )}
    </span>
  );
}

Pagination.Root = Root;
Pagination.Content = Content;
Pagination.First = First;
Pagination.Prev = Prev;
Pagination.Pages = Pages;
Pagination.Page = Page;
Pagination.Ellipsis = Ellipsis;
Pagination.Next = Next;
Pagination.Last = Last;
Pagination.Report = Report;

export { Root, Content, First, Prev, Pages, Page, Ellipsis, Next, Last, Report };
