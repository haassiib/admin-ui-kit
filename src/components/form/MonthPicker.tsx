'use client';

/* Origin: marketing-stats (96S1), verbatim. */

import { useState, useRef, useEffect } from 'react';
import { CalendarDays, ChevronDown, X } from 'lucide-react';
import { MonthGrid } from './MonthGrid';
import { businessToday, isFutureBusinessMonth } from '@/lib/dateUtils';

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

function formatLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        className={`w-full px-4 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
          disabled
            ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
            : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 active:scale-[0.98]'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-gray-700 dark:text-gray-200 truncate">
            <CalendarDays size={16} className="flex-shrink-0 text-indigo-500 dark:text-indigo-400" />
            <span className={`truncate ${!parsed ? 'text-gray-400 dark:text-gray-500' : ''}`}>
              {parsed ? formatLabel(parsed.year, parsed.month) : placeholder}
            </span>
          </span>
          <span className="flex items-center gap-1 flex-shrink-0">
            {allowClear && parsed && !disabled && (
              <X
                size={14}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                onClick={(e) => { e.stopPropagation(); onChange(null); }}
              />
            )}
            <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </span>
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 top-full right-0 mt-2 origin-top-right bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/70 dark:border-gray-700/70 rounded-2xl shadow-xl z-30 p-4 w-72 animate-scale-in">
          <MonthGrid
            year={viewYear}
            selectedYear={parsed?.year ?? -1}
            selectedMonth={parsed?.month ?? -1}
            onYearChange={setViewYear}
            onPick={(_, m) => handlePickMonth(m)}
            isMonthDisabled={isMonthDisabled}
          />

          {allowClear && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={handleClear}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
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
