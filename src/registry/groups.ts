/**
 * How the gallery's menu and its browse-all page group the catalog: by what a
 * person is LOOKING FOR, in the order they build a page — shell, then inputs,
 * then tables and charts, then what floats over them.
 *
 * Deliberately not the source folders. The folders say where a file lives and
 * are part of every import path, so they stay coarse and stable; a folder of
 * thirty-two "form" components mixed date pickers with the Lark-style filter
 * panels, and "data" put a donut chart next to a badge. Regrouping here moves
 * nothing on disk and breaks no import.
 *
 * Plain data, like the catalog: `scripts/registry-check.mjs` reads the
 * `group(…)` calls with a regex and fails when a component is in no group or
 * in two, since either way it silently vanishes from, or doubles in, the menu.
 */

/**
 * How wide a demo sits in its preview card. By default it is centred at its
 * own size. `fill` takes the card's full width — things as wide as their
 * container by nature (a chart, a table, a top bar), which would collapse or
 * look shrunken at their content's width. `field` is centred with a 24rem
 * floor — inputs and pickers, whose `w-full` field has no width of its own
 * and would otherwise shrink to its placeholder.
 */
export type DemoWidth = 'auto' | 'field' | 'fill';

/** Per group: a width for every demo in it, or per name — with `'*'` for the rest of the group. */
type Widths = Exclude<DemoWidth, 'auto'> | Partial<Record<string, DemoWidth>>;

export type MenuGroup = { label: string; names: string[]; widths?: Widths };

const group = (label: string, names: string[], widths?: Widths): MenuGroup => ({ label, names, widths });

export const MENU_GROUPS: MenuGroup[] = [
  group('Shell & navigation', ['Layout', 'Sidebar', 'Topbar', 'NavMenu', 'Breadcrumbs', 'Tabs', 'UserDropdown', 'MenuIcon', 'ThemeSettings', 'ThemeScript', 'IdleLogout'], { Layout: 'fill', Sidebar: 'fill', Topbar: 'fill', NavMenu: 'fill', Breadcrumbs: 'fill', Tabs: 'fill' }),
  group('Containers', ['Card', 'Splitter', 'Accordion', 'Fieldset', 'Divider'], 'fill'),
  group('Buttons & actions', ['Button', 'ButtonGroup', 'SplitButton', 'SpeedDial']),
  group('Feedback', ['Alert', 'EmptyState', 'Progress', 'Skeleton'], { Alert: 'fill', EmptyState: 'fill', Progress: 'fill', Skeleton: 'fill' }),
  group('Text inputs', ['Field', 'InputGroup', 'IconField', 'FloatLabel', 'IftaLabel', 'InputMask', 'InputPassword', 'InputColor'], 'field'),
  group('Choices', ['Checkbox', 'RadioGroup', 'ToggleSwitch', 'Slider', 'Knob']),
  group('Selects & pickers', ['MultiSelect', 'AutocompleteDropdown', 'CascadeSelect', 'TreeMultiSelectDropdown', 'PickList'], 'field'),
  // DateRangePicker fills: its 800px calendar hangs off the trigger's RIGHT
  // edge, so from a centred field it reaches back over the sidebar.
  group('Dates', ['DatePicker', 'DateRangePicker', 'MonthPicker', 'MonthRangePicker', 'DayGrid', 'MonthGrid'], { '*': 'field', DateRangePicker: 'fill' }),
  group('Filters & views', ['CombinedFilterDropdown', 'MultilevelMenu', 'FilterPanel', 'ConditionGroupsBuilder', 'SortPanel', 'GroupPanel', 'FieldsPanel', 'FieldEditor', 'ColorRulesPanel', 'ViewTabs'], 'fill'),
  group('Tables', ['DataTable', 'BaseTable', 'BaseGrid', 'PivotTable', 'PasteableGrid'], 'fill'),
  group('Table parts', ['Pagination', 'EditableCell', 'AccountCell', 'GroupBandRow', 'SaveAllBar'], 'fill'),
  group('Lists & trees', ['SortableList', 'Tree', 'OrganizationChart'], { SortableList: 'field' }),
  group('Charts', ['ChartCard', 'BarChart', 'LineChart', 'AreaChart', 'DonutChart', 'ScatterChart', 'Heatmap', 'FunnelChart', 'DivergingBars', 'Sparkline', 'TrendChart', 'RetentionChart', 'RankedBars', 'chartTheme'], 'fill'),
  group('Metrics & status', ['KpiTile', 'StatusBar', 'StatusSteps', 'Badge', 'OptionPill', 'Avatar'], { KpiTile: 'fill', StatusBar: 'fill', StatusSteps: 'fill' }),
  group('Dialogs & popovers', ['Modal', 'MultilevelDialog', 'Drawer', 'AnchoredPanel', 'ConfirmPopover', 'ContextMenu', 'Tooltip']),
  group('Notifications & activity', ['NotificationBell', 'NotificationCard', 'ActivityFeed'], { ActivityFeed: 'fill' }),
  group('Media', ['MediaLibrary', 'Carousel', 'Gallery'], 'fill'),
];

/** A demo's width in its preview card — see `DemoWidth`. */
export function demoWidth(name: string): DemoWidth {
  const g = MENU_GROUPS.find((x) => x.names.includes(name));
  if (!g?.widths) return 'auto';
  return typeof g.widths === 'string' ? g.widths : g.widths[name] ?? g.widths['*'] ?? 'auto';
}

/**
 * How many columns a component's tile spans on the browse-all grid — 1x to 4x,
 * by how much room its demo needs to read at thumbnail size. A button reads at
 * 1x; a data grid shrunk into one column is a grey smudge. 3x and 4x are also
 * two rows tall, or a whole table scaled into one short row is a thin strip.
 *
 * Unlisted components are 1x. Names, like the groups, so a rename that misses
 * this map only costs a tile its size.
 */
export type TileSize = 1 | 2 | 3 | 4;

const TILE_SIZES: Partial<Record<string, TileSize>> = {
  // Whole screens.
  Layout: 4, DataTable: 4, BaseTable: 4, BaseGrid: 4, PivotTable: 4, PasteableGrid: 4,
  // Wide by nature: a full bar, a two-month calendar, a builder, a big chart.
  DateRangePicker: 3, ConditionGroupsBuilder: 3,
  TrendChart: 3, Heatmap: 3, OrganizationChart: 3, MediaLibrary: 3, Gallery: 3,
  // Charts, panels and strips that need a card's width to be recognisable.
  Topbar: 2, Sidebar: 2, FilterPanel: 2, NavMenu: 2, Tabs: 2, Card: 2, Splitter: 2, Accordion: 2, Fieldset: 2, Alert: 2, EmptyState: 2,
  PickList: 2, CombinedFilterDropdown: 2, MultilevelMenu: 2, ViewTabs: 2,
  Pagination: 2, GroupBandRow: 2, SaveAllBar: 2, Tree: 2, Carousel: 2,
  ChartCard: 2, BarChart: 2, LineChart: 2, AreaChart: 2, DonutChart: 2, ScatterChart: 2,
  FunnelChart: 2, DivergingBars: 2, RetentionChart: 2, RankedBars: 2,
  KpiTile: 2, StatusBar: 2, StatusSteps: 2, ActivityFeed: 2,
};

export function tileSize(name: string): TileSize {
  return TILE_SIZES[name] ?? 1;
}
