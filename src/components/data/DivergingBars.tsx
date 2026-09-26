'use client';

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard, { ChartTooltip } from './ChartCard';
import { axisProps } from './chartSeries';
import { useChartPalette } from './chartTheme';

export type DivergingItem = { label: string; value: number };

/**
 * Above or below a baseline — change against target, gain against loss.
 *
 * Two hues that read as OPPOSITES (blue for above, red for below) around a
 * zero line, so the sign reads before the size does. The value sits at each
 * bar's tip, signed, so the direction is never carried by colour alone.
 * Items keep the caller's order unless `sort` is set; a sorted list turns
 * the chart into a ranking, which is often the point.
 */
export default function DivergingBars({
  title,
  hint,
  data,
  sort = false,
  format = (v) => `${v > 0 ? '+' : ''}${v.toLocaleString()}`,
  valueLabel = 'Change',
  className,
}: {
  title: string;
  hint?: string;
  data: DivergingItem[];
  sort?: boolean;
  format?: (v: number) => string;
  /** What the value is, for the tooltip and the table. */
  valueLabel?: string;
  className?: string;
}) {
  const p = useChartPalette();
  const axis = axisProps(p);
  const rows = sort ? [...data].sort((a, b) => b.value - a.value) : data;

  return (
    <ChartCard
      title={title}
      hint={hint}
      className={className}
      empty={rows.length === 0}
      legend={[
        { label: 'Above', color: p.diverging.positive },
        { label: 'Below', color: p.diverging.negative },
      ]}
      table={{
        columns: [
          { key: 'label', label: 'Item' },
          { key: 'value', label: valueLabel, align: 'right', format: (v) => format(Number(v)) },
        ],
        rows,
      }}
    >
      <div style={{ height: Math.max(200, rows.length * 34 + 24) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 48, left: 0, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid horizontal={false} stroke={p.grid} />
            <XAxis type="number" tickFormatter={format} {...axis} />
            <YAxis type="category" dataKey="label" width={96} {...axis} axisLine={false} />
            <ReferenceLine x={0} stroke={p.axis} />
            <Tooltip
              cursor={{ fill: p.dark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)' }}
              content={(props) => <ChartTooltip {...props} format={format} />}
            />
            <Bar dataKey="value" name={valueLabel} maxBarSize={20} isAnimationActive={false}>
              {rows.map((d) => (
                <Cell
                  key={d.label}
                  fill={d.value >= 0 ? p.diverging.positive : p.diverging.negative}
                  // Round the data-end, square at the zero line — which end
                  // that is depends on the sign.
                  radius={(d.value >= 0 ? [0, 4, 4, 0] : [4, 0, 0, 4]) as unknown as number}
                />
              ))}
              <LabelList dataKey="value" position="right" formatter={(v: unknown) => format(Number(v))} style={{ fontSize: 11, fill: p.inkSecondary }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
