/**
 * The catalog, shaped as `NavMenu` sections — one per category, in reading
 * order, behind a "Browse all" link.
 *
 * Flat text links rather than an icon tree: fifty-seven entries under six
 * headings scan far better as text, which is the whole reason `NavMenu` exists
 * alongside `Sidebar`.
 */

import type { NavSection } from '@/components/layout/NavMenu';
import { CATEGORY_LABEL, CATEGORY_ORDER, ENTRIES } from './index';

export const BROWSE_HREF = '/';

export function buildGalleryMenu(): NavSection[] {
  const sections: NavSection[] = [
    { label: 'Start', items: [{ label: 'Browse all', href: BROWSE_HREF }] },
  ];

  for (const category of CATEGORY_ORDER) {
    const items = ENTRIES.filter((e) => e.category === category);
    if (items.length === 0) continue;
    sections.push({
      label: CATEGORY_LABEL[category],
      items: items.map((e) => ({ label: e.name, href: `/preview/${e.slug}` })),
    });
  }

  return sections;
}
