/** AI prompts — see `./index.ts` for what a prompt is for. */

export const TABLE_B_PROMPTS: Record<string, string> = {
  'account-cell': `Build a two-line account identity table cell component in React + TypeScript + Tailwind CSS.

## Look
- It renders a fragment that goes INSIDE the caller's \`<td>\`. It has no padding of its own: row height belongs to the table (one table may use \`py-3\`, another \`py-2\`), not to the cell.
- Line 1, the username: \`font-mono leading-tight text-slate-800 dark:text-slate-100\`.
- Line 2, \`mt-1 text-[10px] leading-tight text-slate-400\`: the group (\`cluster\`) in \`font-semibold text-slate-600 dark:text-slate-300\`, then " · ", then the category (\`brand\`) in plain slate-400.
- Group first, category second. The group is what rows are sorted and followed up by, and the category only narrows things down inside it.

## Behaviour
- Either part of line 2 may be null or missing. Show only the parts that exist, with no separator left hanging. When both are missing, leave line 2 out.
- No state and no handlers, so no \`'use client'\`. It then renders in both server-rendered and client tables, and two tables can show the same column with exactly the same markup.

## API
- \`username: string\`, \`cluster?: string | null\`, \`brand?: string | null\`.

## Demo
A one-column "Person" table with three rows. Username is the email, cluster is the team, brand is the role: \`ada@example.com\` / **Engineering** · Administrator, \`grace@example.com\` / **Engineering** · Maintainer, \`alan@example.com\` / **Research** · Maintainer.`,

  'base-grid': `Build an Airtable / Lark-Base style data grid component in React + TypeScript + Tailwind CSS. It has a view bar (search, fields, filter, group, sort, conditional colour) over a spreadsheet-like table. The table has frozen columns, pinned rows, collapsible group bands, in-place cell editing, a record drawer with change history, and an optional board (kanban) mode. All of it is computed in the browser over the rows passed in. It is generic over the row type \`T\`.

## Layout
- Root \`flex min-h-0 flex-col\`. The view bar (\`flex flex-wrap items-center gap-1.5 pb-2\`) sits over a scroll box: \`min-h-0 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700\`, with \`maxHeight\` (default 520). The box is focusable (\`tabIndex=0\`, \`focus-visible:ring-2 ring-indigo-500/30\`), so the grid scrolls and the page does not.
- The table is \`table-fixed min-w-max\`, with a \`<colgroup>\` for a 64px index column, then each column at its width (default 160), then a 44px "+" column when fields can be added. Widths are fixed, so a long value is cut off with an ellipsis instead of reflowing the table. Cells are \`truncate px-3\` and right-aligned columns add \`tabular-nums\`.
- Table shell: \`w-full text-left text-xs\`. Header text is 10px semibold uppercase \`tracking-wider\` slate-600 (dark slate-300), \`whitespace-nowrap\`. Every \`th\` is \`sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200/80 dark:border-slate-700 py-2.5 leading-4\`. Put the border on the \`th\`, not the \`tr\`, or it scrolls away from the sticky header. The body is \`divide-y divide-slate-100 dark:divide-slate-800\` with slate-700 / dark slate-200 text, and rows are \`hover:bg-slate-50 dark:hover:bg-slate-800/60\`.

## View bar, left to right
- Search: \`h-8 w-48\` with a Search icon inside, and a clear × once there is text. It matches visible columns only, including option labels. Hidden columns are not searched, or a row would match on text nobody can see.
- Icon buttons, each opening an in-flow dropdown panel (z-50, opaque, p-3). A button is 32px square, rounded-lg, slate-500, with hover slate-100. While its panel is open or its setting is applied, it is tinted \`bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300\` and shows a count badge at the top-right: 14px indigo-600 pill, 9px white bold text, \`ring-2 ring-white dark:ring-slate-800\`.
  - **Fields** (SlidersHorizontal): a searchable column list. Each row has an eye toggle to show or hide the column and a grip to drag it into a new order. Click a name to rename or edit the field. "New field" sits in the footer. The primary column sits first with a lock. Changes apply live. Badge = hidden count.
  - **Filter** (Filter): \`[field] [operator] [value]\` rows, matching all or any, up to 20. Edits are a draft until Apply, and any other close reverts. Operators by kind: text/select → is, is not, contains, doesn't contain, is empty, is not empty. number → is, is not, >, ≥, <, ≤, empty. date → is, is before, is after, empty. checkbox → is.
  - **Group** (Group icon, tinted AMBER, not indigo; grid mode only): up to 3 levels, each with its own direction. Drag to reorder, then Apply.
  - **Sort** (ArrowUpDown): several levels. Direction is labelled by what it means: "A → Z", "0 → 9", "Old → New", "No → Yes". Apply.
  - **Colour** (PaintBucket): rules of the form \`[tone] [Cell | Row] [field] [operator] [value]\`. The first match wins for each target, so the rule order is the priority (drag to reorder). Apply.
- In board mode, a "Stack by" select replaces Group. When grouped, an expand/collapse-all button appears (FoldVertical / UnfoldVertical).
- At the right edge (\`ml-auto\`, 11px slate-500): "24 tasks", or "9 of 24 tasks" when filtered. Then a \`toolbarEnd\` slot.

## Columns and cells
- \`GridColumn<T>\` fields:
  - \`key\`, \`label\`
  - \`kind: 'text'|'number'|'date'|'select'|'bool'|'ref'\`, which sets the operators, sort, grouping, default cell and editor
  - \`type?\`: text, longtext, number, currency, date, checkbox, select, multiselect, user, url or email. It sets the header icon (Type, TextAlignStart, Hash, CircleDollarSign, Calendar, SquareCheck, CircleChevronDown, ListChecks, User, Link, Mail).
  - \`options?: {value,label,tone?}[]\`
  - \`value(row)\`
  - \`set?(row, v) => T\`
  - \`cell?(row)\`, \`width?\`, \`align?\`, \`sortable?\`, \`groupable?\`
- Default cells:
  - empty → "—" in slate-300
  - options → pills: \`rounded-full px-2.5 py-1 text-[11px] font-medium leading-none ring-1 ring-inset\`, e.g. \`bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900\`. An option with no tone takes a palette colour by its index. An unknown value shows raw, in slate.
  - currency → 2 decimals
  - url / email → indigo link
  - checkbox → emerald Check icon
  - date → "Sep 26, 2026" (a bare YYYY-MM-DD string is read as UTC)
  - number → \`toLocaleString\`
- A select column sorts and groups by OPTION ORDER, not alphabetically. Tones are sky, amber, slate, emerald, zinc, rose, violet, indigo, orange, yellow, lime, teal, cyan, blue, purple, fuchsia, pink.

## Headers
- Content: type icon (12px slate-400), label, a sort arrow (indigo-500) when sorted, and an amber Group icon when grouped by this column. Clicking the label cycles asc → desc → off. The column moves to the front of the sort levels, with at most 3 kept.
- A caret (ChevronDown) appears on hover or focus and opens a menu portalled to <body>: \`position: fixed\`, 208px wide, z-200. It is portalled because the header is sticky inside a scroller. Menu groups are split by hairlines, and an action that doesn't apply is left out:
  - Edit field · Hide field
  - Move left · Move right
  - Freeze up to this column · Freeze at start · Freeze at end · Unfreeze
  - Sort A → Z · Sort Z → A · Clear sort · Group by this field
- Resize grip: a 6px strip on the right edge (\`hover:bg-indigo-400/50\`, active indigo-500). Dragging resizes live (clamped to 60–800px) and commits once on release. Double-click resets the width. The grip is focusable, and ArrowLeft/Right change the width by ±16px.
- Drag a header to reorder it (every column except the primary). The dragged header goes to 40% opacity, and a 2px indigo inset bar marks the drop side (\`shadow-[inset_2px_0_0_0_#6366f1]\`). Dropping into the frozen block freezes the column, and dragging it out unfreezes it. Hidden columns keep their place in the order.
- A trailing "+" header (24px Plus button) opens the field editor: a name, a type list with icons, and coloured options for choice types, with Save and Cancel. "Edit field" also offers Delete, behind a confirm.

## Frozen columns and pinned rows
- The index column and the first (primary) column are always frozen. \`view.frozen\` freezes more: sticky \`left\` offsets are summed from column widths, on an OPAQUE \`bg-slate-50 dark:bg-slate-900\`, z-1 in the body and z-20 in the header. Row tints therefore don't reach frozen cells. The last frozen column draws \`border-r border-slate-200 shadow-[2px_0_4px_-2px_rgba(15,23,42,0.08)]\`. Columns frozen at the RIGHT edge (\`frozenEnd\`) sit last, with the border and shadow mirrored. The primary column cannot be hidden or moved.
- Index cell: the row number (11px tabular slate-400). On row hover it is replaced by 24px Pin and Open buttons (Maximize2, or ExternalLink when \`onRowOpen\` is set), with hover \`bg-indigo-50 text-indigo-600\`.
- Pinned rows leave the body and sit just under the header, each sticky at a \`top\` measured from the header and the pinned rows above it (re-measured with a ResizeObserver, because row height varies). A pinned row shows a small indigo Pin icon. The last pinned row gets \`shadow-[inset_0_-2px_0_0_#c7d2fe]\` on its cells, because a border doesn't travel with sticky cells. Pinned rows still obey the search and the filter.

## Grouping and colour
- Group bands: a full-width \`<tr>\` in \`bg-slate-50/80 dark:bg-slate-800/40\`. A chevron sits in a fixed 20px slot, then the label indented 18px per depth, then the real count ("5 tasks", 11px slate-400). The label is \`sticky left-0\` so it stays visible when you scroll sideways. Only the chevron toggles. Empty values group as "No <label>", and checkboxes group as Checked / Unchecked. Group levels order the rows first, and the sorts order rows within each band.
- Row tints are weak and translucent (\`bg-rose-50/60 dark:bg-rose-950/20\`). Cell tints are stronger (\`bg-rose-100/70 dark:bg-rose-950/40\`). Filter and colour rules share one predicate evaluator, so they cannot disagree about what "contains" means.

## Editing (only with \`onRowChange\` and the column's \`set\`)
- Click selects a cell (\`ring-2 ring-inset ring-indigo-500\`, \`cursor-cell\`). With \`editOn='click'\` (the default) the click also opens the editor. With \`'doubleClick'\`, only a double-click does.
- Keys on the focused grid: arrows and Tab move the selection. Enter or F2 edits. A printable key opens a text or number editor seeded with that character. Space toggles a checkbox. Delete / Backspace clears the cell. Escape deselects.
- A checkbox toggles without an editor. Text, number and date use a bare input inside the cell, so nothing moves when it opens. Opened by a click, the caret goes to the end. Opened by Enter or F2, the whole value is selected. Enter or blur commits, Escape cancels, and focus goes back to the grid.
- Select: the cell turns into a chip box (a pill with × for each pick, and a ChevronUp). Under it, a list portalled to <body> opens at the cell's width, with a "Select an option" search and option pills, a check marking each picked one. A single select commits on the pick. A multi-select toggles, then commits when the list closes. Enter picks the first match, and Backspace in an empty search removes the last chip.
- Clicks on links or buttons inside a cell are not edits. The grid never mutates rows: it calls \`onRowChange(next, prev)\`. Each real change is logged as \`{id, rowId, field, label, from, to, at, by}\`.

## Record drawer (when \`onRowOpen\` is absent)
- Panel: 560px right-side panel, resizable from its left edge, with no backdrop. Title = the primary value, subtitle = the noun. Tabs: Details / History (with a count badge) / Log.
- Details: one line per field. A 9.5rem label column shows the type icon and name, then comes an editor that commits on blur, Enter or pick; there is no Save. The editors are: a combobox with pills and a searchable portalled list (multi adds Clear / Done), a switch for checkboxes (\`h-5 w-9\`, indigo-600 when on), and a textarea for longtext. Hidden columns appear under the heading "Hidden in this view".
- History: a \`border-l\` timeline. Each entry has a 20px indigo-100 initials circle and reads "**Grace Hopper** changed **Status** 2h ago", then the old value struck through → the new value, both drawn like cells.
- Log: a When / Field / From / To / By table.

## Board mode (\`view.mode='board'\`)
- One lane per option of a single-select or person column (\`boardBy\`), plus a "No <label>" lane when needed. Lane: \`w-72 rounded-xl bg-slate-100/70 dark:bg-slate-800/40\`, with a header pill and a count.
- Card: \`rounded-lg border bg-white p-2.5 shadow-sm\` (dark slate-900). It shows the primary value, then up to four more fields as 11px label/value rows, and takes the row tint.
- Dragging a card to another lane is an edit made through \`set\`, and is logged. The lane under the drag gets \`ring-2 ring-indigo-400\`. An empty lane shows a dashed "Drop a task here".
- Search, filter and sort apply to the board, but grouping does not.
- Empty states: "No tasks" (with a hint when filtered). Board mode with no single-select column: "Nothing to stack by".

## API
- Props:
  - \`columns\`, \`rows\`, \`getRowId\`
  - \`view\` / \`onViewChange\`: controlled view, or leave both out and pass \`defaultView\`
  - \`search=true\`, \`onRowOpen(row, rect)\`, \`onRowChange\`, \`editOn\`
  - \`onFieldAdd\`, \`onFieldChange\`, \`onFieldDelete\`
  - \`history\` / \`onHistoryAdd\`: controlled, or kept internally
  - \`actor='You'\`, \`toolbarEnd\`, \`noun='record'\`, \`maxHeight=520\`, \`className\`
- \`GridView\`: \`{ mode?, boardBy?, conditions, match, groups, sorts, colors, fields?: {order, hidden, labels}, frozen?, frozenEnd?, pinnedRows?, widths? }\`.
- Also export \`columnFromField(def, {get, set})\`. It builds a column from a field definition. Default widths: checkbox 90, number/currency 110 (right-aligned), date 120, longtext 260, anything else 160. Number, date and longtext columns are not groupable.

## Demo
A task tracker. Columns: Task (280px, primary), Status (To do / In progress / In review / Done in slate / sky / amber / emerald), Priority (Low … Urgent), Team, Owner, Tags (multi), Estimate (number), Due (date), Billable (checkbox). Every column has \`set\`, and rows are kept in state.`,

  'base-table': `Build a saved-views data table component in React + TypeScript + Tailwind CSS: a bar of view tabs above an Airtable-style grid. Each tab is a saved view, shown as either a grid or a board.

## Structure
- A view tab bar with \`mb-3\`, then the grid showing the active view. Build these two as separate components:
  - **View tabs**: one tab per view with its mode icon (Table2 for a grid, SquareKanban for a board). Active tab: white background, indigo text and an indigo underline. It has a caret menu (Rename, Duplicate, Delete view), double-click to rename in place, drag to reorder, and "+" to add a grid or a board.
  - **Grid**: generic over the row type. A view bar (search, Fields, Filter, Group, Sort, conditional Colour) over a sticky-header table. The table has frozen columns, pinned rows, collapsible group bands, resizable and draggable headers, in-place cell editing, a record drawer with History and Log tabs, and a board mode with lanes. Its whole configuration is one controlled object, \`GridView\`: \`{ mode?: 'grid'|'board', boardBy?, conditions, match: 'all'|'any', groups, sorts, colors, fields?: {order, hidden, labels}, frozen?, frozenEnd?, pinnedRows?, widths? }\`.

## Behaviour
- \`SavedView = { id, name, view: GridView }\`. The default is a single view named "Grid" with an empty view.
- The active view's \`GridView\` is passed to the grid as controlled state. Every grid change (a filter, a column width, a pinned row) is written back into that view only.
- Create: a new id, named "Grid" or "Board" after the mode. If the name is taken, it gets a number: "Grid 2", "Grid 3". The new tab becomes active and opens straight into rename.
- Duplicate: a deep clone of the view, named "<name> copy" (numbered the same way), inserted right after the source and made active.
- Delete: never the last view. Deleting the active view activates the one before it.
- Rename and reorder come back from the tab bar.
- Controlled when \`views\` and \`onViewsChange\` are both passed, so the caller can store views on a server, per user or shared. Otherwise the views are kept internally and, with \`storageKey\`, saved to localStorage as \`{ views, active }\` (including which tab is active). Read storage once after mount, never during render, to avoid a hydration mismatch. Wrap reads and writes in try/catch: if storage is blocked or corrupt, the defaults are used.

## API
- \`columns\`, \`rows\`, \`getRowId\`, \`onRowChange(next, prev)\`, \`editOn?: 'click'|'doubleClick'\`
- \`onFieldAdd\`, \`onFieldChange\`, \`onFieldDelete\`
- \`views\`, \`onViewsChange\`, \`defaultViews\`, \`storageKey\`
- \`history\`, \`onHistoryAdd\`, \`actor\`, \`noun\`, \`toolbarEnd\`, \`maxHeight\`, \`className\`
- Everything except the views is passed straight to the grid.

## Demo
A task tracker (Task, Status, Priority, Team, Owner, Tags, Estimate, Due, Billable) with three starting views:
- "All tasks": empty view.
- "Open by team": Status is not Done, grouped by Team, sorted by Due ascending, Urgent rows tinted rose, two frozen columns.
- "Status board": a board stacked by Status, sorted by Priority descending.

Rows and history are kept in state, and views persist under one storage key.`,

  'view-tabs': `Build a saved-views tab bar component in React + TypeScript + Tailwind CSS, for use above a data table. Each tab has a mode icon, a caret menu, rename in place, drag to reorder, and a "+" that adds a grid or a board view.

## Look
- Root: \`flex min-w-0 items-end gap-1 border-b border-slate-200 dark:border-slate-700\`.
- Tab strip: \`role="tablist"\`, \`-mb-px flex min-w-0 items-end gap-0.5 overflow-x-auto overflow-y-hidden\`, with a thin scrollbar.
  - It scrolls sideways ONLY. \`overflow-x: auto\` alone makes the other axis auto too, and the 1px underline would then add a vertical scrollbar.
  - \`-mb-px\` lets the active underline sit ON the bar's border line.
- Tab: \`relative flex shrink-0 items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs\`.
  - Active: \`bg-white font-medium text-indigo-600 dark:bg-slate-900 dark:text-indigo-300\`, plus an underline \`absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-indigo-500\`.
  - Inactive: \`text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800\`.
- Mode icon (14px): Table2 for grid, SquareKanban for board. indigo-500 on the active tab, slate-400 otherwise.
- Name button: \`max-w-[12rem] truncate\`, with the title "<name> — double-click to rename".
- Caret button: ChevronDown 12px, \`rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600\`. Always visible on the active tab. On other tabs it shows only on tab hover or keyboard focus.
- "+" after the strip: 28px square, \`mb-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600\` (dark hover slate-800 / indigo-300).
- Rename input: \`w-28 rounded border border-indigo-300 bg-white px-1 py-0.5 text-xs\`, dark \`border-indigo-500/50 bg-slate-900\`.
- Menus: 192px wide, opaque, p-1. Items are \`flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-40\` with 14px slate-400 icons.
  - Tab menu: Rename (Pencil), Duplicate (Copy), a divider, then "Delete view" (Trash2) in rose-600 / dark rose-400. Delete is disabled on the last view, with the title "A table always keeps one view".
  - "+" menu: a "New view" heading (10px semibold uppercase slate-400), then "Grid view" and "Board view".

## Behaviour
- Holds no view data. The caller owns the list and every change comes back through a callback. The only local state is which tab is being renamed, the open menu, and the drag.
- Double-click a name, or choose Rename, to edit it in place. The input is focused with its text selected. Enter or blur keeps the trimmed name (ignored if empty or unchanged). Escape abandons the edit.
- \`onCreate(mode)\` returns the new view's id, and that tab opens straight into rename. If \`modes\` has a single entry, "+" creates that mode directly with no menu.
- Drag a tab to reorder it (HTML5 drag and drop; no dragging while renaming). The dragged tab goes to 40% opacity. The hovered tab shows a 2px indigo inset bar on the half the pointer is over (\`shadow-[inset_2px_0_0_0_#6366f1]\` / \`shadow-[inset_-2px_0_0_0_#6366f1]\`). On drop, call \`onReorder(ids)\`.
- Menus are portalled to <body> with \`position: fixed\`, 4px below the trigger, and their left edge clamped to [8, viewportWidth − 200]. They are portalled because the strip scrolls sideways and would clip an in-flow menu.
- Each action shows only when its callback is passed.

## API
- \`type ViewMode = 'grid' | 'board'\`
- \`type ViewTab = { id, name, mode }\`
- Props:
  - \`views\`, \`activeId\`, \`onSelect\`
  - \`onCreate?: (mode) => string | void\`
  - \`onRename?\`, \`onDuplicate?\`, \`onDelete?\`, \`onReorder?(ids)\`
  - \`modes = ['grid','board']\`, \`className\`

## Accessibility
- Name buttons are \`role="tab"\` with \`aria-selected\`, and the strip has \`aria-label="Views"\`.
- Caret button: \`aria-label="<name> view options"\`. Add button: "Add view". Rename input: "View name".
- Menus use \`role="menu"\` with \`menuitem\` items.

## Demo
Three views: "All tasks" (grid), "My open work" (grid) and "Status board" (board). All callbacks are wired to local state.`,

  'group-band-row': `Build a collapsible group header row (a "group band") component for HTML tables in React + TypeScript + Tailwind CSS.

## Look
- One \`<tr>\` in \`bg-slate-50/80 dark:bg-slate-800/40\`, containing a single \`<td colSpan={columnCount}>\` with its padding removed (\`!p-0\`).
- Inside: a flex row whose content span is \`sticky left-0 flex items-stretch pl-3 text-xs font-medium text-slate-700 dark:text-slate-200\`. The band spans the whole table, so without this its label would sit at the TABLE's left edge and scroll out of view when the table scrolls sideways. \`sticky left-0\` keeps it at the left of the scroll box.
- A fixed 20px chevron slot (\`w-5 py-1.5\`, centred) that is never indented, so the chevron lines up with the row numbers below at every depth. Only the label indents.
  - Chevron button: \`rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300\`.
  - Icon: 14px ChevronDown when open, ChevronRight when collapsed.
- The label span has \`padding-left: depth × 18px\`, \`py-1.5 pr-4\` and \`gap-1.5\`. After the label comes the count in \`text-[11px] font-normal text-slate-400 whitespace-nowrap\`: "3 tasks", or "1 task" (a plain "s" plural of \`noun\`).

## Behaviour
- Only the chevron toggles, not the whole band. With the whole band clickable, a click meant for the edge of a row, or a drag to select the group name, would fold the group. The chevron is a real \`<button>\`, so Enter and Space work.
- Nesting is flat. The caller emits bands between the rows they head, each with a depth, and never nests \`<tbody>\` elements.
- \`count\` is the group's REAL size (every row under it), not only the rows on screen.

## API
- Props: \`label: string\`, \`count: number\`, \`depth = 0\`, \`collapsed: boolean\`, \`onToggle()\`, \`columnCount: number\`, \`noun = 'record'\`.
- Export \`INDENT_STEP = 18\`.

## Accessibility
- \`aria-expanded={!collapsed}\` on the chevron.
- \`aria-label\`: "Collapse Engineering" / "Expand Engineering".

## Demo
A Task / Owner / Status table with two bands, "Engineering" (3 tasks) and "Design" (2 tasks). Each band toggles its own rows, and Status is shown as coloured pills.

Table shell for the demo: \`text-xs\` text, 10px uppercase semibold slate-600 headers on \`bg-slate-50/95\`, and \`divide-y divide-slate-100 dark:divide-slate-800\` rows.`,

  'pivot-table': `Build a spreadsheet-style pivot table component in React + TypeScript + Tailwind CSS. It is a toolbar plus a scrollable pivot grid, with the field list in a slide-over panel on the right edge. The panel has Filters, Columns, Rows and Data zones you drag fields into.

## Toolbar
- \`mb-2 flex flex-wrap items-center gap-1\`. Buttons are \`h-8 gap-1.5 rounded-lg px-2.5 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-40\` with 14px icons:
  - "Collapse all" / "Expand all" (FoldVertical / UnfoldVertical), disabled when there are no collapsible groups.
  - "Swap" (ArrowLeftRight), which exchanges the row fields and the column fields.
  - "Export CSV" (Download).
- Then "342 of 360 records" (\`ml-auto\`, 11px slate-500).
- Then a "Pivot settings" toggle (SlidersHorizontal). While the panel is open it shows \`bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200\`, with \`aria-pressed\` set.

## Table
- Scroll box: \`overflow-auto rounded-xl border border-slate-200 dark:border-slate-700\`, \`maxHeight\` (default 520). While recalculating it is dimmed to \`opacity-60\` (150ms transition) with \`aria-busy\`. Nothing inside the box opens a popover, which is why it is safe for it to scroll.
- \`<table class="min-w-max border-separate border-spacing-0 text-xs">\`: \`separate\`, so borders stay on sticky cells. \`thead\` is \`sticky top-0 z-10\`.
- Header cell: \`border-b border-r border-slate-200 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200\`. Column-group labels are centred and nowrap. Subtotal and grand-total headers use \`bg-slate-100 dark:bg-slate-800\`.
- Corner cell (\`sticky left-0 z-20 min-w-48 align-bottom\`, spanning the column header rows): the row fields joined with " › " ("REGION › COUNTRY", 10px uppercase tracking-wider slate-500). With exactly one measure, a second 11px line names it, e.g. "Sum of Revenue".
- Column headers: one header row per column field, nested with colSpans.
  - After each outer group comes a "<label> total" subtotal column (when \`columnSubtotals\` is on and there is more than one column field).
  - "Grand total" comes last. With no column fields there is a single "Total" column.
  - With several measures, an extra header row names each measure under each column: right-aligned, font-medium, e.g. "Sum of Units".
- Rows use the COMPACT layout: one sticky row-header column (\`<th scope="row">\`, \`sticky left-0 z-[1] border-b border-r border-slate-200 px-3 py-1.5\`), indented 12px + 16px per depth.
  - Group rows (every level but the last) are font-semibold on an opaque \`bg-slate-50 dark:bg-slate-900\` header. They carry the group's own subtotal and a collapse chevron (14px, \`rounded p-0.5 text-slate-400 hover:bg-slate-200\`), so collapsing a group keeps its total in view.
  - Leaf rows have a \`bg-white dark:bg-slate-800\` header with an 18px spacer where the chevron would be.
- Value cells: \`whitespace-nowrap border-b border-r border-slate-100 px-3 py-1.5 text-right tabular-nums dark:border-slate-800\`. Subtotal and grand columns add \`bg-slate-50/70 dark:bg-slate-900/60 font-semibold\`. Row hover: \`bg-indigo-50/40 dark:bg-indigo-500/5\`.
- Grand total row: \`sticky bottom-0\`, \`border-t-2 border-slate-300 bg-slate-100 py-2 font-semibold\` (dark slate-600 / slate-800). Its header cell sticks both left and bottom (z-[2]).
- A missing value reads "(blank)", in italic slate-400, and blanks group together.
- No matches: "No records match the filters." centred, py-16, slate-400.

## Aggregation
- Every subtotal and total is aggregated from the RECORDS, never summed from cells, so averages and distinct counts are right at every level.
- Aggregations: Sum, Count, Average, Min, Max, Distinct count. Non-number fields offer only Count and Distinct count. With no measures, the cells show an implicit "Count of records".
- Counts are whole numbers with \`toLocaleString\`. Other values use the field's \`format\`, or \`toLocaleString\` with at most 2 decimals.
- Group labels sort ascending by default, with a per-field toggle. Use a numeric, case-insensitive collator, so "Q10" sorts after "Q2".
- Value filters are stored as EXCLUDED values per field, so a value that first appears in new data is shown rather than silently hidden.

## Settings panel
- A slide-over panel on the right edge: 380px (at most half the viewport), resizable, with NO backdrop, so the table stays readable and scrollable while you re-pivot. Title "Pivot settings", subtitle "Drag fields between the areas". \`fieldList\` opens it on first render.
- Field list:
  - Starts with a "COLUMNS" section title, then a "Search fields" input, then a scrolling list (max-h-72) of every field.
  - Each field row has a checkbox (\`accent-indigo-600\`), an icon (Hash for number fields, Type otherwise), the label, an indigo funnel when the field is filtered, and a grip that appears on hover.
  - Ticking adds the field: a number goes to Data as Sum, anything else goes to Rows. Unticking removes it from every zone. Rows are draggable.
- Four zones, STACKED at full width. Not a 2×2 grid: a chip needs the width for its name and controls.
  - Filters (Filter): narrows every cell without grouping by the field.
  - Columns (Columns3)
  - Rows (Rows3)
  - Data (Sigma)
- Zone: \`min-h-[4.25rem] rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-1.5\` (dark \`border-slate-600 bg-slate-800/40\`). While dragging over it: \`border-indigo-400 bg-indigo-50/60\`. The title is 10px uppercase with its icon, and the zone's purpose is a tooltip. An empty zone shows "Drop here".
- Chip: \`rounded-md border border-slate-200 bg-white px-1.5 py-1 text-[11px] shadow-sm cursor-grab\` with a grip icon. Contents by zone:
  - Data chips: a borderless inline \`<select>\` for the aggregation (indigo-600, medium), then "of", then the field name.
  - Rows and Columns chips: a sort toggle (ArrowDownAZ / ArrowUpZA).
  - Every chip outside Data: a funnel button, indigo while it is excluding values.
  - Every chip: an × to remove it (hover rose-600).
- Drag and drop:
  - The insertion index comes from the pointer position against each chip's vertical midpoint, shown as a 2px indigo line.
  - A field can be in only one of Rows, Columns and Filters at a time, so placing it removes it from the others.
  - Moving a chip within Data keeps its aggregation. The dragged chip goes to 40% opacity.
- Value filter: a funnel opens a 240px popover, portalled to <body> and fixed (max-h-80), that flips above its trigger when there is no room below. It has:
  - a header with the field name and "5 of 7"
  - a "Search values" input
  - a checklist where ticked means kept
  - "Select all" and "Clear" ghost buttons, which act only on the values matching the search
  - Changes apply as you tick, with no Apply step.

## Performance
- The panel reads the live config, and the table reads a deferred copy (\`useDeferredValue\`), so a tick or a drop answers on the next frame while the table catches up, dimmed.
- Split the work into two memos:
  - the aggregation pass, keyed on the CONTENTS of the grouping fields, measured fields and exclusions
  - finalizing (sort order, switching Sum to Average), which reuses that pass
- Memoize the table markup itself.
- Past 60 body rows, window the rows: draw only those in view plus 8 extra above and below, with spacer rows standing in for the rest. Measure the row height from a real row, since the table's row height can change.

## CSV export
- Exports the visible rows: collapsed groups stay collapsed, and labels are indented two spaces per level.
- Header names look like "Q1 › Sum of Revenue". The Grand total row is included.
- The file is named from a slug of \`title\`, e.g. \`sales.csv\`.

## API
- \`PivotField = { key, label, kind?: 'text'|'number'|'date', format?: (n) => string }\`
- \`PivotConfig = { rows: string[], columns: string[], values: {field, agg}[], filters: string[], exclude: Record<string, string[]>, sort: Record<string, 'asc'|'desc'> }\`
- Props:
  - \`data: Record<string, unknown>[]\`, \`fields\`
  - \`config\` / \`onConfigChange\`: controlled, or pass \`defaultConfig\` instead
  - \`columnSubtotals = true\`, \`fieldList = false\`, \`maxHeight = 520\`, \`title\`, \`className\`
- Also export the field list on its own (with a \`bare\` flag that drops its card frame) for use in a sidebar.

## Demo
360 sales records with these fields: Region, Country, Sales rep, Category, Product, Channel, Quarter, Month, Units, Revenue and Cost (the last two formatted as whole dollars). Regions are Europe (Germany, France, Spain), Americas (United States, Brazil) and Asia-Pacific (Japan, Australia). Starting config:
- rows: Region › Country
- columns: Quarter
- values: Sum of Revenue and Sum of Units
- Channel in Filters, with Partner excluded`,
};
