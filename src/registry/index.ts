/**
 * The catalog: one entry per component, grouped by what the component is FOR.
 *
 * Plain data — no 'use client', no component imports — because the preview
 * route's `generateStaticParams` is a server component and reaches a client
 * module as an opaque reference rather than as the array. Demos live in
 * `demos/map.tsx`, keyed by slug.
 */

import { MENU_GROUPS } from './groups';

export type Category = 'layout' | 'overlay' | 'form' | 'table' | 'data' | 'media';

export type Entry = {
  slug: string;
  name: string;
  category: Category;
  /** Path within this package — also what the code view reads. */
  path: string;
  blurb: string;
  /**
   * Which function the props table should document, when it is not the one
   * named after the component.
   *
   * A compound component has no `Paginator(props)` to read — the props live on
   * `Paginator.Root`. Without this the parser finds nothing and the page shows
   * an empty table, which reads as "this takes no props" rather than "look
   * somewhere else".
   */
  propsOf?: string;
};

export const CATEGORY_LABEL: Record<Category, string> = {
  layout: 'Layout & shell',
  overlay: 'Overlays',
  form: 'Form & input',
  table: 'Tables & lists',
  data: 'Data display',
  media: 'Media',
};

export const CATEGORY_ORDER: Category[] = ['layout', 'form', 'table', 'data', 'overlay', 'media'];

const e =
  (category: Category, dir: string) =>
  (name: string, blurb: string, opts: { file?: string; propsOf?: string } = {}): Entry => ({
    slug: name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(),
    name,
    category,
    path: `src/components/${dir}/${opts.file ?? `${name}.tsx`}`,
    blurb,
    propsOf: opts.propsOf,
  });

const layout = e('layout', 'layout');
const overlay = e('overlay', 'overlay');
const form = e('form', 'form');
const table = e('table', 'table');
const data = e('data', 'data');
const media = e('media', 'media');

