'use client';

import { useChartPalette } from './chartTheme';

/**
 * A word-sized trend — twelve-odd points and no axes, for a stat tile or a
 * table cell, where the question is "which way is it going" and not "what
 * was it on the 4th".
 *
 * The history is the de-emphasis grey and only the CURRENT point is in the
 * accent, so the eye goes to now. Plain SVG rather than a chart library: at
 * this size a library's axes, margins and resize observers are all cost and
 * no content. The accessible name states the first, last and change, since
 * the picture alone carries no numbers.
 */
export default function Sparkline({
  values,
  width = 96,
  height = 28,
  label = 'Trend',
  className,
}: {
  values: number[];
  width?: number;
  height?: number;
  /** What is trending — used in the accessible name. */
  label?: string;
  className?: string;
}) {
  const p = useChartPalette();
  if (values.length < 2) return null;

  const pad = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const xOf = (i: number) => pad + (i / (values.length - 1)) * (width - pad * 2);
  const yOf = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2);
  const d = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ');
  const first = values[0];
  const last = values[values.length - 1];
  const change = first ? ((last - first) / Math.abs(first)) * 100 : 0;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${label}: from ${first.toLocaleString()} to ${last.toLocaleString()}, ${change >= 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(1)}%`}
      className={className}
    >
      <path d={d} fill="none" stroke={p.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xOf(values.length - 1)} cy={yOf(last)} r={4} fill={p.categorical[0]} stroke={p.surface} strokeWidth={2} />
    </svg>
  );
}
