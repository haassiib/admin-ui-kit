'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Boxes } from 'lucide-react';

import AppShell from '@/components/layout/AppShell';
import NavMenu, { type NavSection } from '@/components/layout/NavMenu';
import ThemeSettings from '@/components/layout/ThemeSettings';
import Badge from '@/components/data/Badge';

/**
 * The gallery's own chrome, built from the library's `AppShell` and `NavMenu` —
 * so the shell the docs run inside is the same shell the docs document.
 */
export default function DashShell({
  sections,
  children,
}: {
  sections: NavSection[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AppShell
      brand={
        <Link href="/" className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <Boxes className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          Admin UI Kit
        </Link>
      }
      actions={
        <>
          <Badge tone="neutral">v1.0</Badge>
          <ThemeSettings />
        </>
      }
      sidebar={<NavMenu sections={sections} activeHref={pathname} filterable filterPlaceholder="Filter components…" />}
    >
      {children}
    </AppShell>
  );
}
