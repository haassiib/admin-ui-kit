'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Boxes, Search, X } from 'lucide-react';

import Layout from '@/components/layout/Layout';
import NavMenu, { type NavSection } from '@/components/layout/NavMenu';
import ThemeSettings from '@/components/layout/ThemeSettings';
import Badge from '@/components/data/Badge';

/**
 * The gallery's own chrome, built from the library's `Layout` and `NavMenu` — so
 * the frame the docs run inside is the same frame the docs document.
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

  return (
    <Layout
      brand={
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-sm font-bold text-slate-900 dark:text-white"
        >
          <Boxes className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          Admin UI Kit
        </Link>
      }
      search={
        <div className="relative">
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
      }
      actions={
        <>
          <Badge tone="neutral">v1.0</Badge>
          <ThemeSettings />
        </>
      }
      sidebar={
        <NavMenu
          sections={sections}
          activeHref={pathname}
          filter={query}
          emptyLabel="No components match"
        />
      }
    >
      {children}
    </Layout>
  );
}
