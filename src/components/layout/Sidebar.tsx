'use client';

/* Origin: bonus-adjustment (96S2), verbatim. */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { MenuItem } from '@/lib/menu';
import { cn } from '@/lib/cn';
import { useSidebar } from '@/contexts/SidebarContext';
import Avatar from './Avatar';
import MenuIcon from './MenuIcon';

/**
 * The nav, in marketing-stats' shape: a frosted panel that is a rail at
 * `lg:w-20` when collapsed and expands on hover, off-canvas below `lg`.
 *
 * Two behaviours worth knowing:
 *   * Hover-expand is temporary and doesn't touch the stored preference — the
 *     collapsed rail is still "collapsed" after the pointer leaves.
 *   * While collapsed AND not hover-expanded, a group can't expand in place
 *     (there is no room for labels), so its children open in a popover instead
 *     of becoming unreachable.
 *
 * It receives an ALREADY permission-filtered tree. The filtering is
 * `buildMenuTree` on the server, never here — a client-side filter is a
 * suggestion, not a boundary.
 */

/** Segment-aware, so '/requests' never lights up for '/requests-archive'. */
const matches = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

function isActiveTree(item: MenuItem, pathname: string): boolean {
  if (item.href && matches(pathname, item.href)) return true;
  return item.children.some((c) => isActiveTree(c, pathname));
}

/** Ids of every group containing the current route — expanded on navigation. */
function activeGroupIds(items: MenuItem[], pathname: string, acc: number[] = []): number[] {
  for (const item of items) {
    if (item.children.length > 0 && isActiveTree(item, pathname)) {
      acc.push(item.id);
      activeGroupIds(item.children, pathname, acc);
    }
  }
  return acc;
}

function Row({
  item,
  pathname,
  level,
  collapsed,
}: {
  item: MenuItem;
  pathname: string;
  level: number;
  collapsed: boolean;
}) {
  const { expanded, toggleExpanded, setOpen } = useSidebar();
  const [hovering, setHovering] = useState(false);
  const hasChildren = item.children.length > 0;
  const isGroup = !item.href && hasChildren;
  const active = isActiveTree(item, pathname);
  const isOpen = expanded.has(item.id);

  const rowClasses = cn(
    'flex items-center w-full text-sm font-medium rounded-lg transition-colors cursor-pointer group',
    collapsed ? 'px-3 py-3 justify-center' : 'px-3 py-3',
    level > 0 && !collapsed && 'ml-6',
    active
      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50',
  );

  const icon = (
    <MenuIcon
      name={item.icon}
      className={cn(
        'w-5 h-5 shrink-0 transition-colors',
        active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400',
      )}
    />
  );

  const label = (
    <span
      className={cn(
        'whitespace-nowrap transition-all duration-300',
        collapsed && !hasChildren
          ? // Collapsed leaf: the label becomes a hover tooltip rather than
            // disappearing, so an icon-only rail is still navigable.
            'absolute left-full ml-2 px-2 py-1 rounded bg-slate-900 text-white text-xs shadow-lg invisible group-hover:visible z-50'
          : collapsed
            ? 'opacity-0 w-0'
            : 'opacity-100 w-auto ml-3 flex-1 truncate',
      )}
    >
      {item.name}
    </span>
  );

  const children = (
    <div className="mt-1 space-y-1">
      {item.children.map((child) => (
        <Row key={child.id} item={child} pathname={pathname} level={level + 1} collapsed={false} />
      ))}
    </div>
  );

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {item.href ? (
        <Link
          href={item.href}
          // Closing the off-canvas drawer on navigation. On desktop `open` is
          // unused, so this is harmless there.
          onClick={() => setOpen(false)}
          className={rowClasses}
        >
          {icon}
          {label}
        </Link>
      ) : (
        <div onClick={() => toggleExpanded(item.id)} className={rowClasses}>
          {icon}
          {label}
          {hasChildren && !collapsed && (
            <ChevronDown
              className={cn(
                'w-4 h-4 text-slate-400 shrink-0 transition-transform',
                isOpen && 'rotate-180',
              )}
            />
          )}
        </div>
      )}

      {hasChildren && !collapsed && (isOpen || (!isGroup && active)) && children}

      {hasChildren && collapsed && hovering && (
        <div className="absolute left-full top-0 ml-2 w-48 z-50 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg p-2 space-y-1">
          <div className="px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white">
            {item.name}
          </div>
          {children}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({
  items,
  user,
}: {
  items: MenuItem[];
  user: { name: string | null; email: string; avatarUrl: string | null };
}) {
  const pathname = usePathname();
  const { collapsed, open, setOpen, setExpanded } = useSidebar();
  const [hoverExpanded, setHoverExpanded] = useState(false);

  // Open whichever group contains the current route. Groups the user closed by
  // hand stay closed until they navigate into them.
  useEffect(() => {
    setExpanded(activeGroupIds(items, pathname));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const isEffectivelyCollapsed = collapsed && !hoverExpanded;

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-slate-600/50 z-40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <div
        onMouseEnter={() => collapsed && setHoverExpanded(true)}
        onMouseLeave={() => setHoverExpanded(false)}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col overflow-y-auto custom-scrollbar',
          'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-r border-black/10 dark:border-white/10',
          'transition-all duration-300 ease-in-out lg:static lg:translate-x-0',
          isEffectivelyCollapsed && 'overflow-x-hidden',
          open ? 'translate-x-0' : '-translate-x-full',
          // w-60 rather than a round w-64: sized to the widest nested label
          // ("Permissions" under Settings) plus the row's chrome. The mobile
          // panel keeps w-64 — it overlays content, so a narrower one buys
          // nothing there.
          isEffectivelyCollapsed ? 'w-64 lg:w-20' : 'w-64 lg:w-60',
        )}
      >
        <div
          className={cn(
            'flex items-center h-16 shrink-0 border-b border-slate-200 dark:border-slate-700',
            isEffectivelyCollapsed ? 'px-4 justify-center' : 'px-6',
          )}
        >
          <Avatar name={user.name} email={user.email} avatarUrl={user.avatarUrl} size="md" />
          <span
            className={cn(
              'ml-3 text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap truncate transition-all duration-300',
              isEffectivelyCollapsed ? 'opacity-0 w-0' : 'opacity-100',
            )}
          >
            {user.name || user.email}
          </span>
        </div>

        <nav className={cn('mt-4 space-y-1 flex-1', isEffectivelyCollapsed ? 'px-2' : 'px-4')}>
          {items.map((item) => (
            <Row
              key={item.id}
              item={item}
              pathname={pathname}
              level={0}
              collapsed={isEffectivelyCollapsed}
            />
          ))}
        </nav>
      </div>
    </>
  );
}
