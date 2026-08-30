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

export const compactCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(v);

export const fullCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

export const compactNumber = (v: number) =>
  new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(v);

export const percent = (v: number) => `${v.toFixed(0)}%`;
