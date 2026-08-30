'use client';

import { cn } from '@/lib/cn';

const TONE = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  info: 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/30',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30',
} as const;

export type BadgeTone = keyof typeof TONE;

/** A status pill. `dot` prefixes a filled circle for a state rather than a count. */
export default function Badge({
  tone = 'neutral',
  dot = false,
  className,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        // `leading-none` is load-bearing, not tidying. The density rules set a
        // line-height of 32-48px on every table cell, and an inline-flex badge
        // inherits it — which stretches the pill into an oval the moment one is
        // used inside a table, which is most of the time.
        'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold leading-none ring-1 ring-inset',
        TONE[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />}
      {children}
    </span>
  );
}
