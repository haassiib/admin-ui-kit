/**
 * The catalog, shaped as `NavMenu` sections — one per menu group (see
 * `groups.ts`), in reading order, behind a "Browse all" link.
 *
 * Flat text links rather than an icon tree: a hundred entries under short,
 * purpose-named headings scan far better as text, which is the whole reason
 * `NavMenu` exists alongside `Sidebar`.
 */

import type { NavSection } from '@/components/layout/NavMenu';
import { displayName, GROUPED_ENTRIES } from './index';

export const BROWSE_HREF = '/';

export function buildGalleryMenu(): NavSection[] {
  const sections: NavSection[] = [
    { label: 'Start', items: [{ label: 'Browse all', href: BROWSE_HREF }] },
  ];

  for (const { label, entries } of GROUPED_ENTRIES) {
    sections.push({
      label,
      // Spaced for reading; the page itself keeps the real PascalCase name.
      items: entries.map((e) => ({ label: displayName(e.name), href: `/preview/${e.slug}` })),
    });
  }

  return sections;
}
