/**
 * Public surface of the library.
 *
 * Everything is re-exported from one place so a consumer writes
 * `import { Button, DataTable } from '<lib>/components'` rather than tracking
 * which folder each component lives in. The folders organise the source for
 * people reading it; they are not part of the API.
 */

// layout
export { default as Alert } from './layout/Alert';
export { default as Avatar } from './layout/Avatar';
export { default as Breadcrumbs } from './layout/Breadcrumbs';
export { default as Button } from './layout/Button';
export { default as Card } from './layout/Card';
export { default as EmptyState } from './layout/EmptyState';
export { default as IdleLogout } from './layout/IdleLogout';
export { default as MenuIcon } from './layout/MenuIcon';
export { ICON_MAP, ICON_NAMES, resolveMenuIcon } from './layout/MenuIcon';
export { default as NavMenu } from './layout/NavMenu';
export type { NavItem, NavOrientation, NavSection } from './layout/NavMenu';
export { default as Sidebar } from './layout/Sidebar';
export { default as Splitter } from './layout/Splitter';
export { default as Tabs } from './layout/Tabs';
export type { Tab } from './layout/Tabs';
export { default as ThemeScript } from './layout/ThemeScript';
export { default as ThemeSettings } from './layout/ThemeSettings';
export { default as Topbar } from './layout/Topbar';
export { default as UserDropdown } from './layout/UserDropdown';
export type { DropdownUser } from './layout/UserDropdown';

// overlay
export { default as ConfirmPopover } from './overlay/ConfirmPopover';
export { default as Drawer } from './overlay/Drawer';
export { Modal } from './overlay/Modal';
export { default as NotificationBell } from './overlay/NotificationBell';
export { default as NotificationCard } from './overlay/NotificationCard';
export type { HeaderNotification } from './overlay/NotificationCard';
export { default as Tooltip } from './overlay/Tooltip';
export { InfoTooltip } from './overlay/Tooltip';
export type { TooltipPlacement, TooltipVariant } from './overlay/Tooltip';

// form
export { default as Checkbox } from './form/Checkbox';
export { AutocompleteDropdown } from './form/AutocompleteDropdown';
export { CombinedFilterDropdown } from './form/CombinedFilterDropdown';
export type { FilterGroup, FilterOption, FilterValue } from './form/CombinedFilterDropdown';
export { default as DatePicker } from './form/DatePicker';
export { default as DateRangePicker } from './form/DateRangePicker';
export type { IsoDayRange } from './form/DateRangePicker';
export { default as Field } from './form/Field';
export { Input, Select, Textarea } from './form/Field';
export { MonthGrid, MONTH_LABELS } from './form/MonthGrid';
export { DayGrid, calendarDays, WEEKDAY_LABELS } from './form/DayGrid';
export type { DayState } from './form/DayGrid';
export { default as MonthPicker } from './form/MonthPicker';
export { default as MonthRangePicker } from './form/MonthRangePicker';
export { default as MultiSelect } from './form/MultiSelect';
export type { Option, OptionValue } from './form/MultiSelect';
export { default as PickList } from './form/PickList';
export type { PickListValue } from './form/PickList';
export { default as ToggleSwitch } from './form/ToggleSwitch';
export { TreeMultiSelectDropdown } from './form/TreeMultiSelectDropdown';
export type { TreeOption } from './form/TreeMultiSelectDropdown';

// table
export { default as AccountCell } from './table/AccountCell';
export { default as DataTable } from './table/DataTable';
export type { Column } from './table/DataTable';
export { default as EditableCell } from './table/EditableCell';
export { default as Pagination } from './table/Pagination';
export type { PaginationNavigation, PaginationVariant } from './table/Pagination';
export { default as PasteableGrid } from './table/PasteableGrid';
export type { PasteableGridColumn, PasteableGridHandle } from './table/PasteableGrid';
export { default as SaveAllBar } from './table/SaveAllBar';
export { default as SortableList } from './table/SortableList';

// data
export { default as ActivityFeed } from './data/ActivityFeed';
export type { FeedEvent } from './data/ActivityFeed';
export { default as Badge } from './data/Badge';
export type { BadgeTone } from './data/Badge';
export { default as KpiTile } from './data/KpiTile';
export { Delta } from './data/KpiTile';
export { default as Progress } from './data/Progress';
export { default as RankedBars } from './data/RankedBars';
export { default as RetentionChart } from './data/RetentionChart';
export { default as Skeleton } from './data/Skeleton';
export { default as StatusBar } from './data/StatusBar';
export { default as StatusSteps } from './data/StatusSteps';
export { default as TrendChart } from './data/TrendChart';
export { compactCurrency, compactNumber, fullCurrency, percent, useChartTheme } from './data/chartTheme';
export type { DashboardData, Metrics, RankedRow, RetentionTrendPoint, TrendPoint } from './data/types';

// media
export { default as MediaLibrary } from './media/MediaLibrary';
export type { MediaItem } from './media/MediaLibrary';

// lib
export { pageRange } from '../lib/page-range';
export type { PageToken } from '../lib/page-range';

