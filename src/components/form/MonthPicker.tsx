'use client';

/* Origin: marketing-stats (96S1), verbatim. */

import { useState, useRef, useEffect } from 'react';
import { CalendarDays, ChevronDown, X } from 'lucide-react';
import { MonthGrid } from './MonthGrid';
import { businessToday, formatUtcMonthLabel, isFutureBusinessMonth, utcMonthStart } from '@/lib/dateUtils';
import { useDismiss } from '@/lib/use-dismiss';

interface MonthPickerProps {
  // YYYY-MM, or null/undefined for no selection.
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
  // Show the "X" clear affordance / "Clear" footer action. Turn off when the
  // consumer always needs a month selected (e.g. a required field).
  allowClear?: boolean;
  // Locks the field: the popup can't be opened and the value can't be cleared.
  // For form fields that are part of a record's identity and therefore
  // read-only while editing (see balances/BalanceForm.tsx).
  disabled?: boolean;
  // Which months are greyed out in the grid. Defaults to "no future months",
  // the rule every filter on this app uses. A form can tighten it — e.g.
  // balances also excludes the CURRENT month, since a month's closing balance
  // isn't final until the month has ended.
  isMonthDisabled?: (year: number, month: number) => boolean;
}

function parseMonthValue(value: string | null | undefined): { year: number; month: number } | null {
  if (!value) return null;
  const [y, m] = value.split('-').map(Number);
  if (!y || !m) return null;
  return { year: y, month: m - 1 };
}

function formatMonthValue(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

// The same formatter MonthRangePicker uses, fed a UTC-anchored month start so
// the two triggers cannot spell the same month differently.
function formatLabel(year: number, month: number): string {
  return formatUtcMonthLabel(utcMonthStart(year, month));
}

export default function MonthPicker({
  value,
  onChange,
  placeholder = 'Select month',
  className = '',
  allowClear = true,
  disabled = false,
  isMonthDisabled = isFutureBusinessMonth,
}: MonthPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const parsed = parseMonthValue(value);
  // The year currently browsed in the grid — independent of the applied
  // value, so browsing to a different year doesn't select anything on its own.
  // Defaults to the current GMT+8 year (the reporting timezone), not the
  // browser's — see dateUtils' BUSINESS_TIMEZONE notes.
  const [viewYear, setViewYear] = useState(parsed?.year ?? businessToday().year);

  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (parsed) setViewYear(parsed.year);
  }, [value]);

  useDismiss(popupRef, isOpen, () => setIsOpen(false));

  const handlePickMonth = (month: number) => {
    if (isMonthDisabled(viewYear, month)) return;
    onChange(formatMonthValue(viewYear, month));
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={popupRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`field-input text-left ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2 truncate">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
            <span className={`truncate ${!parsed ? 'text-slate-400 dark:text-slate-500' : ''}`}>
              {parsed ? formatLabel(parsed.year, parsed.month) : placeholder}
            </span>
          </span>
          <span className="flex items-center gap-1 flex-shrink-0">
            {allowClear && parsed && !disabled && (
              <X
                className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                onClick={(e) => { e.stopPropagation(); onChange(null); }}
              />
            )}
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </span>
        </div>
      </button>

      {isOpen && !disabled && (
        <div data-overlay="picker" className="absolute right-0 top-full z-50 mt-1 w-72 origin-top-right panel panel-solid p-3 animate-scale-in">
          <MonthGrid
            year={viewYear}
            selectedYear={parsed?.year ?? -1}
            selectedMonth={parsed?.month ?? -1}
            onYearChange={setViewYear}
            onPick={(_, m) => handlePickMonth(m)}
            isMonthDisabled={isMonthDisabled}
          />

          {allowClear && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
