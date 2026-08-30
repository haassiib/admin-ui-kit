/* Origin: bonus-adjustment (96S2), verbatim. */
// Ported from marketing-stats' components/ui/DateRangePicker.tsx. Three
// changes, all at the boundary only — the calendar grid, the quick options and
// the hover-preview range logic below are unmodified:
//
//   - "today" and the future-day guard come from BKK, not GMT+8, so the picker
//     agrees with `bkkDate()` about which day today is (see lib/bkk-calendar).
//   - the value in and out is the `from`/`to` pair the list-tab filters already
//     keep in the URL (`YYYY-MM-DD`, inclusive), instead of UTC-anchored Dates.
//   - the TRIGGER label is compact (a same-year range prints its year once)
//     and truncates, so the control sits at 13rem on the filter bar instead of
//     16rem without ever clipping a date. Nothing about which days the range
//     covers changes — see formatDisplayDate / formatFullRange.
'use client';

import { useState, useRef, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isBefore,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek as weekStart,
  subMonths as subtractMonths
} from 'date-fns';
import {
  bkkTodayAsLocalFields,
  isFutureBkkDay,
  isoDayToLocalFields,
  localFieldsToIsoDay,
} from '@/lib/bkk-calendar';

/** Internal, local-fielded — see lib/bkk-calendar for why the grid works this way. */
interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

/** The public shape: an inclusive pair of BKK calendar days, '' when unset. */
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
  const [leftMonth, setLeftMonth] = useState(normalizedInitialRange.startDate || bkkTodayAsLocalFields());
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
    setLeftMonth(normalized.startDate || bkkTodayAsLocalFields());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.from, value.to]);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setDateRange(toLocalFieldedRange(value));
        setTempEndDate(null);
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.from, value.to]);

  const rightMonth = addMonths(leftMonth, 1);
  // Caps the "next month" arrow once the right-hand calendar would reach the
  // current BKK month — no browsing into a future month at all, not just
  // greying out its individual days.
  const todayLocal = bkkTodayAsLocalFields();
  const isNextMonthNavDisabled = rightMonth.getFullYear() > todayLocal.getFullYear()
    || (rightMonth.getFullYear() === todayLocal.getFullYear() && rightMonth.getMonth() >= todayLocal.getMonth());

  const generateCalendarDays = (month: Date) => {
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(month)),
      end: endOfWeek(endOfMonth(month))
    });
  };

  const leftDays = generateCalendarDays(leftMonth);
  const rightDays = generateCalendarDays(rightMonth);

  const handleDateClick = (date: Date) => {
    if (isFutureBkkDay(date)) return;
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

  const navigateMonths = (direction: 'prev' | 'next') => {
    setLeftMonth(current => 
      direction === 'prev' ? subMonths(current, 1) : addMonths(current, 1)
    );
  };

  const handleQuickSelect = (option: QuickOption) => {
    // BKK's "today", as local fields so the date-fns arithmetic below is
    // unchanged — otherwise "Today"/"Yesterday" name the wrong day during the
    // hours where the viewer's zone and GMT+8 sit on different calendar dates.
    const today = bkkTodayAsLocalFields();
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

  const Calendar = ({ days, month }: { days: Date[]; month: Date }) => (
    <div className="w-full">
      {/* Month Header */}
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 text-center mb-4">
        {format(month, 'MMMM yyyy')}
      </h3>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const isCurrentMonth = isSameMonth(day, month);
          const isSelectedStart = isRangeStart(day);
          const isSelectedEnd = isRangeEnd(day);
          const isInSelectedRange = isInRange(day);
          const isToday = isSameDay(day, bkkTodayAsLocalFields());
          const isFuture = isFutureBkkDay(day);
          const isDisabled = !isCurrentMonth || isFuture;

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              onMouseEnter={() => handleMouseEnter(day)}
              className={`
                h-8 text-sm rounded-full transition-all duration-200 flex items-center justify-center active:scale-90
                ${!isCurrentMonth ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-700 dark:text-slate-300 cursor-pointer'}
                ${isFuture && isCurrentMonth ? 'opacity-40 cursor-not-allowed' : ''}
                ${isToday && !isSelectedStart && !isSelectedEnd ? 'border border-indigo-500 font-semibold' : ''}
                ${isSelectedStart || isSelectedEnd ? 'bg-indigo-600 text-white font-semibold' : ''}
                ${isInSelectedRange ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200' : ''}
                ${isCurrentMonth && !isDisabled && !isSelectedStart && !isSelectedEnd && !isInSelectedRange ? 'hover:bg-slate-100 dark:hover:bg-slate-800' : ''}
                ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
              disabled={isDisabled}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );

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
          <svg className="w-3.5 h-3.5 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </button>

      {/* Popup Calendar. Right-anchored, as in the marketing-stats original —
          the trigger sits near the right end of its toolbar in both, so the
          800px panel has to open inward (leftward) to stay on the page. */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200/70 dark:border-slate-700/70 rounded-2xl shadow-xl z-30 p-4 sm:p-6 w-[300px] sm:w-auto sm:min-w-[800px]">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
            {/* Quick Selection Panel */}
            <div className="w-full sm:w-48 flex-shrink-0">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Quick Selection</h4>
              <div className="grid grid-cols-2 sm:flex sm:flex-col gap-1.5 sm:gap-0 sm:space-y-1">
                {quickOptions.map(option => (
                  <button
                    key={option.key}
                    onClick={() => handleQuickSelect(option.key)}
                    className="w-full text-left px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-400 rounded transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {/* Selected Dates Display */}
              {(dateRange.startDate || dateRange.endDate) && (
                <div className="mt-3 sm:mt-4 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <h5 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Selected Range</h5>
                  <div className="text-sm text-slate-800 dark:text-slate-200">
                    {dateRange.startDate && format(dateRange.startDate, 'MMM d, yyyy')}
                    {dateRange.endDate && ` - ${format(dateRange.endDate, 'MMM d, yyyy')}`}
                  </div>
                </div>
              )}
            </div>

            {/* Calendars */}
            <div className="flex-1">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <button
                  onClick={() => navigateMonths('prev')}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="flex gap-2 items-center">
                  <span className="text-sm sm:text-lg font-semibold text-slate-800 dark:text-slate-200">
                    {format(leftMonth, 'MMMM yyyy')}
                  </span>
                  <span className="text-lg text-slate-400 hidden sm:inline">→</span>
                  <span className="text-lg font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline">
                    {format(rightMonth, 'MMMM yyyy')}
                  </span>
                </div>
                
                <button
                  onClick={() => navigateMonths('next')}
                  disabled={isNextMonthNavDisabled}
                  aria-label="Next month"
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Two Calendars Side by Side */}
              <div className="flex flex-col sm:flex-row gap-8">
                <div className="flex-1">
                  <Calendar days={leftDays} month={leftMonth} />
                </div>
                <div className="hidden sm:block flex-1">
                  <Calendar days={rightDays} month={rightMonth} />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-between items-center mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 gap-4 sm:gap-0">
            <button
              onClick={() => {
                setDateRange({ startDate: null, endDate: null });
                setTempEndDate(null);
              }}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Clear Selection
            </button>
            
            <div className="flex gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={!isApplicable}
                className="px-6 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:scale-95 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed disabled:active:scale-100 transition-all"
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