'use client';

import { useState } from 'react';
import ChartCard from './ChartCard';
import { compactNumber, useChartPalette } from './chartTheme';

/**
 * Magnitude over a grid — activity by weekday and hour, usage by team and
 * month. One hue, light (near zero) to dark (most), so "more" is always
 * "darker" and there is nothing to decode.
 *
 * Values are binned into the ramp's steps by their share of the maximum, and
 * a scale legend under the grid says so. Each cell has its own hover readout
 * (row, column, value) and lifts on hover; the table view carries every
 * value for a reader who cannot see the shades apart. A 2px gap in the
 * card's colour separates cells — the grid IS the gap, no borders.
 */
export default function Heatmap({
  title,
  hint,
  rows,
  columns,
  values,
  format = compactNumber,
  cellSize = 22,
  className,
}: {
  title: string;
  hint?: string;
  rows: string[];
  columns: string[];
  /** `values[row][column]`. */
  values: number[][];
  format?: (v: number) => string;
  cellSize?: number;
  className?: string;
}) {
  const p = useChartPalette();
  const [hover, setHover] = useState<{ r: number; c: number; x: number; y: number } | null>(null);
  const max = Math.max(0, ...values.flat());
  const steps = p.sequential.length;
  const colorOf = (v: number) => (max === 0 ? p.sequential[0] : p.sequential[Math.min(steps - 1, Math.floor((v / max) * steps))]);

  return (
    <ChartCard
      title={title}
      hint={hint}
      className={className}
      empty={max === 0}
      table={{
        columns: [{ key: 'row', label: '' }, ...columns.map((c) => ({ key: c, label: c, align: 'right' as const, format: (v: unknown) => format(Number(v)) }))],
        rows: rows.map((r, ri) => ({ row: r, ...Object.fromEntries(columns.map((c, ci) => [c, values[ri]?.[ci] ?? 0])) })),
      }}
    >
      <div className="relative overflow-x-auto">
        <div
          role="img"
          aria-label={`${title}: ${rows.length} by ${columns.length} grid, peak ${format(max)}. The table view lists every value.`}
          className="inline-grid gap-[2px] text-[10px] text-slate-500 dark:text-slate-400"
          style={{ gridTemplateColumns: `auto repeat(${columns.length}, ${cellSize}px)` }}
          onMouseLeave={() => setHover(null)}
        >
          <span />
          {columns.map((c, ci) => (
            <span key={c} className="text-center tabular-nums">
              {/* Every other column label, so they never collide. */}
              {columns.length > 12 && ci % 2 === 1 ? '' : c}
            </span>
          ))}
          {rows.map((r, ri) => (
            <div key={r} className="contents">
              <span className="pr-2 text-right leading-[22px]" style={{ lineHeight: `${cellSize}px` }}>{r}</span>
              {columns.map((c, ci) => {
                const v = values[ri]?.[ci] ?? 0;
                const on = hover?.r === ri && hover.c === ci;
                return (
                  <span
                    key={c}
                    onMouseEnter={(e) => {
                      const box = e.currentTarget.offsetParent as HTMLElement | null;
                      const cell = e.currentTarget.getBoundingClientRect();
                      const origin = box?.getBoundingClientRect();
                      setHover({ r: ri, c: ci, x: cell.left - (origin?.left ?? 0) + cellSize / 2, y: cell.top - (origin?.top ?? 0) });
                    }}
                    style={{ width: cellSize, height: cellSize, background: colorOf(v) }}
                    className={`rounded-[3px] transition-[filter] ${on ? 'brightness-110 ring-2 ring-slate-900/60 ring-offset-0 dark:ring-white/70' : ''}`}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {hover && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full panel panel-solid px-2.5 py-1.5 text-xs shadow-lg"
            style={{ left: hover.x, top: hover.y - 6 }}
          >
            <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-50">{format(values[hover.r]?.[hover.c] ?? 0)}</span>{' '}
            <span className="text-slate-500 dark:text-slate-400">{rows[hover.r]} · {columns[hover.c]}</span>
          </div>
        )}

        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
          Less
          {p.sequential.map((c) => (
            <span key={c} aria-hidden className="h-2.5 w-4 rounded-[2px]" style={{ background: c }} />
          ))}
          More
          <span className="ml-2 tabular-nums">peak {format(max)}</span>
        </div>
      </div>
    </ChartCard>
  );
}
