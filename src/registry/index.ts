/**
 * The catalog: one entry per component, grouped by what the component is FOR.
 *
 * Plain data — no 'use client', no component imports — because the preview
 * route's `generateStaticParams` is a server component and reaches a client
 * module as an opaque reference rather than as the array. Demos live in
 * `demos/map.tsx`, keyed by slug.
 */

export type Category = 'layout' | 'overlay' | 'form' | 'table' | 'data' | 'media';

export type Entry = {
  slug: string;
  name: string;
  category: Category;
  /** Path within this package — also what the code view reads. */
  path: string;
  blurb: string;
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

const e = (category: Category, dir: string) => (name: string, blurb: string, file = `${name}.tsx`): Entry => ({
  slug: name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(),
  name,
  category,
  path: `src/components/${dir}/${file}`,
  blurb,
});

const layout = e('layout', 'layout');
const overlay = e('overlay', 'overlay');
const form = e('form', 'form');
const table = e('table', 'table');
const data = e('data', 'data');
const media = e('media', 'media');

export const ENTRIES: Entry[] = [
  // ---- Layout & shell ----
  layout('AppShell', 'The dashboard frame: sidebar, header and a scrolling content area, with a mobile off-canvas.'),
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

  // ---- Form & input ----
  form('Field', 'Label, control and error wired together — ids and ARIA included.', 'Field.tsx'),
  form('Checkbox', 'Styled checkbox with label and an optional hint tooltip.'),
  form('ToggleSwitch', 'Labelled on/off switch.'),
  form('MultiSelect', 'Searchable multi-select with removable chips; disabled options stay visible.'),
  form('AutocompleteDropdown', 'Single-select with type-ahead and optional option grouping.'),
  form('TreeMultiSelectDropdown', 'Multi-select over a nested tree; ticking a parent selects its subtree.'),
  form('CombinedFilterDropdown', 'Multi-group filter in one popover: parent-child narrowing, a measured chip row, or a fixed-height summary.'),
  form('DatePicker', 'Single-date calendar with a per-date disable predicate.'),
  form('DateRangePicker', 'Two-month range calendar with quick options. Controlled on ISO day strings.'),
  form('MonthPicker', 'Single-month select on `YYYY-MM` strings, clearable.'),
  form('MonthRangePicker', 'Month-granularity range picker with quick options.'),
  form('MonthGrid', 'The bare 12-month grid with a year stepper, shared by both month pickers.'),

  // ---- Tables & lists ----
  table('DataTable', 'Sorting, optional selection and optional paging over a column array.'),
  table('PasteableGrid', 'Spreadsheet-style grid: paste a block of cells, map columns by header alias, keyboard navigation, column summaries.'),
  table('EditableCell', 'Click-to-edit cell with dirty state, commit/cancel keys and a no-jump overlay input.'),
  table('Pagination', 'Page controls and page size, in a bar, a pill, or a floating pill.'),
  table('UrlPagination', 'The same control, driven by the query string instead of callbacks.'),
  table('SortableTh', 'Header cell that cycles asc → desc → unsorted.'),
  table('SortableList', 'Drag-to-reorder list, generic over the item type, with an explicit grip.'),
  table('SaveAllBar', 'Sticky bar shown while rows are dirty: save all or discard all.'),
  table('AccountCell', 'Identity cell: a name with its group and category beneath.'),

  // ---- Data display ----
  data('KpiTile', 'A KPI card with tone, delta arrow and optional subtitle.'),
  data('RankedTable', 'Ranked table of items by value, with share and delta.'),
  data('RankedBars', 'The same ranking as horizontal bars, for short named lists.'),
  data('TrendChart', 'Multi-series daily line chart.'),
  data('RetentionChart', 'Monthly rate chart that leaves null periods as gaps rather than zeroes.'),
  data('ActivityFeed', 'Reverse-chronological event list with per-type phrasing.'),
  data('StatusBar', 'Proportional bar of per-status counts.'),
  data('StatusSteps', 'Horizontal progress dots for a lifecycle, including skipped states.'),
  data('Badge', 'Status pill in five tones, with an optional state dot.'),
  data('Progress', 'Determinate bar with a clamped value and optional label.'),
  data('Skeleton', 'Loading placeholder in text, circle and rect shapes.'),
  data('chartTheme', 'Hook returning chart axis, grid and tooltip colours for the active scheme, plus number formatters.', 'chartTheme.ts'),

  // ---- Overlays ----
  overlay('Modal', 'Centred dialog in four sizes; closes on backdrop and Escape.'),
  overlay('Drawer', 'Right-hand slide-over, resizable by its left edge, with a footer slot.'),
  overlay('Tooltip', 'Portal tooltip that flips on overflow, opens on hover AND focus, and wires `aria-describedby`.'),
  overlay('ConfirmPopover', 'Inline confirm anchored to its trigger, portalled so a table shell cannot clip it.'),
  overlay('NotificationBell', 'Unread badge and dropdown, with optimistic mark-as-read.'),
  overlay('NotificationCard', 'One notification row: type icon, actor, reference and relative time.'),

  // ---- Media ----
  media('MediaLibrary', 'Searchable media picker with grid and list views, drag-and-drop upload, and icon fallbacks.'),
];

export const BY_SLUG = new Map(ENTRIES.map((x) => [x.slug, x]));
