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

import { useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import Splitter from '@/components/layout/Splitter';
import Layout, { type SidebarPosition } from '@/components/layout/Layout';
import NavMenu from '@/components/layout/NavMenu';
import Button from '@/components/layout/Button';
import Badge from '@/components/data/Badge';
import Alert from '@/components/layout/Alert';
import Pagination from '@/components/table/Pagination';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Tooltip, { InfoTooltip } from '@/components/overlay/Tooltip';
import Progress from '@/components/data/Progress';
import DataTable, { type Column } from '@/components/table/DataTable';
import { CombinedFilterDropdown, type FilterValue } from '@/components/form/CombinedFilterDropdown';
import Drawer from '@/components/overlay/Drawer';
import Card from '@/components/layout/Card';
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
  const [dir, setDir] = useState<'horizontal' | 'vertical'>('horizontal');
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {(['horizontal', 'vertical'] as const).map((d) => (
          <Button key={d} size="sm" variant={dir === d ? 'primary' : 'secondary'} onClick={() => setDir(d)}>{d}</Button>
        ))}
      </div>
      <Frame>
        <Splitter direction={dir} first={<Pane label="Panel 1" />} second={<Pane label="Panel 2" />} />
      </Frame>
    </div>
  );
}

function SplitterSizing() {
  const [size, setSize] = useState(25);
  return (
    <>
      <Frame>
        <Splitter
          initial={25}
          min={20}
          max={70}
          onResize={(p) => setSize(Math.round(p))}
          first={<Pane label="Panel 1" hint="Starts at 25%, clamped between 20% and 70%." />}
          second={<Pane label="Panel 2" hint="Takes the rest." />}
        />
      </Frame>
      <p className="mt-2 font-mono text-[11px] text-slate-500 dark:text-slate-400">onResize → {size}%</p>
    </>
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
            second={<Splitter initial={50} first={<Pane label="Panel 3" />} second={<Pane label="Panel 4" />} />}
          />
        }
      />
    </Frame>
  );
}

/* --------------------------------------------------------------- Layout --- */

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
        <Layout
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
        </Layout>
      </div>
    </div>
  );
}

function LayoutPositions() {
  const [position, setPosition] = useState<SidebarPosition>('left');
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {(['left', 'right', 'top', 'bottom'] as const).map((pos) => (
          <Button key={pos} size="sm" variant={position === pos ? 'primary' : 'secondary'} onClick={() => setPosition(pos)}>{pos}</Button>
        ))}
      </div>
      <ShellFrame position={position} />
    </div>
  );
}

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

function NavMenuFiltering() {
  const [query, setQuery] = useState('bill');
  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Own field</span>
        <div className="w-56 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <NavMenu sections={MENU_SECTIONS} activeHref="/roles" filterable />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Filtered from outside</span>
        <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Filter menu" className="field-input w-56" />
        <div className="w-56 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <NavMenu sections={MENU_SECTIONS} activeHref="/roles" filter={query} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------ CombinedFilterDropdown --- */

const REGIONS = [
  { id: 1, name: 'Europe' },
  { id: 2, name: 'Americas' },
  { id: 3, name: 'Asia-Pacific' },
];
const TEAMS = [
  { id: 1, name: 'Engineering', regionId: 1 },
  { id: 2, name: 'Research', regionId: 1 },
  { id: 3, name: 'Design', regionId: 2 },
  { id: 4, name: 'Support', regionId: 2 },
  { id: 5, name: 'Operations', regionId: 3 },
];
const FILTER_GROUPS = [
  { key: 'region', label: 'Region', options: REGIONS.map((r) => ({ id: r.id, label: r.name })) },
  { key: 'team', label: 'Team', options: TEAMS.map((t) => ({ id: t.id, label: t.name, parentId: t.regionId })) },
];

/**
 * Seeded with a selection, deliberately.
 *
 * Both display modes render NOTHING beside the trigger until something is
 * picked, so an empty demo shows two identical buttons and the whole difference
 * between them is invisible. Starting with a selection is the only way the
 * example says anything.
 */
function useSeededFilter(initial: FilterValue) {
  const [value, setValue] = useState<FilterValue>(initial);
  return {
    groups: FILTER_GROUPS,
    value,
    onChange: (key: string, ids: Array<string | number>) => setValue({ ...value, [key]: ids }),
  };
}

function CombinedFilterDropdownChips() {
  const bound = useSeededFilter({ region: [1], team: [1, 2] });
  return <CombinedFilterDropdown {...bound} onClearEverything={() => bound.onChange('region', [])} />;
}

function CombinedFilterDropdownSummary() {
  const bound = useSeededFilter({ region: [1], team: [1, 2] });
  return <CombinedFilterDropdown {...bound} selectionDisplay="summary" />;
}

function CombinedFilterDropdownEmpty() {
  const bound = useSeededFilter({ region: [], team: [] });
  return <CombinedFilterDropdown {...bound} />;
}

/* --------------------------------------------------------------- Drawer --- */

const drawerBody = (
  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
    Drag the left edge to resize. Escape and the close button both dismiss it.
  </p>
);

function DrawerBasic() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open drawer</Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Request REQ-4471"
        subtitle="Engineering · submitted 08:02"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => setOpen(false)}>Approve</Button>
          </div>
        }
      >
        {drawerBody}
      </Drawer>
    </>
  );
}

