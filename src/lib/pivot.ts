/**
 * PIVOT — group records by some fields down the side and others across the
 * top, and aggregate the rest in the cells.
 *
 * PURE: records in, a result the table renders out. No React, so the maths
 * can be tested in bare Node and reused by a caller that renders its own way
 * (an export, a chart).
 *
 * ── How the totals come out right ───────────────────────────────────────────
 *
 * Every record is added to the accumulator of every PREFIX of its row path
 * crossed with every prefix of its column path. With rows Region › Rep and
 * columns Quarter, one record lands in (Region, Rep, Q1), (Region, Q1),
 * ((), Q1), (Region, Rep, ()), (Region, ()) and ((), ()). A subtotal is then
 * just the cell of a shorter path, and the grand total the cell of two empty
 * paths — each aggregated from the RECORDS, never summed from the cells
 * beneath it. That distinction matters: an average of averages, or a count
 * of distinct values added across groups, is simply the wrong number.
 */

export type PivotAgg = 'sum' | 'count' | 'avg' | 'min' | 'max' | 'countDistinct';

export const PIVOT_AGGS: { value: PivotAgg; label: string }[] = [
  { value: 'sum', label: 'Sum' },
  { value: 'count', label: 'Count' },
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Min' },
  { value: 'max', label: 'Max' },
  { value: 'countDistinct', label: 'Distinct count' },
];

/** One aggregated measure: a field and how it is combined. */
export type PivotValue = { field: string; agg: PivotAgg };

export type PivotConfig = {
  /** Fields grouping down the side, outermost first. */
  rows: string[];
  /** Fields grouping across the top, outermost first. */
  columns: string[];
  /** The measures in the cells. Empty means "count of records". */
  values: PivotValue[];
  /** Fields offered as page filters above the table, without grouping by them. */
  filters: string[];
  /**
   * Values EXCLUDED per field. Stored as what is left out rather than what is
   * kept, so a value that appears in new data is shown by default instead of
   * silently hidden — the safer failure for a report.
   */
  exclude: Record<string, string[]>;
  /** Label sort per grouping field. Default ascending. */
  sort: Record<string, 'asc' | 'desc'>;
};

export const EMPTY_PIVOT: PivotConfig = { rows: [], columns: [], values: [], filters: [], exclude: {}, sort: {} };

/** How a missing value reads, and groups, in the table. */
export const BLANK = '(blank)';

export function labelOf(v: unknown): string {
  if (v === null || v === undefined || v === '') return BLANK;
  return Array.isArray(v) ? v.join(', ') : String(v);
}

type Acc = { sum: number; count: number; numeric: number; min: number; max: number; distinct: Set<string> | null };

const newAcc = (distinct: boolean): Acc => ({ sum: 0, count: 0, numeric: 0, min: Infinity, max: -Infinity, distinct: distinct ? new Set() : null });

function add(acc: Acc, raw: unknown) {
  if (raw === null || raw === undefined || raw === '') return;
  acc.count += 1;
  acc.distinct?.add(labelOf(raw));
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (Number.isFinite(n)) {
    acc.numeric += 1;
    acc.sum += n;
    if (n < acc.min) acc.min = n;
    if (n > acc.max) acc.max = n;
  }
}

function finish(acc: Acc | undefined, agg: PivotAgg): number | null {
  if (!acc) return null;
  switch (agg) {
    case 'count': return acc.count;
    case 'countDistinct': return acc.distinct ? acc.distinct.size : null;
    case 'sum': return acc.numeric ? acc.sum : null;
    case 'avg': return acc.numeric ? acc.sum / acc.numeric : null;
    case 'min': return acc.numeric ? acc.min : null;
    case 'max': return acc.numeric ? acc.max : null;
  }
}

export type PivotNode = {
  /** A small integer, unique within its tree — what cell lookups key on. */
  id: number;
  /** The composite key of `path`, unique across the tree. */
  key: string;
  label: string;
  path: string[];
  depth: number;
  children: PivotNode[];
};

type BuildNode = PivotNode & { index: Map<string, BuildNode> };

export type PivotResult = {
  rowTree: PivotNode;
  colTree: PivotNode;
  /** The measures in play — the config's, or the implicit record count. */
  values: PivotValue[];
  /** The aggregate at a row path × column path, for one measure. Empty paths are totals. */
  cell: (rowPath: string[], colPath: string[], valueIndex: number) => number | null;
  /** The same, by node — the fast path a renderer should use. */
  cellAt: (row: PivotNode, col: PivotNode, valueIndex: number) => number | null;
  /** Records that passed the filters. */
  count: number;
};

const SEP = '\u0000';
/** The field id the implicit "count of records" measure uses. */
export const RECORDS = '__records';