// ---- Lark-Base-style grid (ticket-management port) ----
export { default as FilterPanel, ConditionRow, ValueInput, joinerFor, blankCondition, nextConditionForField } from './form/FilterPanel';
export { default as ConditionGroupsBuilder } from './form/ConditionGroupsBuilder';
export { default as GroupPanel } from './form/GroupPanel';
export { default as SortPanel } from './form/SortPanel';
export { default as FieldsPanel, EMPTY_LAYOUT, arrangeColumns } from './form/FieldsPanel';
export type { FieldColumn, FieldLayout } from './form/FieldsPanel';
export type { SortableColumn } from './form/SortPanel';
export { default as ColorRulesPanel, SwatchPicker } from './form/ColorRulesPanel';
export { default as FieldEditor, FieldTypeIcon } from './form/FieldEditor';
export { default as BaseGrid, EMPTY_VIEW, columnFromField } from './table/BaseGrid';
export { default as BaseTable, DEFAULT_VIEWS } from './table/BaseTable';
export type { SavedView } from './table/BaseTable';
export { default as ViewTabs } from './table/ViewTabs';
export type { ViewTab, ViewMode } from './table/ViewTabs';
export type { GridColumn, GridView, HistoryEntry } from './table/BaseGrid';
export { default as GroupBandRow, INDENT_STEP } from './table/GroupBandRow';
export { default as OptionPill, OptionPills, optionTone } from './data/OptionPill';
export { default as AnchoredPanel, anchorOf, closestPanelRect } from './overlay/AnchoredPanel';
export type { Anchor } from './overlay/AnchoredPanel';

// ---- Charts ----
export { default as ChartCard, ChartTooltip } from './data/ChartCard';
export type { ChartTableColumn } from './data/ChartCard';
export { default as BarChart } from './data/BarChart';
export { default as LineChart, AreaChart } from './data/LineChart';
export { default as DonutChart } from './data/DonutChart';
export type { DonutSlice } from './data/DonutChart';
export { default as ScatterChart } from './data/ScatterChart';
export type { ScatterPoint, ScatterGroup } from './data/ScatterChart';
export { default as Heatmap } from './data/Heatmap';
export { default as FunnelChart } from './data/FunnelChart';
export type { FunnelStage } from './data/FunnelChart';
export { default as DivergingBars } from './data/DivergingBars';
export type { DivergingItem } from './data/DivergingBars';
export { default as Sparkline } from './data/Sparkline';
export { seriesColor } from './data/chartSeries';
export type { ChartSeries } from './data/chartSeries';
export { chartPalette, useChartPalette } from './data/chartTheme';

// ---- Form inputs (PrimeReact set) ----
export { default as InputColor, hexToHsv, hsvToHex } from './form/InputColor';
export { default as FloatLabel } from './form/FloatLabel';
export { default as IftaLabel } from './form/IftaLabel';
export { default as CascadeSelect } from './form/CascadeSelect';
export type { CascadeOption } from './form/CascadeSelect';
export { default as MultilevelDialog, useDialogStack } from './overlay/MultilevelDialog';
export type { DialogEntry, DialogLevel, DialogStackApi } from './overlay/MultilevelDialog';

// ---- Data & media (PrimeReact set) ----
export { default as Tree } from './data/Tree';
export type { TreeNode, TreeSelectionMode } from './data/Tree';
export { default as OrganizationChart } from './data/OrganizationChart';
export type { OrgChartNode } from './data/OrganizationChart';
export { default as Carousel } from './media/Carousel';
export type { CarouselResponsiveOption } from './media/Carousel';
export { default as Gallery } from './media/Gallery';
export type { GalleryImage } from './media/Gallery';

// ---- Layout & actions (PrimeReact set) ----
export { default as Fieldset } from './layout/Fieldset';
export { default as Divider } from './layout/Divider';
export { default as Accordion } from './layout/Accordion';
export type { AccordionItem } from './layout/Accordion';
export { default as ButtonGroup, SegmentedControl } from './layout/ButtonGroup';
export type { SegmentedOption } from './layout/ButtonGroup';
export { default as SplitButton } from './layout/SplitButton';
export type { SplitButtonItem } from './layout/SplitButton';
export { default as ContextMenu, useContextMenu } from './overlay/ContextMenu';
export type { ContextMenuItem } from './overlay/ContextMenu';
export { default as SpeedDial } from './overlay/SpeedDial';
export type { SpeedDialAction } from './overlay/SpeedDial';
export { default as Slider } from './form/Slider';
export type { SliderValue } from './form/Slider';
export { default as RadioGroup, RadioButton } from './form/RadioGroup';
export type { RadioOption } from './form/RadioGroup';
export { default as Knob } from './form/Knob';
export { default as InputGroup, InputGroupAddon } from './form/InputGroup';
export { default as IconField } from './form/IconField';
export { default as InputMask, applyMask } from './form/InputMask';
export type { MaskChange } from './form/InputMask';
export { default as InputPassword, passwordStrength } from './form/InputPassword';
export { default as PivotTable, PivotFieldList } from './table/PivotTable';
export type { PivotField } from './table/PivotTable';
export { pivot, pivotColumns, pivotHeaderRows, EMPTY_PIVOT, PIVOT_AGGS } from '../lib/pivot';
export type { PivotConfig, PivotValue, PivotAgg } from '../lib/pivot';
export { default as MultilevelMenu, selectedLists } from './overlay/MultilevelMenu';
export type { MultilevelMenuNode, MultilevelMenuOption, MultilevelMenuValue } from './overlay/MultilevelMenu';
export { default as Layout, DEFAULT_APPEARANCE } from './layout/Layout';
export type { ShellAccent, ShellAppearance, ShellCrumb, ShellHeaderMenu, ShellNavItem, ShellNavSection, ShellUser, ShellUserMenuItem } from './layout/Layout';
