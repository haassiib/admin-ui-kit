'use client';

import {
  Area, AreaChart as RAreaChart, CartesianGrid, Line, LineChart as RLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import ChartCard, { ChartTooltip } from './ChartCard';
import { axisProps, seriesColor, type ChartSeries } from './chartSeries';
import { compactNumber, useChartPalette } from './chartTheme';

type Common = {
  title: string;
  hint?: string;
  data: Record<string, string | number>[];
  /** The x key — usually a date or period label. */
  x: string;
  series: ChartSeries[];
  format?: (v: number) => string;
  /** How an x value reads in the tooltip and the table. */
  xFormat?: (v: unknown) => string;
  height?: number;
  className?: string;
};

/**
 * Lines for change over time — one or several series on ONE axis.
 *
 * Two measures of different scale do not share this chart: a second y-axis
 * invents a correlation out of where the two scales happen to line up. Give
 * each its own chart, or index both to a common base.
 *
 * Lines are 2px; the hover crosshair snaps to the nearest x and one tooltip
 * lists every series there, so the pointer never has to land on a line. The
 * active point is an 8px dot ringed in the card's colour so it reads where
 * lines cross.
 */
export default function LineChart({ emphasis, ...props }: Common & {
  /** Draw this series in colour and the rest in grey — when one line is the point. */
  emphasis?: string;
}) {
  return <TimeChart {...props} kind="line" emphasis={emphasis} />;
}

/**
 * Areas for a trend where the filled volume matters — one series, or several
 * stacked into a total. The fill is a ~12% wash of the series hue with the
 * 2px line on top, never a saturated block.
 */
export function AreaChart({ stacked = false, ...props }: Common & { stacked?: boolean }) {
  return <TimeChart {...props} kind="area" stacked={stacked} />;
}

function TimeChart({
  kind,
  title,
  hint,
  data,
  x,
  series,
  stacked = false,
  emphasis,
  format = compactNumber,
  xFormat = (v) => String(v),
  height = 280,
  className,
}: Common & { kind: 'line' | 'area'; stacked?: boolean; emphasis?: string }) {
  const p = useChartPalette();
  const axis = axisProps(p);
  const colorOf = (s: ChartSeries, i: number) => (emphasis && s.key !== emphasis ? p.muted : seriesColor(p, s, i));

  const shared = (
    <>
      <CartesianGrid vertical={false} stroke={p.grid} />
      <XAxis dataKey={x} tickFormatter={(v) => xFormat(v)} minTickGap={24} {...axis} />
      <YAxis tickFormatter={format} width={48} {...axis} axisLine={false} />
      <Tooltip
        cursor={{ stroke: p.axis, strokeWidth: 1 }}
        content={(props) => <ChartTooltip {...props} format={format} labelFormat={xFormat} />}
      />
    </>
  );
  const activeDot = (color: string) => ({ r: 4, fill: color, stroke: p.surface, strokeWidth: 2 });

  return (
    <ChartCard
      title={title}
      hint={hint}
      className={className}
      empty={data.length === 0}
      legend={series.map((s, i) => ({ label: s.label, color: colorOf(s, i), shape: kind === 'line' ? 'line' : 'rect' }))}
      table={{
        columns: [
          { key: x, label: x.charAt(0).toUpperCase() + x.slice(1), format: xFormat },
          ...series.map((s) => ({ key: s.key, label: s.label, align: 'right' as const, format: (v: unknown) => format(Number(v)) })),
        ],
        rows: data,
      }}
    >
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {kind === 'line' ? (
            <RLineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              {shared}
              {series.map((s, i) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={colorOf(s, i)}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dot={false}
                  activeDot={activeDot(colorOf(s, i))}
                  isAnimationActive={false}
                />
              ))}
            </RLineChart>
          ) : (
            <RAreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              {shared}
              {series.map((s, i) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stackId={stacked ? 'stack' : undefined}
                  stroke={colorOf(s, i)}
                  strokeWidth={2}
                  fill={colorOf(s, i)}
                  fillOpacity={0.12}
                  activeDot={activeDot(colorOf(s, i))}
                  isAnimationActive={false}
                />
              ))}
            </RAreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