const pathKey = (p: string[]) => p.join(SEP);

function collator() {
  return new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
}

function sortedCopy(node: PivotNode, fields: string[], sort: Record<string, 'asc' | 'desc'>, cmp: Intl.Collator): PivotNode {
  if (node.children.length === 0) return node;
  const field = fields[node.depth + 1];
  const dir = sort[field] === 'desc' ? -1 : 1;
  const children = [...node.children].sort((a, b) => {
    // Blanks sit last in both directions: "no value" is not the smallest value.
    if (a.label === BLANK) return 1;
    if (b.label === BLANK) return -1;
    return cmp.compare(a.label, b.label) * dir;
  });
  return { ...node, children: children.map((c) => sortedCopy(c, fields, sort, cmp)) };
}

/** Every distinct label of a field across the data, sorted — what a filter offers. */
export function distinctValues(data: readonly Record<string, unknown>[], field: string): string[] {
  const set = new Set(data.map((r) => labelOf(r[field])));
  const cmp = collator();
  return [...set].sort((a, b) => (a === BLANK ? 1 : b === BLANK ? -1 : cmp.compare(a, b)));
}

/**
 * The expensive half: one pass over the records, grouping and accumulating.
 * Depends only on WHICH fields group and are measured, and on the filters —
 * not on sort order or aggregation, which is what lets a caller memoize it
 * and make re-sorting, and switching Sum to Average, instant.
 *
 * Every accumulator keeps count, sum, min and max at once (cheap); only the
 * distinct set is conditional, since it is the one that costs a string per
 * record per cell.
 */
export type PivotAggregate = {
  rowTree: PivotNode;
  colTree: PivotNode;
  /** The measured fields, in order; RECORDS for the implicit count. */
  fields: string[];
  count: number;
  accs: Map<number, Acc[]>;
  colCount: number;
  rowIndex: Map<string, PivotNode>;
  colIndex: Map<string, PivotNode>;
};

export function aggregate(
  data: readonly Record<string, unknown>[],
  shape: { rows: string[]; columns: string[]; exclude: Record<string, string[]>; fields: string[]; distinct: boolean },
): PivotAggregate {
  const fields = shape.fields.length ? shape.fields : [RECORDS];
  const excluded = Object.entries(shape.exclude)
    .filter(([, v]) => v.length)
    .map(([k, v]) => [k, new Set(v)] as const);

  let nextRow = 0;
  let nextCol = 0;
  const mk = (id: number, key: string, label: string, path: string[], depth: number): BuildNode => ({ id, key, label, path, depth, children: [], index: new Map() });
  const rowTree = mk(nextRow++, '', '', [], -1);
  const colTree = mk(nextCol++, '', '', [], -1);

  // Accumulators are keyed by row id × col id. Column ids are not known up
  // front, so the pair is packed as row * STRIDE + col, with STRIDE comfortably
  // above any column count a pivot can draw.
  const STRIDE = 1 << 20;
  const accs = new Map<number, Acc[]>();
  const accFor = (r: number, c: number) => {
    const k = r * STRIDE + c;
    let list = accs.get(k);
    if (!list) {
      list = fields.map(() => newAcc(shape.distinct));
      accs.set(k, list);
    }
    return list;
  };

  const rowChain: BuildNode[] = [];
  const colChain: BuildNode[] = [];
  const walk = (root: BuildNode, rec: Record<string, unknown>, groupFields: string[], chain: BuildNode[], nextId: () => number) => {
    chain.length = 0;
    chain.push(root);
    let node = root;
    for (let d = 0; d < groupFields.length; d += 1) {
      const label = labelOf(rec[groupFields[d]]);
      let child = node.index.get(label);
      if (!child) {
        const path = [...node.path, label];
        child = mk(nextId(), pathKey(path), label, path, d);
        node.index.set(label, child);
        node.children.push(child);
      }
      chain.push(child);
      node = child;
    }
  };

  let count = 0;
  for (const rec of data) {
    // A record is in only if no field it has excludes it — including fields
    // that are not grouped on at all, which is what a page filter is.
    let keep = true;
    for (const [f, set] of excluded) {
      if (set.has(labelOf(rec[f]))) { keep = false; break; }
    }
    if (!keep) continue;
    count += 1;

    walk(rowTree, rec, shape.rows, rowChain, () => nextRow++);
    walk(colTree, rec, shape.columns, colChain, () => nextCol++);
    const raws = fields.map((f) => (f === RECORDS ? 1 : rec[f]));
    for (const r of rowChain) {
      for (const c of colChain) {
        const list = accFor(r.id, c.id);
        for (let i = 0; i < raws.length; i += 1) add(list[i], raws[i]);
      }
    }
  }

  const index = (root: PivotNode) => {
    const m = new Map<string, PivotNode>();
    const go = (n: PivotNode) => { m.set(n.key, n); n.children.forEach(go); };
    go(root);
    return m;
  };

  return { rowTree, colTree, fields, count, accs, colCount: nextCol, rowIndex: index(rowTree), colIndex: index(colTree) };
}

