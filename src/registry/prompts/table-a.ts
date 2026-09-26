/** AI prompts — see `./index.ts` for what a prompt is for. */

export const TABLE_A_PROMPTS: Record<string, string> = {
  'data-table': `Build a generic data table component in React + TypeScript + Tailwind CSS, configured entirely by a column array: sorting, one global search, row selection with a bulk-action bar, pinned rows, pinned columns on either side, resizable columns, a column-visibility menu, striped rows, paging, and loading / empty states.

## Look
- Outer card: the opaque floating surface (\`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg\`, no blur), \`flex min-h-0 flex-col\`. Stacked inside: toolbar, scroll box, selection bar, footer, pagination — each bar \`shrink-0\` with a slate-200 / dark slate-700 hairline towards the scroll box.
- Toolbar (only if searchable, column toggle or \`header\` is set): \`flex flex-wrap items-center gap-2 border-b px-3 py-2\` holding the \`header\` node, the search input (\`relative min-w-48 flex-1\`, 14px Search icon absolutely placed at left-2.5, input \`pl-8\`), then a Columns3 icon button (\`shrink-0 rounded-md p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200\`).
- Scroll box: \`min-h-0 flex-1 overflow-auto\`, thin 5px scrollbar (slate-300 thumb, dark slate-700); \`maxHeight\` applied inline, otherwise the table grows.
- Table: \`w-full text-left text-xs\`, \`table-layout: fixed\` when resizable, else auto. \`tbody\` has \`divide-y divide-slate-100 dark:divide-slate-800\`, text slate-700 / dark slate-200. Row height comes from line-height, not padding: body cells \`px-3 py-0 leading-[40px] truncate\` (right-aligned for \`align: 'right'\`). Header cells never wrap.
- Header cells: sticky \`top-0 z-10\`, \`bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200/80 dark:border-slate-700\` — background and border on the \`th\`, not the \`tr\`, or they scroll away. Text 10px semibold uppercase \`tracking-wider\` slate-600 / dark slate-300. The cell is \`p-0\` and holds a full-width button \`px-3 py-2.5 leading-4\` with a truncating label.
- Sort indicator: a 12px icon after the label, ALWAYS rendered so the header never changes width on click — ArrowUp / ArrowDown on the sorted column (whose label turns slate-800 / dark slate-100), otherwise ChevronsUpDown at opacity 0 that shows at 40% on header hover. Unsortable columns: no icon, default cursor.
- Rows: hover \`bg-slate-50 dark:bg-slate-800/50\`; striped \`odd:bg-slate-50/70 dark:odd:bg-slate-800/30\`; selected \`bg-indigo-50/60 dark:bg-indigo-500/10\`, declared after the stripe so selection wins.
- Checkbox column: 40px, native checkboxes with \`accent-indigo-600\`, sticky at left 0 (header cell \`z-[3] bg-slate-50 dark:bg-slate-900\`).
- Pinned columns: \`sticky z-[2] bg-white dark:bg-slate-900\` (opaque, or scrolled cells show through) with a slate-200 / dark slate-700 border on the inner edge; their header cells \`z-[3]\`.
- Pinned rows: a separate \`tbody\` above the body with \`border-b-2 border-indigo-200 dark:border-indigo-500/40\`. \`position: sticky\` is ignored on a \`tr\`, so every CELL is sticky at \`top = measured header height\` (ResizeObserver on the thead — it changes with density and wrapping), \`z-[1] bg-indigo-50/70 dark:bg-indigo-500/10\` (\`z-[2]\` where it is also a pinned column). No hover, stripe or selected tint.
- Resize handle: 4px strip on each header's right edge, \`cursor-col-resize hover:bg-indigo-400\`, \`bg-indigo-500\` while dragging.
- Selection bar (while anything is selected): \`border-t bg-indigo-50/60 dark:bg-indigo-500/10 px-4 py-2\` — "3 selected" in semibold indigo-700 / dark indigo-300, then right-aligned the caller's actions and a ghost "Clear" button with an X icon.
- Footer bar: \`border-t px-4 py-2 text-xs text-slate-600 dark:text-slate-300\`.

## Behaviour
- Sorting: only columns with \`sortValue\`. Clicks cycle ascending → descending → unsorted (back to arrival order). Missing values (null / undefined / '') sort LAST in both directions. The kind is read off the first non-missing value: numbers compare numerically, anything else with \`localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })\`. Sort a copy; stable. Any sort change resets to page 1.
- Uncontrolled until \`sort\` is passed; then the table only shows the indicator and calls \`onSortChange\` — it does not re-sort (server-side sorting).
- Search: case-insensitive substring match against every column's \`filterValue\` (cells render JSX, so a column is searchable only if it says what its text is). Typing resets to page 1. Deliberately no per-column filter menus.
- Pinned rows (\`pinnedRowIds\`, in the order given) come from the full \`rows\` and are excluded from the body, search and paging.
- Selection is controlled. The header checkbox is checked when every row on the CURRENT page is selected and toggles just that page, keeping selections elsewhere.
- Pinned offsets: each left-pinned column's \`left\` is the sum of the pinned widths before it, seeded with 40 when the checkbox column is on; right-pinned the same from the right. Pinned columns with no \`width\` count as 160px.
- Resize: on pointerdown record x and width; listen for pointermove / pointerup on \`window\` (the pointer leaves a 4px target mid-drag); width = start + dx, min \`minWidth\` (default 64). Set \`cursor: col-resize\` and \`user-select: none\` on body while dragging.
- Column menu: portalled to <body>, \`position: fixed\`, 224px wide, max 288px tall and scrolling, \`z-[200]\`, \`rounded-lg border p-1 shadow-xl\`, opaque. Opens 4px below the trigger, flips above if there is more room there, stays 8px inside the viewport, re-places on resize and on scroll in the CAPTURE phase (the table's own scroll doesn't bubble). Items \`px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800\`: a 14px rounded square (indigo-600 fill with white check when visible, slate-300 border when hidden) + label. \`alwaysVisible\` columns are disabled at 40% opacity.
- Paging (\`pageSize\` > 0): a bar under the table — left "1–25 of 80" (numbers semibold); right a "Rows" select (25 / 50 / 100 / 250) and first / prev / numbered pages with ellipsis gaps / next / last (14px chevrons, \`p-1.5 rounded-lg text-slate-500 hover:bg-slate-100\`, disabled 40%; current page \`bg-indigo-600 text-white font-semibold\`, min-w-[1.75rem]). Hidden when everything fits on one page. Changing size resets to page 1.
- Loading: 4 skeleton rows under the real header (a pulsing \`h-3 rounded bg-slate-200 dark:bg-slate-700\` bar per cell) so widths don't jump.
- No rows at all: just the card, \`p-8\`, with a centred \`text-sm font-medium\` title (\`py-16\`) and the hint behind an ⓘ tooltip — never a bare header. A search with no matches shows one full-width row: "No rows match" / "Clear the search to see everything."

## API
- \`Column<T>\`: \`key\`, \`header: ReactNode\`, \`cell(row)\`, \`sortValue?(row): string | number | null\`, \`filterValue?(row): string\`, \`align?: 'left' | 'right'\`, \`width?\`, \`minWidth?\`, \`pin?: 'left' | 'right'\`, \`alwaysVisible?\`.
- Data: \`rows\`, \`columns\`, \`getRowId(row): string | number\`.
- Selection: \`selectable\` (false), \`selected\`, \`onSelectedChange\`, \`selectionActions?(ids): ReactNode\`.
- Sorting / paging: \`sort?: { key, dir: 'asc' | 'desc' } | null\`, \`onSortChange\`, \`pageSize\` (0 = off).
- Features: \`searchable\` (false), \`searchPlaceholder\` ('Search…'), \`resizable\`, \`columnToggle\`, \`pinnedRowIds\`, \`stripedRows\` (the only banding option), \`loading\`.
- Chrome: \`header\`, \`footer\`, \`emptyTitle\` ('Nothing here yet'), \`emptyHint\`, \`maxHeight\` (e.g. '20rem'), \`className\`.

## Accessibility
- \`aria-sort\` on every header cell; checkboxes labelled "Select all rows on this page" / "Select row"; the resize handle is \`role="separator" aria-orientation="vertical"\`; the Columns button has \`aria-label\` and \`aria-expanded\`; the search input's label is its placeholder.

## Demo
A "Team members" table (title in the \`header\` slot): Name (pinned left, always visible, medium weight), Email, Team, Role, Status (pill badge with a dot: active emerald, invited indigo, suspended rose), Projects and Spend (right-aligned, \`$18,420\`; Spend pinned right). Eight people (Ada Lovelace, Grace Hopper, Alan Turing…), searchable, selectable with an "Export N" action, row 1 pinned, resizable, column menu, striped, pageSize 25, maxHeight 20rem, footer "8 members · $82,305 total".`,

  'pasteable-grid': `Build a spreadsheet-style editable grid component in React + TypeScript + Tailwind CSS: every cell is an input; paste a block copied from Excel / Google Sheets, select ranges, copy them as TSV, fill-drag like Excel, undo / redo, resize columns, and optionally freeze the header and leading columns.

## Look
- Wrapper: \`isolate\`; by default a card \`border border-slate-200 dark:border-slate-700 rounded-md shadow-sm\` (\`bordered={false}\` drops it). Default \`overflow-x-auto\` with no vertical scroll of its own; in pinned mode \`overflow-auto max-h-full\` (\`h-full\` with \`fillHeight\`).
- Table: \`select-none\`, \`table-layout: fixed\`, \`border-collapse\` with a 1px \`border\` on every cell in \`border-slate-300 dark:border-slate-600\`. Pinned mode instead uses \`border-separate border-spacing-0\` and one-sided \`border-b border-r\` cells (the wrapper gives top / left) — collapsed borders belong to the table and stay behind when a sticky cell moves.
- Columns, left to right: a "#" column (3rem) of row numbers — centred, slate-400 / dark slate-500 on \`bg-slate-50 dark:bg-slate-700/40\`; an optional \`rowHeader\` column (default 8rem, label \`rowHeaderLabel\`) with non-editable slate-600 / dark slate-300 text, nowrap, truncating; the data columns; an optional 2rem clear-row column.
- Header cells: \`bg-slate-100 dark:bg-slate-700\`, 15px semibold slate-600 / dark slate-300, centred, \`px-2 pt-1.5 pb-1\`, label truncates \`leading-tight\`. A column with \`summary\` shows it on a second line under a divider: \`mt-1.5 pt-1.5 border-t\`, right-aligned, 14px semibold indigo-600 / dark indigo-400 — e.g. a running total. Not pinned, the thead is sticky \`top-0 z-10\`.
- Row height 40px (set as line-height on the cell). The cell is \`relative p-0\`; the input fills it (\`absolute inset-0 w-full h-full box-border px-1.5\`), text right-aligned \`tabular-nums\`, no outline, a 1px transparent border that turns \`border-indigo-500\` on focus (plus \`z-10\`). That 1px border is the ONLY indicator for a single active cell.
- Read-only column: \`bg-slate-50 dark:bg-slate-700/30 text-slate-500 dark:text-slate-400 cursor-default\`, focus border slate-400 / dark slate-500.
- Invalid cell (\`cellError\` returns a message): \`bg-rose-50 dark:bg-rose-900/25 text-rose-700 dark:text-rose-300 border-rose-400 dark:border-rose-500/70\`, message as the input's \`title\`. Presentational only — input is never blocked.
- Multi-cell selection: \`bg-indigo-100/50 dark:bg-indigo-900/30\` on each cell plus a 2px indigo-500 border on the outer edges only (top row gets \`border-t-2\`, bottom row \`border-b-2\`, etc.) — one Excel-style rectangle.
- Fill handle: a 7×7px \`bg-indigo-600\` square with a 1px white / dark slate-800 border, at the selection's bottom-right cell offset \`-right-[3px] -bottom-[3px]\`, \`cursor-crosshair z-20\`, title "Drag to fill". While dragging, cells about to be filled get \`border-2 border-dashed border-slate-500 dark:border-slate-300\`.
- Resize handle: 6px strip at each header's right edge, \`cursor-col-resize hover:bg-indigo-400/50 active:bg-indigo-500/60\`.
- Clear-row button: 12px Trash2, slate-300 → hover rose-600, invisible until the row is hovered.

## Behaviour
- Values are opaque strings; the grid never computes anything (summaries are consumer text). It never adds rows.
- Paste (multi-cell text): strip \`\\r\`, drop trailing empty lines, split on tab if any line has one else on comma, trim each cell. If the first row looks like this grid's own headers — at least min(2, non-empty cells) of its cells match a column's \`aliases\` (default: its label), compared lowercase with non-alphanumerics removed — drop it. Write starting at the selection's top-left (or the pasted cell), ignoring rows / columns past the end and skipping read-only columns.
- Paste a single value (no tab / newline) onto a multi-cell selection: fill every selected cell with it. Onto one cell: native paste.
- Copy with a range selected: write the range as TSV. Single cell: native copy. Delete / Backspace on a range clears it; on one cell, native (focusing a cell selects its text).
- Mouse: mousedown sets anchor + focus, dragging extends, Shift+click extends from the anchor.
- Keys: arrows move focus (clamped), Shift+arrows extend the selection, Enter moves down, Escape reverts the cell's in-progress edit (no history step) or else collapses the selection to the anchor.
- Undo / redo: Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y, 100 steps. Typing coalesces into ONE step per cell, committed on blur or navigation, not per keystroke; paste, clear and fill are each one step. History is discarded when \`rows\` changes from outside (anything other than the grid's own emit).
- Fill drag: locks to one axis — whichever the pointer is furthest past the selection on — and TILES the source values (repeats them as a pattern, never extrapolates a series), skipping read-only columns. Afterwards the selection covers the filled area; releasing inside the source does nothing. Listen for mouseup on \`window\`.
- Column widths: by default the table is 100% wide, columns with \`width\` keep it and the rest share the remainder. Dragging a border snapshots every column's rendered px width, then grows the dragged column by taking space from its siblings in proportion to how much each has above a 40px minimum (shrinking hands width back in proportion to size), and renders widths as PERCENTAGES so the grid still scales with its container — a resize never causes horizontal scroll. Exception: if EVERY column has a px / rem width, the table's width is their sum (+3rem #, row header, 32px clear column), it scrolls horizontally, and a resize may grow the total once siblings are out of slack.
- Pinned mode: header row sticky top; # and row-header columns sticky left, each with an opaque \`bg-slate-50 dark:bg-slate-900\`. The row header's \`left\` must be the # column's MEASURED width (ResizeObserver) — rem widths shift with root font size and leave a seam. Z tiers: corner header cells 50 > data headers 40 > pinned body cells 30 > fill handle 20 > focused input 10; \`isolate\` keeps them from out-stacking page popovers. The parent must bound the height.

## API
- \`PasteableGridColumn<K>\`: \`key: K\`, \`label\`, \`width?\` ('16rem' / '120px'), \`aliases?: string[]\`, \`summary?: string\`, \`readOnly?\`.
- Props: \`columns\`, \`rows: Record<K, string>[]\`, \`onRowsChange(next)\` (fully controlled), \`rowHeader?(rowIndex): ReactNode\`, \`rowHeaderWidth\` ('8rem'), \`rowHeaderLabel\`, \`onClearRow?(rowIndex)\`, \`cellError?(rowIndex, key): string | null\`, \`pinned\`, \`fillHeight\`, \`bordered\` (true).
- Ref handle (forwardRef, generic over K): \`pasteAt(rowIdx, colIdx, text)\` runs the same paste logic from outside, e.g. a "Paste from clipboard" button.

## Demo
Bonus adjustments in a 22rem-tall box, pinned + fillHeight: Person (16rem, aliases "name", "user"), Amount (10rem, summary = the column's live total), Note. Rows: Ada Lovelace 1200 "Q3 bonus", Grace Hopper 850, Alan Turing 2400 "Relocation", Katherine J. 640, plus one blank row. Paste "Name⇥Amount⇥Note" plus rows to show the header being dropped.`,

  'editable-cell': `Build a click-to-edit table cell component in React + TypeScript + Tailwind CSS: it reads as plain text, hints on hover that it is editable, opens an input over itself without moving anything, and marks unsaved values.

## Look
- Wrapper (\`td\` or \`div\`, via \`as\`): \`group relative\`, text slate-600 / dark slate-300; when dirty \`text-amber-600 dark:text-amber-400 font-medium\`. The wrapper owns the text colour, so callers pass only width / padding.
- Inner box: \`relative box-border w-full flex items-center gap-2.5 px-2 py-1 rounded text-xs\` (\`items-start\` when \`wrap\`), dirty adds \`bg-slate-100 dark:bg-slate-700/50\`.
- Editable affordance: the box always has a 1px bottom border, transparent at rest, \`border-dashed border-slate-400 dark:border-slate-500\` on hover and while editing; \`cursor-pointer\`. A 12px Pencil (slate-400 / dark slate-500) sits at the right, \`shrink-0\`, opacity 0 → 100 on hover.
- Display text: \`flex-1 min-w-0 truncate\` (no truncation with \`wrap\`, for chip lists).
- Editing: the input overlays the box (\`absolute inset-0 w-full h-full px-2 py-1 rounded text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none\`), autofocused with its text selected. Number inputs hide the spin buttons (\`[appearance:textfield]\` + webkit spin-button \`appearance-none\`).

## No-jump rules (the point of the component)
- Read and edit share one reserved box — same width, padding and bottom border — so opening a cell never resizes its row or column.
- \`min-w-0\` stops an input's intrinsic width from widening a narrow column.
- The pencil is always rendered, even under the open input; only its opacity changes.
- While editing, the display text stays in layout with \`invisible\` (not hidden), so the box keeps its size.
- \`autoWidth\`: the input is in flow instead (\`relative -mx-2 -my-1 min-w-0 max-w-full\`), sized to \`clamp(value.length + 1, 8, 60)ch\`, and the display text is hidden. Off by default.

## Behaviour
- Presentational and fully controlled: the parent decides which cell is open, holds the pending value and whether the user may edit. Edits are meant to be batched and saved together, not written per keystroke.
- Clicking the cell calls \`onStartEdit\` (when not already editing). Enter or blur → \`onCommit\`; Escape → \`onCancel\`.
- \`editor\` replaces the built-in input with a custom control (e.g. a select) in an \`absolute inset-0 flex items-center\` overlay whose clicks don't bubble back to the cell.
- Tooltip (\`title\`) "Click to edit", or "Click to edit — unsaved" when dirty; none while editing or when \`canEdit\` is false (then no pencil or dashed line either).

## API
\`editing\`, \`dirty\`, \`canEdit\`, \`display: ReactNode\`, \`onStartEdit\`; built-in input: \`value\`, \`onChange(v)\`, \`onCommit\`, \`onCancel\`, \`inputType\` ('text' | 'number' | 'date', default 'text'), \`step\` (e.g. '0.01'); layout: \`alignRight\` (right-aligns both modes), \`wrap\`, \`autoWidth\`, \`className\`, \`inputClassName\`, \`as\` ('div' | 'td', default 'div'); \`editor?: ReactNode\`.

## Demo
A one-row table (Person / Amount / Note): "Ada Lovelace", an Amount cell (\`as="td"\`, right-aligned, number, step 0.01) showing 1200, and a Note cell "Q3 bonus". Only one cell open at a time; commit saves the draft, Escape restores the saved value; an edited-but-uncommitted cell shows amber on grey.`,

  'pagination': `Build a pagination component in React + TypeScript + Tailwind CSS: numbered page links with ellipsis gaps (or a "page N of M" box), first / prev / next / last steppers, a range line and a rows-per-page select — as a props-driven component with three placements, and as composable parts for custom layouts.

## Look
- Everything \`text-xs\`. Three placements (\`variant\`), differing only in the wrapper:
  - \`bar\` (default): full width under a table — \`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-slate-200 dark:border-slate-800 px-4 py-2\`.
  - \`pill\`: centred in flow — \`mt-3 mx-auto w-fit flex items-center gap-4 rounded-full border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-4 py-2 shadow-lg\`.
  - \`floating\`: the same pill \`fixed bottom-4 left-1/2 -translate-x-1/2 z-20\`.
- Left: the range line, slate-600 / dark slate-300 — "**1**–**25** of **1204** members" (numbers semibold). In the pill variants it hides below \`sm\`.
- Right (\`flex items-center gap-3\`): a "Rows" label with a small native select (\`rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-1.5 py-0.5\`), then the controls in \`flex items-center gap-0.5\`.
- Steppers: ChevronsLeft / ChevronLeft / ChevronRight / ChevronsRight at 14px, \`p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg\`, disabled \`opacity-40\` with no hover. In pill variants \`rounded-full\`, dark hover slate-700, and they press in (\`active:scale-90\`).
- Page links: \`min-w-[1.75rem] px-1.5 py-1 rounded-lg\` (\`rounded-full\` in pills), slate-600 with slate-100 hover; current page \`bg-indigo-600 text-white font-semibold\`.
- Ellipsis: a plain "…" span, \`px-1 text-slate-400 select-none\` — not a button.
- \`navigation="input"\` replaces the links with a \`w-9\` centred input (\`rounded-md border border-slate-200 dark:border-slate-700 py-0.5 bg-transparent\`) followed by "of **M**".

## Behaviour
- Renders nothing when everything fits on one page. Page changes are clamped to 1…totalPages in one place.
- Which pages to show: \`edges\` links pinned at each end, \`siblings\` either side of the current page, gaps between. If totalPages ≤ edges×2 + siblings×2 + 3, list every page. A gap that would hide exactly ONE page shows that page instead ("1 … 3" is no shorter than "1 2 3"). The window keeps its width near the ends. \`showEllipsis={false}\` lists every page and ignores \`edges\`.
- The page input is local while typing and commits on blur or Enter (a half-typed "12" never jumps to page 1); a non-number reverts; it resyncs when the page changes.
- \`reportTemplate\` rewrites the range line with \`{first}\`, \`{last}\`, \`{total}\`, \`{page}\`, \`{totalPages}\` (locale-formatted), e.g. "Showing {first} to {last} of {total}". rangeStart is 0 when there are no items.
- Changing the page size is the caller's job (usually also resetting to page 1).

## API
- \`totalItems\`, \`itemsPerPage\`, \`currentPage\`, \`onPageChange(page)\`, \`onItemsPerPageChange(size)\`; \`itemType\` ('rows'), \`variant\` ('bar' | 'pill' | 'floating'), \`navigation\` ('pages' | 'input'), \`siblings\` (1), \`edges\` (1), \`showEllipsis\` / \`showRange\` / \`showPageSize\` (true), \`pageSizes\` ([25, 50, 100, 250]), \`reportTemplate\`.
- Composable parts as static members, sharing state through context so they can be arranged freely: \`Pagination.Root\` (\`total\` items, \`itemsPerPage\`, \`page\`, \`onPageChange\`, \`siblings\`, \`edges\`, \`showEllipsis\`, \`shape: 'rounded' | 'pill'\`), \`.Content\` (a \`nav\` \`flex flex-wrap items-center gap-2\`), \`.First\` / \`.Prev\` / \`.Next\` / \`.Last\` (children replace the icon), \`.Pages\` (optional render prop per page), \`.Page\`, \`.Ellipsis\`, \`.Report\` (optional render prop over \`{ page, totalPages, total, rangeStart, rangeEnd }\`, or \`itemType\`). A part used outside Root throws an error naming the fix. Build the props-driven component FROM these parts so the two can never drift.

## Accessibility
- \`nav aria-label="Pagination"\` on Content; steppers labelled "First page", "Previous page", "Next page", "Last page"; each link \`aria-label="Page N"\` with \`aria-current="page"\` on the current one; the ellipsis is \`aria-hidden\`; the input is labelled "Page number".

## Demo
1,204 members, 25 per page, starting on page 3: a \`bar\` inside a bordered box, and a \`pill\` below it. Plus a composed layout: "← Newer" Prev, "Showing 31–40 of 480", the page links and "Older →" Next, spread with \`justify-between\`.`,

  'sortable-list': `Build a drag-to-reorder list component in React + TypeScript on the browser's native HTML5 drag-and-drop (no drag library), generic over the item type, where only an explicit grip starts a drag.

## Look
- Unstyled \`ul role="list"\` (\`className\` goes on it); each item is an \`li\` wrapping whatever \`renderItem\` returns. The row being dragged gets \`opacity-40\`.
- The caller draws the row and its grip. Typical row: an opaque card \`mb-1.5 flex items-center gap-2 px-3 py-2 text-xs\` with a "⠿" (or GripVertical) grip in slate-400, \`cursor-grab select-none\`.

## Behaviour
- Grip opt-in: \`renderItem\` receives \`handleProps\` (\`onPointerDown\`, \`onPointerUp\`) to spread on the grip. An \`li\` is \`draggable\` only while the pointer is down on its own grip — rows often contain inputs, and a fully draggable row swallows text selection.
- Live reordering: on \`dragenter\` over another row, move the dragged item to that row's index and call \`onReorder(next)\`. What you see mid-drag is what gets committed, so \`onReorder\` fires many times per drag — keep it a setState and persist from a separate Save.
- Cancel restores: remember the order at \`dragstart\`; \`drop\` marks the drag as landed; on \`dragend\` (which always fires), if nothing dropped (Escape, released outside a row) call \`onReorder\` with the original order.
- Groups: several lists can be on screen. Keep the in-flight drag \`{ group, id }\` in module scope (only one drag exists per document, and \`dataTransfer\` is unreadable during dragover). A list only accepts rows with its own \`group\`: \`dragover\` calls \`preventDefault()\` and sets \`dropEffect = 'move'\` for same-group drags only; cross-group drags are ignored rather than reparenting the row.
- \`dragstart\` must call \`dataTransfer.setData('text/plain', id)\` (Firefox won't start a drag otherwise) and set \`effectAllowed = 'move'\`.
- \`disabled\` stops any row becoming draggable.

## API
\`items: T[]\`, \`getId(item): string | number\`, \`onReorder(next: T[])\`, \`renderItem(item, { isDragging, handleProps })\`, \`group: string\`, \`disabled\` (false), \`className\`.

## Demo
Five teams — Engineering, Research, Design, Support, Operations — as small cards with a ⠿ grip, reordered by dragging the grip, in group "teams".`,

  'save-all-bar': `Build a floating "unsaved changes" bar component in React + TypeScript + Tailwind CSS for inline-edit tables: it shows how many rows are dirty and offers Save all / Discard.

## Look
- A centred pill that sticks to the bottom of its scroll area: \`sticky bottom-4 z-20 mx-auto w-fit flex items-center gap-3 pl-4 pr-2 py-2 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-xl\`.
- Left: "**3** unsaved changes" — \`text-xs\` slate-700 / dark slate-200, nowrap, count semibold, "change" singular at 1.
- Then a primary button made round (\`rounded-full px-4\`) with a 14px Save icon, "Save all" (reads "Saving…" while busy), and a ghost button (\`rounded-full px-3\`) with a 14px X icon, "Discard". Both disabled while busy.

## Behaviour
- Renders nothing when \`count\` is 0, so the caller can mount it unconditionally.
- \`onSaveAll\` may return a promise; the bar awaits it and tracks its own busy state (reset in \`finally\`), which blocks a double-click from firing two saves.
- An external \`saving\` flag is OR-ed with the internal one, for a caller that already tracks a save in flight (e.g. several tables saved together).

## API
\`count: number\`, \`onSaveAll(): void | Promise<void>\`, \`onDiscardAll(): void\`, \`saving?: boolean\` (default false).

## Demo
The bar with 3 unsaved changes; Save all and Discard both reset the count to 0, and a ghost "Dirty 3 rows again" button brings it back.`,
};
