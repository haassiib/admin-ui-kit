'use client';

/**
 * Named examples per component, in the shape a docs page wants: a short title, a
 * sentence saying what it demonstrates, and the component driving it.
 *
 * Most components need one example, so `EXAMPLES` only carries the ones that
 * genuinely have several modes worth seeing separately. Everything else falls
 * back to its single demo under "Basic" — see `examplesFor`.
 *
 * The example id is also the anchor for the on-this-page nav, so it has to be
 * unique within a component and stable across edits.
 */

import { useState } from 'react';
import Splitter from '@/components/layout/Splitter';
import AppShell, { type SidebarPosition } from '@/components/layout/AppShell';
import NavMenu from '@/components/layout/NavMenu';
import Button from '@/components/layout/Button';
import Badge from '@/components/data/Badge';
import Alert from '@/components/layout/Alert';
import Pagination from '@/components/table/Pagination';
import Tooltip, { InfoTooltip } from '@/components/overlay/Tooltip';
import Progress from '@/components/data/Progress';
import DataTable from '@/components/table/DataTable';
import { DEMOS } from './demos/map';
import { EXAMPLE_META, type ExampleMeta } from './examples';

const Pane = ({ label, hint }: { label: string; hint?: string }) => (
  <div className="flex h-full flex-col justify-center p-4">
    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{label}</p>
    {hint && <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{hint}</p>}
  </div>
);

const Frame = ({ children, h = 'h-64' }: { children: React.ReactNode; h?: string }) => (
  <div className={`${h} overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700`}>
    {children}
  </div>
);

/* ------------------------------------------------------------- Splitter --- */

function SplitterBasic() {
  return (
    <Frame>
      <Splitter first={<Pane label="Panel 1" />} second={<Pane label="Panel 2" />} />
    </Frame>
  );
}

function SplitterVertical() {
  return (
    <Frame>
      <Splitter direction="vertical" first={<Pane label="Panel 1" />} second={<Pane label="Panel 2" />} />
    </Frame>
  );
}

function SplitterSize() {
  return (
    <Frame>
      <Splitter
        initial={25}
        first={<Pane label="Panel 1" hint="Starts at 25%." />}
        second={<Pane label="Panel 2" hint="Takes the rest." />}
      />
    </Frame>
  );
}

function SplitterMinMax() {
  return (
    <Frame>
      <Splitter
        min={30}
        max={70}
        first={<Pane label="Panel 1" hint="Cannot go below 30%." />}
        second={<Pane label="Panel 2" hint="Cannot go below 30% either." />}
      />
    </Frame>
  );
}

function SplitterNested() {
  return (
    <Frame h="h-80">
      <Splitter
        initial={35}
        first={<Pane label="Panel 1" />}
        second={
          <Splitter
            direction="vertical"
            initial={60}
            first={<Pane label="Panel 2" />}
            second={
              <Splitter
                initial={50}
                first={<Pane label="Panel 3" />}
                second={<Pane label="Panel 4" />}
              />
            }
          />
        }
      />
    </Frame>
  );
}

function SplitterResizeEvents() {
  const [size, setSize] = useState(50);
  return (
    <>
      <Frame>
        <Splitter
          onResize={(p) => setSize(Math.round(p))}
          first={<Pane label="Panel 1" />}
          second={<Pane label="Panel 2" />}
        />
      </Frame>
      <p className="mt-2 font-mono text-[11px] text-slate-500 dark:text-slate-400">
        onResize → {size}%
      </p>
    </>
  );
}

/* ------------------------------------------------------------- AppShell --- */

const SHELL_SECTIONS = [
  { label: 'Workspace', items: [{ label: 'Overview', href: '/' }, { label: 'Members', href: '/members' }] },
  { label: 'Settings', items: [{ label: 'Billing', href: '/billing' }, { label: 'Roles', href: '/roles' }] },
];

/**
 * The shell is `h-screen`, so previewing it inside a page needs a frame that
 * bounds it — otherwise it takes over the document it is being shown in.
 */
function ShellFrame({ position }: { position: SidebarPosition }) {
  const horizontal = position === 'top' || position === 'bottom';
  return (
    <div className="h-[26rem] overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="h-full [&>div]:h-full">
        <AppShell
          sidebarPosition={position}
          sidebarWidth="w-48"
          brand={<span className="text-sm font-bold text-slate-900 dark:text-white">Acme</span>}
          actions={<Badge tone="info">Pro</Badge>}
          sidebar={
            <NavMenu
              sections={SHELL_SECTIONS}
              activeHref="/members"
              orientation={horizontal ? 'horizontal' : 'vertical'}
              showSectionLabels={!horizontal}
            />
          }
        >
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Members</h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            Navigation is on the <strong>{position}</strong>.
          </p>
        </AppShell>
      </div>
    </div>
  );
}

