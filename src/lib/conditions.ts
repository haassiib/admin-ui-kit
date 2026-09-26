/**
 * Filter CONDITIONS — the `[field] [operator] [value]` rows behind a Lark Base
 * style filter, matching all or any — and the evaluator that answers them
 * against a row already in the browser.
 *
 * PURE: no React, no DOM, no date library. The panels (`FilterPanel`,
 * `ColorRulesPanel`, `ConditionGroupsBuilder`) build conditions; `matches` /
 * `conditionsMatch` evaluate them; `BaseGrid` does both.
 *
 * Origin: ticket-management (96S2) `lib/ticket/conditions.ts` (the operator
 * and kind vocabulary) and `lib/ticket/coloring.ts` (the browser-side
 * comparison). There the server turned a condition into a database clause and
 * only the colouring rules were evaluated client-side; here the rows are in
 * hand, so ONE evaluator serves the filter and the colouring both — which is
 * also what stops them disagreeing about what "contains" means.
 */

import { BUSINESS_UTC_OFFSET_MINUTES, businessToday } from './dateUtils';

/* ── Operators ─────────────────────────────────────────────────────────────── */

export const OP = {
  IS: 'is',
  IS_NOT: 'isNot',
  CONTAINS: 'contains',
  NOT_CONTAINS: 'notContains',
  EMPTY: 'isEmpty',
  NOT_EMPTY: 'isNotEmpty',
  GT: 'gt',
  GTE: 'gte',
  LT: 'lt',
  LTE: 'lte',
  BEFORE: 'before',
  AFTER: 'after',
} as const;

export type Operator = (typeof OP)[keyof typeof OP];

export const OPERATOR_LABELS: Record<Operator, string> = {
  is: 'is',
  isNot: 'is not',
  contains: 'contains',
  notContains: "doesn't contain",
  isEmpty: 'is empty',
  isNotEmpty: 'is not empty',
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  before: 'is before',
  after: 'is after',
};

/** Operators that take NO value. The UI hides the value control for these. */
const VALUELESS: readonly Operator[] = [OP.EMPTY, OP.NOT_EMPTY];

export function isValueless(op: Operator): boolean {
  return VALUELESS.includes(op);
}

export function isOperator(v: string): v is Operator {
  return (Object.values(OP) as string[]).includes(v);
}

/* ── Date filter modes ────────────────────────────────────────────────────────
 *
 * A DATE `is` condition can name an EXACT day, or one of a fixed set of
 * RELATIVE windows ("today", "this week", ...) resolved at the moment the
 * filter is evaluated — Lark Base's own second dropdown next to the operator.
 * Encoded in `Condition.value` as `rel:<mode>` so the shape stays a plain
 * string, and a bare `YYYY-MM-DD` keeps meaning EXACT.
 */
export type DateMode =
  | 'exact'
  | 'today'
  | 'tomorrow'
  | 'yesterday'
  | 'thisWeek'
  | 'lastWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'past7Days'
  | 'next7Days'
  | 'past30Days'
  | 'next30Days';

export const DATE_MODE_OPTIONS: readonly { value: DateMode; label: string }[] = [
  { value: 'exact', label: 'Exact date' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'thisWeek', label: 'This week' },
  { value: 'lastWeek', label: 'Last week' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: 'past7Days', label: 'In the past 7 days' },
  { value: 'next7Days', label: 'Within the next 7 days' },
  { value: 'past30Days', label: 'In the past 30 days' },
  { value: 'next30Days', label: 'Within the next 30 days' },
];

const REL_PREFIX = 'rel:';

export function isRelativeDateValue(value: string): boolean {
  return value.startsWith(REL_PREFIX);
}

/** The mode a stored value asks for — `exact` for a bare day, for junk, and
 *  for a prefix naming a mode this build no longer knows. */
export function dateModeOf(value: string): DateMode {
  if (!value.startsWith(REL_PREFIX)) return 'exact';
  const mode = value.slice(REL_PREFIX.length);
  return DATE_MODE_OPTIONS.some((o) => o.value === mode && mode !== 'exact') ? (mode as DateMode) : 'exact';
}