function DrawerAnchored() {
  const [open, setOpen] = useState(false);
  // The anchor is the CARD the panel belongs to, never the button that opens
  // it: `anchorRef` mirrors the element's top, height and right edge onto the
  // panel, so anchoring to a 28px button yields a 28px drawer.
  const card = useRef<HTMLDivElement>(null);
  return (
    <div ref={card}>
      <Card title="Reviewers" subtitle="The panel covers this card, not the window." solid>
        <Button onClick={() => setOpen(true)}>Open over this card</Button>
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          title="Edit reviewers"
          anchorRef={card}
          initialWidth={340}
        >
          {drawerBody}
        </Drawer>
      </Card>
    </div>
  );
}

function DrawerOptions() {
  const [backdrop, setBackdrop] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={() => { setBackdrop(true); setOpen(true); }}>With header action</Button>
      <Button variant="secondary" onClick={() => { setBackdrop(false); setOpen(true); }}>Without backdrop</Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={backdrop ? 'Request REQ-4471' : 'Non-modal panel'}
        backdrop={backdrop}
        maxWidth={0.6}
        headerActions={
          backdrop ? (
            <Button size="sm" variant="ghost" onClick={(e) => e.stopPropagation()}>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          ) : undefined
        }
      >
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          {backdrop
            ? 'headerActions puts a panel-level control in the title bar; maxWidth caps the drag.'
            : 'The page behind stays readable and clickable, so click-outside no longer closes — Escape and the close button are the way out.'}
        </p>
      </Drawer>
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

const Boxed = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-lg border border-slate-200 dark:border-slate-700">{children}</div>
);

function PaginationBasic() {
  const [siblings, setSiblings] = useState(1);
  const [edges, setEdges] = useState(1);
  const [ellipsis, setEllipsis] = useState(true);
  const num = (v: number, set: (n: number) => void, label: string) => (
    <label className="flex items-center gap-1.5">
      {label}
      <input type="number" min={0} max={3} value={v} onChange={(e) => set(Number(e.target.value))}
        className="w-12 rounded-md border border-slate-200 bg-transparent px-1 py-0.5 text-center dark:border-slate-700" />
    </label>
  );
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 dark:text-slate-300">
        {num(siblings, setSiblings, 'siblings')}
        {num(edges, setEdges, 'edges')}
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={ellipsis} onChange={(e) => setEllipsis(e.target.checked)} className="accent-indigo-600" />
          gaps
        </label>
      </div>
      <Boxed>
        <Pagination {...usePager()} siblings={siblings} edges={edges} showEllipsis={ellipsis} />
      </Boxed>
    </div>
  );
}

