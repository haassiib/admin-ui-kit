'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Boxes, Menu, Search, X } from 'lucide-react';

import NavMenu, { type NavSection } from '@/components/layout/NavMenu';
import ThemeSettings from '@/components/layout/ThemeSettings';
import Badge from '@/components/data/Badge';
import { cn } from '@/lib/cn';

/**
 * The gallery's own chrome: a nav rail, a header and a scrolling content area,
 * with the library's `NavMenu` in the rail.
 *
 * `<main>` is the ONLY scroll container. `h-screen` on the root plus `min-h-0`
 * on the content column is what makes it a definite-height scroll box, so a page
 * that says `flex-1 min-h-0` is genuinely bounded. It also matters for a reason
 * that is easy to miss: most dropdowns and calendars position themselves
 * ABSOLUTELY inside their trigger, and any extra `overflow` ancestor clips them
 * — the menu opens and is painted away. So content fills by GROWING
 * (`flex-1 min-h-full` on the wrapper), never by nesting another scroller.
 *
 * The search sits in the HEADER and drives the sidebar from there: the query is
 * held here and handed to `NavMenu` as a controlled `filter`, so the field and
 * the list it filters do not have to be neighbours.
 */
export default function DashShell({
  sections,
  children,
}: {
  sections: NavSection[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  // Close the drawer on Escape. Without it the only way out is the backdrop,
  // which is not reachable from a keyboard.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-950">
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white',
          'dark:border-slate-800 dark:bg-slate-950',
          'transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-4 dark:border-slate-800">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 text-sm font-bold text-slate-900 dark:text-white"
          >
            <Boxes className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            Admin UI Kit
          </Link>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <NavMenu
            sections={sections}
            activeHref={pathname}
            filter={query}
            emptyLabel="No components match"
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="relative min-w-0 max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search components…"
              aria-label="Search components"
              className="field-input pl-8 pr-8"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge tone="neutral">v1.0</Badge>
            <ThemeSettings />
          </div>
        </header>

        <main className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-auto">
          {/* `flex-1` fills when the page is short; `min-h-full` keeps it filled
              once main is scrolling, where `flex-1` alone collapses back to
              content height. `min-w-0` lets a wide table shrink instead of
              forcing the column past the viewport. The docs are mostly tables
              and grids, so the column is fluid rather than capped. */}
          <div className="mx-auto flex min-h-full w-full min-w-0 flex-1 flex-col px-6 py-8">
            {children}
            {/* The content pads 32px at the foot; this makes it 4x, so the last
                component clears the bottom edge instead of stopping flush with
                it. A spacer rather than a wrapper, so a page that fills with
                `flex-1` still does. */}
            <div aria-hidden className="h-24 shrink-0" />
          </div>
        </main>
      </div>
    </div>
  );
}
