'use client';

import { createContext, useContext } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { pageRange } from '@/lib/page-range';

/**
 * A paginator you compose part by part.
 *
 * `Pagination` is the batteries-included one: pass four props, get a range line,
 * a page-size selector and the navigation, in a fixed order. This is the other
 * half of that trade — every part is a separate element you arrange yourself,
 * and anything can go between them: a custom label, an input, a spinner.
 *
 * Both are driven by the SAME `pageRange` helper, so the two can never disagree
 * about where the ellipsis gaps fall. That is the whole reason this is a second
 * component rather than a second implementation.
 *
 * Reach for `Pagination` first. Reach for this when the layout is the point.
 *
 *   <Paginator.Root total={480} itemsPerPage={10} page={page} onPageChange={setPage}>
 *     <Paginator.Content>
 *       <Paginator.Prev />
 *       <Paginator.Report />
 *       <Paginator.Next />
 *     </Paginator.Content>
 *   </Paginator.Root>
 */

type PaginatorContextValue = {
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

const PaginatorContext = createContext<PaginatorContextValue | null>(null);

/**
 * Every part reads its state from here rather than taking props, which is what
 * lets them be rearranged freely. The error names the fix, because "cannot read
 * property of null" from inside a chevron button is not a useful place to land.
 */
function usePaginator(part: string): PaginatorContextValue {
  const ctx = useContext(PaginatorContext);
  if (!ctx) throw new Error(`<Paginator.${part}> must be rendered inside <Paginator.Root>`);
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
    <PaginatorContext.Provider
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
    </PaginatorContext.Provider>
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
  target: (c: PaginatorContextValue) => number,
  disabled: (c: PaginatorContextValue) => boolean,
  label: string,
) {
  return function Stepper({ children, className }: { children?: React.ReactNode; className?: string }) {
    const ctx = usePaginator(part);
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
  const ctx = usePaginator('Page');
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
  /** Render prop for one page link. Omit for the default `<Paginator.Page>`. */
  children?: (page: number) => React.ReactNode;
  className?: string;
}) {
  const ctx = usePaginator('Pages');
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
  const { page, totalPages, total, rangeStart, rangeEnd } = usePaginator('Report');
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

const Paginator = { Root, Content, First, Prev, Pages, Page, Ellipsis, Next, Last, Report };

export default Paginator;
export { Root, Content, First, Prev, Pages, Page, Ellipsis, Next, Last, Report };
