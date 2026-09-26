'use client';

/* Origin: marketing-stats (96S1), verbatim. */

import { useState, useRef, useEffect } from 'react';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { MonthGrid } from './MonthGrid';
import {
  businessToday,
  formatUtcMonthLabel,
  isFutureBusinessMonth,
  utcMonthStart,
  utcMonthEnd,
  utcYearStart,
} from '@/lib/dateUtils';
import { useDismiss } from '@/lib/use-dismiss';

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

  useDismiss(popupRef, isOpen, () => setIsOpen(false));

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
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="field-input text-left"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2 truncate">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
            <span className={`truncate ${range.startDate && range.endDate ? '' : 'text-slate-400 dark:text-slate-500'}`}>{formatDisplay()}</span>
          </span>
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div data-overlay="picker" className="absolute right-0 top-full z-50 mt-1 w-[300px] origin-top-right panel panel-solid p-4 animate-scale-in sm:w-auto sm:min-w-[560px]">
          <div className="flex items-baseline justify-between mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {range.startDate && range.endDate
                ? `${formatUtcMonthLabel(range.startDate)} – ${formatUtcMonthLabel(range.endDate)}`
                : 'Select a month range'}
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
            <div className="w-full sm:w-36 flex-shrink-0">
              <h4 className="panel-title mb-2">Quick Selection</h4>
              <div className="flex flex-wrap sm:flex-col gap-1.5">
                {quickOptions.map(option => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => handleQuickSelect(option.key)}
                    className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-left text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="panel-title mb-2">From</h3>
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
                <h3 className="panel-title mb-2">To</h3>
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

          <div className="flex flex-col-reverse sm:flex-row justify-between items-center mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 gap-4 sm:gap-0">
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Clear Selection
            </button>

            <div className="flex gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={!range.startDate || !range.endDate}
                className="btn-primary px-4"
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
