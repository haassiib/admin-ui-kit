'use client';

import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart as RScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';
import ChartCard from './ChartCard';
import { axisProps } from './chartSeries';
import { compactNumber, useChartPalette } from './chartTheme';

export type ScatterPoint = { x: number; y: number; label?: string };
export type ScatterGroup = { label: string; points: ScatterPoint[] };

/**
 * Two measures per item, to show how they relate — and up to THREE groups.
 *
 * The cap is not arbitrary. In a scatter every pair of groups can overlap,
 * not just neighbours in a legend, and the palette's first three slots are
 * the most it validates for every pair under colour-blind simulation. A
 * fourth group is dropped here with a console warning; facet into small
 * multiples, or fold the rest into one grey "Other".
 *
 * Markers are 8px and ringed 2px in the card's colour so overlapping points
 * stay distinct; the hover target is larger than the mark.
 */
export default function ScatterChart({
  title,
  hint,
  groups,
  xLabel,
  yLabel,
  xFormat = compactNumber,
  yFormat = compactNumber,
  height = 300,
  className,
}: {
  title: string;
  hint?: string;
  groups: ScatterGroup[];
  xLabel: string;
  yLabel: string;
  xFormat?: (v: number) => string;
  yFormat?: (v: number) => string;
  height?: number;
  className?: string;
}) {
  const p = useChartPalette();
  const axis = axisProps(p);
  if (groups.length > 3 && process.env.NODE_ENV !== 'production') {
    console.warn(`ScatterChart "${title}": ${groups.length} groups, showing 3 — facet or fold the rest into "Other".`);
  }
  const shown = groups.slice(0, 3);

  return (
    <ChartCard
      title={title}
      hint={hint}
      className={className}
      empty={shown.every((g) => g.points.length === 0)}
      legend={shown.map((g, i) => ({ label: g.label, color: p.categorical[i], shape: 'dot' }))}
      table={{
        columns: [
          { key: 'group', label: 'Group' },
          { key: 'label', label: 'Item' },
          { key: 'x', label: xLabel, align: 'right', format: (v) => xFormat(Number(v)) },
          { key: 'y', label: yLabel, align: 'right', format: (v) => yFormat(Number(v)) },
        ],
        rows: shown.flatMap((g) => g.points.map((pt) => ({ group: g.label, label: pt.label ?? '—', x: pt.x, y: pt.y }))),
      }}
    >
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RScatterChart margin={{ top: 8, right: 12, left: 0, bottom: 16 }}>
            <CartesianGrid stroke={p.grid} />
            <XAxis
              type="number"
              dataKey="x"
              name={xLabel}
              tickFormatter={xFormat}
              label={{ value: xLabel, position: 'insideBottom', offset: -8, fontSize: 11, fill: p.axis }}
              {...axis}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yLabel}
              tickFormatter={yFormat}
              width={52}
              label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize: 11, fill: p.axis, style: { textAnchor: 'middle' } }}
              {...axis}
              axisLine={false}
            />
            {/* A fixed marker size: area is not encoding anything here. */}
            <ZAxis range={[64, 64]} />
            <Tooltip
              cursor={{ stroke: p.axis, strokeWidth: 1 }}
              content={({ active, payload }) => {
                const pt = payload?.[0]?.payload as (ScatterPoint & { group?: string }) | undefined;
                if (!active || !pt) return null;
                return (
                  <div className="panel panel-solid px-3 py-2 text-xs shadow-lg">
                    {pt.label && <p className="mb-1 font-medium text-slate-800 dark:text-slate-100">{pt.label}</p>}
                    <p className="tabular-nums"><span className="font-semibold text-slate-900 dark:text-slate-50">{xFormat(pt.x)}</span> <span className="text-slate-500">{xLabel}</span></p>
                    <p className="tabular-nums"><span className="font-semibold text-slate-900 dark:text-slate-50">{yFormat(pt.y)}</span> <span className="text-slate-500">{yLabel}</span></p>
                  </div>
                );
              }}
            />
            {shown.map((g, i) => (
              <Scatter
                key={g.label}
                name={g.label}
                data={g.points}
                fill={p.categorical[i]}
                stroke={p.surface}
                strokeWidth={2}
                isAnimationActive={false}
              />
            ))}
          </RScatterChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
