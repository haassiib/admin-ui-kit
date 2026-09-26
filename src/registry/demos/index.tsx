'use client';

/** Live demos — one exported `<Name>Demo` per catalog entry, driving the real
 *  component with real props. */

import { Fragment, useRef, useState } from 'react';
import { Coins, RefreshCw, TrendingUp, Users, Zap } from 'lucide-react';

import Alert from '@/components/layout/Alert';
import NavMenu from '@/components/layout/NavMenu';
import Avatar from '@/components/layout/Avatar';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import Button from '@/components/layout/Button';
import Card from '@/components/layout/Card';
import EmptyState from '@/components/layout/EmptyState';
import IdleLogout from '@/components/layout/IdleLogout';
import MenuIcon from '@/components/layout/MenuIcon';
import Sidebar from '@/components/layout/Sidebar';
import Splitter from '@/components/layout/Splitter';
import Tabs from '@/components/layout/Tabs';
import ThemeSettings from '@/components/layout/ThemeSettings';
import Topbar from '@/components/layout/Topbar';
import UserDropdown from '@/components/layout/UserDropdown';

import ConfirmPopover from '@/components/overlay/ConfirmPopover';
import Drawer from '@/components/overlay/Drawer';
import { Modal } from '@/components/overlay/Modal';
import NotificationBell from '@/components/overlay/NotificationBell';
import NotificationCard from '@/components/overlay/NotificationCard';
import Tooltip, { InfoTooltip } from '@/components/overlay/Tooltip';

import { AutocompleteDropdown } from '@/components/form/AutocompleteDropdown';
import Checkbox from '@/components/form/Checkbox';
import { CombinedFilterDropdown, type FilterValue } from '@/components/form/CombinedFilterDropdown';
import { DatePicker } from '@/components/form/DatePicker';
import DateRangePicker from '@/components/form/DateRangePicker';
import Field, { Input, Select, Textarea } from '@/components/form/Field';
import { MonthGrid } from '@/components/form/MonthGrid';
import { DayGrid } from '@/components/form/DayGrid';
import MonthPicker from '@/components/form/MonthPicker';
import MonthRangePicker from '@/components/form/MonthRangePicker';
import MultiSelect, { type OptionValue } from '@/components/form/MultiSelect';
import PickList, { type PickListValue } from '@/components/form/PickList';
import ToggleSwitch from '@/components/form/ToggleSwitch';
import { TreeMultiSelectDropdown } from '@/components/form/TreeMultiSelectDropdown';

import AccountCell from '@/components/table/AccountCell';
import DataTable, { type Column } from '@/components/table/DataTable';
import EditableCell from '@/components/table/EditableCell';
import Pagination from '@/components/table/Pagination';
import PasteableGrid from '@/components/table/PasteableGrid';
import SaveAllBar from '@/components/table/SaveAllBar';
import SortableList from '@/components/table/SortableList';

import ActivityFeed from '@/components/data/ActivityFeed';
import Badge from '@/components/data/Badge';
import KpiTile from '@/components/data/KpiTile';
import Progress from '@/components/data/Progress';
import RankedBars from '@/components/data/RankedBars';
import RetentionChart from '@/components/data/RetentionChart';
import Skeleton from '@/components/data/Skeleton';
import StatusBar from '@/components/data/StatusBar';
import StatusSteps from '@/components/data/StatusSteps';
import TrendChart from '@/components/data/TrendChart';
import ChartCard from '@/components/data/ChartCard';
import BarChart from '@/components/data/BarChart';
import LineChart, { AreaChart } from '@/components/data/LineChart';
import DonutChart from '@/components/data/DonutChart';
import ScatterChart from '@/components/data/ScatterChart';
import Heatmap from '@/components/data/Heatmap';
import FunnelChart from '@/components/data/FunnelChart';
import DivergingBars from '@/components/data/DivergingBars';
import Sparkline from '@/components/data/Sparkline';
import { compactCurrency, compactNumber } from '@/components/data/chartTheme';

import MediaLibrary from '@/components/media/MediaLibrary';

import FilterPanel from '@/components/form/FilterPanel';
import ConditionGroupsBuilder from '@/components/form/ConditionGroupsBuilder';
import GroupPanel from '@/components/form/GroupPanel';
import SortPanel from '@/components/form/SortPanel';
import FieldsPanel, { type FieldLayout } from '@/components/form/FieldsPanel';
import ColorRulesPanel from '@/components/form/ColorRulesPanel';
import BaseGrid, { columnFromField, type GridColumn, type HistoryEntry } from '@/components/table/BaseGrid';
import BaseTable from '@/components/table/BaseTable';
import ViewTabs, { type ViewTab } from '@/components/table/ViewTabs';
import FieldEditor from '@/components/form/FieldEditor';
import type { FieldDef } from '@/lib/fields';
import GroupBandRow from '@/components/table/GroupBandRow';
import OptionPill, { OptionPills } from '@/components/data/OptionPill';
import AnchoredPanel, { anchorOf, closestPanelRect, type Anchor } from '@/components/overlay/AnchoredPanel';
import { filterRows, groupsMatch, type Condition, type ConditionGroup, type FilterField, type MatchMode, type RowReader } from '@/lib/conditions';
import { resolveRowColors, type ColorRule } from '@/lib/coloring';
import { CELL_TINT, ROW_TINT } from '@/lib/tones';
import type { GroupLevel } from '@/lib/grouping';
import type { SortLevel } from '@/lib/sort';

import {
  DEMO_USER, MEDIA, MENU_TREE, NOTIFICATIONS, PEOPLE, RANKED, REGIONS, RETENTION, TEAMS, TREND,
  TASKS, TASK_COLUMNS, TASK_EXTRA, TASK_HISTORY, TASK_PRIORITY, TASK_STATUS, TASK_TAGS, TASK_VIEWS,
  MRR_BY_PLAN, PLAN_SERIES, TICKETS_BY_TEAM, WAU_BY_REGION, REGION_SERIES, SIGNUPS_BY_CHANNEL, DEALS,
  WEEKDAYS, HOURS, SESSIONS_BY_HOUR, ONBOARDING_FUNNEL, CSAT_VS_TARGET, SPARK_REVENUE, SPARK_CHURN, SPARK_SEATS,
  type Person, type Task,
} from '../fixtures';
import { DemoTable, Row, Variant, useEcho } from './kit';

