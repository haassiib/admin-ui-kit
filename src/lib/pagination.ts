/**
 * One definition of a page, shared by the tables and the footer control.
 *
 * Page size lives here rather than in the Pagination component because the
 * SERVER validates it and the CLIENT offers it: if the two lists ever drifted,
 * the dropdown would offer a size the server silently refuses.
 */
export const PAGE_SIZES = [25, 50, 100, 250] as const;
export const DEFAULT_PAGE_SIZE = 25;

export type PageParams = { page: number; pageSize: number; skip: number; take: number };

/** Accepts whatever the URL carries. Anything unusable falls back to page 1. */
export function parsePageParams(params?: {
  page?: string | string[];
  pageSize?: string | string[];
}): PageParams {
  const first = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

  const rawPage = Number.parseInt(first(params?.page) ?? '', 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  // Only a size the dropdown actually offers is honoured — otherwise `?pageSize=100000`
  // is a one-request way to make the server read the whole table.
  const rawSize = Number.parseInt(first(params?.pageSize) ?? '', 10);
  const pageSize = (PAGE_SIZES as readonly number[]).includes(rawSize)
    ? rawSize
    : DEFAULT_PAGE_SIZE;

  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

/**
 * Clamp a page against a count known only after the query.
 *
 * Deleting the last row on page 4 leaves you requesting a page that no longer
 * exists, which renders an empty table rather than the new last page.
 */
export const clampPage = (page: number, totalItems: number, pageSize: number): number =>
  Math.min(Math.max(1, page), Math.max(1, Math.ceil(totalItems / pageSize)));
