'use client';

/* Origin: bonus-adjustment (96S2), verbatim. */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { ArrowRight, Bell, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { useDismiss } from '@/lib/use-dismiss';
import NotificationCard from './NotificationCard';
import type { HeaderNotification } from '@/components/overlay/NotificationCard';

/**
 * The header bell, rendering the mockup's notification cards
 * (docs/dashboard.html → `renderNotifications()`): a tinted, bordered card per
 * row with a bold title, the relative time on the right, and the detail beneath
 * — not a flat list.
 *
 * Rows are `events`, the audit trail that replaced Lark, and "unread" is this
 * user's own read state, so two people clearing their bells don't affect each
 * other. A row links to its request where it has one; there is no request
 * detail page yet (DASHBOARD-SPEC §4), so that link goes to the list.
 */
export default function NotificationBell({
  items,
  unread,
  onMarkRead,
  onMarkAllRead,
}: {
  items: HeaderNotification[];
  unread: number;
  /** Persist a read. Omit for a purely optimistic bell. */
  onMarkRead?: (eventIds: number[]) => Promise<{ error?: string } | void>;
  onMarkAllRead?: () => Promise<{ error?: string } | void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useDismiss(ref, open, () => setOpen(false));

  const readOne = (eventId: number) => {
    startTransition(async () => {
      const result = (await onMarkRead?.([eventId])) ?? {};
      if ('error' in result) toast.error(result.error);
      router.refresh();
    });
  };

  const readAll = () => {
    startTransition(async () => {
      const result = (await onMarkAllRead?.()) ?? {};
      if ('error' in result) toast.error(result.error);
      router.refresh();
    });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        className={cn(
          'relative p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
          open && 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200',
        )}
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none tabular-nums">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* `panel-solid` is `.panel` without the translucency: this floats over
          page content rather than sitting on the gradient ground, and at 60%
          white the rows behind it read straight through the list. Shared with
          the appearance and account menus so the three cannot drift apart. */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 panel panel-solid p-0 z-50 overflow-hidden">
          {/* The mockup's drawer header, kept verbatim in shape: bell, bold
              title, and the dismissive control on the right. */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Notifications
              {unread > 0 && (
                <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">
                  {unread} unread
                </span>
              )}
            </span>
            {unread > 0 && (
              <button
                type="button"
                onClick={readAll}
                disabled={pending}
                className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50"
              >
                <CheckCheck className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="p-6 text-xs text-center text-slate-400 dark:text-slate-500">
              Nothing yet. Releases, submissions and approvals land here.
            </p>
          ) : (
            <ol className="max-h-96 overflow-y-auto custom-scrollbar p-4 space-y-3">
              {items.map((n) => (
                <li key={n.eventId}>
                  <NotificationCard
                    item={n}
                    // There is no request detail page yet (DASHBOARD-SPEC §4),
                    // so a card carrying a request goes to the list.
                    href={n.requestId ? '/requests' : null}
                    disabled={pending}
                    onActivate={() => {
                      if (n.requestId) setOpen(false);
                      if (!n.read) readOne(n.eventId);
                    }}
                  />
                </li>
              ))}
            </ol>
          )}

          {/* Always present, including on an empty bell: the dropdown holds the
              latest NOTIFICATION_LIMIT only, so the way to the rest has to be a
              fixed part of the surface rather than something that appears once
              there is enough history to need it. Outside the scrolling <ol> so
              it stays pinned to the bottom edge. */}
          <div className="border-t border-slate-200 dark:border-slate-700 p-2">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 w-full rounded-lg px-3 py-2 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              See all notifications
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
