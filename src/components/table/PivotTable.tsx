'use client';

import { Fragment, useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowDownAZ, ArrowLeftRight, ArrowUpZA, ChevronDown, ChevronRight, Columns3, Download, Filter, FoldVertical,
  GripVertical, Hash, Rows3, Search, Sigma, SlidersHorizontal, Type, UnfoldVertical, X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useDismiss } from '@/lib/use-dismiss';
import Drawer from '@/components/overlay/Drawer';
import {
  BLANK, EMPTY_PIVOT, PIVOT_AGGS, RECORDS, aggregate, distinctValues, finalize, pivotColumns, pivotHeaderRows,
  type PivotAgg, type PivotConfig, type PivotNode, type PivotValue,
} from '@/lib/pivot';

/** A field the pivot can use. `kind` decides where a checkbox puts it and how it is formatted. */
export type PivotField = {
  key: string;
  label: string;
  kind?: 'text' | 'number' | 'date';
  /** How this field's aggregates read in the cells. Counts are always whole numbers. */
  format?: (n: number) => string;
};

type Zone = 'filters' | 'columns' | 'rows' | 'values';

const ZONES: { zone: Zone; label: string; icon: typeof Filter; hint: string }[] = [
  { zone: 'filters', label: 'Filters', icon: Filter, hint: 'Narrow every cell without grouping by it' },
  { zone: 'columns', label: 'Columns', icon: Columns3, hint: 'Group across the top' },
  { zone: 'rows', label: 'Rows', icon: Rows3, hint: 'Group down the side' },
  { zone: 'values', label: 'Data', icon: Sigma, hint: 'What the cells aggregate' },
];

const aggLabel = (agg: PivotAgg) => PIVOT_AGGS.find((a) => a.value === agg)?.label ?? agg;

/** A header cell's recipe. Module scope: the memoized table reads it during render. */
const headCell = 'border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200';

/** Past this many body rows, only the rows in view (plus a margin) are drawn. */
const VIRTUAL_MIN = 60;
const OVERSCAN = 8;

/**
 * A PIVOT TABLE — the spreadsheet kind: a field list on the side with a
 * FILTERS, COLUMNS, ROWS and DATA zone, and the table it produces beside it.
 *
 * ── Building one ────────────────────────────────────────────────────────────
 *
 * Tick a field to add it (a number goes to Data as a sum, anything else to
 * Rows), or drag it into a zone; drag chips between zones and within one to
 * reorder the grouping. A Data chip picks its aggregation (sum, count,
 * average, min, max, distinct count); a Row or Column chip toggles its label
 * sort; every chip's funnel opens a checklist of that field's values to keep
 * or drop. A field in Filters narrows every cell without adding a group —
 * the page-filter of a spreadsheet pivot.
 *
 * ── What the table shows ────────────────────────────────────────────────────
 *
 * Rows in the COMPACT layout: one row-header column, each level indented, and
 * a group's own row carrying its subtotal — so collapsing a group leaves its
 * total in view. Columns nest across the top with a subtotal after each outer
 * group and a grand total at the end. Every total is aggregated from the
 * records (`lib/pivot`), never summed from cells, so an average or a distinct
 * count stays correct at every level.
 *
 * The configuration is controlled with `config` / `onConfigChange`, or kept
 * here with `defaultConfig`. The table scrolls inside its own box with sticky
 * headers; nothing inside that box opens a popover, which is what makes the
 * scroller safe.
 *
 * ── Settings in a side panel ────────────────────────────────────────────────
 *
 * The field list opens in a slide-over panel from the right edge, not beside
 * the table: a pivot is usually wider than the space it has, and a field list
 * sharing the row takes a third of that width away from the numbers. The
 * panel has no backdrop, so the table behind it stays readable and scrollable
 * while fields are being moved — which is the point of re-pivoting: watching
 * the table change.
 */