/** The cheap half: sort the trees and read the accumulators with each measure's aggregation. */
export function finalize(agg: PivotAggregate, config: Pick<PivotConfig, 'rows' | 'columns' | 'values' | 'sort'>): PivotResult {
  const values = config.values.length ? config.values : [{ field: RECORDS, agg: 'count' as PivotAgg }];
  const slot = values.map((v) => agg.fields.indexOf(v.field));
  const cmp = collator();
  const STRIDE = 1 << 20;
  const cellAt = (row: PivotNode, col: PivotNode, vi: number) => {
    const at = slot[vi];
    if (at === -1) return null;
    return finish(agg.accs.get(row.id * STRIDE + col.id)?.[at], values[vi].agg);
  };
  return {
    rowTree: sortedCopy(agg.rowTree, config.rows, config.sort, cmp),
    colTree: sortedCopy(agg.colTree, config.columns, config.sort, cmp),
    values,
    count: agg.count,
    cellAt,
    cell: (rowPath, colPath, vi) => {
      const r = agg.rowIndex.get(pathKey(rowPath));
      const c = agg.colIndex.get(pathKey(colPath));
      return r && c ? cellAt(r, c, vi) : null;
    },
  };
}

/** The measured fields and whether any needs a distinct count — the part of the config `aggregate` depends on. */
export function aggregateShape(config: PivotConfig) {
  return {
    rows: config.rows,
    columns: config.columns,
    exclude: config.exclude,
    fields: [...new Set(config.values.map((v) => v.field))],
    distinct: config.values.some((v) => v.agg === 'countDistinct'),
  };
}

export function pivot(data: readonly Record<string, unknown>[], config: PivotConfig): PivotResult {
  return finalize(aggregate(data, aggregateShape(config)), config);
}

/** A column of the rendered table: a leaf path, an outer group's subtotal, or the grand total. */
export type PivotColumn = { path: string[]; kind: 'leaf' | 'subtotal' | 'grand'; label: string; node: PivotNode };

/**
 * The column tree as the ordered list of columns the table draws: each outer
 * group's leaves, then that group's subtotal (when asked for), and the grand
 * total last. The header rows are derived from the same walk, so the two can
 * never disagree about order.
 */
export function pivotColumns(colTree: PivotNode, depth: number, subtotals: boolean): PivotColumn[] {
  if (depth === 0) return [{ path: [], kind: 'grand', label: 'Total', node: colTree }];
  const out: PivotColumn[] = [];
  const walk = (n: PivotNode) => {
    if (n.depth === depth - 1) { out.push({ path: n.path, kind: 'leaf', label: n.label, node: n }); return; }
    n.children.forEach(walk);
    if (subtotals) out.push({ path: n.path, kind: 'subtotal', label: `${n.label} total`, node: n });
  };
  colTree.children.forEach(walk);
  out.push({ path: [], kind: 'grand', label: 'Grand total', node: colTree });
  return out;
}

/** One header cell, with its spans, for the column header rows. */
export type PivotHeaderCell = { label: string; colSpan: number; rowSpan: number; kind: 'group' | 'leaf' | 'subtotal' | 'grand'; key: string };

/** The column header rows — one per column field — matching `pivotColumns`' order. */
export function pivotHeaderRows(colTree: PivotNode, depth: number, subtotals: boolean, valueCount: number): PivotHeaderCell[][] {
  const rows: PivotHeaderCell[][] = Array.from({ length: depth }, () => []);
  if (depth === 0) return rows;
  const walk = (n: PivotNode): number => {
    const d = n.depth;
    if (d === depth - 1) {
      rows[d].push({ label: n.label, colSpan: valueCount, rowSpan: 1, kind: 'leaf', key: n.key });
      return 1;
    }
    const at = rows[d].length;
    rows[d].push({ label: n.label, colSpan: 0, rowSpan: 1, kind: 'group', key: n.key });
    let leaves = 0;
    for (const c of n.children) leaves += walk(c);
    if (subtotals) {
      rows[d + 1].push({ label: `${n.label} total`, colSpan: valueCount, rowSpan: depth - d - 1, kind: 'subtotal', key: `${n.key}:total` });
      leaves += 1;
    }
    rows[d][at].colSpan = leaves * valueCount;
    return leaves;
  };
  colTree.children.forEach(walk);
  rows[0].push({ label: 'Grand total', colSpan: valueCount, rowSpan: depth, kind: 'grand', key: ':grand' });
  return rows;
}
