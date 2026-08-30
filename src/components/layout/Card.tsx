'use client';

import { cn } from '@/lib/cn';

/**
 * The frosted panel every surface in this library sits on, as a component.
 *
 * `solid` turns off the backdrop blur — needed for anything that floats OVER
 * page content, where a translucent surface lets the rows behind read through.
 * The CSS recipes (`.panel`, `.panel-solid`) stay available for markup that
 * cannot take a component.
 */
export default function Card({
  title,
  subtitle,
  actions,
  footer,
  solid = false,
  padded = true,
  className,
  children,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  solid?: boolean;
  padded?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className={cn('panel', solid && 'panel-solid', 'flex flex-col', className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <div className="min-w-0">
            {title && <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn('min-h-0 flex-1', padded && 'p-4')}>{children}</div>
      {footer && (
        <footer className="border-t border-slate-200 px-4 py-2.5 dark:border-slate-700">{footer}</footer>
      )}
    </section>
  );
}
