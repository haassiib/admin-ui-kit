'use client';

/* Origin: marketing-stats (96S1), verbatim. */

import { useState, useRef, useEffect } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { MonthGrid } from './MonthGrid';
import {
  businessToday,
  isFutureBusinessMonth,
  utcMonthStart,
  utcMonthEnd,
  utcYearStart,
} from '@/lib/dateUtils';

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface MonthRangePickerProps {
  onDateRangeChange: (range: DateRange) => void;
  initialRange?: DateRange;
  className?: string;
}

type QuickOption = 'thisMonth' | 'lastMonth' | 'last3Months' | 'last6Months' | 'yearToDate' | 'lastYear';

// initialRange can come from a Zustand `persist` store — after rehydrating
// from localStorage, Date fields arrive as plain ISO strings (JSON has no
// Date type), not real Date instances. Coerce defensively before calling any
// Date method on them.
function toDateOrNull(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

// Boundaries here are UTC-anchored (see dateUtils' BUSINESS_TIMEZONE notes), so
// the label has to be read in UTC too — date-fns `format` reads LOCAL fields
// and would render a UTC-anchored Jul 1 as "Jun 2026" for any viewer west of
// UTC. Same `timeZone: 'UTC'` convention the report tables already use.
function formatUtcMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export default function MonthRangePicker({ onDateRangeChange, initialRange, className = '' }: MonthRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const normalizedInitialRange = initialRange
    ? { startDate: toDateOrNull(initialRange.startDate), endDate: toDateOrNull(initialRange.endDate) }
    : { startDate: null, endDate: null };
  const [range, setRange] = useState<DateRange>(normalizedInitialRange);
  // The month/year currently highlighted in each picker column, independent of
  // an already-applied range so browsing doesn't commit until Apply.
  // Read with getUTC* — the range's UTC fields are the intended calendar month
  // — falling back to the current GMT+8 month rather than the browser's.
  const [startYear, setStartYear] = useState(() => normalizedInitialRange.startDate?.getUTCFullYear() ?? businessToday().year);
  const [startMonth, setStartMonth] = useState(() => normalizedInitialRange.startDate?.getUTCMonth() ?? businessToday().month);
  const [endYear, setEndYear] = useState(() => normalizedInitialRange.endDate?.getUTCFullYear() ?? businessToday().year);
  const [endMonth, setEndMonth] = useState(() => normalizedInitialRange.endDate?.getUTCMonth() ?? businessToday().month);

  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialRange) {
      const startDate = toDateOrNull(initialRange.startDate);
      const endDate = toDateOrNull(initialRange.endDate);
      setRange({ startDate, endDate });
      if (startDate) {
        setStartYear(startDate.getUTCFullYear());
        setStartMonth(startDate.getUTCMonth());
      }
      if (endDate) {
        setEndYear(endDate.getUTCFullYear());
        setEndMonth(endDate.getUTCMonth());
      }
    }
  }, [initialRange]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Every preset is expressed in whole GMT+8 calendar months and built with the
  // UTC-anchored constructors — no date-fns arithmetic, which would operate on
  // the browser's local fields. Date.UTC normalizes out-of-range months, so
  // `month - 5` rolling into the previous year needs no special case.
  const handleQuickSelect = (option: QuickOption) => {
    const { year, month } = businessToday();
    let start: Date;
    let end: Date;

    switch (option) {
      case 'thisMonth':
        start = utcMonthStart(year, month);
        end = utcMonthEnd(year, month);
        break;
      case 'lastMonth':
        start = utcMonthStart(year, month - 1);
        end = utcMonthEnd(year, month - 1);
        break;
      case 'last3Months':
        start = utcMonthStart(year, month - 2);
        end = utcMonthEnd(year, month);
        break;
      case 'last6Months':
        start = utcMonthStart(year, month - 5);
        end = utcMonthEnd(year, month);
        break;
      case 'yearToDate':
        start = utcYearStart(year);
        end = utcMonthEnd(year, month);
        break;
      case 'lastYear':
        start = utcYearStart(year - 1);
        end = utcMonthEnd(year - 1, 11);
        break;
      default:
        return;
    }

    setRange({ startDate: start, endDate: end });
    setStartYear(start.getUTCFullYear());
    setStartMonth(start.getUTCMonth());
    setEndYear(end.getUTCFullYear());
    setEndMonth(end.getUTCMonth());
  };

  const handlePickStart = (year: number, month: number) => {
    setStartYear(year);
    setStartMonth(month);
    setRange(prev => ({ ...prev, startDate: utcMonthStart(year, month) }));
  };

  const handlePickEnd = (year: number, month: number) => {
    setEndYear(year);
    setEndMonth(month);
    setRange(prev => ({ ...prev, endDate: utcMonthEnd(year, month) }));
  };

  const handleApply = () => {
    if (!range.startDate || !range.endDate) return;
    onDateRangeChange(range);
    setIsOpen(false);
  };

  const handleClear = () => {
    setRange({ startDate: null, endDate: null });
  };

  const formatDisplay = () => {
    if (range.startDate && range.endDate) {
      return `${formatUtcMonthLabel(range.startDate)} - ${formatUtcMonthLabel(range.endDate)}`;
    }
    return 'Select month range';
  };

  const quickOptions: { key: QuickOption; label: string }[] = [
    { key: 'thisMonth', label: 'This Month' },
    { key: 'lastMonth', label: 'Last Month' },
    { key: 'last3Months', label: 'Last 3 Months' },
    { key: 'last6Months', label: 'Last 6 Months' },
    { key: 'yearToDate', label: 'Year to Date' },
    { key: 'lastYear', label: 'Last Year' },
  ];

  return (
    <div className={`relative ${className}`} ref={popupRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all active:scale-[0.98] shadow-sm"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-gray-700 dark:text-gray-200 truncate">
            <CalendarDays size={16} className="flex-shrink-0 text-indigo-500 dark:text-indigo-400" />
            <span className="truncate">{formatDisplay()}</span>
          </span>
          <ChevronDown size={16} className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full right-0 mt-2 origin-top-right bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/70 dark:border-gray-700/70 rounded-2xl shadow-xl z-30 p-4 sm:p-6 w-[300px] sm:w-auto sm:min-w-[560px] animate-scale-in">
          <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {range.startDate && range.endDate
                ? `${formatUtcMonthLabel(range.startDate)} – ${formatUtcMonthLabel(range.endDate)}`
                : 'Select a month range'}
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
            <div className="w-full sm:w-36 flex-shrink-0">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Quick Selection</h4>
              <div className="flex flex-wrap sm:flex-col gap-1.5">
                {quickOptions.map(option => (
                  <button
                    key={option.key}
                    onClick={() => handleQuickSelect(option.key)}
                    className="rounded-full sm:rounded-xl bg-gray-100 dark:bg-gray-700/60 px-3.5 py-1.5 text-left text-sm font-medium text-gray-600 dark:text-gray-300 transition-colors hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 active:scale-95"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">From</h3>
                <MonthGrid
                  year={startYear}
                  selectedYear={startYear}
                  selectedMonth={startMonth}
                  onYearChange={(y) => handlePickStart(y, startMonth)}
                  onPick={handlePickStart}
                  isMonthDisabled={isFutureBusinessMonth}
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">To</h3>
                <MonthGrid
                  year={endYear}
                  selectedYear={endYear}
                  selectedMonth={endMonth}
                  onYearChange={(y) => handlePickEnd(y, endMonth)}
                  onPick={handlePickEnd}
                  isMonthDisabled={isFutureBusinessMonth}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-between items-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 gap-4 sm:gap-0">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Clear Selection
            </button>

            <div className="flex gap-3 w-full sm:w-auto justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={!range.startDate || !range.endDate}
                className="px-6 py-2 text-sm bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:active:scale-100 transition-all"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
