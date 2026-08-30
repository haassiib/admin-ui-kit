/* Origin: bonus-adjustment (96S2), verbatim. */
import { RequestStatus, displayFor } from '@/lib/status';

/**
 * The four-state lifecycle as one proportional bar plus a legend.
 *
 * A bar rather than a chart on purpose: there is one dimension here (how the
 * open queue is distributed), and a stacked bar reads it at a glance without
 * pulling a charting library into the bundle for a single figure.
 */
export default function StatusBar({ counts }: { counts: Record<string, number> }) {
  const statuses = Object.values(RequestStatus);
  const total = statuses.reduce((sum, s) => sum + (counts[s] ?? 0), 0);

  return (
    <div className="panel p-5 space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="panel-title">Queue by status</h2>
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          {total} request{total === 1 ? '' : 's'}
        </span>
      </div>

      {total === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Nothing in the queue. Statuses appear here as requests move through the lifecycle.
        </p>
      ) : (
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          {statuses.map((status) => {
            const count = counts[status] ?? 0;
            if (count === 0) return null;
            return (
              <div
                key={status}
                title={`${displayFor(status).label}: ${count}`}
                style={{ width: `${(count / total) * 100}%` }}
                className={displayFor(status).dot}
              />
            );
          })}
        </div>
      )}

      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5">
        {statuses.map((status) => {
          const display = displayFor(status);
          const count = counts[status] ?? 0;
          return (
            <li key={status} className="flex items-center gap-1.5 text-[11px]" title={display.hint}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${display.dot}`} />
              <span className="text-slate-500 dark:text-slate-400 truncate">{display.label}</span>
              <span className="ml-auto font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                {count}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
