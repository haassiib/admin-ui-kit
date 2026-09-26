/* Origin: bonus-adjustment (96S2), verbatim. */
// Ported from marketing-stats' components/ui/DateRangePicker.tsx. Three
// changes, all at the boundary only — the quick options and the hover-preview
// range logic below are unmodified:
//
//   - "today" and the future-day guard come from dateUtils' business timezone,
//     the same source DatePicker and the month pickers read, so every picker
//     on a page agrees about which day today is.
//   - the value in and out is the `from`/`to` pair the list-tab filters already
//     keep in the URL (`YYYY-MM-DD`, inclusive), instead of UTC-anchored Dates.
//   - the TRIGGER label is compact (a same-year range prints its year once)
//     and truncates, so the control sits at 13rem on the filter bar instead of
//     16rem without ever clipping a date. Nothing about which days the range
//     covers changes — see formatDisplayDate / formatFullRange.
//
// The day grid itself is DayGrid, shared with DatePicker.
'use client';

import { useState, useRef, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isBefore,
  addMonths,
  subMonths,
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek as weekStart,
  subMonths as subtractMonths
} from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { DayGrid } from './DayGrid';
import {
  businessTodayAsLocalFields,
  isFutureBusinessDay,
  isFutureBusinessMonth,
  isoDayToLocalFields,
  localFieldsToIsoDay,
} from '@/lib/dateUtils';
import { useDismiss } from '@/lib/use-dismiss';

/** Internal, local-fielded — see dateUtils' bridge section for why the grid works this way. */
interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

/** The public shape: an inclusive pair of business calendar days, '' when unset. */
export interface IsoDayRange {
  from: string;
  to: string;
}

interface DateRangePickerProps {
  value: IsoDayRange;
  /** Fired on Apply only — never per click, so one pick is one navigation. */
  onChange: (range: IsoDayRange) => void;
  className?: string;
  /** Trigger text when nothing is picked. */
  placeholder?: string;
}

type QuickOption = 'today' | 'yesterday' | 'last7days' | 'weekToDate' | 'monthToDate' | 'thisMonth' | 'lastMonth';

function toLocalFieldedRange(value: IsoDayRange | undefined): DateRange {
  return {
    startDate: isoDayToLocalFields(value?.from),
    endDate: isoDayToLocalFields(value?.to),
  };
}

function toIsoDayRange(range: DateRange): IsoDayRange {
  return {
    from: localFieldsToIsoDay(range.startDate),
    to: localFieldsToIsoDay(range.endDate),
  };
}