const noop = async () => {};
const LABELS = { settings: 'Settings', members: 'Members' };

/* ---------------------------------------------------------------- layout --- */

export function SidebarDemo() {
  return (
    <div className="h-[26rem] overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
      <Sidebar items={MENU_TREE} user={DEMO_USER} />
    </div>
  );
}

export function TopbarDemo() {
  return <Topbar labels={LABELS} user={DEMO_USER} notifications={NOTIFICATIONS} unreadCount={2} logoutAction={noop} />;
}

export function BreadcrumbsDemo() {
  return <Breadcrumbs labels={LABELS} />;
}

export function SplitterDemo() {
  const pane = (t: string, s: string) => (
    <div className="h-full p-4">
      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{t}</p>
      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{s}</p>
    </div>
  );
  return (
    <div className="h-72 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
      <Splitter
        initial={35}
        first={pane('Left pane', 'Drag the divider, or focus it and use the arrow keys.')}
        second={
          <Splitter
            direction="vertical"
            initial={60}
            first={pane('Top right', 'Splitters nest.')}
            second={pane('Bottom right', 'Sizes are percentages, so they survive a resize.')}
          />
        }
      />
    </div>
  );
}

export function TabsDemo() {
  return (
    <Tabs
      tabs={[
        { id: 'overview', label: 'Overview' },
        { id: 'members', label: 'Members', badge: PEOPLE.length },
        { id: 'billing', label: 'Billing' },
        { id: 'archive', label: 'Archived', disabled: true },
      ]}
    >
      {(active) => (
        <div className="rounded-lg bg-slate-50 p-4 text-xs text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
          Panel: <strong>{active}</strong>
        </div>
      )}
    </Tabs>
  );
}

export function CardDemo() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Card title="Usage" subtitle="Last 30 days" actions={<Button size="sm" variant="ghost">Export</Button>}>
        <p className="text-xs text-slate-600 dark:text-slate-300">Any content.</p>
      </Card>
      <Card title="Plan" solid footer={<Button size="sm">Upgrade</Button>}>
        <p className="text-xs text-slate-600 dark:text-slate-300">Solid variant, with a footer.</p>
      </Card>
    </div>
  );
}

export function ButtonDemo() {
  const [loading, setLoading] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <Row>
        {(['primary', 'secondary', 'ghost', 'danger'] as const).map((v) => (
          <Variant key={v} label={v}><Button variant={v}>Save changes</Button></Variant>
        ))}
      </Row>
      <Row>
        {(['sm', 'md', 'lg'] as const).map((s) => (
          <Variant key={s} label={s}><Button size={s}>Button</Button></Variant>
        ))}
        <Variant label="loading">
          <Button loading={loading} onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1200); }}>
            Submit
          </Button>
        </Variant>
        <Variant label="disabled"><Button disabled>Unavailable</Button></Variant>
      </Row>
    </div>
  );
}

export function AlertDemo() {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex flex-col gap-2">
      <Alert tone="info" title="Scheduled maintenance">Read replicas are read-only until 02:00 UTC.</Alert>
      <Alert tone="success" title="Invite sent">Alan Turing will receive an email shortly.</Alert>
      <Alert tone="warning" title="Approaching your seat limit">7 of 8 seats in use.</Alert>
      {open && <Alert tone="danger" title="Payment failed" onDismiss={() => setOpen(false)}>Update the card on file to avoid suspension.</Alert>}
    </div>
  );
}

export function AvatarDemo() {
  return (
    <Row>
      {(['sm', 'md', 'lg'] as const).map((s) => (
        <Variant key={s} label={s}><Avatar name={DEMO_USER.name} email={DEMO_USER.email} size={s} /></Variant>
      ))}
      <Variant label="email only"><Avatar email="ops@example.com" size="md" /></Variant>
    </Row>
  );
}

export function EmptyStateDemo() {
  return <Card><EmptyState title="No projects yet" hint="Create one to get started." /></Card>;
}

export function MenuIconDemo() {
  return (
    <Row>
      {['LayoutDashboard', 'Layers', 'Settings', 'Users', 'Shield', 'NoSuchIcon'].map((n) => (
        <Variant key={n} label={n}><MenuIcon name={n} className="h-5 w-5 text-slate-600 dark:text-slate-300" /></Variant>
      ))}
    </Row>
  );
}

export function UserDropdownDemo() {
  return <div className="flex justify-end"><UserDropdown user={DEMO_USER} logoutAction={noop} /></div>;
}

export function ThemeSettingsDemo() {
  return <ThemeSettings />;
}

