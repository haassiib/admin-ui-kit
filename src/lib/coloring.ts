/**
 * CONDITIONAL COLOURING — a filter predicate with a colour attached.
 *
 * PURE. What it decides is which tone (if any) a row or a cell takes; what
 * that tone LOOKS like is `lib/tones` (`ROW_TINT`, `CELL_TINT`).
 *
 * THE VOCABULARY IS SHARED, NOT COPIED. `Operator`, `FilterKind`, `isValueless`
 * and the comparison itself all come from `lib/conditions`, so an operator
 * added there is offered and evaluated here with no second table to update.
 *
 * ── First match wins ────────────────────────────────────────────────────────
 *
 * Per target, not per list. A row takes the first ROW-scoped rule that matches
 * it; each cell takes the first CELL-scoped rule that matches AND names that
 * column. Two rules can therefore both apply — one painting the row, one
 * painting a cell in it — which is the point of having two scopes.
 *
 * Origin: ticket-management (96S2) `lib/ticket/coloring.ts`.
 */

import { isValueless, matches, type Operator, type RowReader } from './conditions';
import { TONES, isTone, type Tone } from './tones';

/**
 * WHERE a rule paints. `cell` colours only the column the rule names; `row`
 * colours the whole row. Cell is the default because it is the
 * reversible-looking one: a wrong cell rule tints one column, a wrong row
 * rule repaints the grid.
 */
export const COLOR_SCOPES = ['cell', 'row'] as const;
export type ColorScope = (typeof COLOR_SCOPES)[number];

export type ColorRule = {
  /** Stable across reorders and edits, so React keys and drags do not swap rows. */
  id: string;
  scope: ColorScope;
  /** A `FilterField` id. */
  field: string;
  op: Operator;
  value: string;
  /** A tone token from `COLOR_TONES` — never a raw colour. */
  tone: Tone;
};

/** The full palette, so the grid has ONE set of colours across pills, rules
 *  and swatches. */
export const COLOR_TONES = TONES;

/** Twenty, matching `MAX_CONDITIONS`: every rule is evaluated against every
 *  row on the page, and a list longer than that is not something a reader
 *  can hold in their head while looking at the colours it produces. */
export const MAX_COLOR_RULES = 20;

export function isColorScope(v: unknown): v is ColorScope {
  return COLOR_SCOPES.includes(v as ColorScope);
}

/**
 * A rule that survived the round trip through storage. localStorage is
 * user-writable and outlives deploys, so every field is checked rather than
 * trusted — a rule naming a tone that no longer exists is DROPPED, not
 * rendered as a crash.
 */
export function isColorRule(v: unknown): v is ColorRule {
  if (!v || typeof v !== 'object') return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.field === 'string' &&
    typeof r.op === 'string' &&
    typeof r.value === 'string' &&
    isColorScope(r.scope) &&
    isTone(r.tone)
  );
}

/** Ids only have to be unique within one browser's list. */
export function newRuleId(): string {
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** One rule against one row. Split out so a rule can be previewed on its own. */
export function ruleMatches(rule: ColorRule, row: RowReader): boolean {
  if (!isValueless(rule.op) && rule.value === '') return false;
  return matches(row.valueOf(rule.field), rule.op, rule.value, row.kindOf(rule.field));
}

export type RowColors = {
  /** The tone painting the whole row, or null. */
  row: Tone | null;
  /** Field id → tone, for the cell-scoped rules that matched. */
  cells: Record<string, Tone>;
};

const NO_COLORS: RowColors = { row: null, cells: {} };

/**
 * Every colour ONE row takes, in one pass over the rules. Returns a shared
 * frozen empty result when there is nothing to do — the overwhelmingly common
 * case is no rules at all, and that path must not allocate per row.
 */
export function resolveRowColors(rules: readonly ColorRule[], row: RowReader): RowColors {
  if (rules.length === 0) return NO_COLORS;

  let tone: Tone | null = null;
  const cells: Record<string, Tone> = {};

  for (const rule of rules) {
    // FIRST MATCH WINS, per target.
    if (rule.scope === 'row' ? tone !== null : cells[rule.field] !== undefined) continue;
    if (!ruleMatches(rule, row)) continue;
    if (rule.scope === 'row') tone = rule.tone;
    else cells[rule.field] = rule.tone;
  }

  return tone === null && Object.keys(cells).length === 0 ? NO_COLORS : { row: tone, cells };
}
