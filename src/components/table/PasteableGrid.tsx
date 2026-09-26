'use client';

/* Origin: marketing-stats (96S1), verbatim. */

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

// A spreadsheet-style editable grid:
// - Click any cell and paste (Cmd/Ctrl+V) a tab/comma-separated range copied
//   from Excel or Google Sheets — it fills starting exactly from that cell
//   (or the top-left of the current selection), spanning however many
//   rows/columns the clipboard holds. A pasted first row that looks like one
//   of this grid's own column headers (matched via each column's `aliases`)
//   is dropped automatically.
// - Copy a single cell (Cmd/Ctrl+C with no range selected) then paste it while
//   a multi-cell range is selected to fill every marked cell with that one
//   value — same "copy one, paste to all marked" behavior as Excel/Sheets,
//   distinct from the multi-cell paste above (which maps each clipboard cell
//   to its own target cell instead of repeating a single value).
// - Click-drag or Shift+click/arrow selects a cell range, shown with an
//   Excel-style blue outline + light fill.
// - Cmd/Ctrl+C copies the selected range as TSV; Delete/Backspace clears it.
// - Arrow keys/Enter move the active cell; Shift+Arrow extends the selection;
//   Escape reverts an in-progress edit on the active cell.
// - Cmd/Ctrl+Z undoes, Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y redoes. Typing into a
//   cell coalesces into one undo step per cell (committed on blur/navigate,
//   not per keystroke); paste and clear/delete are each their own step.
// - A small fill handle sits at the bottom-right corner of the current
//   selection — drag it up/down/left/right to repeat (tile) the selection's
//   values into the cells passed over, Excel-style. One axis at a time
//   (whichever direction you've dragged furthest past the selection), shown
//   live via a dashed preview outline, and undoable as one step.
// - Columns fill the available width by default (data columns share the
//   remaining space evenly); dragging a header's right edge resizes that
//   column by taking space from its siblings (proportional to how much each
//   can spare above MIN_COL_WIDTH) rather than growing the table's total
//   width — so a resize never forces horizontal scrolling on its own, and the
//   grid keeps scaling with its container (sidebar collapse, window resize)
//   same as before any resize happened. The one exception is a grid where
//   EVERY column already declares its own pixel `width` (e.g. a wide grid
//   with columns too numerous to share space evenly without becoming
//   unreadable) — there, growing a column past what siblings can spare grows
//   the table's total width as a last resort, same "scroll rather than
//   squeeze" contract that mode already had. No vertical scroll of its own —
//   the page/panel it sits in handles that — unless `pinned` is set (see the
//   prop's comment), which makes the grid its own two-axis scroll container
//   with the header row and row-number/rowHeader columns frozen in place.
export interface PasteableGridColumn<K extends string> {
  key: K;
  label: string;
  width?: string;
  // Header text (case/punctuation-insensitive) that identifies this column
  // when a pasted header row is being auto-detected. Defaults to the label.
  aliases?: string[];
  // Optional small line rendered under the column label in the header — e.g.
  // a running total for that column. The grid doesn't compute this itself
  // (it treats every cell value as an opaque string); the consumer supplies
  // whatever text it wants shown.
  summary?: string;
  // Derived/calculated column (e.g. a running total) — still selectable and
  // copyable like any other cell, but typing, pasting, and clear/delete
  // never modify its value; the consumer recomputes it instead.
  readOnly?: boolean;
}

export interface PasteableGridHandle {
  pasteAt: (rowIdx: number, colIdx: number, text: string) => void;
}

interface PasteableGridProps<K extends string> {
  columns: PasteableGridColumn<K>[];
  rows: Record<K, string>[];
  onRowsChange: (next: Record<K, string>[]) => void;
  // Rendered as a non-editable leading column, after the built-in row number
  // — e.g. a date label. Omit it entirely to skip that column.
  rowHeader?: (rowIndex: number) => React.ReactNode;
  rowHeaderWidth?: string;
  rowHeaderLabel?: string;
  onClearRow?: (rowIndex: number) => void;
  // Per-cell validation: return an error message to tint that cell red (the
  // message doubles as the input's title tooltip), or null/undefined for a
  // clean cell. Purely presentational — the grid never blocks input on it.
  cellError?: (rowIndex: number, colKey: K) => string | null | undefined;
  // Frozen-pane mode (see conventions.md): pins the header row to the top and
  // the row-number + rowHeader columns to the left while the grid scrolls.
  // The wrapper becomes the scroll container for BOTH axes (`overflow-auto` +
  // `max-h-full`), so the consumer must bound its height (e.g. a
  // `flex-1 min-h-0` parent) — without a bound the header pin is inert (the
  // column pin still works, since horizontal overflow is the grid's own).
  // Uses `border-separate` + one-sided cell borders instead of the default
  // `border-collapse`, because collapsed borders belong to the table and stay
  // behind when a sticky cell is offset — the gridlines would scroll away
  // from the pinned cells.
  pinned?: boolean;
  // Pinned-only. Default pinned sizing is `max-h-full` — the wrapper only
  // ever shrinks to the row content's own height, capped by the parent, so a
  // short grid (few rows) inside a tall bounded parent leaves visible blank
  // space beneath it. Set this when the consumer wants the grid to always
  // stretch to fill that parent instead (`h-full`) — e.g. several grids
  // sharing a flex row/column where each should claim its full allotted
  // share of the space regardless of row count.
  fillHeight?: boolean;
  // The wrapper's `border` + `shadow-sm` + `rounded-md` give the grid a
  // "card" look by default. Set to `false` to omit it (e.g. several grids
  // already sitting inside their own sectioned area, where an outer card
  // border around each one is redundant chrome) — every existing caller
  // keeps the bordered look unless it opts out.
  bordered?: boolean;
}