function PaginationVariants() {
  const [variant, setVariant] = useState<'bar' | 'pill' | 'floating'>('bar');
  const [navigation, setNavigation] = useState<'pages' | 'input'>('pages');
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {(['bar', 'pill', 'floating'] as const).map((v) => (
          <Button key={v} size="sm" variant={variant === v ? 'primary' : 'secondary'} onClick={() => setVariant(v)}>{v}</Button>
        ))}
        <span className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700" />
        {(['pages', 'input'] as const).map((n) => (
          <Button key={n} size="sm" variant={navigation === n ? 'primary' : 'secondary'} onClick={() => setNavigation(n)}>{n}</Button>
        ))}
      </div>
      {variant === 'bar' ? (
        <Boxed><Pagination {...usePager()} variant={variant} navigation={navigation} /></Boxed>
      ) : (
        <Pagination {...usePager()} variant={variant} navigation={navigation} />
      )}
    </div>
  );
}

function PaginationComposed() {
  const [page, setPage] = useState(4);
  return (
    <Boxed>
      <div className="px-3 py-2">
        <Pagination.Root total={480} itemsPerPage={10} page={page} onPageChange={setPage}>
          <Pagination.Content className="justify-between">
            <Pagination.Prev>← Newer</Pagination.Prev>
            <Pagination.Report>
              {({ rangeStart, rangeEnd, total }) => (
                <span className="text-slate-500 dark:text-slate-400">Showing {rangeStart}–{rangeEnd} of {total}</span>
              )}
            </Pagination.Report>
            <Pagination.Pages />
            <Pagination.Next>Older →</Pagination.Next>
          </Pagination.Content>
        </Pagination.Root>
      </div>
    </Boxed>
  );
}

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

type Member = {
  id: number;
  name: string;
  email: string;
  team: string;
  role: string;
  status: 'active' | 'invited' | 'suspended';
  projects: number;
  spend: number;
};

const MEMBERS: Member[] = [
  { id: 1, name: 'Ada Lovelace',   email: 'ada@example.com',   team: 'Engineering', role: 'Admin',      status: 'active',    projects: 12, spend: 18_420 },
  { id: 2, name: 'Grace Hopper',   email: 'grace@example.com', team: 'Engineering', role: 'Maintainer', status: 'active',    projects: 9,  spend: 15_280 },
  { id: 3, name: 'Alan Turing',    email: 'alan@example.com',  team: 'Research',    role: 'Maintainer', status: 'invited',   projects: 6,  spend: 9_840 },
  { id: 4, name: 'Katherine J.',   email: 'kj@example.com',    team: 'Research',    role: 'Viewer',     status: 'active',    projects: 4,  spend: 7_415 },
  { id: 5, name: 'Alan Kay',       email: 'kay@example.com',   team: 'Design',      role: 'Maintainer', status: 'suspended', projects: 3,  spend: 4_190 },
  { id: 6, name: 'Barbara Liskov', email: 'bl@example.com',    team: 'Engineering', role: 'Viewer',     status: 'active',    projects: 7,  spend: 11_060 },
  { id: 7, name: 'Edsger D.',      email: 'ed@example.com',    team: 'Research',    role: 'Viewer',     status: 'active',    projects: 2,  spend: 2_330 },
  { id: 8, name: 'Margaret H.',    email: 'mh@example.com',    team: 'Design',      role: 'Admin',      status: 'active',    projects: 8,  spend: 13_770 },
];

const statusTone = (s: Member['status']) =>
  s === 'active' ? ('success' as const) : s === 'invited' ? ('info' as const) : ('danger' as const);

const NAME: Column<Member> = {
  key: 'name', header: 'Name', width: 180,
  cell: (m) => <span className="font-medium text-slate-700 dark:text-slate-200">{m.name}</span>,
  sortValue: (m) => m.name, filterValue: (m) => m.name,
};
const EMAIL: Column<Member> = { key: 'email', header: 'Email', width: 190, cell: (m) => m.email, sortValue: (m) => m.email, filterValue: (m) => m.email };
const TEAM: Column<Member> = { key: 'team', header: 'Team', width: 140, cell: (m) => m.team, sortValue: (m) => m.team, filterValue: (m) => m.team };
const ROLE: Column<Member> = { key: 'role', header: 'Role', width: 130, cell: (m) => m.role, sortValue: (m) => m.role, filterValue: (m) => m.role };
const STATUS: Column<Member> = {
  key: 'status', header: 'Status', width: 120,
  cell: (m) => <Badge dot tone={statusTone(m.status)}>{m.status}</Badge>,
  sortValue: (m) => m.status, filterValue: (m) => m.status,
};
const PROJECTS: Column<Member> = { key: 'projects', header: 'Projects', align: 'right', width: 110, cell: (m) => m.projects, sortValue: (m) => m.projects };
const SPEND: Column<Member> = { key: 'spend', header: 'Spend', align: 'right', width: 120, cell: (m) => `$${m.spend.toLocaleString()}`, sortValue: (m) => m.spend };