export function IdleLogoutDemo() {
  return (
    <>
      <IdleLogout logoutAction={noop} />
      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        Headless — arms an inactivity timer and calls `logoutAction` when it fires.
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ form --- */

export function FieldDemo() {
  const [email, setEmail] = useState('not-an-email');
  const invalid = !email.includes('@');
  return (
    <div className="grid max-w-md gap-3">
      <Field label="Full name" required>{(p) => <Input {...p} defaultValue="Ada Lovelace" />}</Field>
      <Field label="Email" error={invalid ? 'Enter a valid email address.' : null}>
        {(p) => <Input {...p} value={email} onChange={(e) => setEmail(e.target.value)} />}
      </Field>
      <Field label="Team" hint="Determines default project access.">
        {(p) => <Select {...p} defaultValue="Engineering">{TEAMS.map((t) => <option key={t.id}>{t.name}</option>)}</Select>}
      </Field>
      <Field label="Notes">{(p) => <Textarea {...p} rows={3} placeholder="Optional" />}</Field>
    </div>
  );
}

export function CheckboxDemo() {
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <Checkbox id="cb1" checked={a} onChange={setA} label="Email me on approval" hint="One email per batch, not per row." />
      <Checkbox id="cb2" name="skip_dupes" checked={b} onChange={setB} label="Skip duplicates" />
      <Checkbox id="cb3" checked={false} onChange={() => {}} label="Locked by policy" disabled />
    </div>
  );
}

export function ToggleSwitchDemo() {
  const [on, setOn] = useState(true);
  return (
    <div className="flex flex-col gap-3">
      <ToggleSwitch id="tg1" checked={on} onChange={setOn} label="Auto-approve trusted members" />
      <ToggleSwitch id="tg2" checked={false} onChange={() => {}} label="Disabled" disabled />
    </div>
  );
}

export function MultiSelectDemo() {
  const [nums, setNums, numEcho] = useEcho<OptionValue[]>([1, 3]);
  const [strs, setStrs, strEcho] = useEcho<OptionValue[]>(['engineering']);
  return (
    <div className="flex flex-col gap-5">
      <Variant label="numeric ids">
        <MultiSelect options={TEAMS.map((t) => ({ value: t.id, label: t.name }))} selected={nums} onChange={setNums} placeholder="Select teams" searchable />
        {numEcho}
      </Variant>
      <Variant label="string slugs">
        <MultiSelect options={TEAMS.map((t) => ({ value: t.name.toLowerCase(), label: t.name }))} selected={strs} onChange={setStrs} placeholder="Select teams" searchable />
        {strEcho}
      </Variant>
    </div>
  );
}

export function AutocompleteDropdownDemo() {
  const [value, setValue, echo] = useEcho<string | null>(null);
  return (
    <>
      <AutocompleteDropdown
        options={PEOPLE.map((p) => ({ value: String(p.id), label: p.name, group: p.team }))}
        value={value}
        onChange={setValue}
        placeholder="Select a person"
        searchPlaceholder="Search people…"
        emptyText="No one matches"
      />
      {echo}
    </>
  );
}

export function TreeMultiSelectDropdownDemo() {
  const [value, setValue, echo] = useEcho<string[]>([]);
  return (
    <>
      <TreeMultiSelectDropdown
        options={REGIONS.map((r) => ({
          id: `r-${r.id}`,
          label: r.name,
          children: TEAMS.filter((t) => t.regionId === r.id).map((t) => ({
            id: `t-${t.id}`,
            label: t.name,
            children: PEOPLE.filter((p) => p.team === t.name).map((p) => ({ id: `p-${p.id}`, label: p.name })),
          })),
        }))}
        value={value}
        onChange={setValue}
        placeholder="Region / Team / Person"
      />
      {echo}
    </>
  );
}

export function CombinedFilterDropdownDemo() {
  const [value, setValue, echo] = useEcho<FilterValue>({ region: [1], team: [1, 2] });
  return (
    <>
      <CombinedFilterDropdown
        groups={[
          { key: 'region', label: 'Region', options: REGIONS.map((r) => ({ id: r.id, label: r.name })) },
          { key: 'team', label: 'Team', options: TEAMS.map((t) => ({ id: t.id, label: t.name, parentId: t.regionId })) },
        ]}
        value={value}
        onChange={(k, ids) => setValue({ ...value, [k]: ids })}
        onClearEverything={() => setValue({ region: [], team: [] })}
      />
      {echo}
    </>
  );
}

export function DatePickerDemo() {
  const [value, setValue] = useState<Date | null>(new Date('2026-08-15'));
  return <DatePicker value={value} onChange={setValue} placeholder="Pick a date" />;
}

export function DateRangePickerDemo() {
  const [value, setValue, echo] = useEcho({ from: '2026-08-01', to: '2026-08-31' });
  return (<><DateRangePicker value={value} onChange={setValue} />{echo}</>);
}

export function MonthPickerDemo() {
  const [value, setValue, echo] = useEcho<string | null>('2026-08');
  return (<><MonthPicker value={value} onChange={setValue} allowClear />{echo}</>);
}

export function MonthRangePickerDemo() {
  const [range, setRange] = useState<{ startDate: Date | null; endDate: Date | null }>({
    startDate: new Date('2026-03-01'), endDate: new Date('2026-08-31'),
  });
  return <MonthRangePicker initialRange={range} onDateRangeChange={setRange} />;
}

export function DayGridDemo() {
  const [picked, setPicked] = useState<Date | null>(new Date(2026, 6, 14));
  return (
    <div className="max-w-xs">
      <DayGrid
        month={new Date(2026, 6, 1)}
        title
        isDayDisabled={() => false}
        onPick={setPicked}
        dayState={(day) => ({ selected: picked?.getTime() === day.getTime() })}
      />
    </div>
  );
}

export function MonthGridDemo() {
  const [year, setYear] = useState(2026);
  const [picked, setPicked] = useState({ year: 2026, month: 7 });
  return (
    <div className="max-w-xs">
      <MonthGrid year={year} selectedYear={picked.year} selectedMonth={picked.month} onYearChange={setYear} onPick={(y, m) => setPicked({ year: y, month: m })} />
    </div>
  );
}

/* ----------------------------------------------------------------- table --- */

const PEOPLE_COLUMNS: Column<(typeof PEOPLE)[number]>[] = [
  { key: 'name', header: 'Name', cell: (p) => <span className="font-medium text-slate-700 dark:text-slate-200">{p.name}</span>, sortValue: (p) => p.name, pin: 'left' },
  { key: 'email', header: 'Email', cell: (p) => p.email, sortValue: (p) => p.email },
  { key: 'team', header: 'Team', cell: (p) => p.team, sortValue: (p) => p.team },
  { key: 'status', header: 'Status', cell: (p) => (
      <Badge dot tone={p.status === 'active' ? 'success' : p.status === 'invited' ? 'info' : 'danger'}>{p.status}</Badge>
    ), sortValue: (p) => p.status },
  { key: 'projects', header: 'Projects', align: 'right', cell: (p) => p.projects, sortValue: (p) => p.projects },
  { key: 'spend', header: 'Spend', align: 'right', cell: (p) => `$${p.spend.toLocaleString()}`, sortValue: (p) => p.spend },
];

export function DataTableDemo() {
  const [selected, setSelected] = useState<Array<string | number>>([2]);
  return (
    <DataTable rows={PEOPLE} columns={PEOPLE_COLUMNS} getRowId={(p) => p.id} selectable selected={selected} onSelectedChange={setSelected} pageSize={25} />
  );
}

export function PasteableGridDemo() {
  const [rows, setRows] = useState<Record<'person' | 'amount' | 'note', string>[]>([
    { person: 'Ada Lovelace', amount: '1200', note: 'Q3 bonus' },
    { person: 'Grace Hopper', amount: '850', note: '' },
    { person: 'Alan Turing', amount: '2400', note: 'Relocation' },
    { person: 'Katherine J.', amount: '640', note: '' },
    { person: '', amount: '', note: '' },
  ]);
  return (
    <div className="h-[22rem]">
      <PasteableGrid
        pinned
        fillHeight
        columns={[
          { key: 'person', label: 'Person', width: '16rem', aliases: ['name', 'user'] },
          { key: 'amount', label: 'Amount', width: '10rem', summary: 'sum' },
          { key: 'note', label: 'Note' },
        ]}
        rows={rows}
        onRowsChange={setRows}
      />
    </div>
  );
}

export function EditableCellDemo() {
  const [editing, setEditing] = useState<string | null>(null);
  const [amount, setAmount] = useState('1200');
  const [savedAmount, setSavedAmount] = useState('1200');
  const [note, setNote] = useState('Q3 bonus');
  const [savedNote, setSavedNote] = useState('Q3 bonus');
  return (
    <DemoTable head={<><th className="px-3">Person</th><th className="px-3 text-right">Amount</th><th className="px-3">Note</th></>}>
      <tr>
        <td className="px-3">Ada Lovelace</td>
        <EditableCell
          as="td" className="px-3" alignRight inputType="number" step="0.01"
          editing={editing === 'a'} dirty={amount !== savedAmount} canEdit display={savedAmount}
          value={amount} onChange={setAmount} onStartEdit={() => setEditing('a')}
          onCommit={() => { setSavedAmount(amount); setEditing(null); }}
          onCancel={() => { setAmount(savedAmount); setEditing(null); }}
        />
        <EditableCell
          as="td" className="px-3"
          editing={editing === 'n'} dirty={note !== savedNote} canEdit display={savedNote}
          value={note} onChange={setNote} onStartEdit={() => setEditing('n')}
          onCommit={() => { setSavedNote(note); setEditing(null); }}
          onCancel={() => { setNote(savedNote); setEditing(null); }}
        />
      </tr>
    </DemoTable>
  );
}

export function PaginationDemo() {
  const [page, setPage] = useState(3);
  const [size, setSize] = useState(25);
  const shared = { totalItems: 1204, itemsPerPage: size, currentPage: page, onPageChange: setPage, onItemsPerPageChange: (n: number) => { setSize(n); setPage(1); }, itemType: 'members' };
  return (
    <div className="flex flex-col gap-6">
      <Variant label="bar (default)"><div className="rounded-lg border border-slate-200 dark:border-slate-700"><Pagination {...shared} /></div></Variant>
      <Variant label="pill"><Pagination {...shared} variant="pill" /></Variant>
      {/* No `floating` here: it is `fixed` to the viewport, so on the gallery it
          pinned itself over every other component. The variants example shows it
          on demand instead. */}
    </div>
  );
}

export function SortableListDemo() {
  const [items, setItems] = useState(TEAMS);
  return (
    <SortableList
      items={items} getId={(t) => t.id} onReorder={setItems} group="teams"
      renderItem={(t, { isDragging, handleProps }) => (
        <div className={`panel panel-solid mb-1.5 flex items-center gap-2 px-3 py-2 text-xs ${isDragging ? 'opacity-50' : ''}`}>
          <span {...handleProps} className="cursor-grab select-none text-slate-400">⠿</span>
          {t.name}
        </div>
      )}
    />
  );
}

export function SaveAllBarDemo() {
  const [count, setCount] = useState(3);
  return (
    <>
      <SaveAllBar count={count} onSaveAll={() => setCount(0)} onDiscardAll={() => setCount(0)} />
      {count === 0 && <Button variant="ghost" size="sm" onClick={() => setCount(3)}>Dirty 3 rows again</Button>}
    </>
  );
}

export function AccountCellDemo() {
  return (
    <DemoTable head={<th className="px-3">Person</th>}>
      {PEOPLE.slice(0, 3).map((p) => (
        <tr key={p.id}><td className="px-3"><AccountCell username={p.email} cluster={p.team} brand={p.role} /></td></tr>
      ))}
    </DemoTable>
  );
}

/* ------------------------------------------------------------------ data --- */

export function KpiTileDemo() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiTile title="Members" value="1,204" icon={<Users className="h-4 w-4" />} tone="indigo" delta={4.2} />
      <KpiTile title="Active projects" value="86" icon={<Zap className="h-4 w-4" />} tone="emerald" delta={12} />
      <KpiTile title="Spend" value="$551,650" icon={<Coins className="h-4 w-4" />} tone="amber" delta={-8.1} />
      <KpiTile title="Net margin" value="25.2%" icon={<TrendingUp className="h-4 w-4" />} tone="violet" delta={-4.4} subtitle="vs previous period" />
    </div>
  );
}

