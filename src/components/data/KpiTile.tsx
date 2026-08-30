/* Origin: bonus-adjustment (96S2), verbatim. */
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Card anatomy, borrowed from marketing-stats: header row with an icon chip and
 * a title, a hairline divider, then the big tabular value bottom-left with a
 * small stacked secondary stat bottom-right.
 *
 * The fixed body min-height is what keeps every tile in the row the same height
 * whether its corner slot holds a two-line delta or a one-line subtitle.
 */
export function Delta({ value, positiveIsGood = true }: { value: number | null; positiveIsGood?: boolean }) {
  if (value === null || !Number.isFinite(value)) {
    return (
      <span className="flex flex-col items-end leading-tight">
        <span className="text-[10px] text-slate-400 dark:text-slate-500">vs prev 7d</span>
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">—</span>
      </span>
    );
  }

  const up = value >= 0;
  const flat = Math.abs(value) < 0.05;
  const good = positiveIsGood ? up : !up;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;

  return (
    <span className="flex flex-col items-end leading-tight">
      <span className="text-[10px] text-slate-400 dark:text-slate-500">vs prev 7d</span>
      <span
        className={cn(
          'inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums',
          flat
            ? 'text-slate-400 dark:text-slate-500'
            : good
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400',
        )}
      >
        <Icon className="w-3 h-3" />
        {Math.abs(value).toFixed(1)}%
      </span>
    </span>
  );
}

export default function KpiTile({
  title,
  value,
  icon,
  tone = 'indigo',
  delta,
  positiveIsGood = true,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  tone?: 'indigo' | 'amber' | 'violet' | 'emerald';
  delta?: number | null;
  positiveIsGood?: boolean;
  subtitle?: string;
}) {
  const chip = {
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  }[tone];

  return (
    <div className="panel p-0 overflow-hidden h-full flex flex-col">
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
        <div className={cn('rounded-lg p-1.5 shrink-0', chip)}>{icon}</div>
        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
          {title}
        </div>
      </div>
      <div className="flex flex-1 min-h-[3.25rem] items-end justify-between gap-2 px-4 py-3">
        <div className="min-w-0 text-2xl font-bold font-mono tabular-nums tracking-tight text-slate-900 dark:text-white truncate">
          {value}
        </div>
        {subtitle ? (
          <span className="text-[10px] text-right leading-tight text-slate-400 dark:text-slate-500 shrink-0 max-w-[45%]">
            {subtitle}
          </span>
        ) : (
          delta !== undefined && <Delta value={delta ?? null} positiveIsGood={positiveIsGood} />
        )}
      </div>
    </div>
  );
}
