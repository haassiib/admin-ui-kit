'use client';

/* Origin: marketing-stats (96S1), verbatim. */

import { useState, useRef } from 'react';
import { format, isSameDay, addMonths, subMonths } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { DayGrid } from './DayGrid';
import { isFutureBusinessDay, isFutureBusinessMonth } from '@/lib/dateUtils';
import { useDismiss } from '@/lib/use-dismiss';

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  // Which days are greyed out in the grid. Defaults to "no future days", the
  // rule every date field in this app uses.
  isDateDisabled?: (date: Date) => boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select a date',
  className = '',
  disabled = false,
  isDateDisabled = isFutureBusinessDay,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayMonth, setDisplayMonth] = useState(value || new Date());
  const popupRef = useRef<HTMLDivElement>(null);
  // Caps the "next month" arrow at the current GMT+8 month — no browsing into a
  // future month at all, not just greying out its individual days.
  const nextMonthDate = addMonths(displayMonth, 1);
  const isNextMonthDisabled = isFutureBusinessMonth(nextMonthDate.getFullYear(), nextMonthDate.getMonth());

  useDismiss(popupRef, isOpen, () => setIsOpen(false));

  const handleDateSelect = (day: Date) => {
    if (isDateDisabled(day)) return;
    onChange(day);
    setIsOpen(false);
  };

  const nextMonth = () => setDisplayMonth(nextMonthDate);
  const prevMonth = () => setDisplayMonth(subMonths(displayMonth, 1));

  return (
    <div className={`relative ${className}`} ref={popupRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`relative field-input pr-8 text-left ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        disabled={disabled}
      >
        <span className={`block truncate ${value ? '' : 'text-slate-400 dark:text-slate-500'}`}>{value ? format(value, 'MMMM d, yyyy') : placeholder}</span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <CalendarIcon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
        </span>
      </button>

      {isOpen && (
        <div data-overlay="picker" className="absolute z-50 mt-1 w-full min-w-[16rem] panel panel-solid p-3 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Previous month"
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700 dark:hover:text-indigo-400 transition-colors active:scale-90"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {format(displayMonth, 'MMMM yyyy')}
            </div>
            <button
              type="button"
              onClick={nextMonth}
              disabled={isNextMonthDisabled}
              aria-label="Next month"
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700 dark:hover:text-indigo-400 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-colors active:scale-90"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <DayGrid
            month={displayMonth}
            onPick={handleDateSelect}
            isDayDisabled={isDateDisabled}
            dayState={(day) => ({ selected: value ? isSameDay(day, value) : false })}
          />
        </div>
      )}
    </div>
  );
}

export default DatePicker;
