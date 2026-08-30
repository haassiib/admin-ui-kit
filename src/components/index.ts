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
export { default as NotificationBell } from './overlay/NotificationBell';
export { default as NotificationCard } from './overlay/NotificationCard';
export type { HeaderNotification } from './overlay/NotificationCard';
export { default as Tooltip } from './overlay/Tooltip';
export { InfoTooltip } from './overlay/Tooltip';
export type { TooltipPlacement, TooltipVariant } from './overlay/Tooltip';

// form
export { default as Checkbox } from './form/Checkbox';
export type { FilterGroup, FilterOption, FilterValue } from './form/CombinedFilterDropdown';
export { default as DatePicker } from './form/DatePicker';
export { default as DateRangePicker } from './form/DateRangePicker';
export type { IsoDayRange } from './form/DateRangePicker';
export { default as Field } from './form/Field';
export { Input, Select, Textarea } from './form/Field';
export { MONTH_LABELS } from './form/MonthGrid';
export { default as MonthPicker } from './form/MonthPicker';
export { default as MonthRangePicker } from './form/MonthRangePicker';
export { default as MultiSelect } from './form/MultiSelect';
export type { Option, OptionValue } from './form/MultiSelect';
export { default as ToggleSwitch } from './form/ToggleSwitch';
export type { TreeOption } from './form/TreeMultiSelectDropdown';

// table
export { default as AccountCell } from './table/AccountCell';
export { default as DataTable } from './table/DataTable';
export type { Column } from './table/DataTable';
export { default as EditableCell } from './table/EditableCell';
export { default as Pagination } from './table/Pagination';
export type { PaginationVariant } from './table/Pagination';
export { default as PasteableGrid } from './table/PasteableGrid';
export type { PasteableGridColumn, PasteableGridHandle } from './table/PasteableGrid';
export { default as SaveAllBar } from './table/SaveAllBar';
export { default as SortableList } from './table/SortableList';
export { default as SortableTh } from './table/SortableTh';
export { default as UrlPagination } from './table/UrlPagination';

// data
export { default as ActivityFeed } from './data/ActivityFeed';
export type { FeedEvent } from './data/ActivityFeed';
export { default as Badge } from './data/Badge';
export type { BadgeTone } from './data/Badge';
export { default as KpiTile } from './data/KpiTile';
export { Delta } from './data/KpiTile';
export { default as Progress } from './data/Progress';
export { default as RankedBars } from './data/RankedBars';
export { default as RankedTable } from './data/RankedTable';
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

