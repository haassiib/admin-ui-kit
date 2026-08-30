'use client';

/**
 * The gallery shell IS bonus-adjustment's dashboard shell.
 *
 * The markup below is that app's `(dash)/layout.tsx`, structure for structure:
 * a full-height flex row on the gradient ground, its real `Sidebar` beside a
 * content column holding its real `Topbar` and a `<main>` that owns the scroll.
 * The only substitutions are the data — the menu tree is the component catalog,
 * and the user/notifications come from the demo fixtures instead of Postgres.
 *
 * `h-screen` plus the column's `min-h-0` is the load-bearing part: it makes
 * <main> a definite-height scroll container, so a page's own `flex-1 min-h-0`
 * root is genuinely bounded and its panel becomes the scroll box rather than the
 * whole page growing.
 *
 * WHY THIS IS A CLIENT COMPONENT and not the root layout itself: `Topbar` and
 * `IdleLogout` both take a `logoutAction` FUNCTION. A server component may only
 * hand a client one serializable props or a real server action, and the gallery
 * has neither — its sign-out is a no-op. Owning the shell on the client lets the
 * no-op be an ordinary function, and the layout still passes `menu`, `labels`
 * and the fixtures across the boundary as the plain data they are.
 */

import { useEffect } from 'react';

import IdleLogout from '@/components/layout/IdleLogout';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { useSidebar } from '@/contexts/SidebarContext';
import type { MenuItem } from '@/lib/menu';
import { collectGroupIds } from '@/registry/menu';
import type { HeaderNotification } from '@/components/overlay/NotificationCard';

/** Signing out of a gallery would mean nothing; the components still get a real
    function, so their own state transitions run. */
const logoutAction = async () => {
  console.info('[gallery] logout() called — no-op in the component library');
};

export default function DashShell({
  menu,
  labels,
  user,
  notifications,
  children,
}: {
  menu: MenuItem[];
  labels: Record<string, string>;
  user: {
    name: string | null;
    email: string;
    avatarUrl: string | null;
    roleNames: string[];
    departmentCode: string | null;
  };
  notifications: HeaderNotification[];
  children: React.ReactNode;
}) {
  const { setExpanded } = useSidebar();

  // Open every group once, on mount. Nothing is expanded by default, which is
  // right for an app with eight menus and wrong for an index of seventy
  // components — the list has to be visible for the sidebar to be the
  // navigation. `setExpanded` is additive and is what `Sidebar` itself calls to
  // open the active group, so this adds to that rather than overriding it, and
  // a group the user closes by hand stays closed.
  useEffect(() => {
    setExpanded(collectGroupIds(menu));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 dark:from-slate-900 dark:via-slate-950 dark:to-black">
      <Sidebar items={menu} user={user} />

      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
        {/* Harmless here — the action logs rather than ending a session — but
            kept in place so the shell is the real one, not a lookalike. */}
        <IdleLogout logoutAction={logoutAction} />

        <Topbar
          labels={labels}
          user={user}
          notifications={notifications}
          unreadCount={notifications.filter((n) => !n.read).length}
          logoutAction={logoutAction}
        />

        {/*
          `<main>` is the ONE scroll container in the shell, and it has to stay
          that way. Fourteen of the fifty components open an ABSOLUTELY
          positioned popover, and any `overflow` ancestor clips those — so the
          obvious way to make a page fill its space, giving the panel its own
          scroll box, would silently paint half the dropdowns away. Height is
          therefore handled by growing the wrapper, never by nesting a scroller.

          `flex-1` makes the wrapper fill main when the page is short;
          `min-h-full` keeps it filling once main is scrolling, where `flex-1`
          alone would collapse back to content height. `min-w-0` lets a wide
          child (a table, the paste grid) shrink instead of forcing the column
          wider than the viewport.
        */}
        <main className="flex flex-1 min-h-0 flex-col overflow-auto custom-scrollbar">
          <div className="flex min-h-full min-w-0 flex-1 flex-col px-6 pt-4 pb-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
