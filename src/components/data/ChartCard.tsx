'use client';

import { useState, type ReactNode } from 'react';
import { BarChart3, Table2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { InfoTooltip } from '@/components/overlay/Tooltip';

export type ChartTableColumn = { key: string; label: string; align?: 'left' | 'right'; format?: (v: unknown) => string };

/**
 * The frame every chart here sits in: a title (with its explanation behind an
 * ⓘ), a legend, the plot, and a TABLE VIEW one click away.
 *
 * The table is not optional polish. It is the view that works for a screen
 * reader, for a colour-blind reader where two hues still sit close, and for
 * anyone who wants the exact number rather than a bar's length — so a
 * tooltip is never the only way to read a value. The toggle is two icons, so
 * the chart stays the first thing seen.
 */
export default function ChartCard({
  title,
  hint,
  legend,
  table,
  actions,
  empty = false,
  className,
  children,
}: {
  title: string;
  /** What the chart shows and how to read it — behind an ⓘ beside the title. */
  hint?: string;
  /** Series keys, for two or more series. A single series needs none: the title names it. */
  legend?: { label: string; color: string; shape?: 'rect' | 'line' | 'dot' }[];
  /** Rows and columns for the table view. Absent, the toggle is hidden. */
  table?: { columns: ChartTableColumn[]; rows: Record<string, unknown>[] };
  actions?: ReactNode;
  empty?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [view, setView] = useState<'chart' | 'table'>('chart');

  return (
    <section className={cn('panel p-5', className)} aria-label={title}>
      <header className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="panel-title flex items-center gap-1.5">
          {title}
          {hint && <InfoTooltip content={hint} label={`About ${title}`} wide />}
        </h2>
        {legend && legend.length > 1 && view === 'chart' && (
          <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 dark:text-slate-300">
            {legend.map((l) => (
              <li key={l.label} className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  style={{ background: l.color }}
                  className={cn(
                    'shrink-0',
                    l.shape === 'line' ? 'h-[3px] w-3.5 rounded-full' : l.shape === 'dot' ? 'h-2 w-2 rounded-full' : 'h-2.5 w-2.5 rounded-sm',
                  )}
                />
                {l.label}
              </li>
            ))}
          </ul>
        )}
        <div className="ml-auto flex items-center gap-1">
          {actions}
          {table && (
            <div role="group" aria-label="Chart or table" className="flex overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              {(['chart', 'table'] as const).map((v) => {
                const Icon = v === 'chart' ? BarChart3 : Table2;
                return (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={view === v}
                    aria-label={v === 'chart' ? 'Show chart' : 'Show table'}
                    title={v === 'chart' ? 'Chart' : 'Table'}
                    onClick={() => setView(v)}
                    className={cn(
                      'p-1.5 transition-colors',
                      view === v
                        ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {empty ? (
        <div className="flex h-[240px] items-center justify-center text-xs text-slate-400 dark:text-slate-500">No data for the selected period.</div>
      ) : view === 'table' && table ? (
        <div className="max-h-[320px] overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="data-table">
            <thead>
              <tr>
                {table.columns.map((c) => (
                  <th key={c.key} className={cn('px-3', c.align === 'right' && 'text-right')}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i}>
                  {table.columns.map((c) => (
                    <td key={c.key} className={cn('px-3', c.align === 'right' && 'text-right tabular-nums')}>
                      {c.format ? c.format(r[c.key]) : String(r[c.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </section>
  );
}

/**
 * The hover readout the Recharts charts share: VALUE first and strong, the
 * series name after it in secondary ink, keyed by a short stroke of the series
 * colour rather than a filled box — at tooltip density a box is data-weight
 * ink doing a label's job. One tooltip lists every series at that point.
 */
export function ChartTooltip({
  active,
  label,
  payload,
  format = (v) => String(v),
  labelFormat = (l) => String(l),
}: {
  active?: boolean;
  label?: unknown;
  payload?: readonly { name?: unknown; value?: unknown; color?: string; payload?: unknown }[];
  format?: (v: number) => string;
  labelFormat?: (l: unknown) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="panel panel-solid min-w-[8rem] px-3 py-2 text-xs shadow-lg">
      {label !== undefined && label !== '' && <p className="mb-1 text-[11px] text-slate-500 dark:text-slate-400">{labelFormat(label)}</p>}
      <ul className="space-y-0.5">
        {payload.map((p, i) => (
          <li key={i} className="flex items-center gap-2">
            <span aria-hidden className="h-[3px] w-3.5 shrink-0 rounded-full" style={{ background: p.color }} />
            <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-50">{format(Number(p.value))}</span>
            <span className="text-slate-500 dark:text-slate-400">{String(p.name ?? '')}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