export function RankedBarsDemo() { return <RankedBars rows={RANKED} />; }
export function TrendChartDemo() { return <TrendChart trend={TREND} />; }
export function RetentionChartDemo() { return <RetentionChart trend={RETENTION} />; }

export function ChartCardDemo() {
  return (
    <ChartCard
      title="Seats by plan"
      hint="The frame every chart here sits in. The two icons at the right switch between the chart and the same numbers as a table."
      legend={[{ label: 'Used', color: '#2a78d6' }, { label: 'Free', color: '#eb6834' }]}
      table={{ columns: [{ key: 'plan', label: 'Plan' }, { key: 'used', label: 'Used', align: 'right' }, { key: 'free', label: 'Free', align: 'right' }], rows: [{ plan: 'Pro', used: 412, free: 88 }, { plan: 'Enterprise', used: 1_904, free: 96 }] }}
    >
      <p className="py-10 text-center text-xs text-slate-400">Any chart goes here.</p>
    </ChartCard>
  );
}

export function BarChartDemo() {
  return <BarChart title="MRR by plan" hint="Grouped: compare plans within each month." data={MRR_BY_PLAN} x="month" series={PLAN_SERIES} format={compactCurrency} />;
}

export function LineChartDemo() {
  return <LineChart title="Weekly active users" hint="Four regions on one axis. Hover anywhere to read every region at that week." data={WAU_BY_REGION} x="week" series={REGION_SERIES} />;
}

