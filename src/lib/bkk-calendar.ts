/**
 * Calendar-grid helpers for the date-range picker, in Bangkok time.
 *
 * Ported from marketing-stats' `lib/utils/dateUtils.ts` (the DateRangePicker
 * that ships with it is written against that bridge), with two deliberate
 * changes for this app:
 *
 *  - the business zone is BKK (UTC+7), not GMT+8. Every date in this codebase
 *    — the dedup key, the ref's day part, the BO job window — is a BKK
 *    calendar day, so the picker must agree with `bkkDate()` about which day
 *    "today" is.
 *  - the boundary type is a plain `YYYY-MM-DD` string rather than a
 *    UTC-anchored Date. That is what the list-tab filters already put in the
 *    URL and what `buildWhere` turns into a `+07:00` range, so converting to
 *    Dates and back would only add a place for the day to slip.
 *
 * The picker's grid math (date-fns `startOfWeek`/`eachDayOfInterval`/
 * `isSameDay`/...) all reads LOCAL fields. Rather than rewrite it, the
 * conversions below hand it a local-fielded Date carrying the intended
 * calendar date and read the same fields back out — the calendar date never
 * shifts, whatever zone the viewer's browser is in.
 */

/** BKK has never observed DST, so a fixed offset is exact. */
export const BKK_UTC_OFFSET_MINUTES = 7 * 60;

/**
 * A stored timestamp as BKK wall clock, `YYYY-MM-DD HH:mm`.
 *
 * `toISOString()` on its own prints UTC, which is seven hours behind everything
 * else this app shows — a draft saved at 16:29 Bangkok rendered as 09:29, and
 * one saved after 17:00 rendered on the PREVIOUS day. Every other date here
 * (the dedup key, the request ref, an individual draft's label) is BKK, so a
 * UTC one on the same screen reads as a different draft.
 */
export function formatBkkDateTime(at: Date): string {
  const shifted = new Date(at.getTime() + BKK_UTC_OFFSET_MINUTES * 60_000);
  return shifted.toISOString().slice(0, 16).replace('T', ' ');
}

/** Today's BKK calendar date as plain parts (month 0-indexed, as Date uses). */
export function bkkToday(): { year: number; month: number; day: number } {
  const shifted = new Date(Date.now() + BKK_UTC_OFFSET_MINUTES * 60_000);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth(), day: shifted.getUTCDate() };
}

/**
 * Today in BKK as a local-fielded Date, so it can be fed straight into the
 * same local date-fns helpers the grid uses (subDays, startOfMonth, ...).
 * Without this, "Today"/"Yesterday" name the wrong day during the hours where
 * the viewer's zone and BKK sit on different calendar dates.
 */
export function bkkTodayAsLocalFields(): Date {
  const { year, month, day } = bkkToday();
  return new Date(year, month, day);
}

/**
 * Compares calendar date only, never clock time — so today itself is never
 * disabled no matter what hour it currently is.
 */
export function isFutureBkkDay(date: Date): boolean {
  const today = bkkTodayAsLocalFields();
  if (date.getFullYear() !== today.getFullYear()) return date.getFullYear() > today.getFullYear();
  if (date.getMonth() !== today.getMonth()) return date.getMonth() > today.getMonth();
  return date.getDate() > today.getDate();
}

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** `YYYY-MM-DD` -> local-fielded Date carrying that same calendar date. */
export function isoDayToLocalFields(value: string | null | undefined): Date | null {
  const match = ISO_DAY.exec((value ?? '').trim());
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  // Rejects 2026-02-31 and friends, which Date would silently roll forward.
  return Number.isNaN(date.getTime()) || date.getMonth() !== Number(month) - 1 ? null : date;
}

/** Local-fielded Date -> `YYYY-MM-DD`. Built from the local fields, never
 *  `toISOString()`, which would re-interpret them in UTC and shift the day. */
export function localFieldsToIsoDay(value: Date | null | undefined): string {
  if (!value || Number.isNaN(value.getTime())) return '';
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
}
