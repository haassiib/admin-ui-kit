/* Origin: bonus-adjustment (96S2), verbatim. */
import { Activity } from 'lucide-react';
import { cn } from '@/lib/cn';
import { eventLabel, eventTone, isAdminEvent } from '@/lib/events';

/**
 * The events feed — which is also the audit trail. With Lark retired this table
 * is the only durable record that a payout happened (see the schema's note on
 * `Event`), so the dashboard shows it rather than a decorative activity list.
 *
 * Labels, tones and the admin/ordinary split come from `lib/events` so this and
 * the header's notification bell always describe a row the same way.
 */
export type FeedEvent = {
  id: number;
  type: string;
  createdAt: string;
  actor: string | null;
  ref: string | null;
  payload: Record<string, unknown> | null;
};

export default function ActivityFeed({
  events,
  isSuperUser,
}: {
  events: FeedEvent[];
  isSuperUser: boolean;
}) {
  // Ordinary users see the adjustment trail; administrators see everything,
  // including the auth events that only matter to them.
  const visible = isSuperUser ? events : events.filter((e) => !isAdminEvent(e.type));

  return (
    <div className="panel p-5 space-y-3 h-fit">
      <div className="flex items-center gap-2">
        <Activity className="w-3.5 h-3.5 text-slate-400" />
        <h2 className="panel-title">Recent activity</h2>
      </div>

      {visible.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Nothing recorded yet. Every release, submission and approval lands here — this feed is the
          audit trail, not a summary of one.
        </p>
      ) : (
        <ol className="space-y-2.5">
          {visible.map((event) => (
            <li key={event.id} className="flex gap-2.5 text-[11px]">
              <span className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', eventTone(event.type))} />
              <div className="min-w-0">
                <div className="text-slate-700 dark:text-slate-200">
                  {eventLabel(event.type)}
                  {event.ref && (
                    <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                      {' '}
                      {event.ref}
                    </span>
                  )}
                </div>
                <div className="text-slate-400 dark:text-slate-500 truncate">
                  {event.createdAt.slice(0, 16).replace('T', ' ')}
                  {event.actor ? ` · ${event.actor}` : ' · system'}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
