/**
 * The catalog, shaped as `NavMenu` sections.
 *
 * One section per category, in reading order, plus a short "Overview" section
 * for the pages that are not components. Flat text links rather than an icon
 * tree: fifty-five entries under six headings scan far better as text, which is
 * the whole reason `NavMenu` exists alongside `Sidebar`.
 */

import type { NavSection } from '@/components/layout/NavMenu';
import { CATEGORY_LABEL, CATEGORY_ORDER, ENTRIES } from './index';

export const OVERVIEW_HREF = '/';
export const BROWSE_HREF = '/all';

export function buildGalleryMenu(): NavSection[] {
  const sections: NavSection[] = [
    {
      label: 'Getting started',
      items: [
        { label: 'Overview', href: OVERVIEW_HREF },
        { label: 'Browse all', href: BROWSE_HREF },
      ],
    },
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
