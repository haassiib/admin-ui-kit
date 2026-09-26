/** AI prompts — see `./index.ts` for what a prompt is for. */

export const FORM_B_PROMPTS: Record<string, string> = {
  'group-panel': `Build a multi-level "Group by" toolbar popover component (Airtable / Lark Base style) in React + TypeScript + Tailwind CSS.

## Look
- Trigger: a 32px icon-only button (\`h-8 w-8 rounded-lg\`) with the lucide \`Group\` icon at 16px. Idle: \`text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-100\`. While open OR while any level is set it is tinted AMBER — \`bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300\` (amber means "rearranges the same rows", as opposed to indigo for controls that narrow them).
- Count badge on the trigger when grouped: \`absolute -right-0.5 -top-0.5 h-3.5 min-w-3.5 rounded-full bg-indigo-600 px-1 text-[9px] font-semibold leading-none text-white ring-2 ring-white dark:ring-slate-800\`, showing the number of levels.
- Panel: in-flow, \`absolute left-0 top-full mt-1 z-50\`, width from a prop (default 420px) capped at \`max-w-[calc(100vw-2rem)]\`, opaque floating surface with \`p-3\`. Enters with a scale-in from the top-left: 0.22s \`cubic-bezier(0.34, 1.56, 0.64, 1)\`, from opacity 0 / scale 0.96 / translateY 6px.
- Heading: the \`title\` in 12px semibold slate-700 (dark slate-200), \`mb-2\`.
- Empty state: a strip \`rounded-lg bg-slate-50 px-3 py-4 text-center text-xs text-slate-400 dark:bg-slate-900/40\` reading "Not grouped. Rows appear in sort order."
- Each level is a row, \`flex items-center gap-1.5\`, rows \`space-y-1.5\`:
  1. Drag grip (lucide \`GripVertical\`, 14px): \`rounded p-1 text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-300 cursor-grab active:cursor-grabbing touch-none\`.
  2. Connector word, \`w-8 text-right text-[11px] text-slate-400\`: "By" on the first row, "then" on the rest.
  3. A native \`<select>\` of fields (text-input recipe, \`py-1.5\`, \`flex-1 min-w-0\`).
  4. A two-segment direction control: \`rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden\`, segments "A → Z" / "Z → A" at \`px-2 py-1 text-[11px] font-medium\`; inactive \`text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700\`, active \`bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300\`.
  5. Remove ×: \`rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-700\`.
- Footer: \`mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2\`: an amber text button "+ Add a level" (\`px-2 py-1 text-xs font-medium text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40\`, disabled at 40% opacity); at the limit, a small ⓘ info tooltip "3 levels is the limit."; a ghost "Ungroup" pushed right with \`ml-auto\` when any level exists; and, only with \`requireApply\`, a primary "Apply" with its OWN \`ml-auto\` so it hugs the right edge whether or not Ungroup is shown.

## Behaviour
- Commits IMMEDIATELY by default: every add, remove, field change, direction change or reorder calls \`onChange\`. No Apply button.
- \`requireApply\`: edits go to a local draft; Apply commits and closes; closing any other way (outside click, Escape, trigger click) discards the draft. Re-sync the draft whenever \`levels\` changes from outside. Use one "effective list + commit function" pair so both modes share a code path.
- No duplicate fields: each row's select offers its own field plus the fields no other level uses. "Add a level" appends the first unused field, ascending; disabled at \`maxLevels\` (default 3) or when nothing is unused.
- Reorder by drag using native HTML5 drag-and-drop: a row becomes \`draggable\` only while the pointer is down on its grip (so the select stays usable). Rows reorder live as the dragged row enters another; the dragged row is \`opacity-40\` with \`bg-slate-100 dark:bg-slate-700\`. A drag that ends without a drop (Escape, released outside) restores the order from before it started.
- The trigger's label reflects the COMMITTED levels, never an open draft: "Grouped by team, then status" (labels lower-cased), or "Group".

## API
- Generic over the field id: \`GroupPanel<TBy extends string>\`. \`type GroupLevel<TBy> = { by: TBy; dir: 'asc' | 'desc' }\`.
- \`levels: GroupLevel[]\`, \`onChange(levels)\`, \`options: readonly TBy[]\` (every groupable field), \`labelOf(by) => string\`, \`maxLevels = 3\`, \`title = 'Group by'\`, \`width = 420\`, \`requireApply = false\`, \`className\`.

## Accessibility
- Trigger has \`aria-expanded\` and \`aria-label\`/\`title\` set to the "Grouped by …" sentence. Grip: "Drag to reorder this grouping level". Remove: "Remove this grouping level".

## Demo
A task table's toolbar: groupable fields Status, Priority, Team, Owner, Tags, Billable; start grouped by Team ascending, and print the current levels as JSON below.`,

  'sort-panel': `Build a multi-level "Sort by" toolbar popover component (Lark Base / Airtable style) in React + TypeScript + Tailwind CSS.

## Look
- Trigger: a 32px icon-only button (\`h-8 w-8 rounded-lg\`) with the lucide \`ArrowUpDown\` icon at 16px. Idle: \`text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-100\`. While open OR while any sort is applied, tinted indigo: \`bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300\`.
- Count badge when sorted: \`absolute -right-0.5 -top-0.5 h-3.5 min-w-3.5 rounded-full bg-indigo-600 px-1 text-[9px] font-semibold leading-none text-white ring-2 ring-white dark:ring-slate-800\`, showing the number of levels.
- Panel: in-flow, \`absolute left-0 top-full mt-1 z-50\`, width from a prop (default 420px) capped at \`max-w-[calc(100vw-2rem)]\`, opaque floating surface with \`p-3\`, entering with a scale-in from the top-left (0.22s \`cubic-bezier(0.34, 1.56, 0.64, 1)\`, from opacity 0 / scale 0.96 / translateY 6px).
- Heading: \`title\` in 12px semibold slate-700 (dark slate-200), \`mb-2\`.
- Empty state strip: \`rounded-lg bg-slate-50 px-3 py-4 text-center text-xs text-slate-400 dark:bg-slate-900/40\` — "Not sorted. Rows appear in the order they arrived."
- Level rows, \`flex items-center gap-1.5\`, stacked \`space-y-1.5\`: a drag grip (lucide \`GripVertical\` 14px, \`rounded p-1 text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-300 cursor-grab touch-none\`); the connector word "By" (first row) or "then" in \`w-8 text-right text-[11px] text-slate-400\`; a native column \`<select>\` (text-input recipe, \`py-1.5 flex-1 min-w-0\`); a two-segment direction control (\`rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden\`, segments \`px-2 py-1 text-[11px] font-medium\`, inactive \`text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700\`, active \`bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300\`); a remove × (\`rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-700\`).
- Footer: \`mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2\` — indigo text button "+ Add a level" (\`px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40\`, 40% opacity when disabled); at the limit an ⓘ info tooltip "3 levels is the limit."; a ghost "Clear sort" (\`ml-auto\`) when any level exists; a primary "Apply" (\`ml-auto\`) always.

## Behaviour
- The direction labels say what they MEAN, from the column's \`kind\`: text "A → Z" / "Z → A", number "0 → 9" / "9 → 0", date "Old → New" / "New → Old", boolean "No → Yes" / "Yes → No". Never "asc/desc". Missing kind = text.
- Works on a DRAFT. Nothing reaches \`onChange\` until Apply (which then closes). Closing any other way — outside click, Escape, clicking the trigger — reverts the draft. Re-sync the draft when \`sorts\` changes from outside.
- A column can be used once: each row's select lists its own column plus unused ones. "Add a level" appends the first unused column ascending; disabled at 3 levels or when none are unused. "Clear sort" empties the draft (still needs Apply).
- Level order is the meaning (status-then-date ≠ date-then-status), so rows reorder by native HTML5 drag: a row is \`draggable\` only while the pointer is down on its grip; rows reorder live as the dragged one enters another; the dragged row is \`opacity-40\` with \`bg-slate-100 dark:bg-slate-700\`; a drag that ends without a drop restores the previous order.
- The trigger's label uses the committed sorts: "Sorted by Due, then Task", or "Sort".

## API
- \`type SortLevel = { key: string; dir: 'asc' | 'desc' }\`; \`type SortableColumn = { key: string; label: string; kind?: 'text' | 'number' | 'date' | 'boolean' }\`.
- Props: \`sorts: SortLevel[]\`, \`columns: SortableColumn[]\`, \`onChange(sorts)\`, \`title = 'Sort by'\`, \`width = 420\`, \`className\`.

## Accessibility
- Trigger: \`aria-expanded\`, \`aria-label\`/\`title\` = the "Sorted by …" sentence. Grip: "Drag to reorder this sort level". Remove: "Remove this sort level".

## Demo
Columns Task (text), Estimate (number), Due (date), Billable (boolean); start sorted by Due, Old → New; show the applied levels as JSON beneath.`,

  'fields-panel': `Build a "Fields" (column visibility and order) toolbar popover component, Lark Base style, in React + TypeScript + Tailwind CSS.

## Look
- Trigger: a 32px icon-only button (\`h-8 w-8 rounded-lg\`), lucide \`SlidersHorizontal\` at 16px. Idle \`text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-100\`; tinted \`bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300\` while open or while any column is hidden. A count badge of HIDDEN columns: \`absolute -right-0.5 -top-0.5 h-3.5 min-w-3.5 rounded-full bg-indigo-600 px-1 text-[9px] font-semibold text-white ring-2 ring-white dark:ring-slate-800\`.
- Panel: \`absolute left-0 top-full mt-1 z-50\`, width prop (default 320px), \`max-w-[calc(100vw-2rem)]\`, \`max-h-[min(36rem,80vh)]\`, opaque floating surface with NO padding, \`flex flex-col overflow-hidden\`, scale-in from the top-left (0.22s \`cubic-bezier(0.34, 1.56, 0.64, 1)\`, from opacity 0 / scale 0.96 / translateY 6px).
- Top (\`p-2\`, fixed): a search input with a 14px \`Search\` icon inset left (\`pl-8 py-1.5\`), placeholder "Search columns", autofocused.
- Middle: the only scrolling part (\`min-h-0 flex-1 overflow-y-auto px-2 pb-1\`). Row: \`relative flex items-center gap-2 rounded-lg py-1.5 pl-6 pr-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60\`:
  - A grip (\`GripVertical\` 14px) absolutely placed in the left gutter (\`left-0.5\`, vertically centred), \`text-slate-300 dark:text-slate-600\`, INVISIBLE until the row is hovered (\`opacity-0 group-hover:opacity-100\`).
  - A 16px field-type icon, slate-400 (slate-300 / dark slate-600 when hidden). Icons: text \`Type\`, long text \`TextAlignStart\`, number \`Hash\`, currency \`CircleDollarSign\`, date \`Calendar\`, checkbox \`SquareCheck\`, single select \`CircleChevronDown\`, multi select \`ListChecks\`, person \`User\`, URL \`Link\`, email \`Mail\`.
  - The name as a text button (truncates), 12px slate-700 / dark slate-200, or slate-400 / dark slate-500 when hidden; \`hover:text-indigo-600 dark:hover:text-indigo-300\` when editable. A 12px \`Lock\` (slate-300) follows it for a locked or fixed column.
  - At the right (\`ml-auto\`), an eye toggle \`rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-700\`: shown = \`Eye\` in indigo-500 / dark indigo-400; hidden = \`EyeOff\` in slate-300 / dark slate-600; locked = disabled, \`text-indigo-200 dark:text-indigo-500/40\`, \`cursor-not-allowed\`.
- Locked (primary) columns sit first, not draggable, separated from the rest by a \`my-1 border-t border-slate-100 dark:border-slate-700\` divider.
- Footer (fixed, \`border-t border-slate-100 dark:border-slate-700 px-2 py-1.5\`): "+ New field" indigo text button (\`px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/40\`, 16px Plus) when \`onNewField\` is given; a ghost "Show all" on the right when anything is hidden.

## Behaviour
- COMMITS IMMEDIATELY — an eye click or a drag calls \`onChange\` with the new layout. No draft, no Apply.
- The layout is overrides on the caller's column array: \`type FieldLayout = { order: string[]; hidden: string[]; labels: Record<string, string> }\`, empty meaning "as declared". Also export \`EMPTY_LAYOUT\` and \`arrangeColumns(columns, layout)\`: locked columns first, then the keys \`order\` names, then any it does not mention in declared order; unknown keys are dropped. A column's shown name is \`layout.labels[key] || label\`.
- Search filters by the shown name (case-insensitive). Dragging is OFF while filtering (rows render plainly), since a drop in a filtered list has no honest position in the full one. No hits: "No column matches “query”." centred, 12px slate-400. Closing the panel clears the query.
- Reorder by native HTML5 drag: a row is draggable only while the pointer is down on its grip; rows reorder live; dragged row \`opacity-40\` + \`bg-slate-100 dark:bg-slate-700\`; a drag ended without a drop reverts.
- Clicking a name calls \`onEdit(key, panelRect)\` and "New field" calls \`onNewField(panelRect)\` — the panel's own bounding rect, so the caller can open a field editor BESIDE the panel. The panel stays open while that editor is in use: mark floating surfaces with a \`data-overlay\` attribute (this panel \`data-overlay="menu"\`), treat a click inside any \`[data-overlay]\` as not-outside, and ignore Escape while a \`[data-overlay="panel"]\` is open so one Escape closes the editor, not both.

## API
- \`type FieldColumn = { key: string; label: string; type?: FieldType; locked?: boolean; fixed?: boolean }\` — \`locked\`: primary column, pinned first, always shown; \`fixed\`: app-owned type, shown with a lock but still hideable and movable.
- Props: \`columns\`, \`layout\`, \`onChange(layout)\`, \`onEdit?(key, rect)\`, \`onNewField?(rect)\`, \`title = 'Fields'\`, \`width = 320\`, \`className\`.

## Accessibility
- Trigger \`aria-label\` "Fields, 2 hidden" (or just the title) and \`aria-expanded\`. Eye: \`aria-pressed={shown}\`, labels "Hide Status" / "Show Status" / "Task is always shown". Grip: "Drag to reorder Status". Lock icon label: "Primary column — always shown" or "Type set by the app".

## Demo
Columns Task (locked), Status, Estimate, Due, Billable with Estimate hidden to start; show the layout as JSON below.`,

  'field-editor': `Build an "Edit field" / "New field" form panel for a spreadsheet-style table (Lark Base style) in React + TypeScript + Tailwind CSS. It opens as a floating card right where the column is, not in a drawer.

## Look — the anchored card
- Portalled to <body>, \`fixed z-[200]\`, opaque floating surface with no padding, \`shadow-2xl\`, \`flex flex-col overflow-hidden\`, fading in over 0.2s. Width 360px (capped to viewport minus 16px).
- Header: \`min-h-[2.75rem] px-3 py-2 border-b border-slate-200 dark:border-slate-700\`, title 12px semibold slate-900 / dark slate-100 ("New field" or "Edit field"), for an existing field a subtitle in 11px slate-500 like "Single select · status" (type label · key), and a 14px \`X\` close button (\`rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700\`).
- Body scrolls (\`min-h-0 flex-1 overflow-y-auto\`); footer is pinned under it (\`border-t px-3 py-2\`).
- Below 640px wide it becomes a bottom sheet: \`fixed inset-x-0 bottom-0 max-h-[85vh] rounded-t-xl border-t shadow-2xl\`.

## Look — the form (\`space-y-3 p-3\`)
- "Name": autofocused text input, placeholder "Field name".
- "Type": a two-column grid (\`grid grid-cols-2 gap-1\`) of 11 type tiles, each \`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs\` with a 14px icon, the label (medium weight) and a 10px slate-400 hint beneath: Text "A short line" (\`Type\`), Long text "Paragraphs" (\`TextAlignStart\`), Number "Plain figure" (\`Hash\`), Currency "Two decimals" (\`CircleDollarSign\`), Date "A calendar day" (\`Calendar\`), Checkbox "Yes or no" (\`SquareCheck\`), Single select "One choice" (\`CircleChevronDown\`), Multi select "Several choices" (\`ListChecks\`), Person "One of a list of people" (\`User\`), URL "A link" (\`Link\`), Email "An address" (\`Mail\`). Selected: \`border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-200\`, icon indigo-500. Others: \`border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800\`, icon slate-400.
- With \`typeLocked\`, instead a read-only row \`rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 dark:bg-slate-800/60\`: icon, type label, and "Fixed for this column" at the right in 11px slate-400.
- "Options" (labelled "People" for Person) only for Single select, Multi select and Person. Empty: strip \`rounded-lg bg-slate-50 py-3 text-center text-[11px] text-slate-400\` "No options yet. Add the first below." Each option row (\`flex items-center gap-1.5\`): a drag grip (\`GripVertical\`, slate-300); a colour swatch; the label as an inline text input (\`py-1.5 flex-1\`); a preview pill (hidden below \`sm\`); a remove × (hover rose-600). Under the list: an "Add an option" / "Add a person" input and a ghost "+ Add" button (disabled when empty).
- Colour swatch: a 20px \`rounded\` square filled with the tone's 400 shade (\`bg-sky-400\` …) and \`ring-1 ring-inset ring-black/10 dark:ring-white/10\`. Clicking opens a small popover (\`absolute left-0 top-6 z-50 grid grid-cols-6 gap-1 p-1.5\`, opaque surface) of all 17 tones — sky, amber, slate, emerald, zinc, rose, violet, indigo, orange, yellow, lime, teal, cyan, blue, purple, fuchsia, pink — the current one outlined (\`outline outline-2 outline-offset-1 outline-indigo-500\`); picking closes it.
- Pill: \`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium leading-none ring-1 ring-inset\` with \`bg-{tone}-50 text-{tone}-700 ring-{tone}-200 dark:bg-{tone}-950/40 dark:text-{tone}-300 dark:ring-{tone}-900\`. Write every class string out in full in a lookup map — never interpolate tone names into class names.
- Footer: for an existing field with \`onDelete\`, a rose text button "Delete" with \`Trash2\` (\`text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40\`); a ghost "Cancel" (\`ml-auto\`); a primary "Add field" (new) or "Save" (existing), disabled at 40% while the name is blank.

## Behaviour
- Placement from an \`anchor\` rect \`{ top, left, right, bottom }\` (viewport coordinates). \`"below"\` (default): 8px under it, left edges aligned, else right edges. \`"beside"\`: 8px right of it, else left, top-aligned. Skip a side that overlaps another open panel/menu; keep 8px from the window edges, push up only as far as needed, cap max-height to the room below. Null anchor = centred. Measure in a layout effect (no flash at 0,0); re-place on resize.
- A DRAFT until Save: re-seed name, type and options from \`field\` on every open; Cancel, the ×, Escape and an outside click discard. Enter in the form saves. Escape and outside click only apply to the topmost open panel, and clicks inside other floating overlays don't count as outside.
- New field (\`field === null\`): the key is derived from the name on save — lower-case, runs of non-alphanumerics → \`_\`, trimmed, "field" if empty — made unique against \`existingKeys\` with \`_2\`, \`_3\` …. An existing field keeps its key forever.
- Adding an option: Enter or "+ Add"; its value is the same slug of its label, unique among the options; its tone is the palette entry at its position, so consecutive options differ. Options reorder by native drag from the grip (live reordering; a cancelled drag reverts). Saved \`options\` are only included for option types.
- Delete asks first in a small confirm popover: "Delete this field?" / "Every value stored in it goes with it." with a red "Delete" confirm.

## API
- \`type FieldType = 'text' | 'longtext' | 'number' | 'currency' | 'date' | 'checkbox' | 'select' | 'multiselect' | 'user' | 'url' | 'email'\`; \`type FieldDef = { key: string; label: string; type: FieldType; options?: { value: string; label: string; tone?: string }[] }\`.
- Props: \`open\`, \`anchor: Anchor | null\`, \`field: FieldDef | null\`, \`existingKeys?: string[]\`, \`typeLocked = false\`, \`placement: 'beside' | 'below' = 'below'\`, \`onSave(field)\`, \`onDelete?(key)\`, \`onClose()\`. Also export \`FieldTypeIcon({ type, className })\` for column headers.

## Accessibility
- The card is \`role="dialog"\` labelled by its title. The type grid is \`role="radiogroup"\` "Field type" with \`role="radio"\` + \`aria-checked\` tiles. Swatch: \`aria-label="Colour: sky"\`; each tone button is labelled with its name.

## Demo
An "Add field" button that measures itself as the anchor and opens a new-field editor against existing keys title, status, priority, team, owner; show the saved FieldDef as JSON.`,

  'color-rules-panel': `Build a conditional-colouring rules toolbar popover (Lark Base style) in React + TypeScript + Tailwind CSS: each rule is a filter condition with a colour, painting a cell or a whole row.

## Look
- Trigger: a 32px icon-only button (\`h-8 w-8 rounded-lg\`), lucide \`PaintBucket\` at 16px. Idle \`text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/60\`; tinted \`bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300\` when open or when any rule exists; a rule-count badge \`absolute -right-0.5 -top-0.5 h-3.5 min-w-3.5 rounded-full bg-indigo-600 px-1 text-[9px] font-semibold text-white ring-2 ring-white dark:ring-slate-800\`.
- Panel: \`absolute left-0 top-full mt-1 z-50\`, width prop (default 540px), \`max-w-[calc(100vw-2rem)]\`, opaque floating surface \`p-3\`, scale-in from the top-left (0.22s \`cubic-bezier(0.34, 1.56, 0.64, 1)\`).
- Heading row: the title in 12px semibold slate-700, then a 14px ⓘ info tooltip: "Rules are checked top to bottom and the FIRST match wins, so drag the one that should take precedence upwards. Cell tints just that column; Row tints the whole row."
- Empty strip: \`rounded-lg bg-slate-50 px-3 py-4 text-center text-xs text-slate-400 dark:bg-slate-900/40\` — "No colouring rules. Every row is drawn the same."
- Rule row (\`flex items-center gap-1.5\`, rows \`space-y-1.5\`), selects all use the text-input recipe with \`py-1.5\`:
  1. Drag grip (\`GripVertical\` 14px, \`text-slate-300 hover:text-slate-500 cursor-grab\`).
  2. Colour swatch: a 20px \`rounded\` square in the tone's 400 shade with \`ring-1 ring-inset ring-black/10 dark:ring-white/10\`, opening a popover grid (\`absolute left-0 top-6 z-50 grid grid-cols-6 gap-1 p-1.5\`, opaque surface) of 17 tones — sky, amber, slate, emerald, zinc, rose, violet, indigo, orange, yellow, lime, teal, cyan, blue, purple, fuchsia, pink — current one outlined \`outline-2 outline-offset-1 outline-indigo-500\`. It is a swatch grid on purpose, not a select of colour names.
  3. Scope select \`w-20\`: Cell / Row.
  4. Field select \`w-36\`.
  5. Operator select \`w-32\`.
  6. Value control, \`flex-1 min-w-0\` (below).
  7. Remove × (\`rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600\`).
- Footer (\`mt-2 pt-2 border-t border-slate-100 dark:border-slate-700\`): indigo text button "+ New rule", an ⓘ "20 rules is the limit." at the cap, a ghost "Clear all" (\`ml-auto\`) when rules exist, and a primary "Apply" (\`ml-auto\`).

## Behaviour
- Operators by field kind — text & select: is, is not, contains, doesn't contain, is empty, is not empty; number: is, is not, >, ≥, <, ≤, is empty, is not empty; date: is, is before, is after, is empty, is not empty; bool: is; ref (a person/record id): is, is not, is empty, is not empty.
- Value control: "is empty"/"is not empty" show a slate-400 "—" instead. A field with options → a select with "Select…" first; for a select field with contains / doesn't contain, a multi-pick dropdown instead (trigger shows "Select…", the one label, or "3 selected"; a searchable list of checkable options that stays open while picking), stored comma-separated. Bool → select Checked / Unchecked (\`"true"\`/\`"false"\`). Date + "is" → a mode select (Exact date, Today, Tomorrow, Yesterday, This / Last week, This / Last month, In the past / Within the next 7 and 30 days) plus a date input only for Exact; relative modes are stored as \`"rel:today"\` etc. Other dates → \`type="date"\`, numbers → \`type="number"\`, else a text input "Enter a value".
- Changing a rule's field keeps its operator if the new field supports it, else takes the first, and clears the value; changing the operator clears the value.
- New rule: scope CELL (a wrong cell rule tints one column, a wrong row rule repaints the grid), the first field, its first operator, empty value, and the first tone no other rule uses. Max 20 rules. Rule ids are random strings, stable across edits and drags.
- DRAFT + Apply: nothing reaches \`onChange\` until Apply; outside click, Escape or the trigger revert the draft. Re-sync when \`rules\` change from outside.
- Order is priority, so rows reorder by native HTML5 drag from the grip only (row draggable while the grip is pressed, live reordering, dragged row \`opacity-40 bg-slate-100 dark:bg-slate-700\`, a cancelled drag reverts).

## API
- \`type ColorRule = { id: string; scope: 'cell' | 'row'; field: string; op: Operator; value: string; tone: Tone }\`; \`type FilterField = { id: string; label: string; kind: 'text' | 'number' | 'date' | 'select' | 'bool' | 'ref'; options?: { value: string; label: string; tone?: string }[] }\`.
- Props: \`fields: FilterField[]\`, \`rules: ColorRule[]\`, \`onChange(rules)\`, \`title = 'Conditional colouring'\`, \`width = 540\`, \`className\`.
- Ship a pure resolver too: per row, the row takes the first matching ROW rule; each cell takes the first matching CELL rule that names its column. Tints, written out per tone in full (no interpolated class names): row \`bg-{tone}-50/60 dark:bg-{tone}-950/20\`, cell (stronger) \`bg-{tone}-100/70 dark:bg-{tone}-950/40\`; slate and zinc one step darker in light mode and \`-800\` in dark.

## Accessibility
- Trigger \`aria-label\` "Conditional colouring — 2 rules", \`aria-expanded\`. Grip: "Reorder — the first matching rule wins". Scope select: "Where this colour is applied". Swatch "Colour: rose".

## Demo
Task fields Status (To do / In progress / In review / Done) and Priority (Low / Medium / High / Urgent); rules "Row · Priority is Urgent · rose" and "Cell · Status is Done · emerald"; under it a six-row task list painted by the resolver.`,

  'input-color': `Build a colour picker input component in React + TypeScript + Tailwind CSS: a saturation/brightness square, hue slider, optional opacity slider, hex field and preset swatches, shown inline or in a popover behind a swatch trigger.

## Look
- Trigger (default): a full-width text-input-styled button, \`flex items-center gap-2\`: a 16px swatch (\`rounded border border-black/10 dark:border-white/15\`, checkerboard behind the colour), the hex in \`font-mono uppercase\` (or the placeholder "Pick a colour" in slate-400), and a 14px \`ChevronDown\` that rotates 180° while open. Disabled: 60% opacity, \`cursor-not-allowed\`.
- Popover: \`absolute left-0 mt-1 z-50\`, opaque floating surface \`p-3\`, 0.2s fade-in. Inline mode renders the same panel in an opaque card (\`inline-block p-3\`) with no trigger.
- Panel body: \`w-56 flex flex-col gap-3\`:
  - Square \`h-36 rounded-lg cursor-crosshair\`, background \`linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), hsl(H 100% 50%)\`.
  - Hue track \`h-3 rounded-full\` with \`linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)\`.
  - Opacity track (only with \`alpha\`): \`linear-gradient(to right, transparent, <opaque colour>)\` over a checkerboard.
  - Thumbs: 14px circles, \`border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]\`, centred on the point, filled with the colour they represent (square: the opaque colour; hue: the pure hue; alpha: the colour with alpha).
  - A row with a 28px checkered preview chip (\`rounded-md border border-slate-200 dark:border-slate-700\`) and the hex text input (\`py-1.5 font-mono uppercase\`).
  - Presets: \`flex flex-wrap gap-1.5\` of 20px \`rounded-md\` swatches (checkerboard behind, \`border-black/10 dark:border-white/15\`); the one matching the current value gets \`ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-800\`.
- Checkerboard (a transparency indicator, same in both themes): \`repeating-conic-gradient(#cbd5e1 0 25%, #f8fafc 0 50%) 0 0 / 8px 8px\`.
- Focus on square and tracks: \`focus-visible:ring-2 ring-indigo-400 ring-offset-1 dark:ring-offset-slate-800\`.

## Behaviour
- Internal model is HSV + alpha (h 0–360, s/v/a 0–1). Keep it as OWN state rather than deriving from \`value\` every render — hex can't hold hue at zero saturation or brightness, so a derived picker would snap the hue to red when the square is dragged to a corner. Re-read \`value\` only when it changes to something the picker didn't just emit (adjust state during render, no syncing effect).
- Emit lower-case hex: \`#rrggbb\`, or \`#rrggbbaa\` only when \`alpha\` is on and a < 1. Without \`alpha\`, alpha is forced to 1.
- Parse \`#rgb\`, \`#rgba\`, \`#rrggbb\`, \`#rrggbbaa\` (\`#\` optional); anything else is ignored. The hex box keeps its own draft while focused (so typing "#1a" isn't rewritten), commits whenever the draft parses, Enter normalises the text without submitting a form, blur drops the draft. Presets compare normalised, so \`#fff\` lights up for \`#ffffff\`. Fallback colour when value is empty/invalid: a medium indigo.
- Dragging: pointer capture on press (keeps dragging off the edge), \`touch-none\`, clamp 0–1, focus the element by hand on press. Square: x = saturation, y = 1 − brightness.
- Keys: square arrows ←/→ saturation, ↑/↓ brightness; tracks arrows ±, Home/End to ends; step 1%, Shift for 10%.
- Popover: ArrowDown on the closed trigger opens it; Escape closes and returns focus to the trigger.

## API
\`value: string\`, \`onChange(hex)\`, \`alpha = false\`, \`presets?: string[]\`, \`inline = false\`, \`placeholder = 'Pick a colour'\`, \`disabled\`, \`id\` (lands on the trigger for an external label), \`className\`. Also export \`hexToHsv\` and \`hsvToHex\`.

## Accessibility
- Square, hue and opacity are each \`role="slider"\` with \`tabIndex=0\`: "Saturation and brightness" (\`aria-valuetext\` "Saturation 70%, brightness 90%"), "Hue" (0–360), "Opacity" (0–100, "50%"). Trigger: \`aria-haspopup="dialog"\`, \`aria-expanded\`, \`aria-controls\`; popover \`role="dialog"\` "Colour picker". Hex input "Hex colour". Presets are a group "Preset colours" of \`aria-pressed\` buttons labelled with their hex.

## Demo
Three variants: popover with presets (#4f46e5, #0ea5e9, #10b981, #f59e0b, #f43f5e, #64748b, #0f172a, #ffffff) at a 176px width; alpha on, starting at #0ea5e980; and inline with the first six presets.`,

  'float-label': `Build a floating-label field wrapper component in React + TypeScript + Tailwind CSS, in three variants (over, in, on), with pure CSS — no state.

## Look
- Wraps exactly one \`<input>\`, \`<textarea>\` or \`<select>\` (already styled as a standard text input). The label is absolutely positioned inside a \`relative\` box, \`pointer-events-none truncate leading-none max-w-[calc(100%-1.5rem)]\`, animating \`transition-all duration-150 ease-out\`. While the control is focused the floated label turns indigo-600 / dark indigo-400.
- RESTING (empty and not focused): the label sits in the field like a placeholder — \`left-3 text-xs font-normal text-slate-400 dark:text-slate-500\`, vertically centred (\`top-1/2 -translate-y-1/2\`), or on the first line (\`top-2\`) for a textarea.
- FLOATED, per variant:
  - \`over\` (default): above the box — the wrapper reserves the row with \`pt-5\`; label at \`left-0 top-0 -translate-y-[calc(100%+4px)] text-[11px] font-semibold text-slate-600 dark:text-slate-300\`.
  - \`in\`: to the top inside the box — the control gets \`pt-5 pb-1.5\`; label at \`left-3 top-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400\`.
  - \`on\`: on the border line — label at \`left-2 top-0 -translate-y-1/2 px-1 text-[10px] font-medium\` with an OPAQUE patch \`bg-white dark:bg-slate-900\` that hides the border behind it; the control is made opaque in the same colour (\`bg-white dark:bg-slate-900\`) so the patch is invisible. The resting state drops the patch (\`bg-transparent px-0\`).

## Behaviour
- The trick: clone the child with \`placeholder=" "\` (a single space) and the \`peer\` class, render the \`<label>\` AFTER it, and express resting with \`peer-[:placeholder-shown:not(:focus)]:…\` variants. \`:placeholder-shown\` is true exactly while the field is empty, so it works controlled or uncontrolled with no onChange or ref. The compound selector also outranks the floated base classes, so resting wins reliably.
- A \`<select>\` never matches \`:placeholder-shown\`, so its label stays floated — correct, it always shows an option.
- Write every class string as a literal (no runtime-composed variant prefixes, or Tailwind won't generate them).
- The child's own placeholder is replaced — the label is the placeholder. Uses the child's \`id\` or generates one, and links the label with \`htmlFor\`.

## API
\`label: ReactNode\`, \`variant: 'over' | 'in' | 'on' = 'over'\`, \`children\` (one control, or a component forwarding \`id\`, \`className\`, \`placeholder\`), \`multiline?\` (defaults to true for a textarea child), \`className\`.

## Demo
Three columns, one per variant, each with Username (empty), Email (prefilled "someone@example.com") and a two-row Notes textarea.`,

  'ifta-label': `Build an "infield top-aligned" label field component in React + TypeScript + Tailwind CSS: a small label and the control share one bordered box with one focus ring.

## Look
- Wrapper box: \`flex flex-col rounded-lg border bg-white/80 dark:bg-slate-900/60 transition-shadow\`, border \`border-slate-300 dark:border-slate-700\`; on \`focus-within\`: \`ring-2 ring-indigo-500/40 border-indigo-500\`. Disabled control inside → whole box at 60% opacity (\`has-[:disabled]:opacity-60\`).
- Top row \`flex items-center justify-between gap-2 px-3 pt-1.5\`: the label in \`text-[10px] font-semibold leading-none text-slate-500 dark:text-slate-400\`, and an optional \`aside\` on the right (a unit, a counter) in \`text-[10px] leading-none text-slate-400 dark:text-slate-500\`.
- The control below, its own chrome stripped: \`w-full min-w-0 border-0 bg-transparent px-3 pt-1 pb-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 shadow-none outline-none ring-0 focus:ring-0\`.
- \`invalid\`: border \`border-rose-400 dark:border-rose-500\`, focus ring \`ring-rose-400/40\`, label \`text-rose-600 dark:text-rose-400\`.

## Behaviour
- The border and ring belong to the WRAPPER, not the control: the box the eye reads as "the field" includes the label, so a ring round just the input would draw a second box inside it.
- Clone the single child control, giving it the id (its own or a generated one), \`aria-invalid\` when invalid, and the stripping classes (as utilities, so they beat an existing text-input class on the child). The label's \`htmlFor\` focuses the control.

## API
\`label: ReactNode\`, \`children\` (one input/textarea/select), \`aside?: ReactNode\`, \`invalid = false\`, \`className\`.

## Demo
Three side by side: "Amount" with aside "USD" and placeholder "0.00"; "Plan" select (Free / Team / Enterprise, Team selected); "Reference" invalid with value "ABC-".`,

  'cascade-select': `Build a cascade select component (single select over a tree, shown as flyout submenus) in React + TypeScript + Tailwind CSS.

## Look
- Trigger: a full-width text-input-styled button, \`flex items-center gap-2\`: the selected leaf's icon (14px, slate-500), the text — the leaf label, or the whole path "Canada / Ontario / Toronto" with \`showPath\` — or the placeholder in slate-400, and a 14px \`ChevronDown\` that rotates 180° when open. Disabled: 60% opacity, not-allowed cursor.
- Menu column: opaque floating surface, \`absolute z-50 min-w-[11rem] w-max p-1 text-xs\`. The first column drops below the trigger (\`left-0 top-full mt-1\`, 0.2s fade-in); each submenu sits beside its parent row (\`left-full top-0 -mt-1 ml-1.5\`), rendered INSIDE the parent row's \`relative\` wrapper. Columns have no max-height/overflow — a scrolling column would clip its own flyouts — they grow instead.
- Row: \`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 leading-none\`: optional 14px icon, truncating label, then a 14px \`ChevronRight\` for a group (slate-400) or a \`Check\` for a leaf (visible only on the selected leaf).
- Row states: focused row \`bg-indigo-600 text-white\` (chevron white); a row on the open trail but not focused \`bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300\`; a row on the path to the current selection \`text-indigo-600 dark:text-indigo-400\`; otherwise slate-700 / dark slate-200.

## Behaviour
- Only leaves can be picked; a group (non-empty \`children\`) is a route. Branches can differ in depth (a top-level leaf is fine).
- State is one array, the trail: the highlighted index in each open column; its last entry is where focus is. Plus one flag: hovering a group shows its submenu while focus stays on the group row, so the pointer can travel into the submenu.
- Hover MOVES REAL FOCUS (\`focus({ preventScroll: true })\` + \`scrollIntoView({ block: 'nearest' })\`), so pointer and keyboard never disagree about what Enter picks.
- Opening (click, or ArrowDown/ArrowUp on the trigger) lands on the current selection with its whole path unfolded.
- Keys in the menu: ↑/↓ move within the column (wrapping), Home/End; → / Enter / Space on a group opens it and focuses its first child; Enter / Space on a leaf picks it; ← goes back a column; Escape goes back a column and only closes (returning focus to the trigger) from the first; Tab closes and lets focus move on. Enter must not submit a surrounding form.
- Clicking a group opens it and moves into it (for touch); clicking a leaf picks it. Picking calls \`onChange(value, ['Canada', 'Ontario', 'Toronto'])\` and closes, focusing the trigger. Outside click closes without refocus.

## API
- \`type CascadeOption = { value: string; label: string; icon?: ReactNode; children?: CascadeOption[] }\` — values unique across the tree.
- Props: \`options\`, \`value: string | null\` (the leaf), \`onChange(value, pathLabels)\`, \`placeholder = 'Select…'\`, \`showPath = false\`, \`disabled\`, \`id\` (on the trigger), \`className\`.

## Accessibility
- Trigger \`aria-haspopup="menu"\`, \`aria-expanded\`, \`aria-controls\`. Each column \`role="menu"\`; group rows \`role="menuitem"\` with \`aria-haspopup="menu"\` and \`aria-expanded\`; leaves \`role="menuitemradio"\` with \`aria-checked\`. Rows are \`tabIndex={-1}\` (focus is managed).

## Demo
Places: Canada → Ontario (Toronto, Ottawa), Quebec (Montreal, Quebec City); Australia → New South Wales (Sydney, Newcastle), Victoria (Melbourne); and a top-level leaf "Remote". Globe / MapPin / Building2 icons by level. One 224px select with placeholder "Select a city", and one 256px with \`showPath\` preselected to Ottawa.`,

  slider: `Build a slider component (single value or range, horizontal or vertical) in React + TypeScript + Tailwind CSS.

## Look
- Row: \`flex items-center gap-3 text-xs w-full\` (vertical: \`flex-col items-center h-40\`); disabled at 50% opacity.
- Hit area: a padded wrapper (\`px-2 py-2\`, \`flex-1\`, \`touch-none select-none cursor-pointer\`) around a thin rail. The rail is what values are measured against; the padding just enlarges the target.
- Rail \`h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700\` (vertical \`w-1.5 h-full\`). Fill \`rounded-full bg-indigo-600 dark:bg-indigo-500\` from min to the value (single) or between the two thumbs (range).
- Thumbs: 16px circles, \`border-2 bg-white border-indigo-600 dark:bg-slate-900 dark:border-indigo-400 shadow-sm\`, centred on the value, \`hover:shadow-md\`, focus \`ring-2 ring-indigo-400 ring-offset-1 dark:ring-offset-slate-900\`.
- Optional readout beside the rail: \`tabular-nums font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap\`, "40%" or "$20 – $75". Reserve its widest possible width up front (in \`ch\`, from formatting min and max) so the rail doesn't shrink under the pointer when the value gains a digit.

## Behaviour
- \`value\` is a number or a \`[low, high]\` pair; \`onChange\` returns the same shape. Only call it when the value actually changes.
- Snap to \`min + n * step\`, clamp to [min, max], and round to the step's decimal places to kill float noise (0.1 + 0.2). Fractional steps allowed.
- Pointer: press anywhere on the track moves the NEAREST thumb there, focuses it and keeps dragging (pointer capture, preventDefault so text doesn't select). If both thumbs are stacked, decide which one from the direction of the first move. Commit the release point on pointerup too, so a quick flick doesn't stop short.
- Range thumbs clamp at their partner rather than crossing it.
- Keys on a thumb: ←/↓ −step, →/↑ +step, PageUp/PageDown ± one tenth of the span (at least one step), Home/End to the ends of that thumb's allowed range (its partner, for a range thumb). Vertical maps bottom = min.

## API
\`value: number | [number, number]\`, \`onChange\`, \`min = 0\`, \`max = 100\`, \`step = 1\`, \`showValue = false\`, \`formatValue = String\` (used for the readout AND \`aria-valuetext\`), \`disabled\`, \`orientation: 'horizontal' | 'vertical' = 'horizontal'\`, \`label\` (single thumb's name), \`thumbLabels = ['Minimum', 'Maximum']\`, \`className\`.

## Accessibility
- The THUMBS are the \`role="slider"\` elements (a range is two sliders), with \`aria-valuemin/max\` narrowed to the partner for a range, \`aria-valuenow\`, \`aria-valuetext\`, \`aria-orientation\`, \`aria-disabled\`; \`tabIndex -1\` when disabled. The readout is \`aria-hidden\`.

## Demo
Opacity 40% ("40%" readout); price range [20, 75] step 5 as "$20 – $75"; a 0–1 threshold at step 0.05; two vertical sliders (Volume 60, a band [30, 70]); a disabled one at 30.`,

  'radio-group': `Build a radio group component, over real radio inputs, with a roving tab stop and arrow-key selection, in React + TypeScript + Tailwind CSS.

## Look
- Group: \`flex flex-col gap-2\`, or horizontal \`flex-row flex-wrap gap-x-4 gap-y-2\`.
- Each option: a \`<label>\` with \`flex items-start gap-2 text-xs\` holding a 16px drawn circle (\`mt-0.5\`) and the label in \`font-medium text-slate-700 dark:text-slate-200\`.
- Circle: \`w-4 h-4 rounded-full border-2\`; unchecked \`bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600\`; checked \`bg-indigo-600 border-indigo-600\` with a 6px white dot centred on it; keyboard focus \`ring-2 ring-indigo-400\` (via \`peer-focus-visible\` from the visually-hidden input).
- Optional hint: a small ⓘ info icon (12px, slate-400) right AFTER the label (a sibling of the label, not inside it, so clicking it doesn't select), showing the hint in a tooltip.
- Disabled option or group: 50% opacity, \`cursor-not-allowed\`.

## Behaviour
- A real \`<input type="radio" class="sr-only peer">\` sits under each circle, so label clicks, form posting and focus are native. All share a \`name\` (generated when not given).
- Controlled: \`value\` (\`null\` = nothing chosen yet; the user can't un-select).
- ONE tab stop for the whole group: the checked option, or the first enabled one when nothing is checked; all others \`tabIndex=-1\`.
- Arrow keys move AND select: ↓/→ next, ↑/← previous, in either orientation, wrapping at the ends and skipping disabled options. Own this logic rather than relying on native radio behaviour, which varies by browser.
- Also export the single \`RadioButton\` for standalone use (props: \`id\`, \`name?\`, \`value\`, \`checked\`, \`onChange\`, \`label\`, \`hint?\`, \`disabled?\`).

## API
\`type RadioOption = { value: string | number; label: ReactNode; hint?: string; disabled?: boolean }\`. Props: \`options\`, \`value: string | number | null\`, \`onChange(value)\`, \`name?\`, \`orientation: 'horizontal' | 'vertical' = 'vertical'\`, \`label?\` (the group's accessible name), \`disabled = false\`, \`className\`.

## Accessibility
- Wrapper \`role="radiogroup"\` with \`aria-label\`, \`aria-orientation\`, \`aria-disabled\`.

## Demo
"Billing period": Monthly (hint "Billed on the 1st of each month."), Yearly, Lifetime (disabled), Monthly selected. A horizontal "Size" group Small / Medium / Large with nothing selected. A fully disabled group, and a standalone "I have read the notes" radio.`,

  knob: `Build a circular dial (knob) input component in React + TypeScript + Tailwind CSS, drawn in SVG.

## Look
- A square (\`size\`, default 96px) \`rounded-full\` element holding an SVG. The dial sweeps 270° clockwise from −135° (bottom-left) to +135° (bottom-right), leaving a 90° gap at the bottom.
- Track: an arc over the full sweep, \`stroke-slate-200 dark:stroke-slate-700\`, round caps, \`strokeWidth\` default 8, radius = size/2 − strokeWidth/2 − 1.
- Value arc: from the start to the value's angle, \`stroke-indigo-600 dark:stroke-indigo-400\`, round caps. Draw nothing at the minimum — a zero-length round-capped arc would paint a dot that reads as "a little".
- Centre text: the value through a template (e.g. "{value}%"), \`font-semibold tabular-nums fill-slate-700 dark:fill-slate-200\`, font size max(10, size × 0.2), centred both ways.
- Focus ring \`ring-2 ring-indigo-400\` on the round element. Disabled: 50% opacity, not-allowed cursor. Read-only: default cursor.

## Behaviour
- ANGLE-based dragging: the value follows where the pointer is around the centre (atan2, clockwise from 12 o'clock), so a click lands where it's aimed. Pointer capture, \`touch-none select-none\`, focus on press.
- In the dead zone at the bottom on a fresh press, take the end on the pressed side. Mid-drag, a jump of more than half the dial means the pointer went round through the gap — hold the end already reached rather than flipping max ↔ min, like a physical knob stop. Commit the release point on pointerup.
- Snap to \`min + n * step\`, clamp, round to the step's decimals; only call \`onChange\` on a change.
- Keys: ↑/→ +step, ↓/← −step, PageUp/PageDown ± one tenth of the span (rounded to the step, at least one step), Home/End to min/max.
- \`readOnly\`: focusable and announced, but pointer and keys don't change it. \`disabled\`: not focusable.

## API
\`value\`, \`onChange\`, \`min = 0\`, \`max = 100\`, \`step = 1\`, \`size = 96\`, \`strokeWidth = 8\`, \`valueTemplate = '{value}'\`, \`showValue = true\`, \`disabled\`, \`readOnly\`, \`label\` (accessible name — a dial has no visible label), \`className\`.

## Accessibility
- The round element is \`role="slider"\` with \`aria-valuemin/max/now\`, \`aria-valuetext\` = the templated text, \`aria-disabled\`, \`aria-readonly\`; the SVG is \`aria-hidden\`.

## Demo
A row: "Mix" 42 as "{value}%"; "Gain" −12…12 at 64px / stroke 6 as "{value} dB" starting at −6; "Ratio" 0–1 step 0.1 at 72px; a read-only "Usage" 65%; a disabled one.`,

  'input-group': `Build an input group component in React + TypeScript + Tailwind CSS that joins addons (text, icons, buttons, selects) before and after an input into one bordered control.

## Look
- Group: \`flex w-full items-stretch\`, \`role="group"\`.
- Addon (export \`InputGroupAddon\`): a grey cap the same height and border as a text input — \`inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-lg border px-2.5 text-xs leading-none border-slate-300 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400\`, icons inside sized to 14px (\`[&>svg]:h-3.5 [&>svg]:w-3.5\`).

## Behaviour
- The group doesn't draw a frame; it works on the children's OWN borders:
  - every child but the first: \`-ml-px\` (two borders collapse into one) and no left radius;
  - every child but the last: no right radius.
  Use \`[&>*:not(:first-child)]:…\` / \`[&>*:not(:last-child)]:…\` rather than \`first:\`/\`last:\` — the extra pseudo-class out-specifies a child's own \`rounded-lg\`, which is the only way to override a button's corners from outside.
- Every child is \`relative\`, and the focused child is lifted with \`z-[1]\` (\`[&>*:focus]\`, \`[&>*:focus-within]\`) so its focus ring isn't painted over by the next addon.
- Inputs grow (\`[&>input]:flex-1 min-w-0\`); a \`<select>\` keeps its own width — give it \`w-auto\` when used as a unit picker.
- Children are plain elements in visual order; each keeps its own classes. Forward other div props.

## API
\`InputGroup({ children, className, ...divProps })\`, \`InputGroupAddon({ children, className, ...spanProps })\`.

## Demo
Four rows: "https://" + input "example.com" + ".org"; a DollarSign icon addon + number input "0.00" + "USD"; a number "Weight" input + a kg/lb select; a "Search keyword" input + an icon-only clear (X) secondary button + a primary "Search" button with a search icon.`,

  'icon-field': `Build an icon field component (a text input with inset icons) in React + TypeScript + Tailwind CSS.

## Look
- Wrapper \`relative w-full\`; the input uses the standard text-input look, with \`pl-8\` when there's a left icon and \`pr-8\` when there's a right one.
- Icon slots: \`absolute top-1/2 -translate-y-1/2 flex items-center text-slate-400 dark:text-slate-500\`, left at \`left-2.5\`, right at \`right-2.5\`, any svg inside forced to 14px.
- \`loading\` replaces the right slot with a spinning lucide \`Loader2\`.

## Behaviour
- Slots are \`pointer-events-none\`, so a click on the icon lands on the input and focuses it; a \`<button>\` placed in a slot opts back in (\`[&_button]:pointer-events-auto\`) — that's how a clear/copy/reveal button goes in \`iconRight\`.
- \`loading\` sets \`aria-busy\` on the input.
- Forward the ref and all input props to the \`<input>\`; \`className\` goes on the input, \`wrapperClassName\` on the wrapper.

## API
\`iconLeft?: ReactNode\`, \`iconRight?: ReactNode\`, \`loading = false\`, \`wrapperClassName?\`, plus every native input prop.

## Demo
A "Search…" field with a Search icon; a read-only share link "https://example.com/share/abc123" with a Globe icon and a small Copy button on the right (\`rounded p-0.5 hover:text-slate-600\`, focus ring); a "Checking availability…" username field with AtSign on the left and loading on.`,

  'input-mask': `Build a masked text input component in React + TypeScript + Tailwind CSS for phone numbers, dates and codes.

## Look
- A standard text input plus \`font-mono tabular-nums\`. Placeholder defaults to the mask with every slot shown as the slot char, e.g. "(___) ___-____".
- While focused (or once anything is typed) the input shows the full template with empty slots as \`slotChar\` (default \`_\`); an empty unfocused field shows its placeholder.

## Behaviour
- Mask tokens: \`9\` digit, \`a\` letter, \`*\` letter or digit; every other character is a literal typed for the user.
- Model: \`raw\` = the contiguous run of slot characters. Expose a pure \`applyMask(mask, input, slotChar)\` that accepts raw ("5551234567") OR formatted ("(555) 123-4567") input — a character equal to the literal at the current position is consumed as that literal — and returns \`{ formatted, masked, raw, complete }\`: \`formatted\` trimmed after the last filled slot ("(555) 12"), \`masked\` with empty slots as the slot char, \`complete\` when every slot is filled. Characters that don't fit a slot are dropped.
- Work out edits by DIFFING the browser's new value against the old (common prefix capped at the old caret, common suffix), not by intercepting keys — one path covers typing, paste, autofill, drag-drop and mobile keyboards. A pasted fully-formatted value has the mask's leading literals (e.g. "+1 (") stripped first.
- Intercept only Backspace and Delete: they skip literals and remove the nearest slot character (or the selected range). A change event that only deleted a literal (Android backspace) deletes the slot before it.
- Caret: after every edit place it at the slot where the next character lands, in a layout effect (force a re-render even when a keystroke was rejected, so the caret is restored). On focus, move the caret to the first empty slot on the next frame — unless a keystroke already got in. A mouse-up past the typed part snaps back to the first empty slot.
- \`autoClear\`: on blur, an incomplete value is cleared.
- \`inputMode="numeric"\` automatically when every slot is \`9\`. Default \`type="text"\` (overridable with \`tel\`; never email/number, which lack setSelectionRange).

## API
\`mask: string\`, \`value: string\` (raw or formatted — both are read through applyMask), \`onChange({ formatted, raw, complete })\`, \`slotChar = '_'\` (must not be accepted by any slot), \`autoClear = false\`, plus native input props (forwarded ref; the component's own handlers call the caller's onFocus/onBlur/onKeyDown/onSelect/onMouseUp).

## Demo
Phone "(999) 999-9999" with \`type="tel"\` and the change object printed as JSON; date "99/99/9999" with autoClear starting from raw "1225"; code "aa-9999" with slot char "·".`,

  'input-password': `Build a password input component with a show/hide toggle, a strength meter and an optional requirements checklist in React + TypeScript + Tailwind CSS.

## Look
- Input: standard text input with \`pr-8\`. Toggle button inside at the right (\`absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300\`, focus ring indigo-400) showing a 14px \`Eye\` (hidden) or \`EyeOff\` (revealed).
- Meter (\`feedback\`), \`mt-1.5 flex items-center gap-2\`: three \`h-1 flex-1 rounded-full\` segments with \`gap-1\`, unlit \`bg-slate-200 dark:bg-slate-700\`; lit count and colour by level — weak 1 \`bg-rose-500 dark:bg-rose-400\`, medium 2 \`bg-amber-500 dark:bg-amber-400\`, strong 3 \`bg-emerald-500 dark:bg-emerald-400\`, with \`transition-colors\`. Then the word, \`w-14 text-right text-[11px] font-semibold\`, in the matching 600 / dark 400 text colour ("Weak", "Medium", "Strong"), or "Strength" in slate-400 when empty.
- Requirements checklist, \`mt-1.5 space-y-0.5\`: rows \`flex items-center gap-1.5 text-[11px]\` with a 12px \`Check\` (met, \`text-emerald-600 dark:text-emerald-400\`) or \`X\` (unmet, slate-500 / dark slate-400) and the rule label.

## Behaviour
- Strength (export \`passwordStrength(pw, requiredLength = 8)\`): empty → none; shorter than requiredLength → weak regardless of variety; otherwise one point per character class present (lower, upper, digit, symbol), +1 at length ≥ requiredLength + 4, +1 at ≥ 2 × requiredLength; ≥4 strong, 3 medium, else weak. It's a nudge, not a security control.
- Default rules when \`requirements\` is \`true\`: "At least 8 characters", "A number", "An uppercase letter", "A symbol"; or pass your own \`{ label, test(pw) }[]\`.
- Works controlled or uncontrolled: when \`value\` is undefined, mirror the input into local state from its onChange so the meter still updates.
- \`requiredLength\` is NOT passed as \`minLength\`, so it never blocks submit on its own.
- Forward the ref and native props to the input; \`className\` on the input, \`wrapperClassName\` on the wrapper.

## API
\`feedback = false\`, \`requirements: boolean | PasswordRule[] = false\`, \`requiredLength = 8\`, \`wrapperClassName?\`, plus native input props except \`type\`.

## Accessibility
- Toggle: a FIXED \`aria-label="Show password"\` with \`aria-pressed\` (a flipping label would announce "Hide password, pressed"), \`aria-controls\` the input, and a \`title\` that does flip.
- Meter and checklist are linked to the input via \`aria-describedby\` (merged with any the caller passes). Only the level word is \`aria-live="polite"\`; each rule carries a visually-hidden "(met)"/"(not met)" (keep the list \`relative\` so those sr-only spans stay anchored).

## Demo
A toggle-only field prefilled "hunter2", and a "Choose a password" field with feedback and requirements, echoing its value.`,
};