export function AreaChartDemo() {
  return <AreaChart title="MRR by plan" hint="Stacked: the top edge is total MRR, each band a plan's share of it." data={MRR_BY_PLAN} x="month" series={PLAN_SERIES} stacked format={compactCurrency} />;
}

export function DonutChartDemo() {
  return (
    <div className="max-w-xl">
      <DonutChart title="Sign-ups by channel" hint="Seven channels, so the two smallest fold into Other — a donut past six slices stops being readable at a glance." data={SIGNUPS_BY_CHANNEL} />
    </div>
  );
}

export function ScatterChartDemo() {
  return (
    <ScatterChart
      title="Deal size against sales cycle"
      hint="Each dot is a closed deal. Larger deals take longer — and the enterprise cluster sits apart from the rest."
      groups={DEALS}
      xLabel="Days to close"
      yLabel="Deal size"
      yFormat={compactCurrency}
    />
  );
}

export function HeatmapDemo() {
  return (
    <Heatmap
      title="Sessions by weekday and hour"
      hint="Darker is busier. The working-day block and the lunch dip at 13:00 are the patterns to look for."
      rows={WEEKDAYS}
      columns={HOURS}
      values={SESSIONS_BY_HOUR}
    />
  );
}

export function FunnelChartDemo() {
  return (
    <div className="max-w-2xl">
      <FunnelChart title="Trial onboarding" hint="Each bar is scaled to the first stage; the percentage is conversion from the stage before." stages={ONBOARDING_FUNNEL} />
    </div>
  );
}