export default function DateRangePicker({
  value,
  onChange,
  className = '',
  placeholder = 'All dates',
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const normalizedInitialRange = toLocalFieldedRange(value);
  const [leftMonth, setLeftMonth] = useState(normalizedInitialRange.startDate || businessTodayAsLocalFields());
  const [dateRange, setDateRange] = useState<DateRange>(normalizedInitialRange);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);

  const popupRef = useRef<HTMLDivElement>(null);

  // Re-sync whenever the committed range changes — including back to empty,
  // which is what "Clear" on the filter bar does. Keyed on the two strings
  // rather than an object identity so a re-render with an equal-but-new
  // `value` object does not stomp an in-progress pick.
  useEffect(() => {
    const normalized = toLocalFieldedRange(value);
    setDateRange(normalized);
    setTempEndDate(null);
    setLeftMonth(normalized.startDate || businessTodayAsLocalFields());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.from, value.to]);

  const rightMonth = addMonths(leftMonth, 1);
  // Caps the "next month" arrow once the right-hand calendar would reach the
  // current business month — no browsing into a future month at all, not just
  // greying out its individual days.
  const afterRight = addMonths(rightMonth, 1);
  const isNextMonthNavDisabled = isFutureBusinessMonth(afterRight.getFullYear(), afterRight.getMonth());

  const handleDateClick = (date: Date) => {
    if (isFutureBusinessDay(date)) return;
    if (!dateRange.startDate || (dateRange.startDate && dateRange.endDate)) {
      // Start new selection
      const newRange = { startDate: date, endDate: null };
      setDateRange(newRange);
      setTempEndDate(null);
    } else if (dateRange.startDate && !dateRange.endDate) {
      // Complete the selection
      let start = dateRange.startDate;
      let end = date;

      // Ensure start is before end
      if (isBefore(end, start)) {
        [start, end] = [end, start];
      }

      const newRange = { startDate: start, endDate: end };
      setDateRange(newRange);
      setTempEndDate(null);
    }
  };

  const handleMouseEnter = (date: Date) => {
    if (dateRange.startDate && !dateRange.endDate) {
      setTempEndDate(date);
    }
  };

  const isInRange = (date: Date) => {
    if (!dateRange.startDate) return false;

    const start = dateRange.startDate;
    const end = tempEndDate || dateRange.endDate;

    if (!end) return false;

    const actualStart = isBefore(start, end) ? start : end;
    const actualEnd = isBefore(start, end) ? end : start;

    return date >= actualStart && date <= actualEnd && !isSameDay(date, actualStart) && !isSameDay(date, actualEnd);
  };

  const isRangeStart = (date: Date) => {
    if (!dateRange.startDate) return false;

    const start = dateRange.startDate;
    const end = tempEndDate || dateRange.endDate;

    if (!end) return isSameDay(date, start);

    const actualStart = isBefore(start, end) ? start : end;
    return isSameDay(date, actualStart);
  };

  const isRangeEnd = (date: Date) => {
    if (!dateRange.startDate || (!dateRange.endDate && !tempEndDate)) return false;

    const start = dateRange.startDate;
    const end = tempEndDate || dateRange.endDate;

    if (!end) return false;

    const actualEnd = isBefore(start, end) ? end : start;
    return isSameDay(date, actualEnd);
  };

  const dayState = (date: Date) => ({
    selected: isRangeStart(date) || isRangeEnd(date),
    inRange: isInRange(date),
  });

  const navigateMonths = (direction: 'prev' | 'next') => {
    setLeftMonth(current =>
      direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1)
    );
  };

  const handleQuickSelect = (option: QuickOption) => {
    // The business day's "today", as local fields so the date-fns arithmetic
    // below is unchanged — otherwise "Today"/"Yesterday" name the wrong day
    // during the hours where the viewer's zone and the business zone sit on
    // different calendar dates.
    const today = businessTodayAsLocalFields();
    let startDate: Date;
    let endDate: Date;

    switch (option) {
      case 'today':
        startDate = startOfDay(today);
        endDate = endOfDay(today);
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        startDate = startOfDay(yesterday);
        endDate = endOfDay(yesterday);
        break;
      case 'last7days':
        startDate = startOfDay(subDays(today, 6));
        endDate = endOfDay(today);
        break;
      case 'weekToDate':
        startDate = startOfDay(weekStart(today, { weekStartsOn: 0 }));
        endDate = endOfDay(today);
        break;
      case 'monthToDate':
        startDate = startOfMonth(today);
        endDate = endOfDay(today);
        break;
      case 'thisMonth':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case 'lastMonth':
        const lastMonth = subtractMonths(today, 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
        break;
      default:
        return;
    }

    const newRange = { startDate, endDate };
    setDateRange(newRange);
  };

  const handleApply = () => {
    onChange(toIsoDayRange(dateRange));
    setIsOpen(false);
  };

  // Closing without applying must not leave the trigger showing a range the
  // list is not actually filtered by — so Cancel/outside-click roll the draft
  // back to the committed `value`.
  const handleCancel = () => {
    setDateRange(toLocalFieldedRange(value));
    setTempEndDate(null);
    setIsOpen(false);
  };

  // Outside click and Escape are a Cancel, not a close: the draft rolls back too.
  useDismiss(popupRef, isOpen, handleCancel);

  // An empty range is a legitimate thing to apply — it is how the range filter
  // is cleared. Only a HALF-made selection (a start with no end) is not
  // applicable, since there is no sensible end to infer.
  const isApplicable = Boolean(dateRange.startDate) === Boolean(dateRange.endDate);

  /** Both ends spelled out in full — the trigger's tooltip, never truncated. */
  const formatFullRange = () => {
    if (dateRange.startDate && dateRange.endDate) {
      return `${format(dateRange.startDate, 'MMM d, yyyy')} - ${format(dateRange.endDate, 'MMM d, yyyy')}`;
    } else if (dateRange.startDate) {
      return `${format(dateRange.startDate, 'MMM d, yyyy')} - Select end date`;
    }
    return placeholder;
  };

  // What the trigger shows. Same information in fewer characters, which is
  // what lets the control be narrow: a range that stays inside ONE year prints
  // that year once ("Mar 30 - Mar 31, 2026"), and only a range straddling two
  // years spells both out — so no year is ever dropped, just not repeated.
  // Every state now fits the 13rem trigger without ellipsis; `truncate` below
  // is the safety net for a font whose metrics run wider, not the normal case.
  const formatDisplayDate = () => {
    const { startDate, endDate } = dateRange;
    if (startDate && endDate) {
      return startDate.getFullYear() === endDate.getFullYear()
        ? `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`
        : `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
    }
    if (startDate) {
      return `${format(startDate, 'MMM d')} - Select end date`;
    }
    return placeholder;
  };

  const quickOptions = [
    { key: 'today' as QuickOption, label: 'Today' },
    { key: 'yesterday' as QuickOption, label: 'Yesterday' },
    { key: 'last7days' as QuickOption, label: 'Last 7 Days' },
    { key: 'weekToDate' as QuickOption, label: 'Week to Date' },
    { key: 'monthToDate' as QuickOption, label: 'Month to Date' },
    { key: 'thisMonth' as QuickOption, label: 'This Month' },
    { key: 'lastMonth' as QuickOption, label: 'Last Month' },
  ];

  return (
    <div className={`relative ${className}`} ref={popupRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => (isOpen ? handleCancel() : setIsOpen(true))}
        title={formatFullRange()}
        className="field-input text-left"
      >
        <div className="flex items-center justify-between gap-2">
          {/* `min-w-0 truncate`: without it a label wider than the trigger
              pushes the calendar icon past the rounded border instead of
              ellipsising, since a flex item will not shrink below its content
              by default. The tooltip above carries the untruncated range. */}
          <span
            className={`min-w-0 truncate ${dateRange.startDate ? '' : 'text-slate-400 dark:text-slate-500'}`}
          >
            {formatDisplayDate()}
          </span>
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
        </div>
      </button>

      {/* Popup Calendar. Right-anchored, as in the marketing-stats original —
          the trigger sits near the right end of its toolbar in both, so the
          800px panel has to open inward (leftward) to stay on the page. */}
      {isOpen && (
        <div data-overlay="picker" className="absolute right-0 top-full z-50 mt-1 w-[300px] panel panel-solid p-4 sm:w-auto sm:min-w-[800px]">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
            {/* Quick Selection Panel */}
            <div className="w-full sm:w-48 flex-shrink-0">
              <h4 className="panel-title mb-2">Quick Selection</h4>
              <div className="grid grid-cols-2 sm:flex sm:flex-col gap-1.5 sm:gap-0 sm:space-y-1">
                {quickOptions.map(option => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => handleQuickSelect(option.key)}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-lg transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Selected Dates Display */}
              {(dateRange.startDate || dateRange.endDate) && (
                <div className="mt-3 sm:mt-4 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <h5 className="panel-title mb-1">Selected Range</h5>
                  <div className="text-xs text-slate-800 dark:text-slate-200">
                    {dateRange.startDate && format(dateRange.startDate, 'MMM d, yyyy')}
                    {dateRange.endDate && ` - ${format(dateRange.endDate, 'MMM d, yyyy')}`}
                  </div>
                </div>
              )}
            </div>

            {/* Calendars */}
            <div className="flex-1">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => navigateMonths('prev')}
                  aria-label="Previous month"
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700 dark:hover:text-indigo-400 transition-colors active:scale-90"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex gap-2 items-center">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {format(leftMonth, 'MMMM yyyy')}
                  </span>
                  <span className="text-sm text-slate-400 hidden sm:inline">→</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline">
                    {format(rightMonth, 'MMMM yyyy')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => navigateMonths('next')}
                  disabled={isNextMonthNavDisabled}
                  aria-label="Next month"
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700 dark:hover:text-indigo-400 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors active:scale-90"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Two Calendars Side by Side. Padding days are inert here: the
                  same day is clickable on the neighbouring grid. */}
              <div className="flex flex-col sm:flex-row gap-8">
                <div className="flex-1">
                  <DayGrid month={leftMonth} title outsideDays="disabled" onPick={handleDateClick} onHover={handleMouseEnter} dayState={dayState} />
                </div>
                <div className="hidden sm:block flex-1">
                  <DayGrid month={rightMonth} title outsideDays="disabled" onPick={handleDateClick} onHover={handleMouseEnter} dayState={dayState} />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-between items-center mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 gap-4 sm:gap-0">
            <button
              type="button"
              onClick={() => {
                setDateRange({ startDate: null, endDate: null });
                setTempEndDate(null);
              }}
              className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Clear Selection
            </button>

            <div className="flex gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={!isApplicable}
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