export const ENTRIES: Entry[] = [
  // ---- Layout & shell ----
  layout('NavMenu', 'Documentation-style side menu — plain text links under uppercase section headings, with an optional filter.'),
  layout('Sidebar', 'Collapsible nav over a menu tree, nesting to any depth, with a mobile off-canvas and an icon-rail mode.'),
  layout('Topbar', 'Header bar composing breadcrumbs, notifications, appearance and account.'),
  layout('Breadcrumbs', 'Path-derived trail; segments are titled from a label map.'),
  layout('Splitter', 'Two resizable panes with a draggable, keyboard-nudgeable divider.'),
  layout('Tabs', 'Accessible tablist with roving focus and arrow-key navigation.'),
  layout('Card', 'The frosted panel surface, with optional header, actions and footer.'),
  layout('Button', 'Four variants, three sizes, and a loading state that also disables.'),
  layout('Alert', 'Inline message for a condition the user must read before acting.'),
  layout('Avatar', 'Circular avatar with an initials fallback derived from name or email.'),
  layout('EmptyState', 'Two-line placeholder for an empty list or table.'),
  layout('MenuIcon', 'Resolves a stored icon NAME to a component, with a neutral fallback.'),
  layout('UserDropdown', 'Account menu showing roles and department, with sign-out.'),
  layout('ThemeSettings', 'Appearance panel: colour scheme and row density.'),
  layout('ThemeScript', 'Inline pre-paint script that applies the stored theme before hydration, killing the dark-mode flash.'),
  layout('IdleLogout', 'Headless inactivity timer that calls a sign-out action.'),
  layout('Fieldset', 'A bordered group with a legend, optionally toggleable to collapse its content.'),
  layout('Divider', 'Horizontal or vertical rule, solid, dashed or dotted, with optional aligned content.'),
  layout('Accordion', 'Stacked sections that expand one at a time or several, with the WAI accordion keyboard.'),
  layout('ButtonGroup', 'Joins buttons into one segmented control; also a single-choice SegmentedControl.'),
  layout('SplitButton', 'A primary action joined to a caret that opens a menu of secondary actions.'),
  layout('Layout', 'The whole app frame in one file: a sidebar that collapses to a rail and widens over the page on hover, breadcrumbs from the nav, header menus, theme settings (mode, accent, density, fluid or boxed), a user menu, and a drawer when narrow.'),

  // ---- Form & input ----
  form('Field', 'Label, control and error wired together — ids and ARIA included.'),
  form('Checkbox', 'Styled checkbox with label and an optional hint tooltip.'),
  form('ToggleSwitch', 'Labelled on/off switch.'),
  form('PickList', 'Two lists with transfer controls: pick from a set, then order what you picked.'),
  form('MultiSelect', 'Searchable multi-select with removable chips; disabled options stay visible.'),
  form('AutocompleteDropdown', 'Single-select with type-ahead and optional option grouping.'),
  form('TreeMultiSelectDropdown', 'Multi-select over a nested tree; ticking a parent selects its subtree.'),
  form('CombinedFilterDropdown', 'Multi-group filter in one popover: parent-child narrowing, a measured chip row, or a fixed-height summary.'),
  form('DatePicker', 'Single-date calendar with a per-date disable predicate.'),
  form('DateRangePicker', 'Two-month range calendar with quick options. Controlled on ISO day strings.'),
  form('MonthPicker', 'Single-month select on `YYYY-MM` strings, clearable.'),
  form('MonthRangePicker', 'Month-granularity range picker with quick options.'),
  form('MonthGrid', 'The bare 12-month grid with a year stepper, shared by both month pickers.'),
  form('DayGrid', 'The bare month-of-days grid with a weekday header, shared by both date pickers.'),
  form('FilterPanel', 'Lark-Base-style filter builder: `[field] [operator] [value]` rows matching all or any, with a value control chosen by the field kind. Drafts until Apply.'),
  form('ConditionGroupsBuilder', 'OR-of-AND condition groups, drawn from the filter panel\'s own rows. Stateless.'),
  form('GroupPanel', 'Group by up to three fields, each with its own direction; levels reorder by drag.'),
  form('SortPanel', 'Sort by up to three columns, each direction labelled by what it means ("Old → New", not "desc").'),
  form('FieldsPanel', 'The Lark-Base "Fields" panel: search columns, show or hide each with an eye, drag to reorder, click a name to edit it, and "New field" at the foot. Commits as you click.'),
  form('FieldEditor', 'The "Edit field" form: a name, a type from the full list, and options with colours. Opens as an AnchoredPanel where the column is.'),
  form('ColorRulesPanel', 'Conditional colouring: a filter predicate with a tone, painting a cell or a whole row. First match wins.'),
  form('InputColor', 'Colour picker: a saturation square, hue and optional alpha sliders, a hex field and preset swatches; inline or behind a swatch trigger.'),
  form('FloatLabel', 'A label that rests inside the field as its placeholder and floats up on focus or value, in over, in and on-border variants. Pure CSS.'),
  form('IftaLabel', 'An in-field, top-aligned label: small label and control inside one bordered box with one focus ring.'),
  form('CascadeSelect', 'Single select over nested options: groups open flyout submenus, only leaves are picked, full keyboard.'),
  form('Slider', 'Single value or range, horizontal or vertical, with pointer drag, full keyboard and an optional value readout.'),
  form('RadioGroup', 'A group of radio buttons over real inputs, with a roving tab stop, arrow keys, hints and disabled options.'),
  form('Knob', 'A circular dial input: drag around the arc or use the keyboard, with a value template in the centre.'),
  form('InputGroup', 'Joins addons (text, icons, buttons, selects) before and after an input into one bordered control.'),
  form('IconField', 'An input with an icon on either side, an optional clickable right-hand button, and a loading spinner.'),
  form('InputMask', 'Masked input for phone numbers, dates and codes: 9, a and * slots, literals skipped as you type, and both the formatted and raw value.'),
  form('InputPassword', 'Password field with a show/hide toggle, a strength meter and an optional requirements checklist.'),

  // ---- Tables & lists ----
  table('DataTable', 'Sorting, optional selection and optional paging over a column array.'),
  table('PasteableGrid', 'Spreadsheet-style grid: paste a block of cells, map columns by header alias, keyboard navigation, column summaries.'),
  table('EditableCell', 'Click-to-edit cell with dirty state, commit/cancel keys and a no-jump overlay input.'),
  table('Pagination', 'Numbered page links with ellipsis gaps, or a page-number input. Four props for the common layout, or composable parts when the layout is the point.'),
  table('SortableList', 'Drag-to-reorder list, generic over the item type, with an explicit grip.'),
  table('SaveAllBar', 'Sticky bar shown while rows are dirty: save all or discard all.'),
  table('AccountCell', 'Identity cell: a name with its group and category beneath.'),
  table('BaseGrid', 'A Lark-Base-style grid: fields, filter, group, sort and colour over a table with in-place cell editing, a record panel per row, pinned rows, frozen columns, and headers you drag to reorder or resize.'),
  table('BaseTable', 'The whole Lark-Base table in one component: saved views (grid or board) in tabs over a BaseGrid, with every grid feature. The unit to copy into another project.'),
  table('ViewTabs', 'Tabs of saved views: mode icon, rename in place, duplicate, delete, drag to reorder, and + for a grid or a board.'),
  table('GroupBandRow', 'The group header band inside a table: label pinned to the visible edge, a real count and a collapse chevron.'),
  table('PivotTable', 'A spreadsheet-style pivot: drag fields into Filters, Columns, Rows and Data in a side panel that leaves the table its full width; nested headers, subtotals, grand totals, collapsible groups, value filters and CSV export.'),

  // ---- Data display ----
  data('KpiTile', 'A KPI card with tone, delta arrow and optional subtitle.'),
  data('RankedBars', 'The same ranking as horizontal bars, for short named lists.'),
  data('TrendChart', 'Multi-series daily line chart.'),
  data('RetentionChart', 'Monthly rate chart that leaves null periods as gaps rather than zeroes.'),
  data('ActivityFeed', 'Reverse-chronological event list with per-type phrasing.'),
  data('StatusBar', 'Proportional bar of per-status counts.'),
  data('StatusSteps', 'Horizontal progress dots for a lifecycle, including skipped states.'),
  data('Badge', 'Status pill in five tones, with an optional state dot.'),
  data('Progress', 'Determinate bar with a clamped value and optional label.'),
  data('Skeleton', 'Loading placeholder in text, circle and rect shapes.'),
  data('OptionPill', 'A select option as a tinted pill from the seventeen-tone palette, or a removable chip.'),
  data('chartTheme', 'Hooks returning the validated chart palette (categorical, ordinal, sequential, diverging) and the axis, grid and tooltip colours for the active scheme, plus number formatters.', { file: 'chartTheme.ts' }),
  data('ChartCard', 'The frame every chart sits in: title with an ⓘ hint, legend, and a chart/table toggle so no value is only readable by hovering.'),
  data('BarChart', 'Columns or bars comparing magnitude across categories — grouped, stacked, or horizontal for long names.'),
  data('LineChart', 'Lines for change over time on one axis, with a crosshair tooltip; can emphasise one series and grey the rest.'),
  data('AreaChart', 'A trend where the filled volume matters — one series, or several stacked into a total.', { file: 'LineChart.tsx' }),
  data('DonutChart', 'Part-to-whole at a glance, capped at six slices with the rest folded into Other; every slice listed with value and share.'),
  data('ScatterChart', 'Two measures per item and how they relate, for up to three groups.'),
  data('Heatmap', 'Magnitude over a grid — activity by weekday and hour — in one hue from near-zero to most.'),
  data('FunnelChart', 'Stages that each narrow the last, with conversion from the previous stage and from the top.'),
  data('DivergingBars', 'Above or below a baseline — change against target — in two opposing hues around a zero line.'),
  data('Sparkline', 'A word-sized trend for a stat tile or table cell: grey history, accented current point.'),
  data('Tree', 'Hierarchical list with expand/collapse, single, multiple or tri-state checkbox selection, a filter that keeps ancestors, lazy children and the full WAI tree keyboard.'),
  data('OrganizationChart', 'Top-down chart of people or units joined by connector lines, with collapsible subtrees, selection and a custom node template.'),

  // ---- Overlays ----
  overlay('Modal', 'Centred dialog in ten sizes: drag it by the title bar, resize it from any edge or corner; Escape closes it, a click outside does not.'),
  overlay('Drawer', 'Right-hand slide-over, resizable by its left edge, with a footer slot.'),
  overlay('Tooltip', 'Portal tooltip that flips on overflow, opens on hover AND focus, and wires `aria-describedby`.'),
  overlay('ConfirmPopover', 'Inline confirm anchored to its trigger, portalled so a table shell cannot clip it.'),
  overlay('AnchoredPanel', 'A dialog that opens beside what it edits and can open another beside itself: placement avoids open panels, Escape closes only the topmost.'),
  overlay('NotificationBell', 'Unread badge and dropdown, with optimistic mark-as-read.'),
  overlay('NotificationCard', 'One notification row: type icon, actor, reference and relative time.'),
  overlay('MultilevelDialog', 'A dialog that opens dialogs: one backdrop, levels underneath recede, a breadcrumb and back arrow, one Escape closes one level; drag the stack, resize each level, and a click outside closes nothing.'),
  overlay('ContextMenu', 'Right-click menu with icons, shortcuts, separators and nested submenus; portalled and kept inside the viewport. useContextMenu wires table rows.'),
  overlay('SpeedDial', 'A floating action button that fans out into actions in a line, circle, semi-circle or quarter-circle.'),
  overlay('MultilevelMenu', 'A cascading filter menu: each level opens beside the last, level with its row, and ends in searchable lists to tick — Select all, Clear, counts per branch, full keyboard, flips at screen edges.'),

  // ---- Media ----
  media('MediaLibrary', 'Searchable media picker with grid and list views, drag-and-drop upload, and icon fallbacks.'),
  media('Carousel', 'Paged slider over any items: several or fractional per view with a peek, start or centre alignment, variable-size slides, circular, autoplay with a pause button, dots, swipe, vertical, and responsive to its own width.'),
  media('Gallery', 'Image gallery with a main stage, a thumbnail strip on any side, captions, indicators and a fullscreen lightbox.'),
];

