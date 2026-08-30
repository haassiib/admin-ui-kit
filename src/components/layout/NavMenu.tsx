'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { cn } from '@/lib/cn';

export type NavItem = { label: string; href: string; badge?: React.ReactNode };
export type NavSection = { label: string; items: NavItem[] };
export type NavOrientation = 'vertical' | 'horizontal';

/**
 * A documentation-style menu: plain text links under section headings.
 *
 * Deliberately not the icon-rail `Sidebar`. Once a menu is long enough to need
 * grouping — a component index, an API reference, a settings tree — an icon per
 * row stops helping, because they all end up being the same generic glyph and
 * the eye reads the text anyway. Text-only rows scan faster and let a section
 * hold twenty items without becoming a wall of squares.
 *
 * `horizontal` is for a top or bottom bar (see `AppShell`'s `sidebarPosition`).
 * It is not just the vertical menu turned sideways: headings shrink to inline
 * group labels, groups get a divider between them instead of vertical space, and
 * the active item is marked with an underline rather than a filled pill —
 * a pill in a one-row bar reads as a button, not as "you are here".
 *
 * The filter is opt-in. Below roughly twenty items it is chrome you have to skip
 * past; above it, scrolling to find a name is the slow part.
 */
export default function NavMenu({
  sections,
  activeHref,
  orientation = 'vertical',
  filterable = false,
  filterPlaceholder = 'Filter…',
  emptyLabel = 'No matches',
  showSectionLabels = true,
  className,
}: {
  sections: NavSection[];
  /** Current route. Matched exactly — a menu is a list of destinations, not prefixes. */
  activeHref?: string;
  orientation?: NavOrientation;
  filterable?: boolean;
  filterPlaceholder?: string;
  emptyLabel?: string;
  /** Turn off to render a flat bar with no group labels at all. */
  showSectionLabels?: boolean;
  className?: string;
}) {
  const [query, setQuery] = useState('');
  const horizontal = orientation === 'horizontal';

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => ({ ...s, items: s.items.filter((i) => i.label.toLowerCase().includes(q)) }))
      // A heading with nothing under it is noise, so empty sections drop out.
      .filter((s) => s.items.length > 0);
  }, [sections, query]);

  const link = (item: NavItem) => {
    const active = item.href === activeHref;
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'flex items-center gap-2 text-[13px] transition-colors',
            horizontal ? 'whitespace-nowrap border-b-2 px-1 py-1' : 'justify-between rounded-md px-2 py-1.5',
            horizontal && active && 'border-indigo-600 font-semibold text-indigo-700 dark:border-indigo-400 dark:text-indigo-300',
            horizontal && !active && 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100',
            !horizontal && active && 'bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300',
            !horizontal && !active && 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
          )}
        >
          <span className={horizontal ? undefined : 'truncate'}>{item.label}</span>
          {item.badge != null && (
            <span className="shrink-0 text-[10px] text-slate-400">{item.badge}</span>
          )}
        </Link>
      </li>
    );
  };

  const filter = filterable && (
    <div className={cn('relative', horizontal ? 'w-44 shrink-0' : '')}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={filterPlaceholder}
        aria-label={filterPlaceholder}
        className="field-input pl-8"
      />
    </div>
  );

  if (horizontal) {
    return (
      <nav className={cn('flex items-center gap-4', className)}>
        {filter}
        {visible.length === 0 ? (
          <p className="text-[11px] text-slate-400">{emptyLabel}</p>
        ) : (
          visible.map((section, i) => (
            <div key={section.label} className="flex items-center gap-3">
              {i > 0 && <span className="h-4 w-px shrink-0 bg-slate-200 dark:bg-slate-700" aria-hidden />}
              {showSectionLabels && (
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {section.label}
                </span>
              )}
              <ul className="flex items-center gap-3">{section.items.map(link)}</ul>
            </div>
          ))
        )}
      </nav>
    );
  }

  return (
    <nav className={cn('flex flex-col gap-6', className)}>
      {filter}
      {visible.length === 0 ? (
        <p className="px-2 text-[11px] text-slate-400">{emptyLabel}</p>
      ) : (
        visible.map((section) => (
          <div key={section.label}>
            {showSectionLabels && (
              <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {section.label}
              </p>
            )}
            <ul>{section.items.map(link)}</ul>
          </div>
        ))
      )}
    </nav>
  );
}
