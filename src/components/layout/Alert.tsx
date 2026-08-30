'use client';

import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import { cn } from '@/lib/cn';

const TONE = {
  info: { cls: 'border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200', Icon: Info },
  success: { cls: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200', Icon: CircleCheck },
  warning: { cls: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200', Icon: TriangleAlert },
  danger: { cls: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200', Icon: CircleAlert },
} as const;

/**
 * An inline message that stays on the page — for a condition the user has to
 * read before acting. Transient feedback belongs in a toast, not here.
 */
export default function Alert({
  tone = 'info',
  title,
  onDismiss,
  className,
  children,
}: {
  tone?: keyof typeof TONE;
  title?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
  children?: React.ReactNode;
}) {
  const { cls, Icon } = TONE[tone];
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('flex gap-2.5 rounded-lg border px-3 py-2.5', cls, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 text-xs leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title ? "mt-0.5" : null, "opacity-90")}>{children}</div>}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} aria-label="Dismiss" className="shrink-0 opacity-60 hover:opacity-100">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
