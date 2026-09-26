'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import ChartCard, { ChartTooltip } from './ChartCard';
import { compactNumber, useChartPalette } from './chartTheme';

export type DonutSlice = { label: string; value: number };

/** Past this many slices, the rest fold into "Other". */
const MAX_SLICES = 6;

/**
 * Part-to-whole at a glance — a handful of slices around the total.
 *
 * A donut is for "roughly what share", never for comparing close values;
 * reach for a bar when the reader needs to rank the parts. So it is capped:
 * past six slices the smallest fold into "Other" (never a seventh generated
 * hue), and every slice is also listed beside the ring with its value and
 * share, which is what makes it readable at all — identity never rests on
 * matching a colour.
 */
export default function DonutChart({
  title,
  hint,
  data,
  format = compactNumber,
  centerLabel = 'Total',
  height = 220,
  className,
}: {
  title: string;
  hint?: string;
  data: DonutSlice[];
  format?: (v: number) => string;
  centerLabel?: string;
  height?: number;
  className?: string;
}) {
  const p = useChartPalette();
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const slices =
    sorted.length > MAX_SLICES
      ? [...sorted.slice(0, MAX_SLICES - 1), { label: 'Other', value: sorted.slice(MAX_SLICES - 1).reduce((s, d) => s + d.value, 0) }]
      : sorted;
  const total = slices.reduce((s, d) => s + d.value, 0);
  const share = (v: number) => (total ? `${((v / total) * 100).toFixed(1)}%` : '—');
  // "Other" is context, not an entity: it takes the grey, not a hue.
  const colorOf = (d: DonutSlice, i: number) => (d.label === 'Other' && sorted.length > MAX_SLICES ? p.muted : p.categorical[i]);

  return (
    <ChartCard
      title={title}
      hint={hint}
      className={className}
      empty={total === 0}
      table={{
        columns: [
          { key: 'label', label: 'Segment' },
          { key: 'value', label: 'Value', align: 'right', format: (v) => format(Number(v)) },
          { key: 'share', label: 'Share', align: 'right' },
        ],
        rows: slices.map((d) => ({ ...d, share: share(d.value) })),
      }}
    >
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative shrink-0" style={{ width: height, height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="label"
                innerRadius="64%"
                outerRadius="100%"
                startAngle={90}
                endAngle={-270}
                // The 2px surface gap between slices.
                stroke={p.surface}
                strokeWidth={2}
                isAnimationActive={false}
              >
                {slices.map((d, i) => (
                  <Cell key={d.label} fill={colorOf(d, i)} />
                ))}
              </Pie>
              <Tooltip content={(props) => <ChartTooltip {...props} format={(v) => `${format(v)} · ${share(v)}`} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold text-slate-900 dark:text-slate-50">{format(total)}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{centerLabel}</span>
          </div>
        </div>
        <ul className="w-full min-w-0 flex-1 space-y-1.5 text-xs">
          {slices.map((d, i) => (
            <li key={d.label} className="flex items-center gap-2">
              <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: colorOf(d, i) }} />
              <span className="min-w-0 flex-1 truncate text-slate-600 dark:text-slate-300">{d.label}</span>
              <span className="tabular-nums font-medium text-slate-900 dark:text-slate-100">{format(d.value)}</span>
              <span className="w-12 text-right tabular-nums text-slate-500 dark:text-slate-400">{share(d.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
}
