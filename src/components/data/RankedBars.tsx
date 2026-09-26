'use client';

/* Origin: marketing-stats (96S1), verbatim. */

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { RankedRow } from './types';
import { compactCurrency, useChartTheme } from './chartTheme';

// Horizontal bars ranked by Total Spend — the natural form for a short ranked
// list of named categories (labels stay readable on the y-axis instead of being
// rotated under vertical bars).
export default function RankedBars({ rows }: { rows: RankedRow[] }) {
  const t = useChartTheme();

  return (
    <div className="panel p-5">
      <h2 className="panel-title mb-3">Top Items by Spend</h2>
      {rows.length === 0 ? (
        <div className="flex h-[320px] items-center justify-center text-xs text-slate-400 dark:text-slate-500">No data for the selected period.</div>
      ) : (
        <div style={{ height: Math.max(220, rows.length * 40 + 24) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 56, left: 8, bottom: 4 }}>
              <XAxis type="number" hide tickFormatter={compactCurrency} />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fontSize: 12, fill: t.axis }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={t.tooltip}
                cursor={{ fill: t.dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
                formatter={(v, _n, item) => {
                  const row = item?.payload as RankedRow;
                  return [`${compactCurrency(Number(v))}  ·  ${row.ftd} FTD  ·  ROI ${row.roi.toFixed(1)}%`, 'Total Spend'];
                }}
              />
              <Bar dataKey="totalSpend" radius={[0, 4, 4, 0]} maxBarSize={26}>
                {rows.map((b) => (
                  <Cell key={b.id} fill={b.roi >= 0 ? t.series.deposit : t.series.negative} />
                ))}
                <LabelList
                  dataKey="totalSpend"
                  position="right"
                  formatter={(v: React.ReactNode) => compactCurrency(Number(v))}
                  style={{ fontSize: 11, fill: t.axis }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