export function DivergingBarsDemo() {
  return (
    <div className="max-w-2xl">
      <DivergingBars title="CSAT against target" hint="Points above or below each team's target this quarter." data={CSAT_VS_TARGET} valueLabel="vs target" format={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`} />
    </div>
  );
}

export function SparklineDemo() {
  const tiles = [
    { title: 'MRR', value: '$64K', spark: SPARK_REVENUE },
    { title: 'Churn', value: '4.6%', spark: SPARK_CHURN },
    { title: 'Seats', value: '987', spark: SPARK_SEATS },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {tiles.map((t) => (
        <div key={t.title} className="panel flex items-end justify-between gap-3 p-4">
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.title}</p>
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-50">{t.value}</p>
          </div>
          <Sparkline values={t.spark} label={t.title} />
        </div>
      ))}
    </div>
  );
}

export function ActivityFeedDemo() {
  return (
    <ActivityFeed
      isSuperUser
      events={[
        { id: 9, type: 'request.approved',  createdAt: '2026-08-31T08:41:00Z', actor: 'Grace Hopper', ref: 'REQ-4471', payload: { amount: 1200 } },
        { id: 8, type: 'request.submitted', createdAt: '2026-08-31T08:02:00Z', actor: 'Alan Turing',  ref: 'REQ-4470', payload: null },
        { id: 7, type: 'request.rejected',  createdAt: '2026-08-30T17:26:00Z', actor: 'Ada Lovelace', ref: 'REQ-4468', payload: { reason: 'duplicate' } },
      ]}
    />
  );
}

export function StatusBarDemo() {
  return <StatusBar counts={{ draft: 12, submitted: 42, approved: 1204, rejected: 18, released: 987 }} />;
}

export function StatusStepsDemo() {
  return (
    <div className="flex flex-col gap-4">
      {['draft', 'submitted', 'approved', 'released', 'rejected'].map((s) => (
        <Variant key={s} label={s}><StatusSteps status={s} /></Variant>
      ))}
    </div>
  );
}

export function BadgeDemo() {
  return (
    <div className="flex flex-col gap-4">
      <Row>{(['neutral', 'info', 'success', 'warning', 'danger'] as const).map((t) => (
        <Variant key={t} label={t}><Badge tone={t}>{t}</Badge></Variant>
      ))}</Row>
      <Row>{(['neutral', 'info', 'success', 'warning', 'danger'] as const).map((t) => (
        <Variant key={t} label={`${t} · dot`}><Badge tone={t} dot>{t}</Badge></Variant>
      ))}</Row>
    </div>
  );
}

export function ProgressDemo() {
  return (
    <div className="flex max-w-md flex-col gap-4">
      <Progress value={72} label="Seats used" showValue />
      <Progress value={38} tone="emerald" label="Storage" showValue />
      <Progress value={91} tone="amber" label="API quota" showValue />
      <Progress value={140} tone="rose" label="Over budget (clamped from 140%)" showValue />
    </div>
  );
}

export function SkeletonDemo() {
  return (
    <div className="flex max-w-md flex-col gap-4">
      <Row><Skeleton variant="circle" /><div className="flex-1"><Skeleton lines={2} /></div></Row>
      <Skeleton variant="rect" />
      <Skeleton lines={4} />
    </div>
  );
}

/* --------------------------------------------------------------- overlay --- */

export function ModalDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Invite a member" size="md">
        <div className="grid gap-3">
          <Field label="Email" required>{(p) => <Input {...p} placeholder="name@example.com" />}</Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => setOpen(false)}>Send invite</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function DrawerDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open drawer</Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Request REQ-4471"
        subtitle="Engineering · submitted 08:02"
        maxWidth={0.6}
        headerActions={
          <Button size="sm" variant="ghost" onClick={(e) => e.stopPropagation()}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => setOpen(false)}>Approve</Button>
          </div>
        }
      >
        <p className="text-xs text-slate-600 dark:text-slate-300">Drag the left edge to resize.</p>
      </Drawer>
    </>
  );
}

export function TooltipDemo() {
  const trigger = <Button variant="secondary" size="sm">Hover</Button>;
  return (
    <div className="flex flex-col gap-6 py-8">
      <Row className="gap-8">
        {(['top', 'bottom', 'left', 'right'] as const).map((p) => (
          <Variant key={p} label={p}><Tooltip content={`Placed ${p}`} placement={p}>{trigger}</Tooltip></Variant>
        ))}
      </Row>
      <Row className="gap-8">
        <Variant label="light"><Tooltip variant="light" content="Pale bubble, dark text">{trigger}</Tooltip></Variant>
        <Variant label="wide"><Tooltip wide content="Margin = (revenue − cost) / revenue × 100, computed per team and then averaged across the selection.">{trigger}</Tooltip></Variant>
        <Variant label="one line"><Tooltip multiline={false} content="Never wraps">{trigger}</Tooltip></Variant>
        <Variant label="InfoTooltip"><InfoTooltip content="Shown behind an ⓘ beside a label." label="What is this?" /></Variant>
      </Row>
    </div>
  );
}

export function ConfirmPopoverDemo() {
  const [count, setCount] = useState(0);
  return (
    <Row>
      <ConfirmPopover title="Remove this member?" description="They lose access immediately." confirmText="Remove" onConfirm={() => setCount((c) => c + 1)}>
        <Button variant="ghost" size="sm" className="text-rose-600 dark:text-rose-400">Remove</Button>
      </ConfirmPopover>
      <ConfirmPopover variant="default" title="Publish these changes?" description="Everyone in the workspace will see them." confirmText="Publish" cancelText="Not yet" onConfirm={() => setCount((c) => c + 1)}>
        <Button variant="ghost" size="sm">Publish</Button>
      </ConfirmPopover>
      <span className="text-[11px] text-slate-500 dark:text-slate-400">confirmed {count}×</span>
    </Row>
  );
}

export function NotificationBellDemo() {
  return <div className="flex justify-end"><NotificationBell items={NOTIFICATIONS} unread={2} /></div>;
}

export function NotificationCardDemo() {
  return (
    <Card padded={false} solid>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {NOTIFICATIONS.slice(0, 3).map((n) => <NotificationCard key={n.eventId} item={n} href="#" />)}
      </div>
    </Card>
  );
}

/* ----------------------------------------------------------------- media --- */

export function MediaLibraryDemo() {
  const [selected, setSelected] = useState<string[]>(['m1']);
  const [items, setItems] = useState(MEDIA);
  return (
    <MediaLibrary
      items={items}
      selected={selected}
      onSelectedChange={setSelected}
      onUpload={(files) =>
        setItems((prev) => [
          ...Array.from(files).map((f, i) => ({
            id: `new-${Date.now()}-${i}`,
            name: f.name,
            kind: (f.type.split('/')[0] as 'image' | 'video' | 'audio') ?? 'other',
            size: f.size,
            url: URL.createObjectURL(f),
          })),
          ...prev,
        ])
      }
    />
  );
}

/* ------------------------------------------------------- shell and menu --- */

export function NavMenuDemo() {
  const sections = [
    { label: 'Workspace', items: [{ label: 'Overview', href: '/' }, { label: 'Members', href: '/members', badge: '8' }, { label: 'Projects', href: '/projects' }] },
    { label: 'Settings', items: [{ label: 'Billing', href: '/billing' }, { label: 'Roles', href: '/roles' }, { label: 'Integrations', href: '/integrations' }] },
  ];
  return (
    <div className="flex gap-6">
      <div className="w-56 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
        <NavMenu sections={sections} activeHref="/members" />
      </div>
      <div className="w-56 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
        <NavMenu sections={sections} activeHref="/roles" filterable />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- PickList --- */

export function PickListDemo() {
  const [value, setValue] = useState<PickListValue<Person>>({
    source: PEOPLE.slice(3),
    target: PEOPLE.slice(0, 3),
  });
  return (
    <PickList
      value={value}
      onChange={setValue}
      getId={(p) => p.id}
      renderItem={(p) => (
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate">{p.name}</span>
          <span className="shrink-0 text-[10px] text-slate-400">{p.team}</span>
        </span>
      )}
      sourceHeader="Available"
      targetHeader="Reviewers"
      filterable
    />
  );
}

/* ------------------------------------------------ Lark-Base-style grid --- */

/** The filter vocabulary is the grid's columns, verbatim. */
const TASK_FIELDS: FilterField[] = TASK_COLUMNS.map((c) => ({
  id: c.key, label: c.label, kind: c.kind, ...(c.options?.length ? { options: c.options } : {}),
}));

const taskReader = (t: Task): RowReader => ({
  valueOf: (id) => TASK_COLUMNS.find((c) => c.key === id)?.value(t),
  kindOf: (id) => TASK_COLUMNS.find((c) => c.key === id)?.kind ?? 'text',
});

export function FilterPanelDemo() {
  const [conditions, setConditions] = useState<Condition[]>([{ field: 'status', op: 'isNot', value: 'done' }]);
  const [match, setMatch] = useState<MatchMode>('all');
  const kept = filterRows(TASKS, conditions, match, taskReader);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <FilterPanel fields={TASK_FIELDS} conditions={conditions} match={match} onApply={(c, m) => { setConditions(c); setMatch(m); }} />
        <span className="text-xs text-slate-500 dark:text-slate-400">{kept.length} of {TASKS.length} tasks match</span>
      </div>
      <ul className="space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
        {kept.slice(0, 6).map((t) => <li key={t.id}>· {t.title}</li>)}
        {kept.length > 6 && <li className="text-slate-400">… and {kept.length - 6} more</li>}
      </ul>
    </div>
  );
}

export function ConditionGroupsBuilderDemo() {
  const [groups, setGroups] = useState<ConditionGroup[]>([
    { conditions: [{ field: 'priority', op: 'is', value: 'urgent' }] },
    { conditions: [{ field: 'status', op: 'is', value: 'review' }, { field: 'billable', op: 'is', value: 'true' }] },
  ]);
  const [match, setMatch] = useState<MatchMode>('all');
  const kept = TASKS.filter((t) => groupsMatch(groups, match, taskReader(t)));
  return (
    <div className="max-w-2xl space-y-2">
      <ConditionGroupsBuilder fields={TASK_FIELDS} groups={groups} matchMode={match} onChange={(g, m) => { setGroups(g); setMatch(m); }} />
      <p className="text-xs text-slate-500 dark:text-slate-400">{kept.length} of {TASKS.length} tasks match.</p>
    </div>
  );
}

export function GroupPanelDemo() {
  const [levels, setLevels, echo] = useEcho<GroupLevel[]>([{ by: 'team', dir: 'asc' }]);
  const groupable = TASK_COLUMNS.filter((c) => c.groupable !== false);
  return (
    <div>
      <GroupPanel levels={levels} onChange={setLevels} options={groupable.map((c) => c.key)} labelOf={(k) => groupable.find((c) => c.key === k)?.label ?? k} />
      {echo}
    </div>
  );
}

export function FieldsPanelDemo() {
  const [layout, setLayout, echo] = useEcho<FieldLayout>({ order: [], hidden: ['estimate'], labels: {} });
  return (
    <div>
      <FieldsPanel
        layout={layout}
        onChange={setLayout}
        columns={[
          { key: 'title', label: 'Task', locked: true },
          { key: 'status', label: 'Status' },
          { key: 'estimate', label: 'Estimate' },
          { key: 'due', label: 'Due' },
          { key: 'billable', label: 'Billable' },
        ]}
      />
      {echo}
    </div>
  );
}

export function SortPanelDemo() {
  const [sorts, setSorts, echo] = useEcho<SortLevel[]>([{ key: 'due', dir: 'asc' }]);
  return (
    <div>
      <SortPanel
        sorts={sorts}
        onChange={setSorts}
        columns={[
          { key: 'title', label: 'Task', kind: 'text' },
          { key: 'estimate', label: 'Estimate', kind: 'number' },
          { key: 'due', label: 'Due', kind: 'date' },
          { key: 'billable', label: 'Billable', kind: 'boolean' },
        ]}
      />
      {echo}
    </div>
  );
}

export function ColorRulesPanelDemo() {
  const [rules, setRules] = useState<ColorRule[]>([
    { id: 'r1', scope: 'row', field: 'priority', op: 'is', value: 'urgent', tone: 'rose' },
    { id: 'r2', scope: 'cell', field: 'status', op: 'is', value: 'done', tone: 'emerald' },
  ]);
  return (
    <div className="space-y-2">
      <ColorRulesPanel fields={TASK_FIELDS} rules={rules} onChange={setRules} />
      <ul className="max-w-md divide-y divide-slate-100 rounded-lg border border-slate-200 text-xs dark:divide-slate-800 dark:border-slate-700">
        {TASKS.slice(0, 6).map((t) => {
          const c = resolveRowColors(rules, taskReader(t));
          return (
            <li key={t.id} className={`flex items-center gap-3 px-3 py-1.5 ${c.row ? ROW_TINT[c.row] : ''}`}>
              <span className="min-w-0 flex-1 truncate">{t.title}</span>
              <span className={`rounded px-1.5 py-0.5 ${c.cells.status ? CELL_TINT[c.cells.status] : ''}`}>{TASK_STATUS.find((o) => o.value === t.status)?.label}</span>
              <span className={`rounded px-1.5 py-0.5 ${c.cells.priority ? CELL_TINT[c.cells.priority] : ''}`}>{TASK_PRIORITY.find((o) => o.value === t.priority)?.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function BaseGridDemo() {
  const [rows, setRows] = useState(TASKS);
  const [columns, setColumns] = useState<GridColumn<Task>[]>(TASK_COLUMNS);
  return (
    <BaseGrid
      columns={columns}
      rows={rows}
      getRowId={(t) => t.id}
      noun="task"
      maxHeight={420}
      onRowChange={(next) => setRows((prev) => prev.map((r) => (r.id === next.id ? next : r)))}
      onFieldAdd={(f) => setColumns((prev) => [...prev, columnFromField(f, TASK_EXTRA)])}
      onFieldChange={(key, f) =>
        setColumns((prev) =>
          prev.map((c) => (c.key !== key ? c : c.type ? columnFromField(f, TASK_EXTRA) : { ...c, label: f.label, options: f.options })),
        )
      }
      onFieldDelete={(key) => setColumns((prev) => prev.filter((c) => c.key !== key))}
    />
  );
}

/**
 * The whole table, as a real app would mount it: rows, columns and history
 * in state; views persisted in this browser under one key. Everything the
 * table does is on — this is the component to copy.
 */
export function BaseTableDemo() {
  const [rows, setRows] = useState(TASKS);
  const [columns, setColumns] = useState<GridColumn<Task>[]>(TASK_COLUMNS);
  const [history, setHistory] = useState<HistoryEntry[]>(TASK_HISTORY);
  return (
    <BaseTable
      columns={columns}
      rows={rows}
      getRowId={(t) => t.id}
      noun="task"
      actor={DEMO_USER.name}
      defaultViews={TASK_VIEWS}
      storageKey="admin-ui-kit.base-table-demo"
      maxHeight={460}
      history={history}
      onHistoryAdd={(h) => setHistory((prev) => [h, ...prev])}
      onRowChange={(next) => setRows((prev) => prev.map((r) => (r.id === next.id ? next : r)))}
      onFieldAdd={(f) => setColumns((prev) => [...prev, columnFromField(f, TASK_EXTRA)])}
      onFieldChange={(key, f) =>
        setColumns((prev) => prev.map((c) => (c.key !== key ? c : c.type ? columnFromField(f, TASK_EXTRA) : { ...c, label: f.label, options: f.options })))
      }
      onFieldDelete={(key) => setColumns((prev) => prev.filter((c) => c.key !== key))}
    />
  );
}

export function ViewTabsDemo() {
  const [views, setViews] = useState<ViewTab[]>([
    { id: 'a', name: 'All tasks', mode: 'grid' },
    { id: 'b', name: 'My open work', mode: 'grid' },
    { id: 'c', name: 'Status board', mode: 'board' },
  ]);
  const [active, setActive] = useState('a');
  return (
    <ViewTabs
      views={views}
      activeId={active}
      onSelect={setActive}
      onCreate={(mode) => {
        const id = `n${views.length + 1}`;
        setViews([...views, { id, name: mode === 'board' ? 'New board' : 'New grid', mode }]);
        setActive(id);
        return id;
      }}
      onRename={(id, name) => setViews(views.map((v) => (v.id === id ? { ...v, name } : v)))}
      onDuplicate={(id) => {
        const src = views.find((v) => v.id === id)!;
        setViews([...views, { ...src, id: `d${views.length + 1}`, name: `${src.name} copy` }]);
      }}
      onDelete={(id) => {
        const next = views.filter((v) => v.id !== id);
        setViews(next);
        if (active === id) setActive(next[0].id);
      }}
      onReorder={(ids) => setViews(ids.map((id) => views.find((v) => v.id === id)!))}
    />
  );
}

export function FieldEditorDemo() {
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [saved, setSaved, echo] = useEcho<FieldDef | null>(null);
  return (
    <div>
      <Button variant="secondary" onClick={(e) => setAnchor(anchorOf(e.currentTarget))}>Add field</Button>
      <FieldEditor
        open={anchor !== null}
        anchor={anchor}
        field={null}
        existingKeys={TASK_COLUMNS.map((c) => c.key)}
        onSave={(f) => { setSaved(f); setAnchor(null); }}
        onClose={() => setAnchor(null)}
      />
      {saved && echo}
    </div>
  );
}
export function GroupBandRowDemo() {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setCollapsed((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const bands = [
    { id: 'eng', label: 'Engineering', depth: 0, rows: TASKS.filter((t) => t.team === 'eng').slice(0, 3) },
    { id: 'design', label: 'Design', depth: 0, rows: TASKS.filter((t) => t.team === 'design').slice(0, 2) },
  ];
  return (
    <DemoTable head={<><th className="px-4">Task</th><th className="px-4">Owner</th><th className="px-4">Status</th></>}>
      {bands.map((b) => (
        <Fragment key={b.id}>
          <GroupBandRow label={b.label} count={b.rows.length} depth={b.depth} collapsed={collapsed.has(b.id)} onToggle={() => toggle(b.id)} columnCount={3} noun="task" />
          {!collapsed.has(b.id) && b.rows.map((t) => (
            <tr key={t.id}>
              <td className="px-4">{t.title}</td>
              <td className="px-4">{t.owner}</td>
              <td className="px-4"><OptionPills value={t.status} options={TASK_STATUS} /></td>
            </tr>
          ))}
        </Fragment>
      ))}
    </DemoTable>
  );
}

export function OptionPillDemo() {
  const [tags, setTags] = useState(['bug', 'feature', 'customer']);
  return (
    <Row>
      <Variant label="Stored tones">
        <div className="flex flex-wrap gap-1">{TASK_STATUS.map((o) => <OptionPill key={o.value} label={o.label} tone={o.tone} />)}</div>
      </Variant>
      <Variant label="By position">
        <OptionPills value={['bug', 'feature', 'docs', 'infra', 'customer']} options={TASK_TAGS} />
      </Variant>
      <Variant label="Chips">
        <div className="flex flex-wrap gap-1">
          {tags.map((v) => <OptionPill key={v} label={TASK_TAGS.find((o) => o.value === v)?.label ?? v} tone={['sky','amber','slate','emerald','zinc'][TASK_TAGS.findIndex((o) => o.value === v)]} onRemove={() => setTags(tags.filter((t) => t !== v))} />)}
          {tags.length === 0 && <button type="button" className="btn-ghost text-xs" onClick={() => setTags(['bug', 'feature', 'customer'])}>Reset</button>}
        </div>
      </Variant>
    </Row>
  );
}

export function AnchoredPanelDemo() {
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [inner, setInner] = useState<Anchor | null>(null);
  const [label, setLabel] = useState('Status');
  const [options, setOptions] = useState(TASK_STATUS.map((o) => o.label));
  const [draft, setDraft] = useState('');
  return (
    <div>
      <Button variant="secondary" onClick={(e) => setAnchor(anchorOf(e.currentTarget))}>Edit field</Button>

      <AnchoredPanel
        open={anchor !== null}
        anchor={anchor}
        onClose={() => { setAnchor(null); setInner(null); }}
        title="Edit field"
        subtitle="Status · single select"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost text-xs" onClick={() => { setAnchor(null); setInner(null); }}>Cancel</button>
            <button type="button" className="btn-primary" onClick={() => { setAnchor(null); setInner(null); }}>Save</button>
          </div>
        }
      >
        <div className="space-y-3 p-3">
          <label className="block">
            <span className="field-label">Label</span>
            <input value={label} onChange={(e) => setLabel(e.target.value)} className="field-input" />
          </label>
          <div>
            <span className="field-label">Options</span>
            <div className="flex flex-wrap gap-1">{options.map((o, i) => <OptionPill key={o} label={o} tone={TASK_STATUS[i]?.tone} />)}</div>
            {/* Anchored to the PANEL, not the button — see `closestPanelRect`. */}
            <button type="button" className="btn-ghost mt-2 text-xs" onClick={(e) => setInner(closestPanelRect(e.currentTarget))}>
              Manage options…
            </button>
          </div>
        </div>
      </AnchoredPanel>

      <AnchoredPanel open={inner !== null} anchor={inner} onClose={() => setInner(null)} title="Options" subtitle={`${options.length} choices`} width={300}>
        <div className="space-y-2 p-3">
          <ul className="space-y-1">
            {options.map((o) => (
              <li key={o} className="flex items-center justify-between gap-2 rounded px-2 py-1 text-xs hover:bg-slate-50 dark:hover:bg-slate-800">
                {o}
                <button type="button" className="text-slate-400 hover:text-rose-600" onClick={() => setOptions(options.filter((x) => x !== o))} aria-label={`Remove ${o}`}>×</button>
              </li>
            ))}
          </ul>
          <form
            className="flex gap-1.5"
            onSubmit={(e) => { e.preventDefault(); if (draft.trim()) { setOptions([...options, draft.trim()]); setDraft(''); } }}
          >
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="New option" className="field-input min-w-0 flex-1 py-1.5 text-xs" />
            <button type="submit" className="btn-primary">Add</button>
          </form>
        </div>
      </AnchoredPanel>
    </div>
  );
}

export * from './forms-b';

export * from './overlay-e';

export * from './data-d';

export * from './layout-c';

export * from './forms-a';

export * from './table-f';

export * from './layout-g';