export default function PivotTable({
  data,
  fields,
  config: controlled,
  onConfigChange,
  defaultConfig,
  columnSubtotals = true,
  fieldList = false,
  maxHeight = 520,
  title,
  className,
}: {
  data: Record<string, unknown>[];
  fields: PivotField[];
  config?: PivotConfig;
  onConfigChange?: (config: PivotConfig) => void;
  defaultConfig?: Partial<PivotConfig>;
  /** A subtotal column after each outer column group. */
  columnSubtotals?: boolean;
  /** Open the settings panel initially. The toolbar's "Pivot settings" toggles it. */
  fieldList?: boolean;
  /** The table's scroll box height. */
  maxHeight?: number | string;
  /** Names the export file and the table. */
  title?: string;
  className?: string;
}) {
  const [inner, setInner] = useState<PivotConfig>({ ...EMPTY_PIVOT, ...defaultConfig });
  const config = controlled ?? inner;
  const setConfig = (next: PivotConfig) => {
    onConfigChange?.(next);
    if (!controlled) setInner(next);
  };
  const [showList, setShowList] = useState(fieldList);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());

  const byKey = useMemo(() => new Map(fields.map((f) => [f.key, f])), [fields]);

  /*
   * ── Why re-pivoting feels instant ─────────────────────────────────────────
   *
   * 1. The settings panel reads `config`; the table reads a DEFERRED copy. A
   *    tick or a drop updates the panel on the next frame, and the table
   *    re-renders in the background — dimmed while it catches up — instead of
   *    the click waiting for thousands of cells.
   * 2. The work is split in two memos. The pass over the records depends only
   *    on which fields group, which are measured, and the filters; sorting
   *    and switching an aggregation (Sum → Average) only re-read it. The memo
   *    keys are the CONTENTS of those lists, not their identity, because the
   *    field list rebuilds every array on every change.
   * 3. Past VIRTUAL_MIN rows, only the rows in view are drawn, with spacer
   *    rows standing in for the rest, so a deep grouping costs what the
   *    screen shows rather than what the data holds.
   */
  const view = useDeferredValue(config);
  const stale = view !== config;
  const rowsKey = view.rows.join('\u0000');
  const colsKey = view.columns.join('\u0000');
  const excludeKey = JSON.stringify(view.exclude);
  const measured = [...new Set(view.values.map((v) => v.field))];
  const measuredKey = measured.join('\u0000');
  const distinct = view.values.some((v) => v.agg === 'countDistinct');
  const agg = useMemo(
    () => aggregate(data, { rows: view.rows, columns: view.columns, exclude: view.exclude, fields: measured, distinct }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, rowsKey, colsKey, excludeKey, measuredKey, distinct],
  );
  const valuesKey = JSON.stringify(view.values);
  const sortKey = JSON.stringify(view.sort);
  const result = useMemo(
    () => finalize(agg, view),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [agg, valuesKey, sortKey],
  );
  const R = view.rows.length;
  const C = view.columns.length;
  const V = result.values.length;
  const columns = useMemo(() => pivotColumns(result.colTree, C, columnSubtotals && C > 1), [result, C, columnSubtotals]);
  const headerRows = useMemo(() => pivotHeaderRows(result.colTree, C, columnSubtotals && C > 1, V), [result, C, columnSubtotals, V]);

  const valueName = (v: PivotValue) => (v.field === RECORDS ? 'Count of records' : `${aggLabel(v.agg)} of ${byKey.get(v.field)?.label ?? v.field}`);
  const fmt = (n: number | null, v: PivotValue) => {
    if (n === null) return '';
    if (v.agg === 'count' || v.agg === 'countDistinct' || v.field === RECORDS) return n.toLocaleString();
    const f = byKey.get(v.field)?.format;
    return f ? f(n) : n.toLocaleString(undefined, { maximumFractionDigits: v.agg === 'avg' ? 2 : 2 });
  };

  /** Group rows that can collapse, for "collapse all". */
  const groupKeys = useMemo(() => {
    const out: string[] = [];
    const walk = (n: PivotNode) => { if (n.children.length && n.depth < R - 1 && n.depth >= 0) out.push(n.key); n.children.forEach(walk); };
    walk(result.rowTree);
    return out;
  }, [result, R]);
  const allCollapsed = groupKeys.length > 0 && groupKeys.every((k) => collapsed.has(k));

  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  /** The rows as drawn: each visible node, in order, then the grand total. */
  const bodyRows = useMemo(() => {
    const out: PivotNode[] = [];
    const walk = (n: PivotNode) => {
      for (const c of n.children) {
        out.push(c);
        if (!collapsed.has(c.key)) walk(c);
      }
    };
    walk(result.rowTree);
    return out;
  }, [result, collapsed]);

  const rowFieldLabel = view.rows.map((f) => byKey.get(f)?.label ?? f).join(' › ') || 'Total';

  /* ── Row windowing ─────────────────────────────────────────────────────── */

  const scroller = useRef<HTMLDivElement>(null);
  const theadRef = useRef<HTMLTableSectionElement>(null);
  const rowHeight = useRef(40);
  const virtual = bodyRows.length > VIRTUAL_MIN;
  const [range, setRange] = useState({ start: 0, end: VIRTUAL_MIN });
  const frame = useRef(0);

  const measureRange = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const head = theadRef.current?.offsetHeight ?? 0;
    const h = rowHeight.current;
    const start = Math.max(0, Math.floor((el.scrollTop - head) / h) - OVERSCAN);
    const end = Math.min(bodyRows.length, start + Math.ceil(el.clientHeight / h) + OVERSCAN * 2);
    setRange((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, [bodyRows.length]);

  // Row height is read off a real row, so it follows the density setting.
  useLayoutEffect(() => {
    const row = scroller.current?.querySelector<HTMLTableRowElement>('tbody tr[data-row]');
    if (row && row.offsetHeight) rowHeight.current = row.offsetHeight;
    measureRange();
  }, [bodyRows, measureRange]);

  useEffect(() => {
    const el = scroller.current;
    if (!el || !virtual) return;
    const onScroll = () => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(measureRange);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame.current);
    };
  }, [virtual, measureRange]);

  const drawn = virtual ? bodyRows.slice(range.start, range.end) : bodyRows;
  const padTop = virtual ? range.start * rowHeight.current : 0;
  const padBottom = virtual ? Math.max(0, bodyRows.length - range.end) * rowHeight.current : 0;
  const spanAll = 1 + columns.length * V;

  /*
   * The table's markup, memoized on exactly what it draws. The urgent render
   * a tick or a drop triggers — the one that updates the settings panel —
   * then hands React the SAME element and it skips the whole table, which is
   * what keeps a click answering on the next frame. Only the deferred render,
   * with new data, rebuilds it.
   */
  const grid = useMemo(
    () => (
result.count === 0 ? (
            <p className="px-4 py-16 text-center text-xs text-slate-400">No records match the filters.</p>
          ) : (
            <table className="min-w-max border-separate border-spacing-0 text-xs" aria-label={title ?? 'Pivot table'}>
              <thead ref={theadRef} className="sticky top-0 z-10">
                {headerRows.map((cells, level) => (
                  <tr key={level}>
                    {level === 0 && (
                      <th rowSpan={C + (V > 1 ? 1 : 0)} className={cn(headCell, 'sticky left-0 z-20 min-w-48 align-bottom')}>
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">{rowFieldLabel}</span>
                        {V === 1 && <span className="block text-[11px] font-normal text-slate-500 dark:text-slate-400">{valueName(result.values[0])}</span>}
                      </th>
                    )}
                    {cells.map((h) => (
                      <th
                        key={h.key}
                        colSpan={h.colSpan}
                        rowSpan={h.rowSpan}
                        className={cn(headCell, 'whitespace-nowrap text-center', (h.kind === 'subtotal' || h.kind === 'grand') && 'bg-slate-100 dark:bg-slate-800')}
                      >
                        {h.label}
                      </th>
                    ))}
                  </tr>
                ))}
                {(V > 1 || C === 0) && (
                  <tr>
                    {C === 0 && <th className={cn(headCell, 'sticky left-0 z-20 min-w-48')}><span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">{rowFieldLabel}</span></th>}
                    {columns.map((c) =>
                      result.values.map((v, vi) => (
                        <th key={`${c.path.join('/')}:${c.kind}:${vi}`} className={cn(headCell, 'whitespace-nowrap text-right font-medium', c.kind !== 'leaf' && 'bg-slate-100 dark:bg-slate-800')}>
                          {valueName(v)}
                        </th>
                      )),
                    )}
                  </tr>
                )}
              </thead>
              <tbody>
                {padTop > 0 && (
                  <tr aria-hidden>
                    <td colSpan={spanAll} style={{ height: padTop, padding: 0, border: 0, lineHeight: 0 }} />
                  </tr>
                )}
                {drawn.map((n) => {
                  const group = n.depth < R - 1;
                  return (
                    <tr key={n.key} data-row className={cn('hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5', group && 'font-semibold')}>
                      <th
                        scope="row"
                        className={cn(
                          'sticky left-0 z-[1] whitespace-nowrap border-b border-r border-slate-200 px-3 py-1.5 text-left dark:border-slate-700',
                          // Opaque, because the column is sticky and cells scroll under
                          // it — and in the card's own colour, so it does not read as a slab.
                          group ? 'bg-slate-50 dark:bg-slate-900' : 'bg-white font-normal dark:bg-slate-800',
                        )}
                        style={{ paddingLeft: 12 + n.depth * 16 }}
                      >
                        <span className="inline-flex items-center gap-1">
                          {group ? (
                            <button
                              type="button"
                              onClick={() => toggle(n.key)}
                              aria-expanded={!collapsed.has(n.key)}
                              aria-label={`${collapsed.has(n.key) ? 'Expand' : 'Collapse'} ${n.label}`}
                              className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700"
                            >
                              {collapsed.has(n.key) ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </button>
                          ) : (
                            R > 1 && <span className="w-[18px]" aria-hidden />
                          )}
                          <span className={cn(n.label === BLANK && 'italic text-slate-400')}>{n.label}</span>
                        </span>
                      </th>
                      {columns.map((c) =>
                        result.values.map((v, vi) => (
                          <td
                            key={`${c.path.join('/')}:${c.kind}:${vi}`}
                            className={cn(
                              'whitespace-nowrap border-b border-r border-slate-100 px-3 py-1.5 text-right tabular-nums dark:border-slate-800',
                              c.kind !== 'leaf' && 'bg-slate-50/70 font-semibold dark:bg-slate-900/60',
                            )}
                          >
                            {fmt(result.cellAt(n, c.node, vi), v)}
                          </td>
                        )),
                      )}
                    </tr>
                  );
                })}
                {padBottom > 0 && (
                  <tr aria-hidden>
                    <td colSpan={spanAll} style={{ height: padBottom, padding: 0, border: 0, lineHeight: 0 }} />
                  </tr>
                )}
                <tr className="font-semibold">
                  <th scope="row" className="sticky bottom-0 left-0 z-[2] border-t-2 border-r border-slate-300 bg-slate-100 px-3 py-2 text-left dark:border-slate-600 dark:bg-slate-800">
                    Grand total
                  </th>
                  {columns.map((c) =>
                    result.values.map((v, vi) => (
                      <td key={`g:${c.path.join('/')}:${c.kind}:${vi}`} className="sticky bottom-0 whitespace-nowrap border-t-2 border-r border-slate-300 bg-slate-100 px-3 py-2 text-right tabular-nums dark:border-slate-600 dark:bg-slate-800">
                        {fmt(result.cellAt(result.rowTree, c.node, vi), v)}
                      </td>
                    )),
                  )}
                </tr>
              </tbody>
            </table>
          )
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [result, columns, headerRows, drawn, padTop, padBottom, spanAll, collapsed, byKey, R, C, V, rowFieldLabel, title],
  );

  /** The table as CSV — what is on screen, with row labels indented by level. */
  const exportCsv = () => {
    const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
    const head = [rowFieldLabel, ...columns.flatMap((c) => result.values.map((v) => [...c.path, c.kind === 'leaf' ? '' : c.label].filter(Boolean).join(' › ') + (V > 1 || C === 0 ? ` · ${valueName(v)}` : '')))];
    const lines = [head.map(esc).join(',')];
    const line = (label: string, row: PivotNode) =>
      [label, ...columns.flatMap((c) => result.values.map((v, vi) => fmt(result.cellAt(row, c.node, vi), v)))].map(esc).join(',');
    for (const n of bodyRows) lines.push(line(`${'  '.repeat(n.depth)}${n.label}`, n));
    lines.push(line('Grand total', result.rowTree));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(title ?? 'pivot').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const toolButton = 'inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800';

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-2 flex flex-wrap items-center gap-1">
          <button type="button" className={toolButton} disabled={groupKeys.length === 0} onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(groupKeys))}>
            {allCollapsed ? <UnfoldVertical className="h-3.5 w-3.5" /> : <FoldVertical className="h-3.5 w-3.5" />}
            {allCollapsed ? 'Expand all' : 'Collapse all'}
          </button>
          <button
            type="button"
            className={toolButton}
            disabled={config.rows.length === 0 && config.columns.length === 0}
            onClick={() => setConfig({ ...config, rows: config.columns, columns: config.rows })}
            title="Swap rows and columns"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" /> Swap
          </button>
          <button type="button" className={toolButton} onClick={exportCsv}>
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          <span className="ml-auto text-[11px] text-slate-500 dark:text-slate-400">
            {result.count.toLocaleString()} of {data.length.toLocaleString()} records
          </span>
          <button
            type="button"
            className={cn(toolButton, showList && 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200')}
            aria-pressed={showList}
            aria-expanded={showList}
            onClick={() => setShowList((s) => !s)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Pivot settings
          </button>
        </div>

        <div
          ref={scroller}
          style={{ maxHeight }}
          aria-busy={stale}
          className={cn(
            'min-h-0 overflow-auto rounded-xl border border-slate-200 transition-opacity duration-150 dark:border-slate-700',
            stale && 'opacity-60',
          )}
        >
          {grid}
        </div>
      </div>

      <Drawer
        open={showList}
        onClose={() => setShowList(false)}
        title="Pivot settings"
        subtitle="Drag fields between the areas"
        initialWidth={380}
        maxWidth={0.5}
        backdrop={false}
      >
        <PivotFieldList fields={fields} data={data} config={config} onChange={setConfig} bare />
      </Drawer>
    </div>
  );
}

type DragPayload = { field: string; from: Zone | 'list'; index: number };

/**
 * The field list: every field (searchable, tick to add, drag to place) over
 * the four zones. Exported on its own, for a layout that puts it in a drawer
 * or beside a chart built from the same config.
 */
export function PivotFieldList({
  fields,
  data,
  config,
  onChange,
  bare = false,
  className,
}: {
  fields: PivotField[];
  /** For the value checklists in each field's filter. */
  data: Record<string, unknown>[];
  config: PivotConfig;
  onChange: (config: PivotConfig) => void;
  /** No card of its own — for a host that already frames it (a drawer, a sidebar). */
  bare?: boolean;
  className?: string;
}) {
  const [query, setQuery] = useState('');
  const [drag, setDrag] = useState<DragPayload | null>(null);
  const [over, setOver] = useState<{ zone: Zone; index: number } | null>(null);
  const [filterFor, setFilterFor] = useState<{ field: string; anchor: DOMRect } | null>(null);

  const byKey = new Map(fields.map((f) => [f.key, f]));
  const dims = (z: Exclude<Zone, 'values'>) => config[z];
  const used = (key: string) => config.rows.includes(key) || config.columns.includes(key) || config.filters.includes(key) || config.values.some((v) => v.field === key);

  /** A field leaves every dimension zone before landing in one: it can group only once. */
  const place = (field: string, zone: Zone, index: number, from: Zone | 'list', fromIndex: number) => {
    const next: PivotConfig = { ...config, rows: [...config.rows], columns: [...config.columns], filters: [...config.filters], values: [...config.values] };
    if (zone === 'values') {
      const kind = byKey.get(field)?.kind;
      let entry: PivotValue = { field, agg: kind === 'number' ? 'sum' : 'count' };
      if (from === 'values') {
        entry = next.values[fromIndex];
        next.values.splice(fromIndex, 1);
        if (fromIndex < index) index -= 1;
      }
      next.values.splice(Math.min(index, next.values.length), 0, entry);
    } else {
      for (const z of ['rows', 'columns', 'filters'] as const) {
        const at = next[z].indexOf(field);
        if (at !== -1) {
          next[z].splice(at, 1);
          if (z === zone && at < index) index -= 1;
        }
      }
      if (from === 'values') next.values.splice(fromIndex, 1);
      next[zone].splice(Math.min(index, next[zone].length), 0, field);
    }
    onChange(next);
  };

  const removeFrom = (zone: Zone, index: number) => {
    if (zone === 'values') onChange({ ...config, values: config.values.filter((_, i) => i !== index) });
    else onChange({ ...config, [zone]: config[zone].filter((_, i) => i !== index) });
  };

  const tick = (f: PivotField) => {
    if (used(f.key)) {
      onChange({
        ...config,
        rows: config.rows.filter((k) => k !== f.key),
        columns: config.columns.filter((k) => k !== f.key),
        filters: config.filters.filter((k) => k !== f.key),
        values: config.values.filter((v) => v.field !== f.key),
      });
    } else if (f.kind === 'number') place(f.key, 'values', config.values.length, 'list', -1);
    else place(f.key, 'rows', config.rows.length, 'list', -1);
  };

  const needle = query.trim().toLowerCase();
  const shown = needle ? fields.filter((f) => f.label.toLowerCase().includes(needle)) : fields;

  const onZoneOver = (zone: Zone, e: React.DragEvent<HTMLElement>) => {
    if (!drag) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    // Insertion index from the pointer against each chip's midpoint.
    const chips = [...e.currentTarget.querySelectorAll<HTMLElement>('[data-chip]')];
    let index = chips.length;
    for (let i = 0; i < chips.length; i += 1) {
      const r = chips[i].getBoundingClientRect();
      if (e.clientY < r.top + r.height / 2) { index = i; break; }
    }
    if (over?.zone !== zone || over.index !== index) setOver({ zone, index });
  };

  const onZoneDrop = (zone: Zone) => {
    if (drag && over?.zone === zone) place(drag.field, zone, over.index, drag.from, drag.index);
    setDrag(null);
    setOver(null);
  };

  const Icon = (f: PivotField | undefined) => (f?.kind === 'number' ? Hash : Type);

  return (
    <aside
      className={cn('flex shrink-0 flex-col gap-3', !bare && 'rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900', className)}
      aria-label="Pivot fields"
    >
      <div>
        <p className="panel-title mb-1.5">Columns</p>
        <div className="relative mb-1.5">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search fields" aria-label="Search fields" className="field-input py-1.5 pl-8 text-xs" />
        </div>
        <ul className={cn('space-y-0.5 overflow-y-auto pr-1', bare ? 'max-h-72' : 'max-h-48')}>
          {shown.map((f) => {
            const FIcon = Icon(f);
            return (
              <li
                key={f.key}
                draggable
                onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', f.key); setDrag({ field: f.key, from: 'list', index: -1 }); }}
                onDragEnd={() => { setDrag(null); setOver(null); }}
                className="group/field flex cursor-grab items-center gap-2 rounded-md px-1.5 py-1 text-xs hover:bg-slate-50 active:cursor-grabbing dark:hover:bg-slate-800"
              >
                <input
                  type="checkbox"
                  checked={used(f.key)}
                  onChange={() => tick(f)}
                  aria-label={`${used(f.key) ? 'Remove' : 'Add'} ${f.label}`}
                  className="h-3.5 w-3.5 accent-indigo-600"
                />
                <FIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-200">{f.label}</span>
                {(config.exclude[f.key]?.length ?? 0) > 0 && <Filter className="h-3 w-3 text-indigo-500" aria-label="Filtered" />}
                <GripVertical className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover/field:opacity-100 dark:text-slate-600" aria-hidden />
              </li>
            );
          })}
          {shown.length === 0 && <li className="px-2 py-3 text-center text-[11px] text-slate-400">No field matches.</li>}
        </ul>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400">Drag fields between the areas below.</p>

      {/* Stacked full-width rather than a 2×2 grid: a chip carries a grip, a
          sort and a filter button and a remove, and at half the panel's width
          that left no room for the field's own name. */}
      <div className="flex flex-col gap-2">
        {ZONES.map(({ zone, label, icon: ZIcon, hint }) => {
          const entries: { field: string; value?: PivotValue }[] =
            zone === 'values' ? config.values.map((v) => ({ field: v.field, value: v })) : dims(zone).map((field) => ({ field }));
          return (
            <section
              key={zone}
              aria-label={label}
              onDragOver={(e) => onZoneOver(zone, e)}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null); }}
              onDrop={(e) => { e.preventDefault(); onZoneDrop(zone); }}
              className={cn(
                'flex min-h-[4.25rem] flex-col rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-1.5 dark:border-slate-600 dark:bg-slate-800/40',
                over?.zone === zone && 'border-indigo-400 bg-indigo-50/60 dark:border-indigo-400 dark:bg-indigo-500/10',
              )}
            >
              <p className="mb-1 flex items-center gap-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400" title={hint}>
                <ZIcon className="h-3 w-3" aria-hidden /> {label}
              </p>
              <ul className="flex flex-col gap-1">
                {entries.map((e, i) => {
                  const f = byKey.get(e.field);
                  const excluded = config.exclude[e.field]?.length ?? 0;
                  return (
                    <Fragment key={`${e.field}:${i}`}>
                      {over?.zone === zone && over.index === i && <li className="h-0.5 rounded-full bg-indigo-500" aria-hidden />}
                      <li
                        data-chip
                        draggable
                        onDragStart={(ev) => { ev.stopPropagation(); ev.dataTransfer.effectAllowed = 'move'; ev.dataTransfer.setData('text/plain', e.field); setDrag({ field: e.field, from: zone, index: i }); }}
                        onDragEnd={() => { setDrag(null); setOver(null); }}
                        className={cn(
                          'flex min-w-0 cursor-grab items-center gap-1 rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] shadow-sm active:cursor-grabbing dark:border-slate-700 dark:bg-slate-900',
                          drag?.from === zone && drag.index === i && 'opacity-40',
                        )}
                      >
                        <GripVertical className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600" aria-hidden />
                        {e.value ? (
                          <span className="flex min-w-0 flex-1 items-center gap-1">
                            <select
                              value={e.value.agg}
                              onChange={(ev) => onChange({ ...config, values: config.values.map((v, j) => (j === i ? { ...v, agg: ev.target.value as PivotAgg } : v)) })}
                              aria-label={`Aggregation for ${f?.label ?? e.field}`}
                              className="shrink-0 cursor-pointer rounded border-0 bg-transparent p-0 pr-0.5 text-[11px] font-medium text-indigo-600 focus:ring-0 dark:bg-slate-900 dark:text-indigo-300"
                            >
                              {PIVOT_AGGS.filter((a) => f?.kind === 'number' || a.value === 'count' || a.value === 'countDistinct').map((a) => (
                                <option key={a.value} value={a.value}>{a.label}</option>
                              ))}
                            </select>
                            <span className="text-slate-400">of</span>
                            <span className="truncate text-slate-700 dark:text-slate-200">{f?.label ?? e.field}</span>
                          </span>
                        ) : (
                          <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-200">{f?.label ?? e.field}</span>
                        )}
                        {(zone === 'rows' || zone === 'columns') && (
                          <button
                            type="button"
                            onClick={() => onChange({ ...config, sort: { ...config.sort, [e.field]: config.sort[e.field] === 'desc' ? 'asc' : 'desc' } })}
                            aria-label={`Sort ${f?.label} ${config.sort[e.field] === 'desc' ? 'ascending' : 'descending'}`}
                            title={config.sort[e.field] === 'desc' ? 'Z → A' : 'A → Z'}
                            className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700"
                          >
                            {config.sort[e.field] === 'desc' ? <ArrowUpZA className="h-3 w-3" /> : <ArrowDownAZ className="h-3 w-3" />}
                          </button>
                        )}
                        {zone !== 'values' && (
                          <button
                            type="button"
                            onClick={(ev) => setFilterFor({ field: e.field, anchor: ev.currentTarget.getBoundingClientRect() })}
                            aria-label={`Filter ${f?.label}${excluded ? `, ${excluded} hidden` : ''}`}
                            title="Filter values"
                            className={cn('shrink-0 rounded p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700', excluded ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-400 hover:text-slate-700')}
                          >
                            <Filter className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFrom(zone, i)}
                          aria-label={`Remove ${f?.label} from ${label}`}
                          className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-700"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </li>
                    </Fragment>
                  );
                })}
                {over?.zone === zone && over.index === entries.length && <li className="h-0.5 rounded-full bg-indigo-500" aria-hidden />}
                {entries.length === 0 && <li className="px-1 py-2 text-center text-[10px] text-slate-400">Drop here</li>}
              </ul>
            </section>
          );
        })}
      </div>

      {filterFor && (
        <ValueFilter
          field={byKey.get(filterFor.field) ?? { key: filterFor.field, label: filterFor.field }}
          values={distinctValues(data, filterFor.field)}
          excluded={config.exclude[filterFor.field] ?? []}
          anchor={filterFor.anchor}
          onChange={(ex) => {
            const exclude = { ...config.exclude };
            if (ex.length) exclude[filterFor.field] = ex;
            else delete exclude[filterFor.field];
            onChange({ ...config, exclude });
          }}
          onClose={() => setFilterFor(null)}
        />
      )}
    </aside>
  );
}

/**
 * The value checklist behind a chip's funnel. Applies as you tick: a pivot's
 * filter is read by watching the table change, so an Apply step would only
 * delay the thing being checked. Portalled, because the field list may sit in
 * a narrow column or a drawer that would clip it.
 */
function ValueFilter({
  field,
  values,
  excluded,
  anchor,
  onChange,
  onClose,
}: {
  field: PivotField;
  values: string[];
  excluded: string[];
  anchor: DOMRect;
  onChange: (excluded: string[]) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const panel = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  useDismiss(panel, true, onClose);
  useLayoutEffect(() => {
    const w = 240;
    const h = panel.current?.offsetHeight ?? 300;
    const below = anchor.bottom + 4;
    setPos({
      top: below + h > window.innerHeight - 8 ? Math.max(8, anchor.top - h - 4) : below,
      left: Math.max(8, Math.min(anchor.right - w, window.innerWidth - w - 8)),
    });
  }, [anchor]);

  const set = new Set(excluded);
  const needle = query.trim().toLowerCase();
  const rows = needle ? values.filter((v) => v.toLowerCase().includes(needle)) : values;
  const flip = (v: string) => onChange(set.has(v) ? excluded.filter((x) => x !== v) : [...excluded, v]);
  const content: ReactNode = (
    <div
      ref={panel}
      role="dialog"
      aria-label={`Filter ${field.label}`}
      data-overlay="popover"
      style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width: 240 }}
      className="fixed z-[200] flex max-h-80 flex-col overflow-hidden panel panel-solid p-0"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-700">
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{field.label}</p>
        <span className="text-[11px] text-slate-400">{values.length - excluded.length} of {values.length}</span>
      </div>
      <div className="p-2">
        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search values" className="field-input py-1.5 text-xs" />
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-1">
        {rows.map((v) => (
          <li key={v}>
            <label className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-slate-50 dark:hover:bg-slate-800">
              <input type="checkbox" checked={!set.has(v)} onChange={() => flip(v)} className="h-3.5 w-3.5 accent-indigo-600" />
              <span className={cn('truncate', v === BLANK && 'italic text-slate-400')}>{v}</span>
            </label>
          </li>
        ))}
        {rows.length === 0 && <li className="px-2 py-3 text-center text-[11px] text-slate-400">No value matches.</li>}
      </ul>
      <div className="flex justify-between border-t border-slate-200 p-1.5 dark:border-slate-700">
        <button type="button" className="btn-ghost text-xs" onClick={() => onChange(needle ? excluded.filter((x) => !rows.includes(x)) : [])}>
          Select all
        </button>
        <button type="button" className="btn-ghost text-xs" onClick={() => onChange(needle ? [...new Set([...excluded, ...rows])] : values)}>
          Clear
        </button>
      </div>
    </div>
  );
  return typeof document === 'undefined' ? null : createPortal(content, document.body);
}
