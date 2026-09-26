// ---------------------------------------------------------------------------
// Reporting timezone (GMT+8)
// ---------------------------------------------------------------------------
// Every report in this app is denominated in GMT+8 — the brands' operating
// timezone — NOT the viewer's browser zone or the server's. Two rules make
// that work, and every date-handling helper below exists to enforce one of
// them:
//
//   1. Every date that represents a report boundary is UTC-ANCHORED: its UTC
//      calendar fields ARE the intended calendar date. This matches how the
//      data itself is stored — the sync scripts write plain calendar labels at
//      UTC midnight (`new Date(`${date}T00:00:00.000Z`)`, see
//      scripts/lib/syncAgentStats.js) and AgentDepositRetention.regMonth /
//      BrandDepositRetention.regMonth are a month's 1st at UTC midnight. So a
//      boundary is built with Date.UTC(...) and read back with getUTC*(),
//      never with local getFullYear()/getMonth().
//   2. Every notion of "now"/"today" comes from businessToday() below, so the
//      current month, and which months are disabled as future, are the same
//      for a viewer in Dhaka, a viewer in Manila, and a UTC server.
//
// Mixing the two conventions is what silently widens a range by a month: a
// local-midnight Jul 1 in Asia/Dhaka (UTC+6) is really Jun 30 18:00Z, so
// reading getUTCMonth() off it reports JUNE. Build UTC, read UTC.
export const BUSINESS_TIMEZONE = 'Asia/Singapore';
// Asia/Singapore has never observed DST, so a fixed offset is exact here and
// avoids dragging Intl.DateTimeFormat into hot filter paths. Revisit only if
// BUSINESS_TIMEZONE is ever changed to a zone that does observe DST.
export const BUSINESS_UTC_OFFSET_MINUTES = 8 * 60;

// Today's calendar date in GMT+8, as plain parts (month is 0-indexed, matching
// Date's own convention). Use these to seed pickers and "current month"
// defaults instead of reading local fields off `new Date()`.
export function businessToday(): { year: number; month: number; day: number } {
  const shifted = new Date(Date.now() + BUSINESS_UTC_OFFSET_MINUTES * 60_000);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth(), day: shifted.getUTCDate() };
}

// True when (year, month) is later than the current GMT+8 month — the "no
// future months" guard shared by the month pickers.
export function isFutureBusinessMonth(year: number, month: number): boolean {
  const today = businessToday();
  return year > today.year || (year === today.year && month > today.month);
}

// --- UTC-anchored constructors (rule 1) ------------------------------------

export function utcDayStart(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day));
}

export function utcDayEnd(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
}

export function utcMonthStart(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 1));
}

// Last millisecond of the month — day 0 of the NEXT month is the last day of
// this one, so this stays correct across month lengths and leap years.
export function utcMonthEnd(year: number, month: number): Date {
  return new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
}

export function utcYearStart(year: number): Date {
  return new Date(Date.UTC(year, 0, 1));
}

// --- UTC-anchored readers (rule 1) -----------------------------------------

// Snap an already-UTC-anchored value back to its month start. Idempotent, and
// the shape server actions want when filtering a month-keyed column.
export function toUtcMonthStart(value: Date | string): Date {
  const date = value instanceof Date ? value : new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

// Add/subtract whole months on a UTC-anchored month start. Date.UTC normalizes
// out-of-range months (month -1 rolls the year back), so no wrapping math here.
export function addUtcMonths(value: Date, delta: number): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + delta, 1));
}

// --- Bridge for local-field calendar UIs -----------------------------------
// DateRangePicker lays out its day grid with date-fns helpers that all read
// LOCAL fields (startOfWeek/eachDayOfInterval/isSameDay/isSameMonth). Rather
// than rewrite that math, it converts at its ingest and emit boundaries: a
// UTC-anchored boundary comes in as a local-fielded Date carrying the same
// calendar date, and picked days go back out re-anchored to UTC. The grid math
// in between stays untouched, and no calendar date ever shifts.

