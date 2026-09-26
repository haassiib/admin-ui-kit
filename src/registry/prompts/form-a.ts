/** AI prompts — see `./index.ts` for what a prompt is for. */

export const FORM_A_PROMPTS: Record<string, string> = {
  field: `Build a form field wrapper (label + control + error, wired together) component in React + TypeScript + Tailwind CSS.

## Look
- Column (\`flex flex-col\`). Label on top in the field-label style (\`mb-1\`), laid out \`flex items-center gap-1\`.
- \`required\`: a rose-500 \`*\` after the label text (\`aria-hidden\`).
- \`hint\` is NOT a line under the control: it is a small ⓘ icon button beside the label (lucide \`Info\`, 12px, slate-400 → hover slate-600; dark slate-500 → hover slate-300) that shows the hint in a dark tooltip (slate-900, dark slate-700, white text) on hover or focus. The button calls \`preventDefault\` + \`stopPropagation\` so clicking it does not activate the label.
- Error: \`<p class="mt-1 text-[11px] text-rose-600 dark:text-rose-400">\` under the control.
- Also export three thin wrappers over the native elements, all with the house text-input recipe: \`Input\`, \`Textarea\` (adds \`resize-y\`) and \`Select\`. When \`aria-invalid\` is true they switch to \`border-rose-400\` and \`focus:ring-rose-400/40\`.

## Behaviour
- The id is generated inside Field with \`useId()\` and handed to the control through a RENDER PROP, which is what connects \`<label htmlFor>\`, \`aria-describedby\` and the error — the step everyone skips by hand.
- \`children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode\`. \`aria-describedby\` points at \`<id>-error\` and \`aria-invalid\` is true only while there is an error.
- Usage: \`<Field label="Email" error={err}>{(p) => <Input {...p} />}</Field>\`.

## API
\`label: ReactNode\`, \`hint?: ReactNode\`, \`error?: string | null\`, \`required = false\`, \`className?\`, \`children\` (render prop). Default export Field; named exports Input, Textarea, Select.

## Demo
In a \`grid max-w-md gap-3\`: "Full name" (required, "Ada Lovelace"); "Email" validated live, seeded "not-an-email", showing "Enter a valid email address." until it contains \`@\`; "Team" select (Engineering, Research, Design, Support, Operations) with hint "Determines default project access."; "Notes" textarea, 3 rows, placeholder "Optional".`,

  checkbox: `Build a styled checkbox component (real input underneath, optional hint tooltip) in React + TypeScript + Tailwind CSS.

## Look
- Outer \`<span class="flex items-start gap-1.5 text-xs">\`; the whole thing drops to \`opacity-50\` when disabled.
- \`<label htmlFor={id}>\`: \`flex items-start gap-2 min-w-0\`, \`cursor-pointer\` (\`cursor-not-allowed\` when disabled).
- Box: a 16px slot (\`relative w-4 h-4 shrink-0 mt-0.5\`, centred) holding a real \`<input type="checkbox" class="sr-only peer">\` and a visual square \`w-4 h-4 rounded border-2 transition-colors\`:
  - unchecked \`bg-white border-slate-300\`, dark \`bg-slate-800 border-slate-600\`;
  - checked \`bg-indigo-600 border-indigo-600\` with a white lucide \`Check\` (12px, strokeWidth 3) absolutely centred on top;
  - keyboard focus \`peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-400\` on the square.
- Label text \`font-medium text-slate-700 dark:text-slate-200\`, \`min-w-0\` so long labels wrap beside the box, top-aligned.
- \`hint\` renders as a 12px ⓘ icon (slate-400, hover slate-600) with a dark tooltip, \`mt-0.5\` — NOT a second line under the label, which keeps a long list of permissions readable as a list. The ⓘ is a SIBLING of the \`<label>\`, not inside it: nested, its click would toggle the box.

## API
\`id: string\` (required, links label and input), \`name?\` (so it posts with an uncontrolled \`<form>\`), \`checked: boolean\`, \`onChange(checked: boolean)\`, \`label: ReactNode\`, \`hint?: string\`, \`disabled = false\`, \`className?\`. Controlled.

## Demo
Three stacked (\`flex-col gap-3\`): "Email me on approval" (checked, hint "One email per batch, not per row."), "Skip duplicates" (\`name="skip_dupes"\`), "Locked by policy" (disabled).`,

  'toggle-switch': `Build a labelled on/off toggle switch component in React + TypeScript + Tailwind CSS.

## Look
- A \`<label htmlFor={id}>\`: \`relative inline-flex items-center gap-2\`, \`cursor-pointer\`; disabled \`opacity-50 cursor-not-allowed\`.
- Inside, a real \`<input type="checkbox" class="sr-only peer">\`, then the track: \`w-9 h-5 rounded-full bg-slate-200 dark:bg-slate-700 peer-checked:bg-indigo-600 transition-colors relative\`.
- The knob is the track's \`::after\`: \`after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-4\` — pure CSS, no JS animation.
- Optional label to the right: \`text-xs font-medium text-slate-700 dark:text-slate-200\`.

## API
\`id: string\`, \`checked: boolean\`, \`onChange(checked: boolean)\`, \`label?: string\`, \`disabled = false\`. Controlled.

## Demo
"Auto-approve trusted members" (on) and a second switch labelled "Disabled" (off, disabled), stacked with \`gap-3\`.`,

  'pick-list': `Build a dual-list pick list (transfer list: pick from a set, then order what you picked) component in React + TypeScript + Tailwind CSS.

## Look
- Row \`flex items-stretch gap-3\`: source list · transfer buttons · target list · reorder buttons (optional). Both lists are \`flex-1 min-w-0 flex-col\` and share one height (default \`h-64\`) so the columns line up.
- Each list: a header row (\`mb-1.5 flex justify-between\`) with the section-title-style heading left and the item count right (10px slate-400); an optional filter input (14px Search icon inside at the left, \`pl-8\`, placeholder "Filter…", \`mb-1.5\`); then a \`<ul>\` \`overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700\` with a thin scrollbar.
- Rows are full-width buttons \`px-3 py-1.5 text-xs text-left transition-colors\`: idle slate-700 (dark slate-200), hover \`bg-slate-50\` (dark \`slate-800/60\`); selected \`bg-indigo-50 font-medium text-indigo-700\`, dark \`bg-indigo-500/15 text-indigo-300\`. An empty list shows one "Nothing here" line (11px slate-400, \`px-3 py-2\`).
- Control columns are \`flex-col justify-center gap-1.5\` of icon-only buttons: \`rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100\`, dark \`border-slate-700 text-slate-400 hover:bg-slate-800\`, \`disabled:opacity-40\` with no hover. 14px lucide icons:
  - transfer: ChevronRight (selected → target), ChevronsRight (all → target), ChevronLeft (selected → source), ChevronsLeft (all → source);
  - reorder: ChevronsUp (to top), ChevronUp, ChevronDown, ChevronsDown (to bottom).

## Behaviour
- CONTROLLED on one value \`{ source: T[]; target: T[] }\`, never two props — every operation moves an item between them, and two props would let an item end up in both lists or neither.
- Selection is per list and INTERNAL (a transient pointer, not part of the value). Click toggles a row; Shift-click adds the whole run from the last-clicked row (the anchor) to this one, in the currently filtered list.
- Moving appends the items to the end of the other list and clears the selection on the side they left. Move buttons disable when nothing is selected, "all" buttons when the list is empty.
- Reorder applies to the TARGET only (order means something in "what you picked", rarely in "what's left"). Selected rows move as a block and keep their relative order. Up/down step one place and stop at the edge, no wrapping (step the leading edge first so rows in a run don't overwrite each other). Top/bottom lift the block out and reinsert it contiguously. Disabled while nothing in the target is selected.
- Filter: case-insensitive substring over \`String(item)\` and the item's id.

## API
Generic over \`T\`: \`value\`, \`onChange(next)\`, \`getId(item) => string | number\`, \`renderItem?(item)\` (default \`String(item)\`), \`sourceHeader = 'Available'\`, \`targetHeader = 'Selected'\`, \`filterable = false\`, \`reorderable = true\`, \`emptyLabel = 'Nothing here'\`, \`listClassName = 'h-64'\`, \`className\`.

## Accessibility
Rows carry \`aria-pressed\`. Every control has an aria-label ("Move selected to target", "Move all to source", "Move to top", "Move down", …); the filter inputs are labelled "Filter source list" / "Filter target list".

## Demo
Choose reviewers from eight people (Ada Lovelace, Grace Hopper, Alan Turing, Katherine J., Alan Kay, Barbara Liskov, Edsger D., Margaret H.), the first three already in the target; \`targetHeader="Reviewers"\`, \`filterable\`; each row shows the name (truncating) and the person's team in 10px slate-400.`,

  'multi-select': `Build a searchable checkbox multi-select dropdown with removable chips in React + TypeScript + Tailwind CSS.

## Look
- Trigger: a button with the house input recipe, \`flex items-center gap-2 text-left min-h-[34px]\`. Left, a wrapping chip area (\`flex-1 flex flex-wrap gap-1 min-w-0\`) — the placeholder in slate-400 when empty — so the current selection is readable without opening. Right, a 14px ChevronDown in slate-400 that rotates 180° while open.
- Chip: \`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700\`, dark \`bg-indigo-500/15 text-indigo-300\`, ending in a 10px X (hover indigo-900 / dark indigo-100) that removes it without opening the panel (stop propagation). A disabled option's chip has no X.
- Panel: absolute \`z-50 mt-1 w-full\`, opaque floating surface, \`p-2 max-h-72 overflow-y-auto\` with a thin scrollbar.
  - A filter input at the top ONLY when searchable and there are more than 6 options: 12px Search icon at \`left-2.5\`, input \`pl-7 py-1.5\`, placeholder "Filter…", \`mb-2\`.
  - Options \`space-y-1.5\`, each a checkbox row with \`px-1\`: a 16px square (\`rounded border-2\`, unchecked white / slate-300 border, dark slate-800 / slate-600; checked indigo-600 fill with a white 12px Check), label \`text-xs font-medium text-slate-700 dark:text-slate-200\`, and an optional ⓘ hint tooltip beside the label.
  - No matches: "No options" (11px slate-400).

## Behaviour
- Clicking an option toggles it; the panel stays open for more picks. Filter is a case-insensitive substring on the label.
- A \`disabled\` option stays VISIBLE (at 50% opacity, not toggleable, chip not removable) rather than being filtered out — "exists, not yours to give", e.g. a role above the actor's rank.
- Values may be numbers or strings (\`type OptionValue = string | number\`), so numeric ids and string slugs both work.

## API
\`options: { value: OptionValue; label: string; hint?: string; disabled?: boolean }[]\`, \`selected: OptionValue[]\`, \`onChange(next: OptionValue[])\`, \`placeholder = 'Select…'\`, \`searchable = true\`, \`emptyLabel = 'No options'\`. Export the \`Option\` and \`OptionValue\` types.

## Demo
"Select teams" over Engineering, Research, Design, Support, Operations — one instance keyed by numeric ids (seeded [1, 3]) and one by lowercase slugs (seeded ['engineering']), each with the current value echoed below.`,

  'autocomplete-dropdown': `Build a single-select autocomplete combobox (type-ahead, optional option groups) component in React + TypeScript + Tailwind CSS.

## Look
- ONE text input is the whole trigger (house input recipe, \`pr-12\`): closed it shows the selected option's label (or the placeholder); open it is the search box, emptied, with \`searchPlaceholder\`. Disabled: \`opacity-60 cursor-not-allowed\`.
- Right side (\`absolute inset-y-0 right-0 pr-2 flex items-center\`): a clear X button (14px, \`p-1\`, slate-400 → hover slate-600 / dark slate-300), only while a value is set; then a 14px lucide ChevronsUpDown in slate-400.
- Panel: absolute \`z-50 w-full\`, opaque floating surface, \`p-1 text-xs\`, max-height 15rem scrolling with a thin scrollbar, 200ms fade-in. Opens below (\`mt-1\`) or, when fewer than 280px of viewport remain under the input at focus time, above (\`bottom-full mb-1\`).
- Options (\`space-y-0.5\`): \`relative py-1.5 pl-7 pr-3 rounded-lg cursor-pointer select-none transition-colors\`, label truncating. The highlighted row is \`bg-indigo-600 text-white\`; others slate-700 / dark slate-200. The selected option has a 14px Check at \`left-2\`, vertically centred (it inherits the text colour, so white on the highlight).
- Groups: if any option carries \`group\`, render groups in first-appearance order under STICKY headings (\`sticky top-0 z-10 bg-white dark:bg-slate-800 px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500\`); otherwise a flat list.
- No matches for a non-empty query: \`emptyText\` in 11px slate-400, \`px-3 py-2\`.

## Behaviour
- Focus opens the panel, clears the query, and highlights the currently selected option (else the first) — so Enter is a no-op instead of silently reassigning the field.
- Filter: case-insensitive substring on the label OR the group, so typing a group name narrows to that group.
- Typing resets the highlight to the first match. ArrowUp/ArrowDown wrap, Home/End jump, the highlighted row scrolls into view (\`block: 'nearest'\`). Keyboard order is RENDER order (grouped). Hover moves the highlight too, so mouse and keyboard always agree on what Enter will pick.
- Enter commits the highlighted option with \`preventDefault\`, so it never submits a surrounding \`<form>\`. Arrow keys or Enter on a focused, closed input reopen it.
- Picking the already-selected option deselects it (\`onChange(null)\`). Picking closes and clears the query. Escape closes and blurs; Tab closes without committing.

## API
\`options: { value: string; label: string; group?: string }[]\`, \`value: string | null\`, \`onChange(value: string | null)\`, \`placeholder\`, \`searchPlaceholder\`, \`emptyText\` (all required strings), \`className?\`, \`disabled = false\`. Named export \`AutocompleteDropdown\`.

## Accessibility
Input \`role="combobox"\`, \`aria-haspopup="listbox"\`, \`aria-expanded\`, \`autoComplete="off"\`; list \`role="listbox"\`; rows \`role="option"\` with \`aria-selected\` on the chosen one; clear button "Clear selection".

## Demo
"Select a person" over people grouped by team — Engineering: Ada Lovelace, Grace Hopper, Barbara Liskov; Research: Alan Turing, Katherine J., Edsger D.; Design: Alan Kay, Margaret H. — search placeholder "Search people…", empty text "No one matches", selected value echoed below.`,

  'tree-multi-select-dropdown': `Build a tree multi-select dropdown (nested options, add-from-tree / remove-from-Selected) component in React + TypeScript + Tailwind CSS.

## Look
- Trigger: a div with the house input recipe, \`flex items-center gap-2 cursor-text\`, containing a borderless transparent text input (\`flex-1 min-w-0 text-xs\`), a clear-all X (14px slate-400, only with a selection and not disabled) and a 14px ChevronsUpDown. Clicking anywhere on it focuses the input. Closed, the input shows a summary ("12 members selected", "3 teams, 12 members selected") or the placeholder "All"; open, it is the search box ("Search..."). Disabled: \`opacity-60 cursor-not-allowed\`.
- Panel: absolute \`z-50 mt-1 w-full min-w-[440px]\`, opaque floating surface with \`p-0 overflow-hidden\`, fade-in, split into two equal columns \`grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700\`, each \`p-2 min-w-0\` with a \`max-h-80\` scrolling list.
- LEFT, the tree of what is still available: rows \`flex items-center gap-1.5 py-1.5 pr-2 rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 cursor-pointer\`, indented \`depth * 18 + 4\`px. A branch starts with a chevron toggle (ChevronRight / ChevronDown 14px, slate-400 → hover slate-600); a leaf gets an 18px spacer instead. Label truncates; a 14px Plus in slate-400 at the end. Empty: "No options found." (11px slate-400).
- RIGHT, "Selected": a header with the section-title text "Selected (N)" and, when non-empty, a "Clear all" link (11px medium indigo-600 → hover indigo-800; dark indigo-400 → indigo-300). Selected leaves are grouped under their IMMEDIATE parent's label, groups sorted alphabetically, leaves in selection order; top-level leaves get no heading.
  - Group heading: 10px semibold uppercase wide-tracking slate-400 (dark slate-500) with a 13px X that fades in on hover (turns rose-500); clicking the heading removes the whole group.
  - Leaf chip (indented \`pl-2\`, \`space-y-0.5\`): \`flex justify-between px-2 py-1.5 text-xs rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100\`, dark \`bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20\`, with a 13px X; clicking removes it. Empty: "None selected".

## Behaviour
- The value is a flat array of LEAF ids only; branches are sugar. Clicking a leaf row adds it; clicking a branch row adds every leaf still beneath it. The chevron only expands/collapses (stop propagation).
- The tree is add-only and re-derived from \`value\` every render: selected leaves are pruned out, and a branch disappears once all its leaves are picked. No checkboxes, no indeterminate state. Removing in the Selected column makes items reappear in the tree.
- Branches start collapsed and toggle independently. Search (trimmed, case-insensitive) keeps a node if its label matches or any descendant's does; a branch matching ITSELF keeps its whole subtree. While searching every branch is expanded. Search never resurfaces a selected leaf, and the Selected column ignores it.
- Summary: \`countLabels = { leaf: 'member', mid?: 'team' }\` → "N members selected"; with \`mid\`, prefix the number of second-level branches holding at least one selected leaf. Pluralise by adding "s" when the count isn't 1; default leaf word "item".
- Focus opens. Escape in the input closes, clears the search and blurs; outside click closes and clears the search. Becoming disabled closes it.

## API
\`options: TreeOption[]\` with \`TreeOption = { id: string; label: string; children?: TreeOption[] }\` — ids unique across the WHOLE tree, so prefix branch ids (\`r-1\`, \`t-1\`); \`value: string[]\`, \`onChange(value)\`, \`placeholder = 'All'\`, \`searchPlaceholder = 'Search...'\`, \`emptyText = 'No options found.'\`, \`className\`, \`disabled = false\`, \`countLabels?\`. Named export.

## Accessibility
Chevrons are buttons labelled "Expand <label>" / "Collapse <label>"; the trigger's X is "Clear all selected".

## Demo
Region → Team → Person, placeholder "Region / Team / Person": Europe (Engineering: Ada Lovelace, Grace Hopper, Barbara Liskov; Research: Alan Turing, Katherine J., Edsger D.), Americas (Design: Alan Kay, Margaret H.), Asia-Pacific (Operations: no people, so a leaf). Echo the selected ids below.`,

  'combined-filter-dropdown': `Build a combined multi-category filter dropdown (two-level flyout, batched Apply, selection chips beside the trigger) component in React + TypeScript + Tailwind CSS.

## Look
- Root \`flex items-center gap-2 min-w-0\`: the trigger, then the selection display on the same line.
- Trigger: \`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium bg-white dark:bg-slate-800\`; idle \`border-slate-300 text-slate-700 hover:bg-slate-50\` (dark \`border-slate-700 text-slate-200 hover:bg-slate-700\`); open \`border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-700 dark:text-indigo-300\`. Holds a 16px Filter icon, the label, a count pill when anything is selected (\`min-w-[1.25rem] h-5 px-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700\`, dark \`bg-slate-800/60 text-slate-300\`) and a 16px ChevronDown that rotates 180° when open.
- Panel: absolute \`z-50 mt-1 flex flex-col rounded-xl shadow-lg\`, \`bg-white/95 dark:bg-slate-800/95 border border-slate-200/70 dark:border-slate-700/70\`, fade-in. Left-anchored, but flips to \`right-0\` when the trigger's left edge plus the panel's REAL width would pass the viewport minus 8px; re-measured when level 2 opens and on resize.
  - Level 1 (\`w-56 p-1.5\`): header "Filter by" (xs semibold slate-400) with a "Clear all" link (xs medium indigo-600, hover indigo-800); then a \`max-h-[28rem]\` list of category buttons \`w-full flex justify-between px-2.5 py-2 rounded-lg text-sm\` — idle slate-700 hover slate-50 (dark hover slate-700/50), active \`bg-indigo-50 text-indigo-700\` (dark \`bg-indigo-900/30 text-indigo-300\`). On the right: a small count pill (\`h-[1.125rem] text-[0.65rem]\`, same greys) when it has picks — or, for a single-select category, the chosen option's label (xs slate-500, max 9rem) — then a 14px ChevronRight.
  - Level 2 opens as a SIBLING column to the right (both stay visible): \`border-l p-3\`, \`w-[26rem]\` (\`w-56\` for single-select). Header: ChevronLeft back button, the category label (xs semibold uppercase slate-500), a "Clear" text button (xs slate-400) when it has picks.
  - Footer across the whole panel (\`border-t px-3 py-2\`, right-aligned): Cancel (ghost, text-sm) and Apply (indigo-600, \`px-4 py-1.5 text-sm\`; disabled \`bg-slate-300 text-slate-500\`, dark \`bg-slate-700 text-slate-400\`) — disabled until the draft differs from the committed value.
- Multi-select level 2: a search box only when options exceed \`searchThreshold\` (13px Search icon, \`pl-7 py-1.5 text-sm rounded-lg border\`, "Search <label>..."), then \`grid grid-cols-2 divide-x\`: **Available** (header with a "Select all" link) and **Selected (N)**, each \`max-h-[22rem]\` scrolling. Rows \`flex justify-between px-2 py-1.5 rounded-lg text-sm\`: available rows end in a 13px slate-400 Plus; selected rows are \`bg-slate-100\` (dark \`bg-slate-800/60\`) ending in a 13px X. Empty: "No options found." / "None selected".
- Available-row hover is the ONE place categories are colour-coded, cycling by category index through iOS system colours at 10% (dark: their dark variants at 15%): #007AFF, #34C759, #5856D6, #FF9500, #FF2D55, #AF52DE, #FF3B30, #5AC8FA, #FFCC00. Everything else is neutral grey.
- Single-select level 2: one radio list, no split/search/Select all/Clear. Each row has a 14px ring (slate-300; checked indigo-500 with a 6px indigo-500 dot); checked row \`bg-indigo-50 text-indigo-700 font-medium\`.

## Selection display (only when a multi-select category has picks)
- \`chips\` (default): one pill per selected option, \`pl-2 pr-1 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700\` (dark \`bg-slate-800/60 text-slate-300\`), reading "Region: Europe" with the prefix at 70% opacity, truncating at 11rem, with an 11px X. Then an underlined "Clear all" (xs slate-500). The row NEVER wraps: measure every chip in a hidden, invisible, absolutely-positioned copy and the row's width with a ResizeObserver; if it doesn't all fit, show as many chips as fit before a "+N more" pill that opens a \`w-64 max-h-80\` popover of the rest, clustered by category (grey dot + 0.65rem uppercase heading, chips without the prefix) with Clear all at the foot. Render no chips until measured (no flash), and don't put \`overflow-hidden\` on the row — it would clip that popover.
- \`summary\`: one fixed-height button (xs slate-600, hover slate-100, 12px ChevronDown) such as "Europe · 2 teams" — one picked option shows its label, several show a count; \`hideFromSummary\` categories are skipped. It opens a \`w-72\` popover of removable chips under 11px uppercase headings plus a full-width Clear all. For crowded toolbars: it never reflows its neighbours.

## Behaviour
- BATCHED: opening snapshots \`value\` into a draft (resync only on closed→open); everything inside the flyout edits the draft; Apply calls \`onChange(groupKey, ids)\` once per category that actually changed (order-independent, ids compared as strings) and closes. Cancel, outside click and the trigger discard the draft. So a page's fetch fires once per Apply, not per click.
- Removing a chip, or Clear all beside the trigger, commits immediately.
- Escape steps level 2 → level 1, then closes. Clicking the active category collapses level 2; reopening starts at level 1.
- Search splits on whitespace, commas and semicolons and matches ANY term; pasted multi-line/tabbed text (a spreadsheet column) is normalised to spaces, so paste + Select all picks a list in two moves. With more than one term show an ⓘ tooltip: "Matching any of N terms — “Select all” picks every match." Select all adds exactly the visible Available rows; search never narrows Selected.
- Nesting (\`parentId\`, one level): parents listed collapsed, each with a 13px chevron (rotates 90°) as a SIBLING button of the row, children indented \`pl-7\`, childless parents reserving the chevron's 21px. Search overrides collapse both ways (matching parent shows all its children; matching child shows under its parent). \`contextLabel\` replaces the label wherever the option appears without its parent.
- Single-select categories: clicking replaces the value (never empty); excluded from the trigger count, chips and Clear all.
- \`onClearEverything\`: when given, level 1's Clear all is always shown and calls it immediately (clearing the owner's other filters — search, dates) and closes; otherwise it clears the draft.

## API
\`groups: { key; label; options: { id: string | number; label; parentId?; contextLabel? }[]; searchPlaceholder?; emptyText?; singleSelect?; hideFromSummary? }[]\`, \`value: Record<string, (string | number)[]>\`, \`onChange(groupKey, ids)\`, \`triggerLabel = 'Filters'\`, \`searchThreshold = 8\`, \`selectionDisplay: 'chips' | 'summary' = 'chips'\`, \`onClearEverything?\`, \`className\`.

## Demo
Region (Europe, Americas, Asia-Pacific) and Team (Engineering and Research under Europe, Design and Support under Americas, Operations under Asia-Pacific, via \`parentId\`), seeded with Europe + Engineering + Research so the chips show.`,

  'date-picker': `Build a single-date picker (field trigger + calendar popover) component in React + TypeScript + Tailwind CSS, using date-fns.

## Look
- Trigger: a button with the house input recipe, \`pr-8 text-left\`: "August 15, 2026" (\`MMMM d, yyyy\`) or the placeholder in slate-400 (dark slate-500), truncating; a 14px lucide Calendar in slate-400 pinned at the right (\`pr-3\`). Disabled: \`opacity-60 cursor-not-allowed\` and it won't open.
- Popover: absolute \`z-50 mt-1 w-full min-w-[16rem]\`, opaque floating surface, \`p-3\`, 200ms fade-in.
- Header (\`mb-3 flex items-center justify-between\`): prev/next month icon buttons — \`p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600\`, dark \`hover:bg-slate-700 hover:text-indigo-400\`, \`active:scale-90\`, 16px chevrons; next disabled at \`opacity-30\` with no hover — around "August 2026" in \`text-sm font-semibold text-slate-800 dark:text-slate-200\`.
- Weekday row Su Mo Tu We Th Fr Sa: \`grid grid-cols-7 gap-1 mb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500\`, each \`py-1\`.
- Day grid \`grid-cols-7 gap-1\`: whole weeks, Sunday first, from the week holding the 1st to the week holding the last day (5–6 rows). Each day is a 32px circle, \`h-8 w-8 rounded-full text-xs justify-self-center transition-all active:scale-90\`:
  - in-month slate-700 / dark slate-300; padding days from the neighbouring months slate-300 / dark slate-600 but still clickable;
  - disabled in-month days \`opacity-40 cursor-not-allowed\`;
  - today (when not selected) \`border border-indigo-500 font-semibold\`;
  - selected \`bg-indigo-600 text-white font-semibold\`;
  - otherwise \`hover:bg-slate-100 dark:hover:bg-slate-700\`.

## Behaviour
- Opens on the month of \`value\` (or the current month). Clicking an enabled day calls \`onChange(day)\` and closes; disabled days do nothing.
- \`isDateDisabled\` defaults to "no future days". The next-month arrow disables once the next month is wholly in the future — no browsing into future months at all, not just greyed days.
- "Today" is taken in a fixed business timezone (UTC+8, Asia/Singapore) rather than the browser's, so every viewer agrees which day is today; compare calendar dates only, never clock time, so today itself is never disabled. Days are local-field \`Date\`s at midnight.

## API
\`value: Date | null\`, \`onChange(date: Date | null)\`, \`placeholder = 'Select a date'\`, \`className\`, \`disabled = false\`, \`isDateDisabled?(date) => boolean\`. Named and default export.

## Demo
A "Pick a date" field seeded with Aug 15, 2026.`,

  'date-range-picker': `Build a two-month date range picker with quick presets and Apply/Cancel in React + TypeScript + Tailwind CSS, using date-fns.

## Look
- Trigger: a button with the house input recipe; label left (\`min-w-0 truncate\`), 14px CalendarDays in slate-400 right. The label is compact so the control fits ~13rem on a filter bar: same year "Mar 30 - Mar 31, 2026", across years "Dec 28, 2025 - Jan 3, 2026", half-picked "Mar 30 - Select end date", empty the placeholder in slate-400. A \`title\` carries the full "MMM d, yyyy - MMM d, yyyy".
- Popover: absolute \`right-0 top-full z-50 mt-1\` (right-anchored, so it opens inward from a toolbar's right end), opaque floating surface, \`p-4\`; \`w-[300px]\` on mobile, \`sm:w-auto sm:min-w-[800px]\`.
- Body \`flex flex-col sm:flex-row gap-4 sm:gap-8\`:
  - Left (\`sm:w-48\`): section title "Quick Selection" and presets — a 2-column grid on mobile, a stack from \`sm\`: \`px-3 py-1.5 text-xs text-left rounded-lg text-slate-600 hover:bg-indigo-50 hover:text-indigo-700\` (dark \`text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-300\`). Today, Yesterday, Last 7 Days (today and the 6 before), Week to Date (Sunday start), Month to Date, This Month (whole month), Last Month. Below, once anything is picked, a \`p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg\` box: section title "Selected Range" and the full range in xs slate-800 / dark slate-200.
  - Right: a nav row — prev/next icon buttons (\`p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600\`, \`active:scale-90\`, next disabled at 30%) around "August 2026 → September 2026" (sm semibold; the arrow and second month hidden on mobile) — then two month grids side by side (\`gap-8\`, the second hidden below \`sm\`), each titled "August 2026" (\`mb-3 text-center text-sm font-semibold\`).
- Month grid: weekday row Su…Sa (\`grid-cols-7 gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400\`), then Sunday-first whole weeks of 32px round day buttons (\`h-8 w-8 rounded-full text-xs active:scale-90\`, slate-700, hover slate-100 / dark slate-700). Today: \`border border-indigo-500 font-semibold\`. Both range ends \`bg-indigo-600 text-white font-semibold\`; days between \`bg-indigo-100 text-indigo-800\` (dark \`bg-indigo-900/50 text-indigo-200\`). Future days \`opacity-40 cursor-not-allowed\`. Padding days from neighbouring months are slate-300, DISABLED and never highlighted — the same day is clickable on the other grid.
- Footer \`mt-4 pt-4 border-t border-slate-200 dark:border-slate-700\`, \`sm:flex-row justify-between\` (\`flex-col-reverse\` on mobile): "Clear Selection" text button (xs slate-600) left; Cancel (\`border border-slate-300 dark:border-slate-600\`, xs medium, hover slate-50 / dark slate-700) and primary Apply (\`px-4\`) right.

## Behaviour
- First click sets the start, the second the end (swapped if earlier), a third starts over. Between the two clicks, hovering previews the range live.
- Future days are disabled and the next arrow stops once the month after the right-hand grid would be in the future. Opens with the start's month on the left (else the current month).
- DRAFT until Apply: clicks, presets and Clear Selection edit only the draft. Apply emits \`onChange({ from, to })\` and closes. Apply is enabled when both ends are set OR both are empty (applying empty is how the filter is cleared) — disabled only for a half-made range. Cancel, outside click, Escape and re-clicking the trigger roll the draft back to \`value\`, so the trigger never shows a range that isn't applied.
- Re-sync when \`value.from\` / \`value.to\` change, compared as strings so a new-but-equal object doesn't stomp an in-progress pick.
- The value is an inclusive \`{ from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }\`, \`''\` when unset — what URL filters carry. Parse into local-field Dates (reject impossible days like 2026-02-31) and format back from local fields, never \`toISOString()\`, which shifts the day.
- "Today" (for presets, the today ring and the future guard) is taken in a fixed business timezone (UTC+8), not the browser's, so every viewer agrees.

## API
\`value: { from: string; to: string }\`, \`onChange(range)\` (Apply only, never per click), \`className\`, \`placeholder = 'All dates'\`. Default export; export the \`IsoDayRange\` type.

## Demo
Seeded \`{ from: '2026-08-01', to: '2026-08-31' }\`, with the applied value echoed below.`,

  'month-picker': `Build a single-month picker (a \`YYYY-MM\` value, clearable) component in React + TypeScript + Tailwind CSS.

## Look
- Trigger: a button with the house input recipe; inside \`flex justify-between gap-2\`. Left: 14px CalendarDays (slate-400) and "Aug 2026" (en-US short month + year) or the placeholder in slate-400 / dark slate-500, truncating. Right: a 14px X (slate-400, hover slate-600 / dark slate-300; only when clearable, set and not disabled — clears without opening) and a 14px ChevronDown rotating 180° over 200ms while open. Disabled: \`opacity-60 cursor-not-allowed\`.
- Popover: absolute \`right-0 top-full z-50 mt-1 w-72 origin-top-right\`, opaque floating surface, \`p-3\`, a springy scale-in (0.22s \`cubic-bezier(0.34, 1.56, 0.64, 1)\`, from opacity 0, scale 0.96, translateY 6px).
- Year header (\`mb-3 flex items-center justify-between\`): prev/next icon buttons (\`p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600\`, dark \`hover:bg-slate-700 hover:text-indigo-400\`, \`active:scale-90\`, 16px chevrons) around the year in \`text-sm font-semibold text-slate-800 dark:text-slate-100\`. Next is disabled (\`opacity-30\`, no hover) at the current year.
- Month grid \`grid grid-cols-3 gap-1.5\`, Jan…Dec, each \`h-8 text-xs rounded-lg transition-all active:scale-95\`: selected \`bg-indigo-600 text-white font-semibold\`; disabled \`text-slate-300 dark:text-slate-600 cursor-not-allowed\`; otherwise \`text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700\`.
- With \`allowClear\`, a footer (\`mt-3 pt-3 border-t border-slate-200 dark:border-slate-700\`) with a right-aligned "Clear" text button (\`px-3 py-2 text-xs text-slate-600 hover:text-slate-800\`, dark slate-400 → slate-200).

## Behaviour
- The value is \`'YYYY-MM'\` (1-based month) or null. One click on a month emits it and closes. Browsing years selects nothing; the browsed year follows the value when it changes and otherwise starts at the current year.
- \`isMonthDisabled(year, month0)\` defaults to "no future months"; a form can tighten it (e.g. also exclude the current month, whose figures aren't final). "Current" is taken in a fixed business timezone (UTC+8), so the year arrow and the disabled months unlock at the same moment for every viewer.
- \`disabled\` locks the field — no opening, no clearing (for read-only identity fields).

## API
\`value: string | null | undefined\`, \`onChange(value: string | null)\`, \`placeholder = 'Select month'\`, \`className\`, \`allowClear = true\`, \`disabled = false\`, \`isMonthDisabled?(year, month) => boolean\`. Default export.

## Demo
Seeded \`'2026-08'\` with \`allowClear\`, the applied value echoed below.`,

  'month-range-picker': `Build a month-range picker (From / To month grids with quick presets, Apply/Cancel) component in React + TypeScript + Tailwind CSS.

## Look
- Trigger: a button with the house input recipe: 14px CalendarDays (slate-400), then "Mar 2026 - Aug 2026" or "Select month range" in slate-400, truncating; a 14px ChevronDown at the right rotating 180° over 200ms while open.
- Popover: absolute \`right-0 top-full z-50 mt-1 origin-top-right\`, opaque floating surface, \`p-4\`, a springy scale-in (0.22s \`cubic-bezier(0.34, 1.56, 0.64, 1)\`); \`w-[300px]\`, \`sm:w-auto sm:min-w-[560px]\`.
- Heading (\`mb-3 pb-3 border-b border-slate-200 dark:border-slate-700\`): \`text-sm font-semibold text-slate-800 dark:text-slate-100\` — "Mar 2026 – Aug 2026" or "Select a month range".
- Body \`flex flex-col sm:flex-row gap-4 sm:gap-8\`:
  - Left (\`sm:w-36\`): section title "Quick Selection", then preset chips (\`flex flex-wrap sm:flex-col gap-1.5\`): \`rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-left text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-700\` (dark \`hover:bg-indigo-500/10 hover:text-indigo-300\`). This Month, Last Month, Last 3 Months, Last 6 Months (both counting the current month), Year to Date, Last Year.
  - Right: \`grid grid-cols-1 sm:grid-cols-2 gap-6\` of two month grids titled "From" and "To" (section-title style, \`mb-2\`).
- Month grid: a year header — prev/next icon buttons (\`p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600\`, \`active:scale-90\`; next disabled at 30% at the current year) around the year (sm semibold) — over \`grid-cols-3 gap-1.5\` of Jan…Dec, \`h-8 text-xs rounded-lg active:scale-95\`: selected \`bg-indigo-600 text-white font-semibold\`; future months \`text-slate-300 dark:text-slate-600 cursor-not-allowed\`; otherwise slate-700, hover slate-100 / dark slate-700.
- Footer (\`mt-4 pt-4 border-t\`, reversed column on mobile): "Clear Selection" text button (xs slate-600) left; Cancel (bordered, xs medium) and primary Apply (\`px-4\`) right.

## Behaviour
- Picking on From sets the start to that month's 1st; on To, the end to the last millisecond of that month. Stepping a grid's year also moves that side's pick to the same month in the new year. A preset sets both ends and moves both grids to them.
- Apply needs both ends; it calls \`onDateRangeChange({ startDate, endDate })\` and closes. Clear Selection empties the draft (Apply stays disabled until both are picked again). Cancel, outside click and Escape just close without emitting.
- Boundaries are UTC-anchored: build with \`Date.UTC\`, read with \`getUTC*\`, and label with \`toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })\` — mixing local and UTC fields shifts a month for viewers away from UTC. "This month" and the future guard come from a fixed business timezone (UTC+8), not the browser.
- \`initialRange\` may arrive with ISO strings (rehydrated from JSON storage) — coerce to Date. Re-sync when it changes.

## API
\`onDateRangeChange(range: { startDate: Date | null; endDate: Date | null })\`, \`initialRange?\` (same shape), \`className\`. Default export.

## Demo
Seeded with Mar 2026 – Aug 2026, feeding the applied range back in as \`initialRange\`.`,

  'month-grid': `Build a bare 12-month grid with a year stepper (the building block for month pickers) in React + TypeScript + Tailwind CSS.

## Look
- Full width. Header \`mb-3 flex items-center justify-between\`: previous/next-year icon buttons — \`p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600\`, dark \`hover:bg-slate-700 hover:text-indigo-400\`, \`transition-colors active:scale-90\`, 16px ChevronLeft/Right — around the year in \`text-sm font-semibold text-slate-800 dark:text-slate-100\`. The next button is disabled at \`year >= maxYear\`: \`disabled:opacity-30\` with no hover change.
- Grid \`grid grid-cols-3 gap-1.5\` of the 12 short month names (en-US: Jan … Dec), each a button \`h-8 text-xs rounded-lg transition-all active:scale-95\`:
  - selected (the shown year equals \`selectedYear\` and the index equals \`selectedMonth\`): \`bg-indigo-600 text-white font-semibold\`;
  - disabled: \`text-slate-300 dark:text-slate-600 cursor-not-allowed\`;
  - otherwise \`text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700\`.

## Behaviour
- Stateless and fully controlled: the BROWSED year (\`year\`) is separate from the selection, so stepping years never selects anything by itself — the owner decides. One click picks; no wheels or scrolling.
- \`maxYear\` defaults to the current year taken in a fixed business timezone (UTC+8), so the arrow unlocks the new year at the same moment for every viewer. Months are 0-indexed.
- Export the \`MONTH_LABELS\` array too.

## API
\`year: number\`, \`selectedYear: number\`, \`selectedMonth: number\` (pass -1 for none), \`onYearChange(year)\`, \`onPick(year, month)\`, \`isMonthDisabled?(year, month) => boolean\` (default none), \`maxYear?\`. Named export \`MonthGrid\`.

## Demo
In a \`max-w-xs\` box: browsing 2026 with August selected; clicking a month moves the selection.`,

  'day-grid': `Build a bare month-of-days calendar grid with a weekday header (the building block for date pickers) in React + TypeScript + Tailwind CSS, using date-fns.

## Look
- Full width. Optional title "July 2026" (\`MMMM yyyy\`): \`mb-3 text-center text-sm font-semibold text-slate-800 dark:text-slate-200\`.
- Weekday row Su Mo Tu We Th Fr Sa: \`mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500\`, each \`py-1\`.
- Days \`grid grid-cols-7 gap-1\`: whole weeks, Sunday first, from the week containing the 1st to the week containing the last day (5–6 rows). Each is a button \`flex h-8 w-8 items-center justify-center justify-self-center rounded-full text-xs transition-all active:scale-90\`:
  - in-month \`text-slate-700 dark:text-slate-300\`; padding days from neighbouring months \`text-slate-300 dark:text-slate-600\`;
  - disabled in-month days \`opacity-40\`; disabled or inert days \`cursor-not-allowed\`;
  - today (when not selected) \`border border-indigo-500 font-semibold\`;
  - selected \`bg-indigo-600 font-semibold text-white\`;
  - in range \`bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200\`;
  - plain enabled days \`hover:bg-slate-100 dark:hover:bg-slate-700\`.

## Behaviour
- Stateless: the owner says which days are selected / in range through \`dayState(day)\` and receives \`onPick(day)\` and, as the pointer crosses days, \`onHover(day)\` (for a range preview).
- \`outsideDays\`: \`'muted'\` (default) keeps padding days clickable, so last month's 30th is one click away; \`'disabled'\` makes them inert AND never highlighted — for a two-month range picker, where the same day is already clickable on the neighbouring grid and highlighting both reads as two selections.
- \`isDayDisabled\` defaults to "no future days". "Today" is taken in a fixed business timezone (UTC+8) rather than the browser's, compared by calendar date only. Days in and out are local-field \`Date\`s at midnight.
- Also export \`WEEKDAY_LABELS\` and \`calendarDays(month)\` (every day of the Sunday-first whole-week grid).

## API
\`month: Date\` (any day in it), \`onPick(day)\`, \`onHover?(day)\`, \`isDayDisabled?(day) => boolean\`, \`dayState?(day) => { selected?: boolean; inRange?: boolean }\`, \`outsideDays: 'muted' | 'disabled' = 'muted'\`, \`title = false\`. Named export \`DayGrid\`.

## Demo
In a \`max-w-xs\` box: July 2026 with its title, every day enabled, July 14 selected; clicking a day moves the selection.`,

  'filter-panel': `Build a Lark-Base-style filter builder popover (\`[field] [operator] [value]\` rows, match all / any, drafts until Apply) in React + TypeScript + Tailwind CSS.

## Look
- Trigger: a 32px icon-only toolbar button (\`h-8 w-8 rounded-lg\`, 16px lucide Filter). Idle \`text-slate-500 hover:bg-slate-100 hover:text-slate-800\` (dark \`text-slate-400 hover:bg-slate-700/60 hover:text-slate-100\`); TINTED while open or while any condition is applied: \`bg-indigo-100 text-indigo-600\` (dark \`bg-indigo-500/20 text-indigo-300\`), so the view's state reads at a glance. With conditions, a count bubble on the corner: \`absolute -right-0.5 -top-0.5 h-3.5 min-w-3.5 rounded-full bg-indigo-600 px-1 text-[9px] font-semibold leading-none text-white ring-2 ring-white dark:ring-slate-800\`. \`title\` / \`aria-label\` like "Filter — 2 conditions"; \`aria-expanded\`.
- Panel: absolute \`left-0 top-full z-50 mt-1 origin-top-left\`, opaque floating surface, \`p-3\`, springy scale-in (0.22s), width 580px inline, capped \`max-w-[calc(100vw-2rem)]\` — the row skeleton is 430px and the value column needs 150px for a date input.
- Header (\`mb-2 flex items-center gap-2 text-xs text-slate-500\`): the title (semibold slate-700), then, pushed right, "Matching [all ▾] of the conditions" with a compact select (\`w-auto py-1\`).
- Empty: \`rounded-lg bg-slate-50 dark:bg-slate-900/40 px-3 py-4 text-center text-xs text-slate-400\` — "No conditions. Every row is shown."
- Rows (\`space-y-1.5\`), each \`flex items-center gap-1.5\`: a joiner (\`w-10 text-right text-[11px] text-slate-400\`: "Where" on the first row, then "and" / "or" by match mode, so the list reads as one sentence), field select \`w-44\`, operator select \`w-36\`, value control \`flex-1 min-w-0\`, and a remove X (\`p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-rose-600\`). Controls are house inputs at \`py-1.5 text-xs\`.
- Footer (\`mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2\`): "+ Add condition" text button (\`px-2 py-1 rounded text-xs font-medium text-indigo-600 hover:bg-indigo-50\`, dark \`text-indigo-400 hover:bg-indigo-950/40\`, disabled 40%) — at the 20-condition limit an ⓘ tooltip beside it says "20 conditions is the limit." — then, right-aligned, a ghost "Clear all" and a primary "Apply".

## Operators by field kind
text / select: is, is not, contains, doesn't contain, is empty, is not empty · number: is, is not, >, ≥, <, ≤, is empty, is not empty · date: is, is before, is after, is empty, is not empty · bool: is · ref (an id in another table): is, is not, is empty, is not empty.

## Value control, by kind
- "is empty" / "is not empty": no control, just a slate-400 "—" (a disabled box beside it would look broken).
- Field with options: a select ("Select…" + options). For a select field with contains / doesn't contain, a multi-pick dropdown instead: trigger shows "Select…", the one label, or "N selected"; its panel (\`w-64 p-0\`) has a borderless autofocused "Search" input over a \`max-h-56\` list of coloured option pills (\`rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset\`, \`bg-<tone>-50 text-<tone>-700 ring-<tone>-200\`, dark \`bg-<tone>-950/40 text-<tone>-300 ring-<tone>-900\`; tone from the option or cycled by index); checked rows \`bg-slate-100\` with a Check. Toggling never closes it (handle mousedown + preventDefault). Stored comma-joined.
- bool: select Checked / Unchecked.
- date + "is": a mode select — Exact date, Today, Tomorrow, Yesterday, This week, Last week, This month, Last month, In the past 7 days, Within the next 7 days, In the past 30 days, Within the next 30 days — plus a native date input only for Exact date. Relative modes are stored as \`rel:<mode>\` and resolved when evaluated.
- Otherwise an input of type date / number / text, placeholder "Enter a value".

## Behaviour
- Edits a DRAFT: \`onApply(conditions, match)\` fires only on Apply, and on Clear all (which applies \`[]\`, \`'all'\`). Closing any other way — outside click, Escape, the trigger again — reverts the draft to what is applied. Re-seed the draft when the props change.
- Add appends a row on the first field with its kind's first operator. Changing the field keeps the operator if the new kind allows it, else takes its first; the value clears. Changing the operator clears the value.
- A valued row with an empty value stays on screen but narrows nothing. Ship a pure evaluator alongside: text is case-insensitive; select "is" on an array means "holds this choice"; unknown operators match nothing.

## API
\`fields: { id; label; kind: 'text' | 'number' | 'date' | 'select' | 'bool' | 'ref'; options?: { value; label; tone? }[] }[]\`, \`conditions: { field; op; value: string }[]\`, \`match: 'all' | 'any'\`, \`onApply\`, \`title = 'Filter'\`, \`width = 580\`, \`className\`.

## Demo
A task list (Task, Status: To do / In progress / In review / Done, Priority: Low…Urgent, Team, Owner, Tags, Estimate, Due, Billable) seeded with "Status is not Done"; beside the button "12 of 16 tasks match", and the first six matching titles below.`,

  'condition-groups-builder': `Build an OR-of-AND condition-groups builder (Lark Base automation style) component in React + TypeScript + Tailwind CSS.

## Look
- Container \`space-y-2\`. When there are groups, a right-aligned line (\`text-[11px] text-slate-500\`): "Matching [all ▾] of the conditions in each group" with a compact select (\`w-auto py-1 text-xs\`).
- No groups: an empty strip \`rounded-lg bg-slate-50 dark:bg-slate-900/40 px-3 py-4 text-center text-xs text-slate-400\` — "No conditions — matches every row."
- Each group is a light-grey card \`rounded-lg bg-slate-100 p-2 dark:bg-slate-900/50\`: rows on the left (\`flex-1 min-w-0 space-y-1.5\`), a remove-group X top-right (\`p-1 rounded text-slate-400 hover:bg-slate-200 hover:text-rose-600\`, dark hover bg slate-700). An empty group shows \`rounded bg-white dark:bg-slate-800/60 px-2 py-2 text-center text-[11px] text-slate-400\` — "No conditions in this group." Under the rows, an add button reading "+ And" or "+ Or" to match the mode (12px Plus).
- Between groups (\`my-1.5\`): two \`h-px flex-1 bg-slate-200 dark:bg-slate-700\` rules around an "OR" label (11px medium uppercase tracking-wide slate-400). A LABEL, never a control — groups are always OR'd.
- At the foot: "+ Add condition group".
- Add buttons: \`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50\`, dark \`text-indigo-400 hover:bg-indigo-950/40\`, disabled 40%.
- A condition row: \`flex items-center gap-1.5\` — joiner (\`w-10 text-right text-[11px] text-slate-400\`; blank on a group's first row, the card already says where it sits; then "and" / "or"), field select \`w-44\`, operator select \`w-36\`, value control \`flex-1 min-w-0\`, remove X (\`p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-rose-600\`). Controls are house inputs at \`py-1.5 text-xs\`.

## Row rules
- Operators by kind — text / select: is, is not, contains, doesn't contain, is empty, is not empty; number: is, is not, >, ≥, <, ≤, is empty, is not empty; date: is, is before, is after, is empty, is not empty; bool: is; ref: is, is not, is empty, is not empty.
- Value control: a slate-400 "—" for is empty / is not empty; a select of the options when the field has them (for a select field with contains / doesn't contain, a multi-pick dropdown of coloured option pills with a search box, stored comma-joined); Checked / Unchecked for bool; for date + is, a mode select (Exact date, Today, Tomorrow, Yesterday, This / Last week, This / Last month, past / next 7 and 30 days) with a date input only for Exact date (relative stored as \`rel:<mode>\`); otherwise a date / number / text input, "Enter a value".
- A new row takes the first field and its first operator. Changing the field keeps the operator if the new kind allows it, else its first; the value clears. Changing the operator clears the value.

## Behaviour
- STATELESS and controlled: every edit calls \`onChange(groups, matchMode)\`; the owner keeps the draft and decides what a change means. New groups start empty.
- One shared \`matchMode\` joins the rows inside every group. Limits: 10 groups, 20 rows per group — the add buttons disable there, and when there are no fields.
- Ship the evaluator alongside: a row set matches if any group's rows match all / any; no groups match everything; an EMPTY group also matches everything, so allow it while editing but have an owner that saves refuse it. Half-built rows (valued operator, empty value) are skipped.

## API
\`fields: { id; label; kind: 'text' | 'number' | 'date' | 'select' | 'bool' | 'ref'; options?: { value; label; tone? }[] }[]\`, \`groups: { conditions: { field; op; value: string }[] }[]\`, \`matchMode: 'all' | 'any'\`, \`onChange(groups, matchMode)\`, \`emptyText = 'No conditions — matches every row.'\`.

## Demo
Over a task list's fields (Task, Status, Priority, Team, Owner, Tags, Estimate, Due, Billable), in \`max-w-2xl\`: "Priority is Urgent" OR ("Status is In review" and "Billable is Checked"), with "N of 16 tasks match." underneath.`,
};
