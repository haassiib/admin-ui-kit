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

function LayoutLeft() { return <ShellFrame position="left" />; }
function LayoutRight() { return <ShellFrame position="right" />; }
function LayoutTop() { return <ShellFrame position="top" />; }
function LayoutBottom() { return <ShellFrame position="bottom" />; }

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

function NavMenuControlledFilter() {
  const [query, setQuery] = useState('bill');
  return (
    <div className="flex max-w-md flex-col gap-3">
      {/* The field is somewhere else entirely — a header, typically. This is how
          the gallery's own search drives its sidebar. */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter from outside the menu…"
        aria-label="Filter menu"
        className="field-input"
      />
      <div className="w-56 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
        <NavMenu sections={MENU_SECTIONS} activeHref="/roles" filter={query} />
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

/* ------------------------------------ Pagination, composed part by part --- */

const Framed = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">{children}</div>
);

function PaginationComposed() {
  const [page, setPage] = useState(4);
  return (
    <Framed>
      <Pagination.Root total={480} itemsPerPage={10} page={page} onPageChange={setPage}>
        <Pagination.Content>
          <Pagination.First />
          <Pagination.Prev />
          <Pagination.Pages />
          <Pagination.Next />
          <Pagination.Last />
        </Pagination.Content>
      </Pagination.Root>
    </Framed>
  );
}

function PaginationTemplate() {
  const [page, setPage] = useState(4);
  return (
    <Framed>
      <Pagination.Root total={480} itemsPerPage={10} page={page} onPageChange={setPage}>
        <Pagination.Content className="justify-between">
          <span className="flex items-center gap-1">
            <Pagination.First />
            <Pagination.Prev />
          </span>
          {/* Anything can sit between the parts — this is the point of the API. */}
          <span className="text-slate-500 dark:text-slate-400">Page {page} of 48</span>
          <span className="flex items-center gap-1">
            <Pagination.Next />
            <Pagination.Last />
          </span>
        </Pagination.Content>
      </Pagination.Root>
    </Framed>
  );
}

function PaginationCustomText() {
  const [page, setPage] = useState(4);
  return (
    <Framed>
      <Pagination.Root total={480} itemsPerPage={10} page={page} onPageChange={setPage}>
        <Pagination.Content>
          <Pagination.Prev>← Newer</Pagination.Prev>
          <Pagination.Report>
            {({ rangeStart, rangeEnd, total }) => (
              <span className="text-slate-500 dark:text-slate-400">
                Showing {rangeStart}–{rangeEnd} of {total} results
              </span>
            )}
          </Pagination.Report>
          <Pagination.Next>Older →</Pagination.Next>
        </Pagination.Content>
      </Pagination.Root>
    </Framed>
  );
}

function PaginationWithInput() {
  const [page, setPage] = useState(4);
  const [draft, setDraft] = useState('4');
  return (
    <Framed>
      <Pagination.Root total={480} itemsPerPage={10} page={page} onPageChange={(n) => { setPage(n); setDraft(String(n)); }}>
        <Pagination.Content>
          <Pagination.Prev />
          <label className="flex items-center gap-1.5">
            Go to
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                const n = Number.parseInt(draft, 10);
                if (!Number.isNaN(n)) setPage(Math.min(Math.max(n, 1), 48));
              }}
              aria-label="Go to page"
              className="w-12 rounded-md border border-slate-200 bg-transparent px-1 py-0.5 text-center dark:border-slate-700"
            />
            <span className="text-slate-400">of 48</span>
          </label>
          <Pagination.Next />
        </Pagination.Content>
      </Pagination.Root>
    </Framed>
  );
}

function PaginationCustomPages() {
  const [page, setPage] = useState(4);
  return (
    <Framed>
      <Pagination.Root total={480} itemsPerPage={10} page={page} onPageChange={setPage} siblings={2}>
        <Pagination.Content>
          <Pagination.Pages>
            {(n) => (
              <Pagination.Page page={n} className="rounded-full">
                {String(n).padStart(2, '0')}
              </Pagination.Page>
            )}
          </Pagination.Pages>
        </Pagination.Content>
      </Pagination.Root>
    </Framed>
  );
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

function DrawerNoBackdrop() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open without backdrop</Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Non-modal panel" backdrop={false}>
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          The page behind stays readable and clickable. Click-outside no longer closes — a click
          outside is now a click ON something — so Escape and the close button are the way out.
        </p>
      </Drawer>
    </>
  );
}

