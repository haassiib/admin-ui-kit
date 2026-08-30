/**
 * Table sorting, as pure functions so the comparator can be tested in bare Node
 * rather than through a rendered table.
 *
 * One comparator for every column type. The alternative — a `sortBy` string plus
 * ad-hoc `a.x > b.x` at each call site — is where sort bugs live: numbers
 * compared as strings ("10" < "9"), and nulls silently sorting as "" or 0 and so
 * claiming a row has the lowest value rather than no value.
 */

export type SortDirection = 'asc' | 'desc';
export type SortState = { key: string; dir: SortDirection } | null;

/** What a column's value is, which decides how two of them are compared. */
export type SortKind = 'text' | 'number' | 'date';

/**
 * Missing values sort LAST in both directions.
 *
 * Deliberately not "lowest": a user with no department has no position on that
 * axis, and floating them to the top of a descending sort would read as them
 * ranking highest. Last in both directions is the only answer that never
 * asserts something untrue.
 */
function compareValues(a: unknown, b: unknown, kind: SortKind): number {
  const aMissing = a === null || a === undefined || a === '';
  const bMissing = b === null || b === undefined || b === '';
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;

  if (kind === 'number') return Number(a) - Number(b);
  if (kind === 'date') return new Date(a as string | Date).getTime() - new Date(b as string | Date).getTime();

  // `localeCompare` with numeric so "row 2" precedes "row 10", and
  // case-insensitively so a capitalised name is not banished to its own block.
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Sort a copy, never in place — the caller's array is usually props, and React
 * will not re-render a mutated one.
 *
 * STABLE: `Array.prototype.sort` is stable per spec, so rows that tie keep the
 * order they arrived in. That is what makes the underlying `createdAt desc` the
 * implicit tiebreak everywhere without having to say so.
 */
export function sortRows<T>(
  rows: readonly T[],
  sort: SortState,
  valueOf: (row: T, key: string) => unknown,
  kindOf: (key: string) => SortKind,
): T[] {
  if (!sort) return [...rows];
  const kind = kindOf(sort.key);
  const factor = sort.dir === 'asc' ? 1 : -1;

  return [...rows].sort((a, b) => {
    const result = compareValues(valueOf(a, sort.key), valueOf(b, sort.key), kind);
    // Missing-last must survive the direction flip, so the tie-breaking sign is
    // applied to the comparison only, never to the missing-value verdict.
    if (result === 0) return 0;
    const aMissing = isMissing(valueOf(a, sort.key));
    const bMissing = isMissing(valueOf(b, sort.key));
    if (aMissing !== bMissing) return result;
    return result * factor;
  });
}

const isMissing = (v: unknown) => v === null || v === undefined || v === '';

/**
 * Click cycling: unsorted -> asc -> desc -> unsorted.
 *
 * The third state matters. Without it there is no way back to the order the
 * server sent, which for these tables is newest-first — the order most of them
 * are useful in.
 */
export function nextSort(current: SortState, key: string): SortState {
  if (!current || current.key !== key) return { key, dir: 'asc' };
  if (current.dir === 'asc') return { key, dir: 'desc' };
  return null;
}
