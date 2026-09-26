'use client';

import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, startOfWeek, endOfWeek } from 'date-fns';
import { cn } from '@/lib/cn';
import { businessTodayAsLocalFields, isFutureBusinessDay } from '@/lib/dateUtils';

// Shared by DatePicker (one grid) and DateRangePicker (one grid per month) —
// a weekday header plus the 5–6 week grid of day buttons for one month. The
// sibling of MonthGrid, and for the same reason: the two pickers each carried
// their own copy of this grid, and they had already drifted (one showed a
// "today" ring, one did not; their cell hover colours differed by a shade).
//
// The grid is laid out in LOCAL date fields — date-fns' startOfWeek /
// eachDayOfInterval / isSameDay all read local fields — so a caller feeds it
// local-fielded Dates and gets local-fielded Dates back. See dateUtils'
// "bridge" section for how those relate to the business timezone.

export const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/** Every day on the whole-week grid that shows `month`, Sunday first. */
export function calendarDays(month: Date): Date[] {
  return eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  });
}

export interface DayState {
  /** A picked day — the single value, or either end of a range. */
  selected?: boolean;
  /** A day strictly between the two ends of a range. */
  inRange?: boolean;
}

interface DayGridProps {
  /** Any day inside the month to lay out. */
  month: Date;
  onPick: (day: Date) => void;
  /** Fires as the pointer crosses a day. DateRangePicker previews the range with it. */
  onHover?: (day: Date) => void;
  /** Which days are greyed out. Defaults to "no future days", the rule every date field in this app uses. */
  isDayDisabled?: (day: Date) => boolean;
  /** Per-day highlight: the picked day(s) and the days between two ends. */
  dayState?: (day: Date) => DayState;
  /**
   * The days that pad the grid out to whole weeks. `muted` keeps them
   * clickable, so a day at the end of last month is one click away rather
   * than a month step and a click; `disabled` makes them inert, which a
   * two-month range picker wants because the same day is already clickable on
   * the neighbouring grid.
   */
  outsideDays?: 'muted' | 'disabled';
  /** Show "July 2026" above the grid. Off when the caller has one header over several grids. */
  title?: boolean;
}

const NONE: DayState = {};

export function DayGrid({
  month,
  onPick,
  onHover,
  isDayDisabled = isFutureBusinessDay,
  dayState = () => NONE,
  outsideDays = 'muted',
  title = false,
}: DayGridProps) {
  const today = businessTodayAsLocalFields();

  return (
    <div className="w-full">
      {title && (
        <h3 className="mb-3 text-center text-sm font-semibold text-slate-800 dark:text-slate-200">
          {format(month, 'MMMM yyyy')}
        </h3>
      )}

      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {WEEKDAY_LABELS.map((day) => (
          <div key={day} className="py-1">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays(month).map((day) => {
          const outside = !isSameMonth(day, month);
          const inert = outside && outsideDays === 'disabled';
          const greyed = isDayDisabled(day);
          // An inert padding day is a duplicate of a clickable one on the
          // neighbouring grid; highlighting it too reads as two selections.
          const { selected, inRange } = inert ? NONE : dayState(day);
          const isToday = isSameDay(day, today);

          return (
            <button
              key={day.getTime()}
              type="button"
              onClick={() => onPick(day)}
              onMouseEnter={onHover && (() => onHover(day))}
              disabled={inert || greyed}
              className={cn(
                'flex h-8 w-8 items-center justify-center justify-self-center rounded-full text-xs transition-all active:scale-90',
                outside ? 'text-slate-300 dark:text-slate-600' : 'text-slate-700 dark:text-slate-300',
                // Greyed days inside the month fade; padding days are already faint.
                greyed && !outside && 'opacity-40',
                (inert || greyed) && 'cursor-not-allowed',
                isToday && !selected && 'border border-indigo-500 font-semibold',
                selected && 'bg-indigo-600 font-semibold text-white',
                inRange && 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200',
                !inert && !greyed && !selected && !inRange && 'hover:bg-slate-100 dark:hover:bg-slate-700',
              )}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
