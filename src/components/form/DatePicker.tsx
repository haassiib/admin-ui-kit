'use client';

/* Origin: marketing-stats (96S1), verbatim. */

import { useState, useRef, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { businessTodayAsLocalFields, isFutureBusinessDay } from '@/lib/dateUtils';

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
  const today = businessTodayAsLocalFields();
  const isNextMonthDisabled = displayMonth.getFullYear() > today.getFullYear()
    || (displayMonth.getFullYear() === today.getFullYear() && displayMonth.getMonth() >= today.getMonth());

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(startOfMonth(displayMonth)),
    end: endOfWeek(endOfMonth(displayMonth)),
  });

  const handleDateSelect = (day: Date) => {
    if (isDateDisabled(day)) return;
    onChange(day);
    setIsOpen(false);
  };

  const nextMonth = () => setDisplayMonth(addMonths(displayMonth, 1));
  const prevMonth = () => setDisplayMonth(subMonths(displayMonth, 1));

  return (
    <div className={`relative ${className}`} ref={popupRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`relative w-full cursor-default rounded-lg bg-white dark:bg-gray-700 py-2 pl-3 pr-10 text-left border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-gray-900 dark:text-gray-100 transition-transform active:scale-[0.98] ${
          disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed active:scale-100' : ''
        }`}
        disabled={disabled}
      >
        <span className="block truncate">{value ? format(value, 'MMMM d, yyyy') : placeholder}</span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl shadow-lg border border-gray-200/70 dark:border-gray-700/70 p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-90 transition-transform"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {format(displayMonth, 'MMMM yyyy')}
            </div>
            <button
              type="button"
              onClick={nextMonth}
              disabled={isNextMonthDisabled}
              aria-label="Next month"
              className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent active:scale-90 transition-transform"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-gray-400 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {daysInMonth.map(day => {
              const isCurrentMonth = isSameMonth(day, displayMonth);
              const isSelected = value ? isSameDay(day, value) : false;
              const isDisabled = isDateDisabled(day);

              return (
                <button
                  key={day.toString()}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  disabled={isDisabled}
                  className={`
                    w-8 h-8 rounded-full text-sm flex items-center justify-center transition-all active:scale-90
                    ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}
                    ${isDisabled ? 'cursor-not-allowed opacity-40' : ''}
                    ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-semibold'
                        : isCurrentMonth && !isDisabled
                        ? 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        : ''
                    }
                  `}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default DatePicker;