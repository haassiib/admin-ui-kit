/**
 * Which page numbers a paginator should show, and where the gaps go.
 *
 * Pure and separate from the component because this is the only genuinely
 * fiddly part of a paginator, and the failure modes are all off-by-one: a gap
 * standing in for a single page (an ellipsis that hides page 4 is worse than
 * page 4), a window that shrinks near the ends instead of staying the same
 * width, or a run that renders 1 … 2 because the edge and the window touch.
 */

export type PageToken = number | 'ellipsis';

export function pageRange({
  page,
  totalPages,
  siblings = 1,
  edges = 1,
  showEllipsis = true,
}: {
  page: number;
  totalPages: number;
  /** Pages either side of the current one. */
  siblings?: number;
  /** Pages pinned at each end. */
  edges?: number;
  showEllipsis?: boolean;
}): PageToken[] {
  if (totalPages <= 0) return [];

  const all = (): number[] => Array.from({ length: totalPages }, (_, i) => i + 1);

  // Without gaps there is nothing to compute — `edges` only means something
  // relative to an ellipsis, so it is ignored here rather than half-applied.
  if (!showEllipsis) return all();

  // The most this can ever show: both edges, the window, and the two gaps. If
  // that is not fewer than the total, gaps would replace nothing.
  const maxVisible = edges * 2 + siblings * 2 + 3;
  if (totalPages <= maxVisible) return all();

  const start = Math.max(page - siblings, 1);
  const end = Math.min(page + siblings, totalPages);

  const tokens: PageToken[] = [];
  const push = (n: number) => {
    if (!tokens.includes(n)) tokens.push(n);
  };

  for (let i = 1; i <= Math.min(edges, totalPages); i++) push(i);

  // A gap that would hide exactly one page is replaced by that page: "1 … 3"
  // costs the same width as "1 2 3" and tells you less.
  const firstWindow = Math.max(start, edges + 1);
  if (firstWindow > edges + 1) {
    if (firstWindow === edges + 2) push(edges + 1);
    else tokens.push('ellipsis');
  }

  for (let i = firstWindow; i <= Math.min(end, totalPages - edges); i++) push(i);

  const lastEdgeStart = totalPages - edges + 1;
  const lastWindow = Math.min(end, totalPages - edges);
  if (lastWindow < lastEdgeStart - 1) {
    if (lastWindow === lastEdgeStart - 2) push(lastEdgeStart - 1);
    else tokens.push('ellipsis');
  }

  for (let i = Math.max(lastEdgeStart, 1); i <= totalPages; i++) push(i);

  return tokens;
}