export function relativeDateValue(mode: DateMode): string {
  return mode === 'exact' ? '' : `${REL_PREFIX}${mode}`;
}

type DayFields = { year: number; month: number; day: number };

function addDays(base: DayFields, delta: number): DayFields {
  const d = new Date(base.year, base.month, base.day + delta);
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
}

/** ISO — Monday. */
function startOfWeek(base: DayFields): DayFields {
  const weekday = new Date(base.year, base.month, base.day).getDay();
  return addDays(base, -((weekday + 6) % 7));
}

function startOfMonth(base: DayFields): DayFields {
  return { year: base.year, month: base.month, day: 1 };
}

function endOfMonth(base: DayFields): DayFields {
  const d = new Date(base.year, base.month + 1, 0);
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
}

function toIsoDay(base: DayFields): string {
  return `${base.year}-${String(base.month + 1).padStart(2, '0')}-${String(base.day).padStart(2, '0')}`;
}

const dayRange = (from: DayFields, to: DayFields) => ({ from: toIsoDay(from), to: toIsoDay(to) });

/**
 * A relative mode → the inclusive business-day range it names. `null` for
 * `exact`. "Past 7 days" and "next 7 days" both include today at the near end,
 * so together they cover exactly 13 days rather than leaving today in neither.
 */
export function resolveRelativeDateRange(mode: DateMode): { from: string; to: string } | null {
  if (mode === 'exact') return null;
  const today = businessToday();
  switch (mode) {
    case 'today': return dayRange(today, today);
    case 'tomorrow': { const t = addDays(today, 1); return dayRange(t, t); }
    case 'yesterday': { const y = addDays(today, -1); return dayRange(y, y); }
    case 'thisWeek': { const s = startOfWeek(today); return dayRange(s, addDays(s, 6)); }
    case 'lastWeek': { const s = addDays(startOfWeek(today), -7); return dayRange(s, addDays(s, 6)); }
    case 'thisMonth': return dayRange(startOfMonth(today), endOfMonth(today));
    case 'lastMonth': {
      const s = startOfMonth(addDays(startOfMonth(today), -1));
      return dayRange(s, endOfMonth(s));
    }
    case 'past7Days': return dayRange(addDays(today, -6), today);
    case 'next7Days': return dayRange(today, addDays(today, 6));
    case 'past30Days': return dayRange(addDays(today, -29), today);
    case 'next30Days': return dayRange(today, addDays(today, 29));
    default: return null;
  }
}

/* ── Multi-value (`contains` / `doesn't contain` on a SELECT) ──────────────── */

const MULTI_SEP = ',';

export function parseMultiValue(value: string): string[] {
  return value.split(MULTI_SEP).map((v) => v.trim()).filter((v) => v !== '');
}

export function toMultiValue(values: readonly string[]): string {
  return values.filter((v) => v !== '').join(MULTI_SEP);
}

/* ── Field kinds ───────────────────────────────────────────────────────────── */

/**
 * What a field is, for the purpose of CHOOSING OPERATORS. Deliberately
 * coarse: a single and a multi select offer the same operators, and so do a
 * short and a long text.
 *
 * `contains` / `doesn't contain` on the SELECT kind are MEMBERSHIP, not
 * substring: "holds any of these choices".
 */
export const KIND = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date',
  SELECT: 'select',
  BOOL: 'bool',
  /** A row id in another table — a user, a category. A select whose value
   *  happens to be an id. */
  REF: 'ref',
} as const;

export type FilterKind = (typeof KIND)[keyof typeof KIND];

const OPERATORS_BY_KIND: Record<FilterKind, readonly Operator[]> = {
  text: [OP.IS, OP.IS_NOT, OP.CONTAINS, OP.NOT_CONTAINS, OP.EMPTY, OP.NOT_EMPTY],
  number: [OP.IS, OP.IS_NOT, OP.GT, OP.GTE, OP.LT, OP.LTE, OP.EMPTY, OP.NOT_EMPTY],
  date: [OP.IS, OP.BEFORE, OP.AFTER, OP.EMPTY, OP.NOT_EMPTY],
  select: [OP.IS, OP.IS_NOT, OP.CONTAINS, OP.NOT_CONTAINS, OP.EMPTY, OP.NOT_EMPTY],
  bool: [OP.IS],
  ref: [OP.IS, OP.IS_NOT, OP.EMPTY, OP.NOT_EMPTY],
};