// UTC-anchored -> local-fielded, same calendar date.
export function utcAnchoredToLocalFields(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

// local-fielded -> UTC-anchored, same calendar date.
export function localFieldsToUtcDayStart(value: Date | null | undefined): Date | null {
  if (!value) return null;
  return utcDayStart(value.getFullYear(), value.getMonth(), value.getDate());
}

export function localFieldsToUtcDayEnd(value: Date | null | undefined): Date | null {
  if (!value) return null;
  return utcDayEnd(value.getFullYear(), value.getMonth(), value.getDate());
}

// Today in GMT+8, expressed as a local-fielded Date so it can be fed straight
// into the same local date-fns helpers (subDays, startOfMonth, isSameDay, ...).
export function businessTodayAsLocalFields(): Date {
  const { year, month, day } = businessToday();
  return new Date(year, month, day);
}

// Day-level twin of isFutureBusinessMonth, for DatePicker/DateRangePicker —
// both lay out their grids in local-fielded dates (see the section above), so
// this compares against businessTodayAsLocalFields() rather than a UTC-anchored
// boundary. Compares calendar date only, never clock time, so "today" itself is
// never disabled no matter what time it currently is.
export function isFutureBusinessDay(date: Date): boolean {
  const today = businessTodayAsLocalFields();
  if (date.getFullYear() !== today.getFullYear()) return date.getFullYear() > today.getFullYear();
  if (date.getMonth() !== today.getMonth()) return date.getMonth() > today.getMonth();
  return date.getDate() > today.getDate();
}

// --- `YYYY-MM-DD` bridge --------------------------------------------------
// DateRangePicker's public value is a plain ISO day string, not a Date: that is
// what URL filters carry, and converting to a Date and back would only add a
// place for the day to slip. These two are its ingest/emit ends, and they work
// on LOCAL fields for the same reason as the section above.

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

// `YYYY-MM-DD` -> local-fielded Date carrying that same calendar date.
export function isoDayToLocalFields(value: string | null | undefined): Date | null {
  const match = ISO_DAY.exec((value ?? '').trim());
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  // Rejects 2026-02-31 and friends, which Date would silently roll forward.
  return Number.isNaN(date.getTime()) || date.getMonth() !== Number(month) - 1 ? null : date;
}

// Local-fielded Date -> `YYYY-MM-DD`. Built from the local fields, never
// `toISOString()`, which would re-interpret them in UTC and shift the day.
export function localFieldsToIsoDay(value: Date | null | undefined): string {
  if (!value || Number.isNaN(value.getTime())) return '';
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
}

// "Jul 2026" for a UTC-anchored month boundary. Read in UTC, because date-fns
// `format` reads LOCAL fields and would render a UTC-anchored Jul 1 as
// "Jun 2026" for any viewer west of UTC. One formatter for every month label
// so the trigger, the panel header and a chart axis cannot disagree.
export function formatUtcMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

// --- Migration for already-persisted filter state --------------------------
// The six filter stores persist their dateRange to localStorage, and versions
// of this app before the GMT+8 switch wrote LOCAL-midnight boundaries there.
// Re-anchoring those to UTC has to read their LOCAL fields, since local is the
// convention that produced them — and this only ever runs in the browser that
// wrote them, so those fields are the right ones. Wired up as each store's
// persist `migrate` at version 1; without it a returning user's saved range
// stays a month off until they re-pick it.
export function migrateLegacyLocalDateRange<T extends { dateRange?: { startDate?: unknown; endDate?: unknown } }>(persisted: T): T {
  const range = persisted?.dateRange;
  if (!range) return persisted;

  const reanchorStart = (value: unknown): Date | null => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value as string);
    if (Number.isNaN(date.getTime())) return null;
    return utcMonthStart(date.getFullYear(), date.getMonth());
  };
  const reanchorEnd = (value: unknown): Date | null => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value as string);
    if (Number.isNaN(date.getTime())) return null;
    return utcMonthEnd(date.getFullYear(), date.getMonth());
  };

  return {
    ...persisted,
    dateRange: { startDate: reanchorStart(range.startDate), endDate: reanchorEnd(range.endDate) },
  };
}
