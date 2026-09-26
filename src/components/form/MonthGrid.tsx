'use client';

/* Origin: marketing-stats (96S1), verbatim. */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { businessToday } from '@/lib/dateUtils';

// Shared by MonthPicker (a single grid) and MonthRangePicker (one grid per
// From/To side) — a year header with prev/next arrows plus a 3x4 grid of
// month buttons. One click selects; no scrolling/wheels involved.
export const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => new Date(2000, i, 1).toLocaleDateString('en-US', { month: 'short' }));

interface MonthGridProps {
  year: number;
  selectedYear: number;
  selectedMonth: number;
  onYearChange: (year: number) => void;
  onPick: (year: number, month: number) => void;
  // e.g. disable months later than today when browsing the current year.
  isMonthDisabled?: (year: number, month: number) => boolean;
  // Caps the "next year" arrow — defaults to the current GMT+8 year (no future
  // years). GMT+8 rather than the browser's zone so the arrow unlocks the new
  // year at the same moment for every viewer.
  maxYear?: number;
}

export function MonthGrid({
  year,
  selectedYear,
  selectedMonth,
  onYearChange,
  onPick,
  isMonthDisabled = () => false,
  maxYear = businessToday().year,
}: MonthGridProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => onYearChange(year - 1)}
          aria-label="Previous year"
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700 dark:hover:text-indigo-400 transition-colors active:scale-90"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{year}</span>
        <button
          type="button"
          onClick={() => onYearChange(year + 1)}
          disabled={year >= maxYear}
          aria-label="Next year"
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700 dark:hover:text-indigo-400 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors active:scale-90"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {MONTH_LABELS.map((label, i) => {
          const isSelected = selectedYear === year && selectedMonth === i;
          const disabled = isMonthDisabled(year, i);
          return (
            <button
              key={label}
              type="button"
              onClick={() => onPick(year, i)}
              disabled={disabled}
              className={`h-8 text-xs rounded-lg transition-all active:scale-95 ${
                isSelected
                  ? 'bg-indigo-600 text-white font-semibold'
                  : disabled
                  ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
