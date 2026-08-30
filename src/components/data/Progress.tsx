'use client';

import { cn } from '@/lib/cn';

const TONE = {
  indigo: 'bg-indigo-600',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
} as const;

/**
 * A determinate bar. `value` is clamped, because a percentage computed from live
 * counts goes over 100 more often than anyone expects and an overflowing bar
 * paints outside its track.
 */
export default function Progress({
  value,
  max = 100,
  tone = 'indigo',
  label,
  showValue = false,
  className,
}: {
  value: number;
  max?: number;
  tone?: keyof typeof TONE;
  label?: React.ReactNode;
  showValue?: boolean;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="mb-1 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
          {label && <span>{label}</span>}
          {showValue && <span className="font-semibold tabular-nums">{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
      >
        <div className={cn('h-full rounded-full transition-[width] duration-300', TONE[tone])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