function DrawerHeaderActions() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open with header action</Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Request REQ-4471"
        maxWidth={0.6}
        headerActions={
          <Button size="sm" variant="ghost" onClick={(e) => e.stopPropagation()}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        }
      >
        {drawerBody}
      </Drawer>
    </>
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

function PaginationBasic() { return <Boxed><Pagination {...usePager()} /></Boxed>; }
function PaginationSiblings() { return <Boxed><Pagination {...usePager()} siblings={2} /></Boxed>; }
function PaginationEdges() { return <Boxed><Pagination {...usePager()} edges={2} /></Boxed>; }
function PaginationNoEllipsis() {
  const [page, setPage] = useState(3);
  return (
    <Boxed>
      <Pagination
        totalItems={180} itemsPerPage={25} currentPage={page}
        onPageChange={setPage} onItemsPerPageChange={() => {}}
        showEllipsis={false} showPageSize={false} itemType="members"
      />
    </Boxed>
  );
}
function PaginationInput() { return <Boxed><Pagination {...usePager()} navigation="input" /></Boxed>; }
function PaginationMinimal() {
  return <Boxed><Pagination {...usePager()} showRange={false} showPageSize={false} /></Boxed>;
}
/**
 * Driving the paginator from the query string.
 *
 * This used to be a separate `UrlPagination` component, which was eight lines of
 * wiring around this one — so it is an example instead. In a copy-in library a
 * pattern you can read and paste beats a component you have to import.
 *
 * `scroll: false` matters: without it Next jumps to the top of the document on
 * every page change, which on a long table means losing your place each click.
 */
function PaginationUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const page = Number(params.get('page') ?? 1);
  const size = Number(params.get('pageSize') ?? 25);

  const push = (next: Record<string, string>) => {
    const q = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) q.set(k, v);
    router.push(`${pathname}?${q.toString()}`, { scroll: false });
  };

  return (
    <Boxed>
      <Pagination
        totalItems={1204}
        itemsPerPage={size}
        currentPage={page}
        onPageChange={(p) => push({ page: String(p) })}
        // A bigger page can put you past the end, so a size change resets to 1.
        onItemsPerPageChange={(n) => push({ pageSize: String(n), page: '1' })}
        itemType="members"
      />
    </Boxed>
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
const TEAM: Column<Member> = { key: 'team', header: 'Team', width: 140, cell: (m) => m.team, sortValue: (m) => m.team, filterValue: (m) => m.team, filterable: true };
const ROLE: Column<Member> = { key: 'role', header: 'Role', width: 130, cell: (m) => m.role, sortValue: (m) => m.role, filterValue: (m) => m.role, filterable: true };
const STATUS: Column<Member> = {
  key: 'status', header: 'Status', width: 120,
  cell: (m) => <Badge dot tone={statusTone(m.status)}>{m.status}</Badge>,
  sortValue: (m) => m.status, filterValue: (m) => m.status, filterable: true,
};
const PROJECTS: Column<Member> = { key: 'projects', header: 'Projects', align: 'right', width: 110, cell: (m) => m.projects, sortValue: (m) => m.projects };
const SPEND: Column<Member> = { key: 'spend', header: 'Spend', align: 'right', width: 120, cell: (m) => `$${m.spend.toLocaleString()}`, sortValue: (m) => m.spend };

const CORE = [NAME, EMAIL, TEAM, ROLE, STATUS, PROJECTS, SPEND];

function DataTableBasic() {
  return <DataTable rows={MEMBERS} columns={[NAME, TEAM, PROJECTS]} getRowId={(m) => m.id} />;
}

function DataTableSorting() {
  return <DataTable rows={MEMBERS} columns={[NAME, TEAM, STATUS, PROJECTS, SPEND]} getRowId={(m) => m.id} />;
}

function DataTableSelection() {
  const [selected, setSelected] = useState<Array<string | number>>([2]);
  return (
    <DataTable
      rows={MEMBERS}
      columns={[NAME, TEAM, STATUS]}
      getRowId={(m) => m.id}
      selectable
      selected={selected}
      onSelectedChange={setSelected}
      selectionActions={(ids) => (
        <>
          <Button size="sm" variant="ghost">Export {ids.length}</Button>
          <Button size="sm" variant="danger">Remove</Button>
        </>
      )}
    />
  );
}

function DataTableSearch() {
  return <DataTable rows={MEMBERS} columns={CORE} getRowId={(m) => m.id} searchable searchPlaceholder="Search members…" />;
}

function DataTableFilters() {
  return <DataTable rows={MEMBERS} columns={[NAME, TEAM, ROLE, STATUS]} getRowId={(m) => m.id} />;
}

function DataTablePinnedColumns() {
  return (
    <DataTable
      rows={MEMBERS}
      getRowId={(m) => m.id}
      columns={[{ ...NAME, pin: 'left' }, EMAIL, TEAM, ROLE, STATUS, PROJECTS, { ...SPEND, pin: 'right' }]}
    />
  );
}

function DataTablePinnedRows() {
  return (
    <DataTable
      rows={MEMBERS}
      columns={[NAME, TEAM, STATUS, SPEND]}
      getRowId={(m) => m.id}
      pinnedRowIds={[1, 8]}
      maxHeight="16rem"
    />
  );
}

function DataTableResizable() {
  return <DataTable rows={MEMBERS} columns={[NAME, EMAIL, TEAM, SPEND]} getRowId={(m) => m.id} resizable />;
}

function DataTableColumnToggle() {
  return (
    <DataTable
      rows={MEMBERS}
      getRowId={(m) => m.id}
      columns={[{ ...NAME, alwaysVisible: true }, EMAIL, TEAM, ROLE, STATUS, PROJECTS, SPEND]}
      columnToggle
    />
  );
}

function DataTableEverything() {
  const [selected, setSelected] = useState<Array<string | number>>([]);
  return (
    <DataTable
      rows={MEMBERS}
      getRowId={(m) => m.id}
      columns={[{ ...NAME, pin: 'left', alwaysVisible: true }, EMAIL, TEAM, ROLE, STATUS, PROJECTS, { ...SPEND, pin: 'right' }]}
      selectable
      selected={selected}
      onSelectedChange={setSelected}
      selectionActions={(ids) => <Button size="sm" variant="ghost">Export {ids.length}</Button>}
      searchable
      resizable
      columnToggle
      pinnedRowIds={[1]}
      pageSize={25}
      maxHeight="18rem"
    />
  );
}

function DataTableLoading() {
  return <DataTable rows={MEMBERS} columns={[NAME, TEAM, STATUS, SPEND]} getRowId={(m) => m.id} loading />;
}

/**
 * The ranked view that used to be its own `RankedTable` component — a fixed
 * six-column table with a hard-coded heading and no sorting. It is a handful of
 * column definitions here, and it sorts, selects and pages for free.
 */
const RANKED_ROWS = [
  { id: 1, rank: 1, name: 'Engineering', spend: 184_320, count: 1_204, roi: 31.4 },
  { id: 2, rank: 2, name: 'Research', spend: 152_880, count: 986, roi: 18.2 },
  { id: 3, rank: 3, name: 'Design', spend: 98_400, count: 610, roi: -4.7 },
  { id: 4, rank: 4, name: 'Support', spend: 74_150, count: 402, roi: 9.1 },
  { id: 5, rank: 5, name: 'Operations', spend: 41_900, count: 233, roi: 22.8 },
];

function DataTableRanked() {
  type Row = (typeof RANKED_ROWS)[number];
  return (
    <DataTable
      rows={RANKED_ROWS}
      getRowId={(r: Row) => r.id}
      columns={[
        { key: 'rank', header: '#', width: 56, cell: (r: Row) => <span className="tabular-nums text-slate-400">{r.rank}</span> },
        { key: 'name', header: 'Team', cell: (r: Row) => <span className="font-medium text-slate-700 dark:text-slate-200">{r.name}</span>, sortValue: (r: Row) => r.name },
        { key: 'spend', header: 'Spend', align: 'right', cell: (r: Row) => <span className="tabular-nums">${r.spend.toLocaleString()}</span>, sortValue: (r: Row) => r.spend },
        { key: 'count', header: 'Signups', align: 'right', cell: (r: Row) => <span className="tabular-nums">{r.count.toLocaleString()}</span>, sortValue: (r: Row) => r.count },
        {
          key: 'roi', header: 'ROI', align: 'right', sortValue: (r: Row) => r.roi,
          // Tinting by sign is the one thing worth carrying over from the old
          // component: a negative return that reads like every other number is
          // the number people miss.
          cell: (r: Row) => (
            <span className={`tabular-nums font-medium ${r.roi >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {r.roi.toFixed(1)}%
            </span>
          ),
        },
      ]}
    />
  );
}

function DataTableEmpty() {
  return (
    <DataTable
      rows={[] as Member[]}
      columns={[NAME, TEAM, STATUS]}
      getRowId={(m) => m.id}
      emptyTitle="No members yet"
      emptyHint="Invite someone to get started."
    />
  );
}

/* ------------------------------------------------------------------------- */

/** slug -> example id -> component. Joined to `EXAMPLE_META` by id. */
export const EXAMPLE_DEMOS: Record<string, Record<string, React.ComponentType>> = {
  'drawer': { 'basic': DrawerBasic, 'anchored': DrawerAnchored, 'no-backdrop': DrawerNoBackdrop, 'header-actions': DrawerHeaderActions },
  'combined-filter-dropdown': { 'chips': CombinedFilterDropdownChips, 'summary': CombinedFilterDropdownSummary, 'empty': CombinedFilterDropdownEmpty },
  'layout': { 'left': LayoutLeft, 'right': LayoutRight, 'top': LayoutTop, 'bottom': LayoutBottom },
  'nav-menu': { 'vertical': NavMenuVertical, 'horizontal': NavMenuHorizontal, 'filterable': NavMenuFilterable, 'controlled-filter': NavMenuControlledFilter },
  'splitter': { 'basic': SplitterBasic, 'vertical': SplitterVertical, 'size': SplitterSize, 'min-max': SplitterMinMax, 'nested': SplitterNested, 'resize-events': SplitterResizeEvents },
  'button': { 'variants': ButtonVariants, 'sizes': ButtonSizes, 'loading': ButtonLoading },
  'badge': { 'tones': BadgeTones, 'dot': BadgeDot },
  'alert': { 'tones': AlertTones, 'dismissible': AlertDismissible },
  'pagination': {
    'basic': PaginationBasic, 'siblings': PaginationSiblings, 'edges': PaginationEdges,
    'no-ellipsis': PaginationNoEllipsis, 'input': PaginationInput, 'minimal': PaginationMinimal,
    'url': PaginationUrl,
    'composed': PaginationComposed, 'template': PaginationTemplate,
    'custom-text': PaginationCustomText, 'with-input': PaginationWithInput,
    'custom-pages': PaginationCustomPages,
    'pill': PaginationPill, 'floating': PaginationFloating,
  },
  'tooltip': { 'placement': TooltipPlacement, 'appearance': TooltipAppearance, 'info': TooltipInfo },
  'progress': { 'basic': ProgressBasic, 'clamped': ProgressClamped },
  'data-table': {
    'basic': DataTableBasic, 'sorting': DataTableSorting, 'selection': DataTableSelection,
    'search': DataTableSearch, 'filters': DataTableFilters, 'pinned-columns': DataTablePinnedColumns,
    'pinned-rows': DataTablePinnedRows, 'resizable': DataTableResizable,
    'column-toggle': DataTableColumnToggle, 'everything': DataTableEverything,
    'loading': DataTableLoading, 'ranked': DataTableRanked, 'empty': DataTableEmpty,
  },
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