export const BY_SLUG = new Map(ENTRIES.map((x) => [x.slug, x]));

const BY_NAME = new Map(ENTRIES.map((x) => [x.name, x]));

/** The catalog in menu order, under `MENU_GROUPS` headings. Unknown names are skipped; the registry check reports them. */
export const GROUPED_ENTRIES: Array<{ label: string; entries: Entry[] }> = MENU_GROUPS.map((g) => ({
  label: g.label,
  entries: g.names.flatMap((n) => BY_NAME.get(n) ?? []),
})).filter((g) => g.entries.length > 0);

/**
 * Acronyms that must not be split or title-cased into nonsense.
 * `KpiTile` -> "KPI Tile", not "Kpi Tile".
 */
const ACRONYMS: Record<string, string> = { Kpi: 'KPI', Th: 'TH', Url: 'URL', Ui: 'UI' };

/**
 * A component's name as READING MATTER — "Data Table", not "DataTable".
 *
 * Used in the navigation, where fifty-eight run-together identifiers are a wall
 * of camel case that the eye has to decode word by word. NOT used for the page
 * heading or the import line: there the PascalCase name is the thing you
 * actually type, and prettifying it would be a lie about the API.
 */
export function displayName(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(' ')
    .map((word) => ACRONYMS[word] ?? word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
