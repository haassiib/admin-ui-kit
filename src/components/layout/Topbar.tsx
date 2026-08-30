'use client';

/* Origin: bonus-adjustment (96S2), verbatim. */

import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import Breadcrumbs from './Breadcrumbs';
import NotificationBell from '@/components/overlay/NotificationBell';
import ThemeSettings from './ThemeSettings';
import UserDropdown, { type DropdownUser } from './UserDropdown';
import type { HeaderNotification } from '@/components/overlay/NotificationCard';

/**
 * The one header row, in marketing-stats' shape: a frosted h-16 bar carrying the
 * sidebar toggle, the breadcrumb trail, and the notification/appearance/account
 * controls.
 *
 * Pages don't render their own heading — the trail's last crumb IS the page
 * title, which is what keeps the two from ever disagreeing.
 */
export default function Topbar({
  labels,
  user,
  notifications,
  unreadCount,
  logoutAction,
}: {
  labels: Record<string, string>;
  user: DropdownUser;
  notifications: HeaderNotification[];
  unreadCount: number;
  logoutAction: () => Promise<void>;
}) {
  const { collapsed, toggleCollapsed, setOpen } = useSidebar();

  return (
    <header className="relative z-40 h-16 shrink-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-black/10 dark:border-white/10">
      <div className="flex items-center justify-between h-full px-6">
        {/* flex-1 min-w-0 lets the trail's current-page name truncate instead of
            pushing the right-hand cluster off screen. */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex items-center justify-center w-8 h-8 shrink-0 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            className="lg:hidden p-2 rounded-md shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Breadcrumbs labels={labels} />
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <NotificationBell items={notifications} unread={unreadCount} />
          <ThemeSettings />
          <UserDropdown user={user} logoutAction={logoutAction} />
        </div>
      </div>
    </header>
  );
}