function AppShellLeft() { return <ShellFrame position="left" />; }
function AppShellRight() { return <ShellFrame position="right" />; }
function AppShellTop() { return <ShellFrame position="top" />; }
function AppShellBottom() { return <ShellFrame position="bottom" />; }

/* -------------------------------------------------------------- NavMenu --- */

const MENU_SECTIONS = [
  { label: 'Workspace', items: [{ label: 'Overview', href: '/' }, { label: 'Members', href: '/members', badge: '8' }, { label: 'Projects', href: '/projects' }] },
  { label: 'Settings', items: [{ label: 'Billing', href: '/billing' }, { label: 'Roles', href: '/roles' }] },
];

function NavMenuVertical() {
  return (
    <div className="w-56 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      <NavMenu sections={MENU_SECTIONS} activeHref="/members" />
    </div>
  );
}

function NavMenuHorizontal() {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
      <NavMenu sections={MENU_SECTIONS} activeHref="/members" orientation="horizontal" />
    </div>
  );
}

function NavMenuFilterable() {
  return (
    <div className="w-56 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      <NavMenu sections={MENU_SECTIONS} activeHref="/roles" filterable />
    </div>
  );
}

/* --------------------------------------------------------------- others --- */

function ButtonVariants() {
  return (
    <div className="flex flex-wrap gap-3">
      {(['primary', 'secondary', 'ghost', 'danger'] as const).map((v) => (
        <Button key={v} variant={v}>
          {v[0].toUpperCase() + v.slice(1)}
        </Button>
      ))}
    </div>
  );
}

function ButtonSizes() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {(['sm', 'md', 'lg'] as const).map((s) => (
        <Button key={s} size={s}>
          Size {s}
        </Button>
      ))}
    </div>
  );
}

function ButtonLoading() {
  const [loading, setLoading] = useState(false);
  return (
    <div className="flex flex-wrap gap-3">
      <Button loading={loading} onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1500); }}>
        Submit
      </Button>
      <Button disabled>Disabled</Button>
    </div>
  );
}

function BadgeTones() {
  return (
    <div className="flex flex-wrap gap-2">
      {(['neutral', 'info', 'success', 'warning', 'danger'] as const).map((t) => (
        <Badge key={t} tone={t}>{t}</Badge>
      ))}
    </div>
  );
}

function BadgeDot() {
  return (
    <div className="flex flex-wrap gap-2">
      {(['neutral', 'info', 'success', 'warning', 'danger'] as const).map((t) => (
        <Badge key={t} tone={t} dot>{t}</Badge>
      ))}
    </div>
  );
}

function AlertTones() {
  return (
    <div className="flex flex-col gap-2">
      <Alert tone="info" title="Scheduled maintenance">Read replicas are read-only until 02:00 UTC.</Alert>
      <Alert tone="success" title="Invite sent">They will receive an email shortly.</Alert>
      <Alert tone="warning" title="Approaching your seat limit">7 of 8 seats in use.</Alert>
      <Alert tone="danger" title="Payment failed">Update the card on file to avoid suspension.</Alert>
    </div>
  );
}

function AlertDismissible() {
  const [open, setOpen] = useState(true);
  return open ? (
    <Alert tone="warning" title="Unsaved changes" onDismiss={() => setOpen(false)}>
      Leaving this page will discard them.
    </Alert>
  ) : (
    <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>Bring it back</Button>
  );
}

function usePager() {
  const [page, setPage] = useState(3);
  const [size, setSize] = useState(25);
  return {
    totalItems: 1204,
    itemsPerPage: size,
    currentPage: page,
    onPageChange: setPage,
    onItemsPerPageChange: (n: number) => { setSize(n); setPage(1); },
    itemType: 'members',
  };
}

function PaginationBar() {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700">
      <Pagination {...usePager()} />
    </div>
  );
}
function PaginationPill() { return <Pagination {...usePager()} variant="pill" />; }
function PaginationFloating() { return <Pagination {...usePager()} variant="floating" />; }

const tip = <Button variant="secondary" size="sm">Hover me</Button>;

function TooltipPlacement() {
  return (
    <div className="flex flex-wrap gap-8 py-10">
      {(['top', 'bottom', 'left', 'right'] as const).map((p) => (
        <Tooltip key={p} content={`Placed ${p}`} placement={p}>{tip}</Tooltip>
      ))}
    </div>
  );
}

function TooltipAppearance() {
  return (
    <div className="flex flex-wrap gap-8 py-10">
      <Tooltip variant="light" content="Pale bubble, dark text">{tip}</Tooltip>
      <Tooltip wide content="Margin = (revenue − cost) / revenue × 100, computed per team and then averaged across the selection.">{tip}</Tooltip>
      <Tooltip multiline={false} content="Never wraps">{tip}</Tooltip>
    </div>
  );
}

