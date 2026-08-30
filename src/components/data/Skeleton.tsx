'use client';

import { cn } from '@/lib/cn';

/**
 * A loading placeholder shaped like the thing it replaces.
 *
 * `lines > 1` staggers the last line short, because a block of equal-length bars
 * reads as a table, not as text.
 */
export default function Skeleton({
  variant = 'text',
  lines = 1,
  className,
}: {
  variant?: 'text' | 'circle' | 'rect';
  lines?: number;
  className?: string;
}) {
  const base = 'animate-pulse bg-slate-200 dark:bg-slate-700';
  if (variant === 'circle') return <span className={cn(base, 'block rounded-full', className ?? 'h-9 w-9')} aria-hidden />;
  if (variant === 'rect') return <span className={cn(base, 'block rounded-lg', className ?? 'h-24 w-full')} aria-hidden />;
  return (
    <span className="block space-y-1.5" aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className={cn(base, 'block h-3 rounded', i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full', className)} />
      ))}
    </span>
  );
}