const CORE = [NAME, EMAIL, TEAM, ROLE, STATUS, PROJECTS, SPEND];

function DataTableBasic() {
  return <DataTable rows={MEMBERS} columns={[NAME, TEAM, STATUS, PROJECTS, SPEND]} getRowId={(m) => m.id} />;
}

/**
 * Every feature at once, because they are meant to be used together and each
 * one on its own is a screenshot rather than a demonstration.
 */
function DataTableFull() {
  const [selected, setSelected] = useState<Array<string | number>>([]);
  return (
    <DataTable
      rows={MEMBERS}
      getRowId={(m) => m.id}
      columns={[
        { ...NAME, pin: 'left', alwaysVisible: true },
        EMAIL,
        TEAM,
        ROLE,
        STATUS,
        PROJECTS,
        { ...SPEND, pin: 'right' },
      ]}
      header={<span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Team members</span>}
      footer={<span>{MEMBERS.length} members · ${MEMBERS.reduce((t, m) => t + m.spend, 0).toLocaleString()} total</span>}
      searchable
      selectable
      selected={selected}
      onSelectedChange={setSelected}
      selectionActions={(ids) => <Button size="sm" variant="ghost">Export {ids.length}</Button>}
      pinnedRowIds={[1]}
      resizable
      columnToggle
      stripedRows
      pageSize={25}
      maxHeight="20rem"
    />
  );
}

function DataTableStates() {
  const [state, setState] = useState<'loading' | 'empty' | 'data'>('loading');
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {(['loading', 'empty', 'data'] as const).map((v) => (
          <Button key={v} size="sm" variant={state === v ? 'primary' : 'secondary'} onClick={() => setState(v)}>
            {v}
          </Button>
        ))}
      </div>
      <DataTable
        rows={state === 'data' ? MEMBERS.slice(0, 4) : ([] as Member[])}
        columns={[NAME, TEAM, STATUS, SPEND]}
        getRowId={(m) => m.id}
        loading={state === 'loading'}
        emptyTitle="No members yet"
        emptyHint="Invite someone to get started."
      />
    </div>
  );
}

/* ------------------------------------------------------------------------- */

/** slug -> example id -> component. Joined to `EXAMPLE_META` by id. */
export const EXAMPLE_DEMOS: Record<string, Record<string, React.ComponentType>> = {
  'drawer': { 'basic': DrawerBasic, 'anchored': DrawerAnchored, 'options': DrawerOptions },
  'combined-filter-dropdown': { 'chips': CombinedFilterDropdownChips, 'summary': CombinedFilterDropdownSummary, 'empty': CombinedFilterDropdownEmpty },
  'layout': { 'positions': LayoutPositions },
  'nav-menu': { 'vertical': NavMenuVertical, 'horizontal': NavMenuHorizontal, 'filtering': NavMenuFiltering },
  'splitter': { 'basic': SplitterBasic, 'sizing': SplitterSizing, 'nested': SplitterNested },
  'button': { 'variants': ButtonVariants, 'sizes': ButtonSizes, 'loading': ButtonLoading },
  'badge': { 'tones': BadgeTones, 'dot': BadgeDot },
  'alert': { 'tones': AlertTones, 'dismissible': AlertDismissible },
  'pagination': { 'basic': PaginationBasic, 'variants': PaginationVariants, 'composed': PaginationComposed },
  'tooltip': { 'placement': TooltipPlacement, 'appearance': TooltipAppearance, 'info': TooltipInfo },
  'progress': { 'basic': ProgressBasic, 'clamped': ProgressClamped },
  'data-table': { 'basic': DataTableBasic, 'full': DataTableFull, 'states': DataTableStates },
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