type CellPos = { row: number; col: number };
type Bounds = { minRow: number; maxRow: number; minCol: number; maxCol: number };

const MIN_COL_WIDTH = 40;
const ROW_NUMBER_COL_WIDTH = '3rem';
const MAX_HISTORY = 100;

function normalizeHeaderText(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function splitClipboardText(text: string): string[][] {
  const lines = text.replace(/\r/g, '').split('\n');
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  if (lines.length === 0) return [];
  const delimiter = lines.some(l => l.includes('\t')) ? '\t' : ',';
  return lines.map(l => l.split(delimiter).map(c => c.trim()));
}

function getBounds(a: CellPos | null, f: CellPos | null): Bounds | null {
  if (!a || !f) return null;
  return {
    minRow: Math.min(a.row, f.row), maxRow: Math.max(a.row, f.row),
    minCol: Math.min(a.col, f.col), maxCol: Math.max(a.col, f.col),
  };
}

type FillDirection = 'up' | 'down' | 'left' | 'right';

// Excel's fill handle locks to a single axis per drag — whichever axis the
// pointer has moved furthest past the source selection along, extending only
// that side. Returns null while the pointer is still inside (or exactly on)
// the source bounds, meaning "no-op if released now".
function computeFillExtension(source: Bounds, target: CellPos): { bounds: Bounds; direction: FillDirection } | null {
  const rowOut = target.row > source.maxRow ? target.row - source.maxRow
    : target.row < source.minRow ? source.minRow - target.row : 0;
  const colOut = target.col > source.maxCol ? target.col - source.maxCol
    : target.col < source.minCol ? source.minCol - target.col : 0;
  if (rowOut === 0 && colOut === 0) return null;
  if (rowOut >= colOut) {
    return target.row > source.maxRow
      ? { bounds: { ...source, maxRow: target.row }, direction: 'down' }
      : { bounds: { ...source, minRow: target.row }, direction: 'up' };
  }
  return target.col > source.maxCol
    ? { bounds: { ...source, maxCol: target.col }, direction: 'right' }
    : { bounds: { ...source, minCol: target.col }, direction: 'left' };
}

// Tiles the source block's values into the extension area (the part of
// `extended` outside `source`) — repeating, not extrapolating a series, per
// the fill handle's job of "repeat content into neighboring cells". Wraps
// around the source block's own height/width so a multi-row/column source
// repeats as a pattern rather than just smearing its last row/column.
function applyFillToRows<K extends string>(
  rows: Record<K, string>[],
  columns: PasteableGridColumn<K>[],
  source: Bounds,
  extended: Bounds,
  direction: FillDirection
): Record<K, string>[] {
  const next = [...rows];
  const srcHeight = source.maxRow - source.minRow + 1;
  const srcWidth = source.maxCol - source.minCol + 1;
  const mod = (n: number, m: number) => ((n % m) + m) % m;

  if (direction === 'up' || direction === 'down') {
    for (let r = extended.minRow; r <= extended.maxRow; r++) {
      if (r >= source.minRow && r <= source.maxRow) continue; // source rows stay put
      if (r < 0 || r >= next.length) continue;
      const srcRow = source.minRow + mod(r - source.minRow, srcHeight);
      const updated = { ...next[r] };
      for (let c = source.minCol; c <= source.maxCol; c++) {
        if (c < 0 || c >= columns.length || columns[c].readOnly) continue;
        updated[columns[c].key] = next[srcRow]?.[columns[c].key] ?? '';
      }
      next[r] = updated;
    }
  } else {
    for (let c = extended.minCol; c <= extended.maxCol; c++) {
      if (c >= source.minCol && c <= source.maxCol) continue; // source columns stay put
      if (c < 0 || c >= columns.length || columns[c].readOnly) continue;
      const srcCol = source.minCol + mod(c - source.minCol, srcWidth);
      for (let r = source.minRow; r <= source.maxRow; r++) {
        if (r < 0 || r >= next.length) continue;
        next[r] = { ...next[r], [columns[c].key]: next[r]?.[columns[srcCol].key] ?? '' };
      }
    }
  }
  return next;
}

// Only understands plain 'Npx'/'Nrem' — the two units this grid's own
// defaults (ROW_NUMBER_COL_WIDTH, rowHeaderWidth) and every consumer's column
// `width` actually use. Returns null for anything else (a '%' width, or no
// width at all), which is the signal that the columns in question don't have
// a fully-specified pixel size to sum.
function parseCssLengthToPx(value: string): number | null {
  const remMatch = /^(\d+(?:\.\d+)?)rem$/.exec(value.trim());
  if (remMatch) return parseFloat(remMatch[1]) * 16;
  const pxMatch = /^(\d+(?:\.\d+)?)px$/.exec(value.trim());
  return pxMatch ? parseFloat(pxMatch[1]) : null;
}

function PasteableGridInner<K extends string>(
  { columns, rows, onRowsChange, rowHeader, rowHeaderWidth = '8rem', rowHeaderLabel, onClearRow, cellError, pinned, fillHeight, bordered = true }: PasteableGridProps<K>,
  ref: React.Ref<PasteableGridHandle>
) {
  // Pinned mode: the rowHeader column's sticky `left` must equal the
  // row-number column's RENDERED width — which can't be derived from
  // ROW_NUMBER_COL_WIDTH ('3rem'), because the app's density setting scales
  // the root font-size (13/14/16px — see ThemeContext), so 3rem is 39-48px
  // depending on the user's setting (and fixed table layout then also
  // redistributes any declared-vs-actual difference across every column).
  // Assuming 1rem=16px left a visible transparent seam between the two
  // pinned columns at the other densities, so measure the real width
  // instead — same measured-sticky-offset technique as BrandsRoiGrid.
  const rowNumberThRef = useRef<HTMLTableCellElement>(null);
  const [measuredRowNumberWidth, setMeasuredRowNumberWidth] = useState<number | null>(null);
  useEffect(() => {
    if (!pinned || !rowNumberThRef.current) return;
    const el = rowNumberThRef.current;
    const update = () => setMeasuredRowNumberWidth(el.getBoundingClientRect().width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [pinned]);
  // Data columns start after the built-in row-number column and the optional
  // rowHeader column — this offset keeps the <colgroup>/resize-handle
  // indexes aligned whichever way the grid is configured.
  const hasRowHeader = !!rowHeader;
  const dataColOffset = hasRowHeader ? 2 : 1;

  // When EVERY column carries an explicit pixel width (e.g. a wide grid like
  // DepositRetentionSyncModal's 26-column one, where the default "share 100%
  // evenly" layout would squeeze each column unreadably thin), sum them up
  // front as the table's own width — same mechanism the column-resize path
  // below already uses once the user drags a border, just computed from the
  // columns' declared widths instead of their measured rendered ones. A grid
  // with no (or only some) columns carrying a `width` keeps the existing
  // "fill 100%, columns share the remainder" default untouched.
  const explicitTotalWidthPx = useMemo(() => {
    let total = parseCssLengthToPx(ROW_NUMBER_COL_WIDTH) ?? 0;
    if (hasRowHeader) total += parseCssLengthToPx(rowHeaderWidth) ?? 0;
    for (const col of columns) {
      const px = col.width ? parseCssLengthToPx(col.width) : null;
      if (px === null) return null;
      total += px;
    }
    if (onClearRow) total += 32;
    return total;
  }, [columns, hasRowHeader, rowHeaderWidth, onClearRow]);
  // Only a grid where every column already declares its own pixel width gets
  // to grow its total width past the container (see the header comment) —
  // every other grid stays "fluid": resizing redistributes among siblings
  // and the rendered widths are expressed as percentages (see `colWidth`
  // below) so the whole thing keeps scaling with the container afterward.
  const fluidMode = explicitTotalWidthPx === null;

  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);
  const tableRef = useRef<HTMLTableElement>(null);
  const isDragging = useRef(false);
  const suppressNextFocusSync = useRef(false);
  const [anchor, setAnchor] = useState<CellPos | null>(null);
  const [focus, setFocus] = useState<CellPos | null>(null);

  // Fill handle drag: `fillSourceRef` is the selection the drag started from
  // (fixed for the whole drag), `fillTarget` is the cell currently under the
  // pointer (drives the live preview). Kept separate from anchor/focus so an
  // in-progress fill drag never disturbs the normal cell selection.
  const isFillDragging = useRef(false);
  const fillSourceRef = useRef<Bounds | null>(null);
  const [fillTarget, setFillTarget] = useState<CellPos | null>(null);
  // Reassigned every render (not in an effect) so it always closes over the
  // latest `rows`/`columns`/`commitChange`, while the window mouseup listener
  // that invokes it is registered once and never goes stale.
  const finishFillDragRef = useRef<() => void>(() => {});
  // null = default layout (row-number/date fixed, data columns share the rest
  // of the width evenly). Once the user drags a column border, every
  // column's rendered width is snapshotted here in px (drag math needs px),
  // then rendered back out as percentages in fluid mode (or as absolute px,
  // same as before, in the all-columns-declare-a-width mode) — see `colWidth`.
  const [colWidthsPx, setColWidthsPx] = useState<number[] | null>(null);

  // Undo/redo: refs (not state) since they don't need to trigger renders —
  // only the `rows` they eventually emit does.
  const undoStackRef = useRef<Record<K, string>[][]>([]);
  const redoStackRef = useRef<Record<K, string>[][]>([]);
  const lastEmittedRef = useRef<Record<K, string>[] | null>(null);
  // A cell mid-typing-session: snapshot taken on its first keystroke, pushed
  // to the undo stack only once the session ends (blur/navigate/Cmd+Z) — so
  // undo reverts a whole edit, not one character at a time.
  const pendingEditSnapshotRef = useRef<Record<K, string>[] | null>(null);
  const pendingEditCellRef = useRef<{ row: number; col: K } | null>(null);

  // If `rows` changed via something other than our own emit (e.g. the parent
  // reset it for a different agent/month), the history no longer applies.
  useEffect(() => {
    if (rows !== lastEmittedRef.current) {
      undoStackRef.current = [];
      redoStackRef.current = [];
      pendingEditSnapshotRef.current = null;
      pendingEditCellRef.current = null;
    }
  }, [rows]);

  useEffect(() => {
    const handleMouseUp = () => {
      isDragging.current = false;
      finishFillDragRef.current();
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const aliasMapRef = useRef<Record<string, number>>({});
  const aliasMap: Record<string, number> = {};
  columns.forEach((col, idx) => {
    (col.aliases ?? [col.label]).forEach(a => { aliasMap[normalizeHeaderText(a)] = idx; });
  });
  aliasMapRef.current = aliasMap;

  const looksLikeHeaderRow = (cells: string[]): boolean => {
    const nonEmpty = cells.filter(c => c.trim() !== '');
    if (nonEmpty.length === 0) return false;
    const recognized = nonEmpty.filter(c => aliasMapRef.current[normalizeHeaderText(c)] !== undefined).length;
    return recognized >= Math.min(2, nonEmpty.length);
  };

  const setInputRef = (rowIdx: number, colIdx: number) => (el: HTMLInputElement | null) => {
    if (!inputRefs.current[rowIdx]) inputRefs.current[rowIdx] = [];
    inputRefs.current[rowIdx][colIdx] = el;
  };

  const emit = (next: Record<K, string>[]) => {
    lastEmittedRef.current = next;
    onRowsChange(next);
  };

  // Ends the current typing session (if any), pushing its pre-edit snapshot
  // as one undo step. Called on blur, navigation, and before any other
  // atomic edit so history stays in the right order.
  const commitPendingEdit = () => {
    if (pendingEditSnapshotRef.current) {
      undoStackRef.current.push(pendingEditSnapshotRef.current);
      if (undoStackRef.current.length > MAX_HISTORY) undoStackRef.current.shift();
      redoStackRef.current = [];
    }
    pendingEditSnapshotRef.current = null;
    pendingEditCellRef.current = null;
  };

  // Paste/clear are atomic — one undo step each, taken immediately.
  const commitChange = (next: Record<K, string>[]) => {
    commitPendingEdit();
    undoStackRef.current.push(rows);
    if (undoStackRef.current.length > MAX_HISTORY) undoStackRef.current.shift();
    redoStackRef.current = [];
    emit(next);
  };

  const handleUndo = () => {
    commitPendingEdit();
    if (undoStackRef.current.length === 0) return;
    const prev = undoStackRef.current.pop()!;
    redoStackRef.current.push(rows);
    emit(prev);
  };

  const handleRedo = () => {
    if (redoStackRef.current.length === 0) return;
    const next = redoStackRef.current.pop()!;
    undoStackRef.current.push(rows);
    emit(next);
  };

  const applyPastedBlock = (startRow: number, startCol: number, text: string) => {
    let block = splitClipboardText(text);
    if (block.length === 0) return;

    if (looksLikeHeaderRow(block[0])) {
      block = block.slice(1);
    }
    if (block.length === 0) return;

    const next = [...rows];
    block.forEach((cellsRow, ri) => {
      const targetRow = startRow + ri;
      if (targetRow >= next.length) return; // never extend past the grid's fixed row count
      const updated = { ...next[targetRow] };
      cellsRow.forEach((val, ci) => {
        const targetCol = startCol + ci;
        if (targetCol >= columns.length) return; // ignore columns past the last one we support
        if (columns[targetCol].readOnly) return;
        updated[columns[targetCol].key] = val;
      });
      next[targetRow] = updated;
    });
    commitChange(next);
  };

  useImperativeHandle(ref, () => ({ pasteAt: applyPastedBlock }));

  const bounds = getBounds(anchor, focus);

  const handleCellPaste = (rowIdx: number, colIdx: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text/plain');
    if (!text) return;
    if (!text.includes('\t') && !text.includes('\n')) {
      // A single copied value pasted onto an active multi-cell selection fills
      // every marked cell with it, rather than only the focused/active one.
      if (bounds && (bounds.maxRow > bounds.minRow || bounds.maxCol > bounds.minCol)) {
        e.preventDefault();
        fillRangeWithValue(bounds, text);
      }
      return; // single cell, no range selected: let the plain paste behave natively
    }
    e.preventDefault();
    const startRow = bounds ? bounds.minRow : rowIdx;
    const startCol = bounds ? bounds.minCol : colIdx;
    applyPastedBlock(startRow, startCol, text);
  };

  const handleCopy = async (rowIdx: number, colIdx: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const b = bounds ?? { minRow: rowIdx, maxRow: rowIdx, minCol: colIdx, maxCol: colIdx };
    if (b.maxRow === b.minRow && b.maxCol === b.minCol) return; // single cell: let native copy of the selected text handle it
    e.preventDefault();
    const lines: string[] = [];
    for (let r = b.minRow; r <= b.maxRow; r++) {
      const cells: string[] = [];
      for (let c = b.minCol; c <= b.maxCol; c++) {
        cells.push(rows[r]?.[columns[c].key] ?? '');
      }
      lines.push(cells.join('\t'));
    }
    e.clipboardData.setData('text/plain', lines.join('\n'));
  };

  const fillRangeWithValue = (b: Bounds, value: string) => {
    const next = [...rows];
    for (let r = b.minRow; r <= b.maxRow; r++) {
      if (r < 0 || r >= next.length) continue;
      const updated = { ...next[r] };
      for (let c = b.minCol; c <= b.maxCol; c++) {
        if (c < 0 || c >= columns.length || columns[c].readOnly) continue;
        updated[columns[c].key] = value;
      }
      next[r] = updated;
    }
    commitChange(next);
  };

  const clearRange = (b: Bounds) => fillRangeWithValue(b, '');

  const updateCell = (rowIdx: number, col: K, value: string) => {
    const sameSession = pendingEditCellRef.current?.row === rowIdx && pendingEditCellRef.current?.col === col;
    if (!sameSession) {
      commitPendingEdit(); // flush a session left on a different cell first
      pendingEditSnapshotRef.current = rows;
      pendingEditCellRef.current = { row: rowIdx, col };
    }
    emit(rows.map((r, i) => i === rowIdx ? { ...r, [col]: value } : r));
  };

  const moveFocusTo = (row: number, col: number) => {
    inputRefs.current[row]?.[col]?.focus();
  };

  const handleKeyDown = (rowIdx: number, colIdx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    const isMeta = e.metaKey || e.ctrlKey;
    if (isMeta && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) handleRedo(); else handleUndo();
      return;
    }
    if (isMeta && !e.shiftKey && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      handleRedo();
      return;
    }

    const withinRows = (r: number) => r >= 0 && r < rows.length;
    const withinCols = (c: number) => c >= 0 && c < columns.length;

    const arrowDelta: Record<string, [number, number]> = {
      ArrowDown: [1, 0], ArrowUp: [-1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
    };

    if (e.key in arrowDelta) {
      const [dr, dc] = arrowDelta[e.key];
      e.preventDefault();
      if (e.shiftKey) {
        const base = focus ?? { row: rowIdx, col: colIdx };
        const nr = base.row + dr, nc = base.col + dc;
        if (withinRows(nr) && withinCols(nc)) setFocus({ row: nr, col: nc });
      } else {
        const nr = rowIdx + dr, nc = colIdx + dc;
        if (withinRows(nr) && withinCols(nc)) moveFocusTo(nr, nc);
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (withinRows(rowIdx + 1)) moveFocusTo(rowIdx + 1, colIdx);
      return;
    }

    if (e.key === 'Escape') {
      if (pendingEditSnapshotRef.current) {
        // Cancel the in-progress edit, reverting without adding a history step.
        const reverted = pendingEditSnapshotRef.current;
        pendingEditSnapshotRef.current = null;
        pendingEditCellRef.current = null;
        emit(reverted);
      } else {
        setFocus(anchor);
      }
      return;
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      const b = bounds;
      if (b && (b.maxRow > b.minRow || b.maxCol > b.minCol)) {
        e.preventDefault();
        clearRange(b);
      }
      // single cell: text is pre-selected on focus, so native Delete/Backspace already clears it
    }
  };

  const handleMouseDown = (rowIdx: number, colIdx: number, e: React.MouseEvent) => {
    isDragging.current = true;
    if (e.shiftKey && anchor) {
      suppressNextFocusSync.current = true;
      setFocus({ row: rowIdx, col: colIdx });
    } else {
      setAnchor({ row: rowIdx, col: colIdx });
      setFocus({ row: rowIdx, col: colIdx });
    }
  };

  const handleMouseEnter = (rowIdx: number, colIdx: number) => {
    if (isFillDragging.current) {
      setFillTarget({ row: rowIdx, col: colIdx });
      return;
    }
    if (isDragging.current) {
      suppressNextFocusSync.current = true;
      setFocus({ row: rowIdx, col: colIdx });
    }
  };

  // Starts a fill drag from the handle at the current selection's
  // bottom-right corner. stopPropagation keeps this from also firing the
  // cell's own onMouseDown (which would reset anchor/focus to this corner).
  const handleFillMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!bounds) return;
    isFillDragging.current = true;
    fillSourceRef.current = bounds;
    setFillTarget({ row: bounds.maxRow, col: bounds.maxCol });
  };

  const fillExtension = useMemo(() => {
    if (!fillTarget || !fillSourceRef.current) return null;
    return computeFillExtension(fillSourceRef.current, fillTarget);
  }, [fillTarget]);

  finishFillDragRef.current = () => {
    if (!isFillDragging.current) return;
    isFillDragging.current = false;
    const source = fillSourceRef.current;
    const target = fillTarget;
    fillSourceRef.current = null;
    setFillTarget(null);
    if (!source || !target) return;
    const ext = computeFillExtension(source, target);
    if (!ext) return; // released back inside the source selection: no-op
    commitChange(applyFillToRows(rows, columns, source, ext.bounds, ext.direction));
    setAnchor({ row: ext.bounds.minRow, col: ext.bounds.minCol });
    setFocus({ row: ext.bounds.maxRow, col: ext.bounds.maxCol });
  };

  const handleCellFocus = (rowIdx: number, colIdx: number, e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
    if (suppressNextFocusSync.current) {
      suppressNextFocusSync.current = false;
      return;
    }
    setAnchor({ row: rowIdx, col: colIdx });
    setFocus({ row: rowIdx, col: colIdx });
  };

  const isSelected = (r: number, c: number) => !!bounds && r >= bounds.minRow && r <= bounds.maxRow && c >= bounds.minCol && c <= bounds.maxCol;

  // A single active cell (no drag/shift range) gets its focus indicator from
  // the input's own border below — same 1px weight as the grid lines. The
  // thicker blue rectangle here is only for an actual multi-cell selection.
  const selectionCellClass = (r: number, c: number): string => {
    if (!bounds || !isSelected(r, c)) return '';
    if (bounds.minRow === bounds.maxRow && bounds.minCol === bounds.maxCol) return '';
    const cls = ['bg-indigo-100/50', 'dark:bg-indigo-900/30'];
    if (r === bounds.minRow) cls.push('border-t-2 border-t-indigo-500');
    if (r === bounds.maxRow) cls.push('border-b-2 border-b-indigo-500');
    if (c === bounds.minCol) cls.push('border-l-2 border-l-indigo-500');
    if (c === bounds.maxCol) cls.push('border-r-2 border-r-indigo-500');
    return cls.join(' ');
  };

  // Dashed outline over the region a fill drag would write into if released
  // now — i.e. inside `fillExtension.bounds` but outside the source
  // selection, which already has its own solid highlight from above.
  const fillPreviewCellClass = (r: number, c: number): string => {
    if (!fillExtension) return '';
    const { bounds: ext } = fillExtension;
    if (r < ext.minRow || r > ext.maxRow || c < ext.minCol || c > ext.maxCol) return '';
    const source = fillSourceRef.current;
    if (source && r >= source.minRow && r <= source.maxRow && c >= source.minCol && c <= source.maxCol) return '';
    return 'border-2 border-dashed border-slate-500 dark:border-slate-300';
  };

  // Dragging a header's right edge: snapshot every column's current rendered
  // width, then grow the dragged column by taking space from its siblings —
  // proportional to how much each can spare above MIN_COL_WIDTH — instead of
  // just growing the table's total width. Only once every sibling is already
  // at MIN_COL_WIDTH does the dragged column's growth spill over into growing
  // the total, and even then only for a grid where every column already
  // declares its own pixel width (`!fluidMode`) — a fluid grid's dragged
  // column simply stops growing once its siblings are out of slack, so the
  // table can never overflow its container from a resize alone. Shrinking the
  // dragged column is symmetric: freed width is handed back to siblings
  // proportional to their current width, never to the total.
  const startColumnResize = (colIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const ths = tableRef.current?.querySelectorAll('thead th');
    if (!ths) return;
    const resizableCount = dataColOffset + columns.length;
    const startWidths = Array.from(ths).map(th => th.getBoundingClientRect().width);
    const startX = e.clientX;
    const startWidth = startWidths[colIndex];
    const otherIndices = startWidths.map((_, i) => i).filter(i => i !== colIndex && i < resizableCount);
    const totalOthersWidth = otherIndices.reduce((sum, i) => sum + startWidths[i], 0);
    const totalShrinkable = otherIndices.reduce((sum, i) => sum + Math.max(0, startWidths[i] - MIN_COL_WIDTH), 0);

    const onMouseMove = (ev: MouseEvent) => {
      const desired = Math.max(MIN_COL_WIDTH, startWidth + (ev.clientX - startX));
      const rawGrow = desired - startWidth;
      // Amount actually reclaimed from siblings — capped at what they can
      // spare so none of them ever drops below MIN_COL_WIDTH.
      const takeFromOthers = Math.max(0, Math.min(rawGrow, totalShrinkable));
      // Fluid grids never grow the total; explicit-width grids may, but only
      // for the leftover a resize's siblings couldn't supply.
      const extraGrowth = fluidMode ? 0 : Math.max(0, rawGrow - totalShrinkable);
      const appliedGrow = rawGrow >= 0 ? takeFromOthers + extraGrowth : rawGrow;

      const next = [...startWidths];
      next[colIndex] = startWidth + appliedGrow;
      if (rawGrow > 0 && totalShrinkable > 0) {
        otherIndices.forEach(i => {
          const shrinkable = Math.max(0, startWidths[i] - MIN_COL_WIDTH);
          next[i] = startWidths[i] - (shrinkable / totalShrinkable) * takeFromOthers;
        });
      } else if (rawGrow < 0 && totalOthersWidth > 0) {
        otherIndices.forEach(i => {
          next[i] = startWidths[i] + (startWidths[i] / totalOthersWidth) * (-rawGrow);
        });
      }
      setColWidthsPx(next);
    };
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const ResizeHandle = ({ colIndex }: { colIndex: number }) => (
    <div
      onMouseDown={(e) => startColumnResize(colIndex, e)}
      className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-indigo-400/50 active:bg-indigo-500/60"
    />
  );

  // Pinned mode's frozen-pane pieces (see the `pinned` prop comment and
  // conventions.md §4):
  // - One-sided borders (`border-b border-r`, the wrapper supplies top/left)
  //   so each gridline belongs to a cell and moves with it when sticky.
  // - The rowHeader column pins at a `left` equal to the row-number column's
  //   MEASURED width (see rowNumberThRef above) — declared widths don't
  //   survive the density root-font-size scaling or fixed-layout
  //   redistribution, and a wrong offset shows as a transparent seam.
  // - z tiers: corner header cells (sticky on both axes) > data header cells
  //   > pinned body cells — all above the fill handle's z-20 and a focused
  //   input's z-10, so scrolled content passes UNDER every pinned cell.
  //   The wrapper is `isolate` so these tiers stay INTERNAL — without it the
  //   sticky headers out-stack the app's absolutely-positioned popovers
  //   (MonthPicker/TreeMultiSelectDropdown panels are z-30) and the grid
  //   paints over an open dropdown.
  // - Sticky cells get their own opaque backgrounds (bg-slate-50/
  //   dark:bg-slate-900, same pair as agent-score's pinned cells) — the
  //   default translucent dark:bg-slate-700/40 would let cells scrolling
  //   underneath show through.
  const cellBorder = pinned ? 'border-b border-r' : 'border';
  const rowNumberWidthPx = measuredRowNumberWidth
    ?? (colWidthsPx ? colWidthsPx[0] : parseCssLengthToPx(ROW_NUMBER_COL_WIDTH) ?? 48);
  const cornerThClass = pinned ? 'sticky top-0 z-50' : 'relative';
  const dataThClass = pinned ? 'sticky top-0 z-40' : 'relative';
  const pinnedBodyCellClass = pinned
    ? 'sticky z-30 bg-slate-50 dark:bg-slate-900'
    : 'bg-slate-50 dark:bg-slate-700/40';

  // Sum of every resized column's snapshot, i.e. everything BUT the fixed
  // clear-row column — the denominator `colWidth` below turns each entry
  // into a percentage of. In fluid mode this stays constant across a resize
  // (see startColumnResize), so expressing widths as a share of it, rather
  // than as their own absolute px, is what keeps the table scaling with its
  // container instead of freezing at whatever size it happened to be dragged
  // to.
  const totalColWidthsPx = colWidthsPx ? colWidthsPx.reduce((sum, w) => sum + w, 0) : null;
  const totalBaselinePx = totalColWidthsPx !== null ? totalColWidthsPx + (onClearRow ? 32 : 0) : null;
  const colWidth = (idx: number): string =>
    fluidMode ? `${(colWidthsPx![idx] / totalBaselinePx!) * 100}%` : `${colWidthsPx![idx]}px`;

  return (
    <div className={`isolate ${bordered ? 'border border-slate-200 dark:border-slate-700 rounded-md shadow-sm' : ''} ${pinned ? `overflow-auto ${fillHeight ? 'h-full' : 'max-h-full'}` : 'overflow-x-auto'}`}>
      <table
        ref={tableRef}
        className={`select-none ${pinned ? 'border-separate border-spacing-0' : 'border-collapse'}`}
        style={{
          tableLayout: 'fixed',
          // A fluid grid (see the header comment) always stays at 100%, resized
          // or not — its columns are rendered as percentages of each other
          // (`colWidth`), so the table scales with its container rather than
          // freezing at whatever size a drag happened to leave it at. Only a
          // grid where every column already declares its own pixel `width`
          // (`!fluidMode`) gets an explicit total-px width: table-layout:fixed +
          // width:auto doesn't reliably grow past the container to fit wider
          // <col>s in every browser, so that's what makes the wrapper's
          // overflow-x-auto kick in for that mode, resized or not
          // (explicitTotalWidthPx before any resize, the resized total after).
          width: fluidMode
            ? '100%'
            : colWidthsPx
              ? `${totalBaselinePx}px`
              : explicitTotalWidthPx !== null ? `${explicitTotalWidthPx}px` : '100%',
        }}
      >
        <colgroup>
          <col style={{ width: colWidthsPx ? colWidth(0) : ROW_NUMBER_COL_WIDTH }} />
          {hasRowHeader && <col style={{ width: colWidthsPx ? colWidth(1) : rowHeaderWidth }} />}
          {columns.map((col, i) => (
            // In the default layout a column's optional `width` pins it while
            // the unsized columns share the remaining space; once the user
            // drags a border, the snapshot widths take over for everything.
            <col key={col.key} style={colWidthsPx ? { width: colWidth(i + dataColOffset) } : col.width ? { width: col.width } : undefined} />
          ))}
          {onClearRow && <col style={{ width: colWidthsPx && fluidMode ? `${(32 / totalBaselinePx!) * 100}%` : '2rem' }} />}
        </colgroup>
        <thead className={pinned ? undefined : 'sticky top-0 z-10'}>
          <tr>
            {/* Header font-size is bumped via an inline style — the app's global
                table-density CSS (see globals.css) unconditionally forces th
                font-size regardless of Tailwind classes, so only an inline
                style (or !important) can override it for this grid specifically. */}
            <th ref={rowNumberThRef} className={`${cornerThClass} ${cellBorder} border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 px-2 text-center font-semibold text-slate-600 dark:text-slate-300`} style={{ fontSize: '0.9375rem', ...(pinned ? { left: 0 } : undefined) }}>
              #
              <ResizeHandle colIndex={0} />
            </th>
            {hasRowHeader && (
              <th className={`${cornerThClass} ${cellBorder} border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 px-2 text-center font-semibold text-slate-600 dark:text-slate-300`} style={{ fontSize: '0.9375rem', ...(pinned ? { left: rowNumberWidthPx } : undefined) }}>
                {rowHeaderLabel}
                <ResizeHandle colIndex={1} />
              </th>
            )}
            {columns.map((col, colIdx) => (
              <th key={col.key} className={`${dataThClass} ${cellBorder} border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 px-2 pt-1.5 pb-1 text-center font-semibold text-slate-600 dark:text-slate-300 truncate`} style={{ fontSize: '0.9375rem' }}>
                <div className="truncate leading-tight">{col.label}</div>
                {col.summary !== undefined && (
                  <div
                    className="mt-1.5 pt-1.5 border-t border-slate-300 dark:border-slate-600 text-right font-semibold text-indigo-600 dark:text-indigo-400 truncate leading-tight"
                    style={{ fontSize: '0.875rem' }}
                  >
                    {col.summary}
                  </div>
                )}
                <ResizeHandle colIndex={colIdx + dataColOffset} />
              </th>
            ))}
            {onClearRow && <th className={`${pinned ? 'sticky top-0 z-40' : ''} ${cellBorder} border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700`} />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} className="group">
              <td className={`${pinnedBodyCellClass} ${cellBorder} border-slate-300 dark:border-slate-600 px-2 text-center text-slate-400 dark:text-slate-500`} style={pinned ? { left: 0 } : undefined}>
                {rowIdx + 1}
              </td>
              {hasRowHeader && (
                <td className={`${pinnedBodyCellClass} ${cellBorder} border-slate-300 dark:border-slate-600 px-2 text-slate-600 dark:text-slate-300 whitespace-nowrap truncate`} style={pinned ? { left: rowNumberWidthPx } : undefined}>
                  {rowHeader(rowIdx)}
                </td>
              )}
              {columns.map((col, colIdx) => {
                const error = cellError?.(rowIdx, col.key);
                return (
                <td
                  key={col.key}
                  onMouseDown={(e) => handleMouseDown(rowIdx, colIdx, e)}
                  onMouseEnter={() => handleMouseEnter(rowIdx, colIdx)}
                  className={`relative ${cellBorder} border-slate-300 dark:border-slate-600 p-0 ${selectionCellClass(rowIdx, colIdx)} ${fillPreviewCellClass(rowIdx, colIdx)}`}
                >
                  <input
                    ref={setInputRef(rowIdx, colIdx)}
                    value={row[col.key]}
                    readOnly={col.readOnly}
                    title={error || undefined}
                    onChange={(e) => { if (!col.readOnly) updateCell(rowIdx, col.key, e.target.value); }}
                    onPaste={(e) => handleCellPaste(rowIdx, colIdx, e)}
                    onCopy={(e) => handleCopy(rowIdx, colIdx, e)}
                    onKeyDown={(e) => handleKeyDown(rowIdx, colIdx, e)}
                    onFocus={(e) => handleCellFocus(rowIdx, colIdx, e)}
                    onBlur={commitPendingEdit}
                    onDragStart={(e) => e.preventDefault()}
                    className={`absolute inset-0 block w-full h-full box-border px-1.5 text-right tabular-nums outline-none focus:z-10 ${
                      col.readOnly
                        ? 'bg-slate-50 dark:bg-slate-700/30 text-slate-500 dark:text-slate-400 cursor-default border border-transparent focus:border-slate-400 dark:focus:border-slate-500'
                        : error
                          ? 'bg-rose-50 dark:bg-rose-900/25 text-rose-700 dark:text-rose-300 border border-rose-400 dark:border-rose-500/70 focus:border-rose-500'
                          : 'bg-transparent dark:text-slate-100 border border-transparent focus:border-indigo-500'
                    }`}
                  />
                  {bounds && rowIdx === bounds.maxRow && colIdx === bounds.maxCol && (
                    <div
                      onMouseDown={handleFillMouseDown}
                      title="Drag to fill"
                      className="absolute -right-[3px] -bottom-[3px] w-[7px] h-[7px] bg-indigo-600 border border-white dark:border-slate-800 cursor-crosshair z-20"
                    />
                  )}
                </td>
                );
              })}
              {onClearRow && (
                <td className={`${cellBorder} border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/40 text-center`}>
                  <button
                    type="button"
                    onClick={() => onClearRow(rowIdx)}
                    className="text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity dark:text-slate-500"
                    title="Clear row"
                  >
                    <Trash2 size={12} className="mx-auto" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const PasteableGrid = forwardRef(PasteableGridInner) as <K extends string>(
  props: PasteableGridProps<K> & { ref?: React.Ref<PasteableGridHandle> }
) => ReturnType<typeof PasteableGridInner>;

export default PasteableGrid;