export function operatorsFor(kind: FilterKind): readonly Operator[] {
  return OPERATORS_BY_KIND[kind] ?? OPERATORS_BY_KIND.text;
}

/* ── The filterable field list ─────────────────────────────────────────────── */

export type FilterFieldOption = {
  value: string;
  label: string;
  /** A tone name from `lib/tones`, when the option carries colour. */
  tone?: string;
};

export type FilterField = {
  id: string;
  label: string;
  kind: FilterKind;
  /** Fixed choices, when the value control should be a picker. Omit rather
   *  than pass empty: the panel decides between a dropdown and a text box on
   *  `options?.length`. */
  options?: FilterFieldOption[];
};

/* ── The conditions themselves ─────────────────────────────────────────────── */

export type Condition = { field: string; op: Operator; value: string };

export type MatchMode = 'all' | 'any';

/** A cap, so a hand-built list cannot ask for a thousand-clause evaluation. */
export const MAX_CONDITIONS = 20;

/** A valued operator with nothing in it is an UNFINISHED row, not a filter
 *  for the empty string — the UI keeps it on screen and it narrows nothing. */
export function isComplete(c: Condition): boolean {
  return c.field !== '' && (isValueless(c.op) || c.value !== '');
}

/**
 * `field|op|value`, one per repeated `c` param, plus `match=any` — readable in
 * an address bar. A condition that cannot be parsed is DROPPED, not refused:
 * a hand-edited URL should degrade to a wider list, never to an error.
 */
export function parseConditions(
  params: Record<string, string | string[] | undefined>,
): { conditions: Condition[]; match: MatchMode } {
  const raw = params.c == null ? [] : Array.isArray(params.c) ? params.c : [params.c];
  const conditions: Condition[] = [];
  for (const entry of raw) {
    // Split on the FIRST TWO pipes only, so a value containing a pipe survives.
    const parts = String(entry).split('|');
    if (parts.length < 2) continue;
    const [field, op] = parts;
    const value = parts.slice(2).join('|');
    if (!field || !isOperator(op)) continue;
    if (!isValueless(op) && value === '') continue;
    conditions.push({ field, op, value: isValueless(op) ? '' : value });
    if (conditions.length >= MAX_CONDITIONS) break;
  }
  return { conditions, match: String(params.match ?? 'all') === 'any' ? 'any' : 'all' };
}

export function conditionsToParams(conditions: readonly Condition[]): string[] {
  return conditions
    .filter(isComplete)
    .slice(0, MAX_CONDITIONS)
    .map((c) => `${c.field}|${c.op}|${isValueless(c.op) ? '' : c.value}`);
}

/* ── OR-of-AND groups ──────────────────────────────────────────────────────── */

/**
 * Lark Base's automation shape: each GROUP is a card of rows combined by the
 * one shared `MatchMode`; groups are always OR'd. A separate, additive grammar
 * rather than an upgrade of the flat list, so a flat `Condition[]` (the grid
 * filter, a URL) keeps its shape.
 */
export type ConditionGroup = { conditions: Condition[] };

export const MAX_CONDITION_GROUPS = 10;

/* ── The comparison ────────────────────────────────────────────────────────── */

const isBlank = (v: unknown): boolean =>
  v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);

const text = (v: unknown): string =>
  Array.isArray(v) ? v.map((x) => String(x)).join(' ') : String(v ?? '');

/**
 * The business-timezone day a timestamp falls on, as `YYYY-MM-DD`. A date
 * rule is read against the day the reader sees in the column, not against
 * UTC — a row stamped at 06:00 on the 5th is 22:00 UTC on the 4th.
 */
export function businessDayOf(v: unknown): string | null {
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = v instanceof Date ? v : new Date(String(v));
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getTime() + BUSINESS_UTC_OFFSET_MINUTES * 60_000).toISOString().slice(0, 10);
}

