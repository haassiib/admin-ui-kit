'use client';

/* Origin: bonus-adjustment (96S2), verbatim. */

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Pagination from './Pagination';

/**
 * `Pagination` driven by the URL rather than component state, so a SERVER
 * component can paginate without becoming a client component.
 *
 * Page and size live in the query string, which also makes a given page
 * linkable and survives a refresh — the reason server pages get this wrapper
 * instead of lifting their whole table into the client.
 */
export default function UrlPagination({
  totalItems,
  page,
  pageSize,
  itemType = 'rows',
}: {
  totalItems: number;
  page: number;
  pageSize: number;
  itemType?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const push = (next: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) params.set(key, value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <Pagination
      totalItems={totalItems}
      itemsPerPage={pageSize}
      currentPage={page}
      onPageChange={(p) => push({ page: String(p) })}
      // A bigger page can put you past the end, so size changes reset to page 1
      // — the same rule UsersTable applies to its filters.
      onItemsPerPageChange={(size) => push({ pageSize: String(size), page: '1' })}
      itemType={itemType}
    />
  );
}
