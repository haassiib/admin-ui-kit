'use client';

import ChartCard from './ChartCard';
import { compactNumber, useChartPalette } from './chartTheme';

export type FunnelStage = { label: string; value: number };

/** Relative luminance of a `#rrggbb` fill, to choose ink that clears it. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * A sequence of stages each a subset of the one before — visits, sign-ups,
 * activations — and where people drop out between them.
 *
 * Each stage is a bar scaled to the FIRST stage, so the shrinking reads as
 * loss. The stages are ORDERED, so they take one hue stepped light to dark
 * (an ordinal ramp, validated so even the palest step clears the surface),
 * not categorical colours that would imply unrelated groups. Every bar is
 * labelled with its value, its conversion from the stage before and from
 * the top — which is the actual question a funnel answers. A bar too short
 * for its label carries it outside, never clipped.
 */
export default function FunnelChart({
  title,
  hint,
  stages,
  format = compactNumber,
  className,
}: {
  title: string;
  hint?: string;
  stages: FunnelStage[];
  format?: (v: number) => string;
  className?: string;
}) {
  const p = useChartPalette();
  const top = stages[0]?.value ?? 0;
  const pct = (v: number, of: number) => (of ? `${((v / of) * 100).toFixed(1)}%` : '—');
  // Spread the ramp across however many stages there are.
  const colorOf = (i: number) => p.ordinal[stages.length <= 1 ? 2 : Math.round((i / (stages.length - 1)) * (p.ordinal.length - 1))];

  return (
    <ChartCard
      title={title}
      hint={hint}
      className={className}
      empty={top === 0}
      table={{
        columns: [
          { key: 'label', label: 'Stage' },
          { key: 'value', label: 'Count', align: 'right', format: (v) => format(Number(v)) },
          { key: 'step', label: 'From previous', align: 'right' },
          { key: 'overall', label: 'From top', align: 'right' },
        ],
        rows: stages.map((s, i) => ({ ...s, step: i === 0 ? '—' : pct(s.value, stages[i - 1].value), overall: pct(s.value, top) })),
      }}
    >
      <ol className="space-y-2">
        {stages.map((s, i) => {
          const width = top ? Math.max(1.5, (s.value / top) * 100) : 0;
          const inside = width > 34;
          return (
            <li key={s.label} className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-3" title={`${s.label}: ${format(s.value)} (${pct(s.value, top)} of ${stages[0].label})`}>
              <span className="truncate text-right text-xs text-slate-600 dark:text-slate-300">{s.label}</span>
              <div className="flex items-center gap-2">
                <div
                  className="flex h-6 items-center rounded-r-[4px] px-2"
                  style={{ width: `${width}%`, background: colorOf(i) }}
                >
                  {inside && (
                    // A label inside a fill picks white or ink by the fill's
                    // own luminance — the ramp runs the other way in dark mode.
                    <span className={`text-[11px] font-semibold tabular-nums ${luminance(colorOf(i)) > 0.4 ? 'text-slate-900' : 'text-white'}`}>
                      {format(s.value)}
                    </span>
                  )}
                </div>
                <span className="shrink-0 text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                  {!inside && <span className="mr-1.5 font-semibold text-slate-800 dark:text-slate-100">{format(s.value)}</span>}
                  {i > 0 && <>{pct(s.value, stages[i - 1].value)} of previous</>}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      {stages.length > 1 && (
        <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-800 dark:text-slate-100">{pct(stages[stages.length - 1].value, top)}</span> of{' '}
          {stages[0].label.toLowerCase()} reach {stages[stages.length - 1].label.toLowerCase()}.
        </p>
      )}
    </ChartCard>
  );
}
