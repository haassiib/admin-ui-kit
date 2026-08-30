'use client';

/* Origin: bonus-adjustment (96S2), verbatim. */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home } from 'lucide-react';

/**
 * The trail in the topbar, and the page's only <h1>.
 *
 * Labels come from the same `menus` table the sidebar renders from (passed down
 * as an href -> name map), so the trail can never disagree with the nav. Routes
 * with no menu row — /profile, /change-password — fall back to STATIC_LABELS
 * and then to a humanised segment.
 *
 * Intermediate segments render as plain text, not links: a grouping parent like
 * "Settings" has no page of its own, and a link to a 404 is worse than no link.
 */

const STATIC_LABELS: Record<string, string> = {
  '/profile': 'My Profile',
  // Reached from the bell's "See all", not from the sidebar — so it has no
  // menu row and needs its label here.
  '/notifications': 'Notifications',
  '/change-password': 'Change Password',
  '/settings': 'Settings',
};

const humanize = (segment: string) =>
  segment
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');

export default function Breadcrumbs({ labels }: { labels: Record<string, string> }) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const crumbs = segments.map((segment, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/');
    return {
      href,
      label: labels[href] ?? STATIC_LABELS[href] ?? humanize(decodeURIComponent(segment)),
    };
  });

  const current = crumbs.at(-1) ?? null;
  const intermediates = crumbs.slice(0, -1);

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-2 min-w-0 text-xs">
        <li className={current ? 'hidden md:block' : 'min-w-0'}>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <Home className="w-3.5 h-3.5" />
            {labels['/'] ?? 'Dashboard'}
          </Link>
        </li>
        {intermediates.map((crumb) => (
          <li key={crumb.href} className="hidden md:flex items-center gap-2">
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-slate-500 dark:text-slate-400">{crumb.label}</span>
          </li>
        ))}
        {current && (
          <li className="min-w-0 flex items-center gap-2">
            <span className="hidden md:inline text-slate-300 dark:text-slate-600">/</span>
            <h1 className="text-base font-semibold text-slate-800 dark:text-slate-100 truncate">
              {current.label}
            </h1>
          </li>
        )}
      </ol>
    </nav>
  );
}