function TooltipInfo() {
  return (
    <div className="flex items-center gap-2 py-4 text-xs text-slate-600 dark:text-slate-300">
      Monthly recurring revenue
      <InfoTooltip content="Committed revenue normalised to a month, excluding one-off fees." label="How is MRR derived?" />
    </div>
  );
}

function ProgressBasic() {
  return (
    <div className="flex max-w-md flex-col gap-4">
      <Progress value={72} label="Seats used" showValue />
      <Progress value={38} tone="emerald" label="Storage" showValue />
      <Progress value={91} tone="amber" label="API quota" showValue />
    </div>
  );
}

function ProgressClamped() {
  return (
    <div className="max-w-md">
      <Progress value={140} tone="rose" label="Given value 140 — clamped to 100" showValue />
    </div>
  );
}

const PEOPLE_MINI = [
  { id: 1, name: 'Ada Lovelace', team: 'Engineering', projects: 12 },
  { id: 2, name: 'Grace Hopper', team: 'Engineering', projects: 9 },
  { id: 3, name: 'Alan Turing', team: 'Research', projects: 6 },
];

const MINI_COLUMNS = [
  { key: 'name', header: 'Name', cell: (p: (typeof PEOPLE_MINI)[number]) => p.name, sortValue: (p: (typeof PEOPLE_MINI)[number]) => p.name },
  { key: 'team', header: 'Team', cell: (p: (typeof PEOPLE_MINI)[number]) => p.team, sortValue: (p: (typeof PEOPLE_MINI)[number]) => p.team },
  { key: 'projects', header: 'Projects', align: 'right' as const, cell: (p: (typeof PEOPLE_MINI)[number]) => p.projects, sortValue: (p: (typeof PEOPLE_MINI)[number]) => p.projects },
];

function DataTableBasic() {
  return <DataTable rows={PEOPLE_MINI} columns={MINI_COLUMNS} getRowId={(p) => p.id} />;
}

function DataTableSelection() {
  const [selected, setSelected] = useState<Array<string | number>>([2]);
  return (
    <DataTable
      rows={PEOPLE_MINI}
      columns={MINI_COLUMNS}
      getRowId={(p) => p.id}
      selectable
      selected={selected}
      onSelectedChange={setSelected}
    />
  );
}

function DataTableEmpty() {
  return <DataTable rows={[]} columns={MINI_COLUMNS} getRowId={(p: { id: number }) => p.id} emptyTitle="No members yet" emptyHint="Invite someone to get started." />;
}

/* ------------------------------------------------------------------------- */

/** slug -> example id -> component. Joined to `EXAMPLE_META` by id. */
export const EXAMPLE_DEMOS: Record<string, Record<string, React.ComponentType>> = {
  'app-shell': { 'left': AppShellLeft, 'right': AppShellRight, 'top': AppShellTop, 'bottom': AppShellBottom },
  'nav-menu': { 'vertical': NavMenuVertical, 'horizontal': NavMenuHorizontal, 'filterable': NavMenuFilterable },
  'splitter': { 'basic': SplitterBasic, 'vertical': SplitterVertical, 'size': SplitterSize, 'min-max': SplitterMinMax, 'nested': SplitterNested, 'resize-events': SplitterResizeEvents },
  'button': { 'variants': ButtonVariants, 'sizes': ButtonSizes, 'loading': ButtonLoading },
  'badge': { 'tones': BadgeTones, 'dot': BadgeDot },
  'alert': { 'tones': AlertTones, 'dismissible': AlertDismissible },
  'pagination': { 'bar': PaginationBar, 'pill': PaginationPill, 'floating': PaginationFloating },
  'tooltip': { 'placement': TooltipPlacement, 'appearance': TooltipAppearance, 'info': TooltipInfo },
  'progress': { 'basic': ProgressBasic, 'clamped': ProgressClamped },
  'data-table': { 'basic': DataTableBasic, 'selection': DataTableSelection, 'empty': DataTableEmpty },
};

export type Example = ExampleMeta & { Demo: React.ComponentType };

/**
 * Every component has at least one example. Anything without an explicit list
 * falls back to its single demo under "Basic", so adding a component to the
 * catalog never leaves its page blank.
 */
export function examplesFor(slug: string): Example[] {
  const meta = EXAMPLE_META[slug];
  const demos = EXAMPLE_DEMOS[slug];
  if (meta && demos) {
    return meta.filter((m) => demos[m.id]).map((m) => ({ ...m, Demo: demos[m.id] }));
  }
  const Demo = DEMOS[slug];
  return Demo ? [{ id: 'basic', title: 'Basic', Demo }] : [];
}
