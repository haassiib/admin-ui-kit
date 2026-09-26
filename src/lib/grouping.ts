/**
 * MULTI-LEVEL GROUPING — Lark Base groups by several fields at once, each
 * level with its own direction. One level is just the common case of the same
 * model, so there is a single code path rather than a special one for it.
 *
 * ── Why the render output is FLAT ────────────────────────────────────────────
 *
 * A nested tree is the obvious model and the wrong one here, because the thing
 * being rendered is a <table>: a flat sequence of <tr>. Emitting a tree means
 * the component walks it back into a sequence itself, and every collapse
 * becomes a recursive filter. `groupRows` emits the sequence directly —
 * headers and rows, each carrying its DEPTH — so the component maps over one
 * array and collapsing is "skip until the next header at depth ≤ mine".
 *
 * PURE and generic over the row: the caller says how a row is keyed and
 * labelled for a level. Origin: the generic half of ticket-management (96S2)
 * `lib/ticket/grouping.ts`, with the counting moved client-side — the rows
 * are all in hand here, so a band's size is counted rather than aggregated
 * by a query.
 */

export type SortDir = 'asc' | 'desc';

/** One level of grouping: what to group by, and which way round. */
export type GroupLevel<TBy extends string = string> = { by: TBy; dir: SortDir };

/** Three: a fourth band of headers leaves no width for the row beneath it. */
export const MAX_GROUP_LEVELS = 3;

/**
 * `department:asc,status:desc`. The single-level form (`department`) still
 * parses, and means ascending. Unrecognised or duplicate levels are dropped
 * rather than erroring. Split on the LAST `:` — a `by` may carry a colon of
 * its own, and `dir` is always the plain word at the very end.
 */
export function parseGroupLevels<TBy extends string>(
  raw: string | string[] | undefined,
  isBy: (v: string) => v is TBy,
): GroupLevel<TBy>[] {
  const text = Array.isArray(raw) ? raw[0] : raw;
  if (!text) return [];
  const out: GroupLevel<TBy>[] = [];
  const seen = new Set<string>();
  for (const part of String(text).split(',')) {
    const trimmed = part.trim();
    const cut = trimmed.lastIndexOf(':');
    const byRaw = cut === -1 ? trimmed : trimmed.slice(0, cut);
    const dirRaw = cut === -1 ? undefined : trimmed.slice(cut + 1);
    if (!isBy(byRaw) || seen.has(byRaw)) continue;
    seen.add(byRaw);
    out.push({ by: byRaw, dir: dirRaw === 'desc' ? 'desc' : 'asc' });
    if (out.length >= MAX_GROUP_LEVELS) break;
  }
  return out;
}

export function groupLevelsToParam(levels: readonly GroupLevel[]): string {
  return levels.slice(0, MAX_GROUP_LEVELS).map((l) => `${l.by}:${l.dir}`).join(',');
}

/** Separator for a composite group key. NUL, because no id or label can
 *  contain one — a `|` or `:` could collide with a real value. */
const SEP = '\u0000';

export function compositeKey(parts: readonly string[]): string {
  return parts.join(SEP);
}

/** What `groupRows` emits: a header band, or a row, each with its depth. */
export type GridItem<T> =
  | {
      kind: 'header';
      /** The composite prefix — unique across levels, so it can key collapse state. */
      id: string;
      label: string;
      count: number;
      depth: number;
    }
  | { kind: 'row'; row: T; depth: number };

/**
 * Rows ALREADY ORDERED by the level keys outermost-first, as a flat render
 * list of headers and rows. A header is emitted whenever its level's key
 * CHANGES relative to the previous row — exactly a group boundary. A change
 * at level 1 re-emits every level below it, which is what makes the second
 * department's "Open" band its own header rather than a continuation of the
 * first's. Counts are the rows actually under each header.
 */
export function flattenGroups<T>(
  rows: readonly T[],
  levels: readonly GroupLevel[],
  keyOf: (row: T, by: string) => string,
  labelOf: (by: string, key: string) => string,
): GridItem<T>[] {
  if (levels.length === 0) {
    return rows.map((row) => ({ kind: 'row' as const, row, depth: 0 }));
  }

  const out: GridItem<T>[] = [];
  const counts = new Map<string, number>();
  let previous: string[] = [];

  for (const row of rows) {
    const keys = levels.map((l) => keyOf(row, l.by));
    for (let depth = 0; depth < keys.length; depth += 1) {
      const changed = previous.length < depth + 1 || previous[depth] !== keys[depth];
      if (!changed) continue;
      const id = compositeKey(keys.slice(0, depth + 1));
      out.push({ kind: 'header', id, label: labelOf(levels[depth].by, keys[depth]), count: 0, depth });
      // Truncate, so the levels below this one are seen as changed as well.
      previous = keys.slice(0, depth + 1);
    }
    previous = keys;
    for (let depth = 1; depth <= keys.length; depth += 1) {
      const id = compositeKey(keys.slice(0, depth));
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    out.push({ kind: 'row', row, depth: keys.length });
  }

  for (const item of out) {
    if (item.kind === 'header') item.count = counts.get(item.id) ?? 0;
  }
  return out;
}

/**
 * Which items a set of collapsed header ids hides. A collapsed header hides
 * everything after it until the next header at the same depth OR SHALLOWER —
 * that boundary is what makes collapsing a department fold its statuses away
 * with it, rather than leaving orphaned sub-headers behind.
 */
export function applyCollapse<T>(
  items: readonly GridItem<T>[],
  collapsed: ReadonlySet<string>,
): GridItem<T>[] {
  const out: GridItem<T>[] = [];
  let hidingBelow: number | null = null;
  for (const item of items) {
    if (hidingBelow !== null) {
      const escapes = item.kind === 'header' && item.depth <= hidingBelow;
      if (!escapes) continue;
      hidingBelow = null;
    }
    out.push(item);
    if (item.kind === 'header' && collapsed.has(item.id)) hidingBelow = item.depth;
  }
  return out;
}

/** Every header id in a list — what "collapse all" needs. */
export function headerIds<T>(items: readonly GridItem<T>[]): string[] {
  return items.flatMap((i) => (i.kind === 'header' ? [i.id] : []));
}