/**
 * Does ONE value satisfy ONE operator?
 *
 * `raw` is whatever the row holds — a string, a number, a Date, an array from
 * a multi-select, or null. `expected` is always the string the condition
 * stored. An operator this function does not handle returns FALSE, never
 * true: an unrecognised rule must match nothing rather than everything.
 *
 * TEXT comparisons are case-insensitive; SELECT `is` on an array means
 * "contains this choice", the only reading under which a rule can match a
 * field holding two values.
 */
export function matches(raw: unknown, op: Operator, expected: string, kind: FilterKind): boolean {
  if (op === OP.EMPTY) return isBlank(raw);
  if (op === OP.NOT_EMPTY) return !isBlank(raw);
  // A half-built rule matches nothing.
  if (expected === '') return false;

  switch (kind) {
    case KIND.NUMBER: {
      const a = Number(raw);
      const b = Number(expected);
      if (isBlank(raw) || !Number.isFinite(a) || !Number.isFinite(b)) return false;
      switch (op) {
        case OP.IS: return a === b;
        case OP.IS_NOT: return a !== b;
        case OP.GT: return a > b;
        case OP.GTE: return a >= b;
        case OP.LT: return a < b;
        case OP.LTE: return a <= b;
        default: return false;
      }
    }

    case KIND.DATE: {
      const day = businessDayOf(raw);
      if (day === null) return false;
      switch (op) {
        case OP.IS: {
          if (isRelativeDateValue(expected)) {
            const range = resolveRelativeDateRange(dateModeOf(expected));
            return range !== null && day >= range.from && day <= range.to;
          }
          return day === expected;
        }
        case OP.BEFORE: return day < expected;
        case OP.AFTER: return day > expected;
        default: return false;
      }
    }

    case KIND.BOOL: {
      const want = expected === 'true' || expected === '1';
      const got = raw === true || raw === 'true' || raw === 1 || raw === '1';
      return op === OP.IS ? got === want : false;
    }

    case KIND.SELECT:
    case KIND.REF: {
      const held = Array.isArray(raw) ? raw.map((x) => String(x)) : [text(raw)];
      const wanted = parseMultiValue(expected);
      const hit = wanted.some((w) => held.includes(w));
      switch (op) {
        case OP.IS:
        case OP.CONTAINS: return hit;
        case OP.IS_NOT:
        case OP.NOT_CONTAINS: return !hit;
        default: return false;
      }
    }

    default: {
      const a = text(raw).toLowerCase();
      const b = expected.toLowerCase();
      switch (op) {
        case OP.IS: return a === b;
        case OP.IS_NOT: return a !== b;
        case OP.CONTAINS: return a.includes(b);
        case OP.NOT_CONTAINS: return !a.includes(b);
        default: return false;
      }
    }
  }
}

/** How a row answers for a field id: its raw value, and the field's kind. */
export type RowReader = {
  valueOf: (fieldId: string) => unknown;
  kindOf: (fieldId: string) => FilterKind;
};

/**
 * A flat list against one row. Incomplete conditions are skipped, so a
 * half-built row in the panel never narrows anything; an empty list matches.
 */
export function conditionsMatch(
  conditions: readonly Condition[],
  match: MatchMode,
  row: RowReader,
): boolean {
  const live = conditions.filter(isComplete);
  if (live.length === 0) return true;
  const test = (c: Condition) => matches(row.valueOf(c.field), c.op, c.value, row.kindOf(c.field));
  return match === 'any' ? live.some(test) : live.every(test);
}

/** OR-of-AND groups against one row. An empty group matches everything, the
 *  same fail-open reading the flat list has. */
export function groupsMatch(
  groups: readonly ConditionGroup[],
  match: MatchMode,
  row: RowReader,
): boolean {
  if (groups.length === 0) return true;
  return groups.some((g) => conditionsMatch(g.conditions, match, row));
}

/** The rows a list keeps. */
export function filterRows<T>(
  rows: readonly T[],
  conditions: readonly Condition[],
  match: MatchMode,
  reader: (row: T) => RowReader,
): T[] {
  if (!conditions.some(isComplete)) return [...rows];
  return rows.filter((r) => conditionsMatch(conditions, match, reader(r)));
}
