'use client';

/* Origin: marketing-stats (96S1), verbatim. */

import { useTheme } from '@/contexts/ThemeContext';

// One place for the dashboard's chart colors so every chart shares the same
// categorical palette and adapts axes/grid/tooltip to light vs dark. Hues are
// deliberately distinct (amber / emerald / indigo / blue) and all read on both
// a white and a near-black surface.
export function useChartTheme() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  return {
    dark,
    axis: dark ? '#9ca3af' : '#6b7280', // gray-400 / gray-500
    grid: dark ? '#374151' : '#e5e7eb', // gray-700 / gray-200
    tooltip: {
      backgroundColor: dark ? '#1f2937' : '#ffffff', // gray-800 / white
      border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
      borderRadius: '0.5rem',
      color: dark ? '#f3f4f6' : '#111827',
      fontSize: '12px',
    } as React.CSSProperties,
    series: {
      spend: '#f59e0b', // amber-500
      deposit: '#10b981', // emerald-500
      registrations: '#6366f1', // indigo-500
      ftd: '#3b82f6', // blue-500
      positive: '#10b981', // emerald-500
      negative: '#ef4444', // red-500
      retention: '#8b5cf6', // violet-500
      retentionD30: '#ec4899', // pink-500
    },
  };
}

/**
 * THE CHART PALETTE — validated, by role.
 *
 * `categorical` is eight hues in a FIXED order: series take slots in the
 * order they are declared, never by rank, so filtering a series out never
 * repaints the survivors. The order is the colour-blind-safety mechanism, not
 * decoration — each adjacent pair clears ΔE 8 under every CVD simulation.
 * Checked with the dataviz skill's validator against this kit's own surfaces
 * (white / slate-800), light and dark:
 *
 *   light  worst adjacent CVD ΔE 9.1, normal-vision 19.6
 *   dark   worst adjacent CVD ΔE 8.4, normal-vision 19.3
 *
 * Three light hues (aqua, yellow, magenta) sit under 3:1 on white, so every
 * chart built on these carries a legend and a table view — identity never
 * rests on colour alone. A scatter, where EVERY pair of series can touch,
 * caps at the first three slots (all-pairs validated in both modes).
 *
 * `ordinal` is the funnel's stage ramp (one hue, visible steps, the end
 * nearest the surface still 2:1); `sequential` is the heatmap's (lightest =
 * near zero, allowed to recede); `diverging` is blue ↔ red with a grey
 * midpoint that reads as "nothing". A ninth series is never a generated
 * hue — fold it into "Other".
 */
const CATEGORICAL = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
};
const ORDINAL = {
  light: ['#104281', '#1c5cab', '#2a78d6', '#5598e7', '#86b6ef'],
  dark: ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf'],
};
const SEQUENTIAL = {
  // near zero → most
  light: ['#e8f1fd', '#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b'],
  dark: ['#26324a', '#184f95', '#1c5cab', '#256abf', '#3987e5', '#6da7ec', '#9ec5f4', '#cde2fb'],
};

/** The palette for one mode, plus the chrome every chart shares. */
export function chartPalette(dark: boolean) {
  const mode = dark ? 'dark' : 'light';
  return {
    dark,
    categorical: CATEGORICAL[mode],
    ordinal: ORDINAL[mode],
    sequential: SEQUENTIAL[mode],
    diverging: { negative: dark ? '#e66767' : '#e34948', positive: dark ? '#3987e5' : '#2a78d6', mid: dark ? '#475569' : '#e2e8f0' },
    /** The de-emphasis grey: context series, sparkline history. */
    muted: dark ? '#64748b' : '#94a3b8',
    /** What a 2px gap between touching marks is drawn in — the card surface. */
    surface: dark ? '#1e293b' : '#ffffff',
    grid: dark ? '#334155' : '#e2e8f0',
    axis: dark ? '#94a3b8' : '#64748b',
    ink: dark ? '#f1f5f9' : '#0f172a',
    inkSecondary: dark ? '#cbd5e1' : '#475569',
  };
}

export type ChartPalette = ReturnType<typeof chartPalette>;

/** The palette for the active colour scheme. */
export function useChartPalette(): ChartPalette {
  const { theme } = useTheme();
  return chartPalette(theme === 'dark');
}

export const compactCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(v);

export const fullCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

export const compactNumber = (v: number) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(v);

export const percent = (v: number) => `${v.toFixed(0)}%`;
