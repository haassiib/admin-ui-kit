'use client';

export type HeaderNotification = {
  /** The EVENT id — `notifications.id` is an implementation detail of read state. */
  eventId: number;
  type: string;
  createdAt: string;
  actor: string | null;
  ref: string | null;
  requestId: number | null;
  read: boolean;
};

/* Origin: bonus-adjustment (96S2), verbatim. */

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/cn';
import { eventCardTint, eventLabel, relativeTime } from '@/lib/events';

/**
 * One notification, as the mockup's tinted card (docs/dashboard.html →
 * `renderNotifications()`): `p-3 <tint> border rounded-lg text-xs space-y-1
 * shadow-sm`, a bold title, the relative time on the right, and the ref and
 * actor beneath.
 *
 * Shared by the header bell and the full notifications page. It was the bell's
 * inline markup first; the page needs the identical row, and two copies of a
 * tint-plus-title recipe drift the moment one of them gains a field.
 *
 * A card that belongs to a request is a LINK; one that does not is a button
 * whose only job is to mark itself read, and it is disabled once it is — a
 * control that looks pressable but does nothing is worse than a flat card.
 */
export default function NotificationCard({
  item,
  href,
  onActivate,
  disabled = false,
}: {
  item: HeaderNotification;
  /** Where the card goes when it has somewhere to go. Null renders the button form. */
  href?: string | null;
  /** Marking read, closing the dropdown — whatever the caller does on a click. */
  onActivate?: () => void;
  /** Caller's in-flight state. Ignored by the link form: navigation must not block. */
  disabled?: boolean;
}) {
  const tint = eventCardTint(item.type, item.read);

  const body = (
    <>
      <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-100 gap-2">
        <span className="flex items-center gap-1.5 min-w-0">
          <Bell className={cn('w-3.5 h-3.5 shrink-0', tint.icon)} />
          <span className="truncate">{eventLabel(item.type)}</span>
        </span>
        <span
          className="text-[10px] text-slate-400 dark:text-slate-500 font-normal shrink-0"
          title={item.createdAt.slice(0, 16).replace('T', ' ')}
        >
          {relativeTime(item.createdAt)}
        </span>
      </div>
      <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
        {item.ref && (
          <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
            {item.ref}{' '}
          </span>
        )}
        {item.actor ? `by ${item.actor}` : 'by the system'}
      </p>
    </>
  );

  // The mockup's card recipe, verbatim.
  const cardClasses = cn(
    'block w-full text-left p-3 border rounded-lg text-xs space-y-1 shadow-sm transition-colors',
    tint.card,
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(cardClasses, 'hover:brightness-95 dark:hover:brightness-110')}
        onClick={onActivate}
      >
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled || item.read}
      onClick={onActivate}
      className={cn(
        cardClasses,
        item.read ? 'cursor-default' : 'hover:brightness-95 dark:hover:brightness-110',
      )}
    >
      {body}
    </button>
  );
}
