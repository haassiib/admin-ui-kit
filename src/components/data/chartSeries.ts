import type { ChartPalette } from './chartTheme';

/**
 * One plotted series: the data key it reads and the name a reader sees.
 *
 * `slot` pins the series to a palette slot. Leave it out and series take slots
 * in DECLARATION order — which is the rule that keeps a colour attached to its
 * entity: pass the same series list with one filtered out and the survivors
 * keep their slots only if you pass `slot`, so a chart whose series come and
 * go (a filter, a toggle) should always set it.
 */
export type ChartSeries = { key: string; label: string; slot?: number };

/** A series' colour: its pinned slot, else its position, from the fixed order. */
export function seriesColor(p: ChartPalette, s: ChartSeries, index: number): string {
  const slot = s.slot ?? index;
  // Past eight is a design error, not a colour to generate: fold into "Other".
  return p.categorical[Math.min(slot, p.categorical.length - 1)];
}

/** Axis and grid props every cartesian chart here shares: solid hairlines, muted ticks. */
export function axisProps(p: ChartPalette) {
  return {
    tick: { fontSize: 11, fill: p.axis },
    stroke: p.grid,
    tickLine: false,
  } as const;
}
