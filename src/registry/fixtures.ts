/**
 * Demo data for the gallery.
 *
 * Deliberately GENERIC — a fictional SaaS admin (people, projects, invoices),
 * with nothing carried over from the app this library was extracted from. A
 * shared library whose examples are full of one company's brands, account
 * numbers and internal jargon is harder to read and impossible to publish.
 *
 * Kept small on purpose: enough rows to show grouping, overflow, sorting, and
 * empty vs full, and nothing more.
 */

import type { MenuItem } from '@/lib/menu';
import type { HeaderNotification } from '@/components/overlay/NotificationCard';
import type { MediaItem } from '@/components/media/MediaLibrary';
import type { RankedRow, TrendPoint, RetentionTrendPoint } from '@/components/data/types';
import type { GridColumn, HistoryEntry } from '@/components/table/BaseGrid';
import type { SavedView } from '@/components/table/BaseTable';
import type { FilterFieldOption } from '@/lib/conditions';

export const DEMO_USER = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  avatarUrl: null,
  roleNames: ['Administrator'],
  departmentCode: 'ENG',
};

/** A group, a nested group and a plain link — enough to exercise collapse,
 *  the active-route highlight and the icon fallback at once. */
export const MENU_TREE: MenuItem[] = [
  { id: 1, name: 'Dashboard', href: '/', icon: 'LayoutDashboard', children: [] },
  {
    id: 2,
    name: 'Reports',
    icon: 'Layers',
    children: [
      { id: 3, name: 'Revenue', href: '/reports/revenue', icon: 'Coins', children: [] },
      { id: 4, name: 'Usage', href: '/reports/usage', icon: 'Activity', children: [] },
    ],
  },
  {
    id: 5,
    name: 'Settings',
    icon: 'Settings',
    children: [
      { id: 6, name: 'Members', href: '/settings/members', icon: 'Users', children: [] },
      { id: 7, name: 'Roles', href: '/settings/roles', icon: 'Shield', children: [] },
      { id: 8, name: 'Unassigned icon', href: '/settings/other', icon: 'NoSuchIcon', children: [] },
    ],
  },
];

export const NOTIFICATIONS: HeaderNotification[] = [
  { eventId: 9, type: 'request.approved',  createdAt: '2026-08-31T08:41:00Z', actor: 'Grace Hopper', ref: 'REQ-4471', requestId: 4471, read: false },
  { eventId: 8, type: 'request.submitted', createdAt: '2026-08-31T08:02:00Z', actor: 'Alan Turing',  ref: 'REQ-4470', requestId: 4470, read: false },
  { eventId: 7, type: 'request.rejected',  createdAt: '2026-08-30T17:26:00Z', actor: 'Ada Lovelace', ref: 'REQ-4468', requestId: 4468, read: true },
  { eventId: 6, type: 'batch.released',    createdAt: '2026-08-30T15:10:00Z', actor: null,           ref: 'BATCH-88', requestId: null, read: true },
];

export type Person = {
  id: number;
  name: string;
  email: string;
  team: string;
  role: string;
  status: 'active' | 'invited' | 'suspended';
  projects: number;
  spend: number;
};

export const PEOPLE: Person[] = [
  { id: 1, name: 'Ada Lovelace',   email: 'ada@example.com',   team: 'Engineering', role: 'Administrator', status: 'active',    projects: 12, spend: 18_420 },
  { id: 2, name: 'Grace Hopper',   email: 'grace@example.com', team: 'Engineering', role: 'Maintainer',    status: 'active',    projects: 9,  spend: 15_280 },
  { id: 3, name: 'Alan Turing',    email: 'alan@example.com',  team: 'Research',    role: 'Maintainer',    status: 'invited',   projects: 6,  spend: 9_840 },
  { id: 4, name: 'Katherine J.',   email: 'kj@example.com',    team: 'Research',    role: 'Viewer',        status: 'active',    projects: 4,  spend: 7_415 },
  { id: 5, name: 'Alan Kay',       email: 'kay@example.com',   team: 'Design',      role: 'Maintainer',    status: 'suspended', projects: 3,  spend: 4_190 },
  { id: 6, name: 'Barbara Liskov', email: 'bl@example.com',    team: 'Engineering', role: 'Viewer',        status: 'active',    projects: 7,  spend: 11_060 },
  { id: 7, name: 'Edsger D.',      email: 'ed@example.com',    team: 'Research',    role: 'Viewer',        status: 'active',    projects: 2,  spend: 2_330 },
  { id: 8, name: 'Margaret H.',    email: 'mh@example.com',    team: 'Design',      role: 'Administrator', status: 'active',    projects: 8,  spend: 13_770 },
];

export const TEAMS = [
  { id: 1, name: 'Engineering', regionId: 1 },
  { id: 2, name: 'Research', regionId: 1 },
  { id: 3, name: 'Design', regionId: 2 },
  { id: 4, name: 'Support', regionId: 2 },
  { id: 5, name: 'Operations', regionId: 3 },
];

export const REGIONS = [
  { id: 1, name: 'Europe' },
  { id: 2, name: 'Americas' },
  { id: 3, name: 'Asia-Pacific' },
];

export const RANKED: RankedRow[] = [
  { id: 1, name: 'Engineering', totalSpend: 184_320, ftd: 1_204, roi: 31.4 },
  { id: 2, name: 'Research',    totalSpend: 152_880, ftd: 986,   roi: 18.2 },
  { id: 3, name: 'Design',      totalSpend: 98_400,  ftd: 610,   roi: -4.7 },
  { id: 4, name: 'Support',     totalSpend: 74_150,  ftd: 402,   roi: 9.1 },
  { id: 5, name: 'Operations',  totalSpend: 41_900,  ftd: 233,   roi: 22.8 },
];

/** 30 days, generated so the line has real shape rather than noise. */
export const TREND: TrendPoint[] = Array.from({ length: 30 }, (_, i) => {
  const wave = Math.sin(i / 4) * 0.28 + 1;
  return {
    date: new Date(Date.UTC(2026, 7, 1 + i)).toISOString().slice(0, 10),
    spend: Math.round(14_000 * wave + i * 180),
    registrations: Math.round(420 * wave + i * 6),
    ftd: Math.round(96 * wave + i * 1.4),
  };
});

export const RETENTION: RetentionTrendPoint[] = [
  { month: '2026-03-01', depositRate: 22.4, thirtyDaysRate: 11.2, registerCount: 8_420,  depositCount: 1_886, thirtyDaysCount: 943 },
  { month: '2026-04-01', depositRate: 24.1, thirtyDaysRate: 12.8, registerCount: 9_110,  depositCount: 2_195, thirtyDaysCount: 1_166 },
  { month: '2026-05-01', depositRate: 21.7, thirtyDaysRate: 10.4, registerCount: 8_960,  depositCount: 1_944, thirtyDaysCount: 932 },
  { month: '2026-06-01', depositRate: 26.3, thirtyDaysRate: 14.1, registerCount: 10_240, depositCount: 2_693, thirtyDaysCount: 1_444 },
  { month: '2026-07-01', depositRate: 25.0, thirtyDaysRate: 13.5, registerCount: 10_880, depositCount: 2_720, thirtyDaysCount: 1_469 },
  // A null month, so the chart's gap handling is visible rather than assumed.
  { month: '2026-08-01', depositRate: null, thirtyDaysRate: null, registerCount: 4_110,  depositCount: 0,     thirtyDaysCount: 0 },
];

export const MEDIA: MediaItem[] = [
  { id: 'm1', name: 'hero-banner.png',   kind: 'image',    size: 482_112, uploadedAt: '2026-08-28' },
  { id: 'm2', name: 'onboarding.mp4',    kind: 'video',    size: 18_204_416, uploadedAt: '2026-08-27' },
  { id: 'm3', name: 'terms-v3.pdf',      kind: 'document', size: 91_204, uploadedAt: '2026-08-24' },
  { id: 'm4', name: 'launch-jingle.mp3', kind: 'audio',    size: 2_411_008, uploadedAt: '2026-08-22' },
  { id: 'm5', name: 'avatar-ada.png',    kind: 'image',    size: 24_576, uploadedAt: '2026-08-20' },
  { id: 'm6', name: 'export.csv',        kind: 'other',    size: 5_120, uploadedAt: '2026-08-19' },
  { id: 'm7', name: 'screenshot-01.png', kind: 'image',    size: 310_720, uploadedAt: '2026-08-18' },
  { id: 'm8', name: 'walkthrough.mov',   kind: 'video',    size: 42_991_616, uploadedAt: '2026-08-15' },
];

/* ── The Lark-Base-style grid ──────────────────────────────────────────────── */

export type Task = {
  id: number;
  title: string;
  status: 'todo' | 'doing' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  team: 'design' | 'eng' | 'ops';
  owner: string;
  tags: string[];
  estimate: number | null;
  due: string | null;
  billable: boolean;
  /** Values of fields added at runtime, keyed by field key. */
  extra?: Record<string, unknown>;
};

/** Where a runtime-added field reads and writes on a task — what `columnFromField` needs. */
export const TASK_EXTRA = {
  get: (t: Task, key: string) => t.extra?.[key],
  set: (t: Task, key: string, value: unknown): Task => ({ ...t, extra: { ...t.extra, [key]: value } }),
};

/** Option lists carry a TONE where one was chosen; the rest colour by position. */
export const TASK_STATUS: FilterFieldOption[] = [
  { value: 'todo', label: 'To do', tone: 'slate' },
  { value: 'doing', label: 'In progress', tone: 'sky' },
  { value: 'review', label: 'In review', tone: 'amber' },
  { value: 'done', label: 'Done', tone: 'emerald' },
];
export const TASK_PRIORITY: FilterFieldOption[] = [
  { value: 'low', label: 'Low', tone: 'zinc' },
  { value: 'medium', label: 'Medium', tone: 'blue' },
  { value: 'high', label: 'High', tone: 'orange' },
  { value: 'urgent', label: 'Urgent', tone: 'rose' },
];
export const TASK_TEAM: FilterFieldOption[] = [
  { value: 'design', label: 'Design' },
  { value: 'eng', label: 'Engineering' },
  { value: 'ops', label: 'Operations' },
];
export const TASK_TAGS: FilterFieldOption[] = [
  { value: 'bug', label: 'Bug' },
  { value: 'feature', label: 'Feature' },
  { value: 'docs', label: 'Docs' },
  { value: 'infra', label: 'Infra' },
  { value: 'customer', label: 'Customer' },
];

export const TASKS: Task[] = [
  { id: 1, title: 'Fix invoice rounding on split payments', status: 'doing', priority: 'urgent', team: 'eng', owner: 'Grace Hopper', tags: ['bug', 'customer'], estimate: 3, due: '2026-09-29', billable: true },
  { id: 2, title: 'Onboarding checklist redesign', status: 'review', priority: 'high', team: 'design', owner: 'Ada Lovelace', tags: ['feature'], estimate: 8, due: '2026-10-03', billable: true },
  { id: 3, title: 'Rotate staging database credentials', status: 'todo', priority: 'medium', team: 'ops', owner: 'Linus Torvalds', tags: ['infra'], estimate: 1, due: '2026-09-27', billable: false },
  { id: 4, title: 'Write API changelog for v3.2', status: 'todo', priority: 'low', team: 'eng', owner: 'Margaret Hamilton', tags: ['docs'], estimate: 2, due: null, billable: false },
  { id: 5, title: 'Dark-mode contrast audit', status: 'done', priority: 'medium', team: 'design', owner: 'Ada Lovelace', tags: ['feature', 'docs'], estimate: 5, due: '2026-09-20', billable: true },
  { id: 6, title: 'Export to CSV times out over 50k rows', status: 'doing', priority: 'high', team: 'eng', owner: 'Grace Hopper', tags: ['bug'], estimate: 5, due: '2026-10-01', billable: true },
  { id: 7, title: 'Quarterly cost review', status: 'todo', priority: 'medium', team: 'ops', owner: 'Katherine Johnson', tags: [], estimate: null, due: '2026-10-15', billable: false },
  { id: 8, title: 'Empty-state illustrations', status: 'review', priority: 'low', team: 'design', owner: 'Mary Jackson', tags: ['feature'], estimate: 3, due: '2026-10-08', billable: true },
  { id: 9, title: 'Alert on failed nightly sync', status: 'done', priority: 'high', team: 'ops', owner: 'Linus Torvalds', tags: ['infra', 'bug'], estimate: 2, due: '2026-09-18', billable: false },
  { id: 10, title: 'Customer asks for SSO via Okta', status: 'todo', priority: 'urgent', team: 'eng', owner: 'Margaret Hamilton', tags: ['feature', 'customer'], estimate: 13, due: '2026-10-20', billable: true },
  { id: 11, title: 'Retire legacy /v1 endpoints', status: 'doing', priority: 'medium', team: 'eng', owner: 'Linus Torvalds', tags: ['infra'], estimate: 8, due: '2026-11-01', billable: false },
  { id: 12, title: 'Pricing page copy', status: 'done', priority: 'low', team: 'design', owner: 'Mary Jackson', tags: ['docs'], estimate: 1, due: '2026-09-12', billable: false },
  { id: 13, title: 'Rate limiter returns 500 instead of 429', status: 'review', priority: 'urgent', team: 'eng', owner: 'Grace Hopper', tags: ['bug'], estimate: 2, due: '2026-09-26', billable: true },
  { id: 14, title: 'Vendor security questionnaire', status: 'doing', priority: 'high', team: 'ops', owner: 'Katherine Johnson', tags: ['customer', 'docs'], estimate: 4, due: '2026-09-30', billable: true },
  { id: 15, title: 'Keyboard navigation for the grid', status: 'todo', priority: 'high', team: 'design', owner: 'Ada Lovelace', tags: ['feature'], estimate: 5, due: null, billable: true },
  { id: 16, title: 'Backfill missing avatar images', status: 'done', priority: 'low', team: 'ops', owner: 'Mary Jackson', tags: ['infra'], estimate: 1, due: '2026-09-10', billable: false },
];

/** The grid's columns over `TASKS`. `kind` and `options` drive filter, sort,
 *  group, colour and the editor together; `value` reads a row and `set`
 *  rebuilds one, which is what makes a column editable. */
export const TASK_COLUMNS: GridColumn<Task>[] = [
  { key: 'title', label: 'Task', kind: 'text', width: 280, value: (t) => t.title, set: (t, v) => ({ ...t, title: String(v ?? '') }), groupable: false },
  { key: 'status', label: 'Status', kind: 'select', options: TASK_STATUS, width: 130, value: (t) => t.status, set: (t, v) => ({ ...t, status: (v ?? 'todo') as Task['status'] }) },
  { key: 'priority', label: 'Priority', kind: 'select', options: TASK_PRIORITY, width: 110, value: (t) => t.priority, set: (t, v) => ({ ...t, priority: (v ?? 'low') as Task['priority'] }) },
  { key: 'team', label: 'Team', kind: 'select', options: TASK_TEAM, width: 130, value: (t) => t.team, set: (t, v) => ({ ...t, team: (v ?? 'eng') as Task['team'] }) },
  { key: 'owner', label: 'Owner', kind: 'text', width: 160, value: (t) => t.owner, set: (t, v) => ({ ...t, owner: String(v ?? '') }) },
  { key: 'tags', label: 'Tags', kind: 'select', options: TASK_TAGS, width: 180, value: (t) => t.tags, set: (t, v) => ({ ...t, tags: Array.isArray(v) ? v.map(String) : [] }) },
  { key: 'estimate', label: 'Estimate', kind: 'number', width: 90, align: 'right', value: (t) => t.estimate, set: (t, v) => ({ ...t, estimate: v == null || v === '' || Number.isNaN(Number(v)) ? null : Number(v) }), groupable: false },
  { key: 'due', label: 'Due', kind: 'date', width: 120, value: (t) => t.due, set: (t, v) => ({ ...t, due: v ? String(v) : null }), groupable: false },
  { key: 'billable', label: 'Billable', kind: 'bool', width: 90, value: (t) => t.billable, set: (t, v) => ({ ...t, billable: Boolean(v) }) },
];

/** A few past edits, so a record's History and Log tabs have something to show. */
export const TASK_HISTORY: HistoryEntry[] = [
  { id: 'h1', rowId: 1, field: 'status', label: 'Status', from: 'todo', to: 'doing', at: '2026-09-25T09:12:00Z', by: 'Grace Hopper' },
  { id: 'h2', rowId: 1, field: 'priority', label: 'Priority', from: 'high', to: 'urgent', at: '2026-09-24T16:40:00Z', by: 'Ada Lovelace' },
  { id: 'h3', rowId: 1, field: 'tags', label: 'Tags', from: ['bug'], to: ['bug', 'customer'], at: '2026-09-24T11:05:00Z', by: 'Grace Hopper' },
  { id: 'h4', rowId: 2, field: 'status', label: 'Status', from: 'doing', to: 'review', at: '2026-09-25T14:30:00Z', by: 'Ada Lovelace' },
];

/** Three saved views over the task table — the shapes a real app starts with. */
export const TASK_VIEWS: SavedView[] = [
  { id: 'all', name: 'All tasks', view: { conditions: [], match: 'all', groups: [], sorts: [], colors: [] } },
  {
    id: 'open',
    name: 'Open by team',
    view: {
      conditions: [{ field: 'status', op: 'isNot', value: 'done' }],
      match: 'all',
      groups: [{ by: 'team', dir: 'asc' }],
      sorts: [{ key: 'due', dir: 'asc' }],
      colors: [{ id: 'u', scope: 'row', field: 'priority', op: 'is', value: 'urgent', tone: 'rose' }],
      frozen: 2,
    },
  },
  { id: 'board', name: 'Status board', view: { mode: 'board', boardBy: 'status', conditions: [], match: 'all', groups: [], sorts: [{ key: 'priority', dir: 'desc' }], colors: [] } },
];

/* ── Charts ───────────────────────────────────────────────────────────────── */

/** Monthly recurring revenue by plan, twelve months. */
export const MRR_BY_PLAN = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map((month, i) => ({
  month,
  starter: Math.round(18_000 + i * 900 + Math.sin(i / 2) * 1_800),
  pro: Math.round(42_000 + i * 2_600 + Math.cos(i / 3) * 3_200),
  enterprise: Math.round(61_000 + i * 4_100 + (i > 6 ? 9_000 : 0)),
}));

export const PLAN_SERIES = [
  { key: 'starter', label: 'Starter', slot: 0 },
  { key: 'pro', label: 'Pro', slot: 1 },
  { key: 'enterprise', label: 'Enterprise', slot: 2 },
];

/** Open tickets by team, for a horizontal bar. */
export const TICKETS_BY_TEAM = [
  { team: 'Customer success', open: 184, overdue: 22 },
  { team: 'Billing', open: 96, overdue: 14 },
  { team: 'Integrations', open: 71, overdue: 5 },
  { team: 'Platform', open: 58, overdue: 9 },
  { team: 'Security', open: 23, overdue: 1 },
];

/** Weekly active users — four regions, one of them the story. */
export const WAU_BY_REGION = Array.from({ length: 16 }, (_, i) => ({
  week: `W${i + 21}`,
  europe: Math.round(8_200 + i * 140 + Math.sin(i / 2) * 400),
  americas: Math.round(11_400 + i * 90 + Math.cos(i / 2.5) * 500),
  apac: Math.round(4_100 + i * 420),
  mea: Math.round(2_600 + i * 35 + Math.sin(i) * 160),
}));

export const REGION_SERIES = [
  { key: 'europe', label: 'Europe', slot: 0 },
  { key: 'americas', label: 'Americas', slot: 1 },
  { key: 'apac', label: 'Asia-Pacific', slot: 2 },
  { key: 'mea', label: 'Middle East & Africa', slot: 3 },
];

export const SIGNUPS_BY_CHANNEL = [
  { label: 'Organic search', value: 4_820 },
  { label: 'Paid social', value: 2_950 },
  { label: 'Referral', value: 1_730 },
  { label: 'Partners', value: 1_120 },
  { label: 'Events', value: 640 },
  { label: 'Podcast', value: 310 },
  { label: 'Other', value: 205 },
];

/** Deal size against sales-cycle length, by segment. */
export const DEALS: { label: string; points: { x: number; y: number; label: string }[] }[] = [
  { label: 'SMB', points: Array.from({ length: 14 }, (_, i) => ({ x: 8 + ((i * 7) % 30), y: 2_000 + ((i * 1_370) % 9_000), label: `SMB deal ${i + 1}` })) },
  { label: 'Mid-market', points: Array.from({ length: 12 }, (_, i) => ({ x: 28 + ((i * 11) % 40), y: 14_000 + ((i * 3_900) % 30_000), label: `Mid-market deal ${i + 1}` })) },
  { label: 'Enterprise', points: Array.from({ length: 9 }, (_, i) => ({ x: 60 + ((i * 13) % 55), y: 48_000 + ((i * 11_000) % 90_000), label: `Enterprise deal ${i + 1}` })) },
];

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));
/** Sessions by weekday and hour — a working-hours peak, a quiet weekend. */
export const SESSIONS_BY_HOUR = WEEKDAYS.map((_, d) =>
  HOURS.map((__, h) => {
    const work = h >= 9 && h <= 18 ? 1 : h >= 7 && h <= 21 ? 0.45 : 0.08;
    const day = d >= 5 ? 0.35 : 1;
    const lunch = h === 13 ? 0.8 : 1;
    return Math.round(1_200 * work * day * lunch + ((d * 7 + h * 3) % 11) * 12);
  }),
);

export const ONBOARDING_FUNNEL = [
  { label: 'Visited pricing', value: 48_200 },
  { label: 'Started trial', value: 9_640 },
  { label: 'Invited a teammate', value: 4_110 },
  { label: 'Connected data', value: 2_380 },
  { label: 'Paid', value: 1_190 },
];

/** Customer satisfaction against target, per team (points). */
export const CSAT_VS_TARGET = [
  { label: 'Integrations', value: 6.2 },
  { label: 'Billing', value: 3.1 },
  { label: 'Platform', value: 0.8 },
  { label: 'Customer success', value: -1.4 },
  { label: 'Onboarding', value: -3.9 },
  { label: 'Security', value: -5.5 },
];

export const SPARK_REVENUE = [42, 44, 43, 47, 49, 48, 52, 55, 54, 58, 61, 64];
export const SPARK_CHURN = [3.1, 3.0, 3.3, 3.2, 3.6, 3.4, 3.8, 3.7, 4.1, 4.0, 4.4, 4.6];
export const SPARK_SEATS = [820, 836, 851, 849, 872, 890, 903, 911, 934, 948, 961, 987];

/* ── Pivot ────────────────────────────────────────────────────────────────── */

export type Sale = {
  id: number;
  region: string;
  country: string;
  rep: string;
  category: string;
  product: string;
  channel: string;
  quarter: string;
  month: string;
  units: number;
  revenue: number;
  cost: number;
};

const SALE_GEO = [
  { region: 'Europe', country: 'Germany', reps: ['Ada Lovelace', 'Alan Turing'] },
  { region: 'Europe', country: 'France', reps: ['Marie Curie'] },
  { region: 'Europe', country: 'Spain', reps: ['Alan Turing'] },
  { region: 'Americas', country: 'United States', reps: ['Grace Hopper', 'Katherine Johnson'] },
  { region: 'Americas', country: 'Brazil', reps: ['Katherine Johnson'] },
  { region: 'Asia-Pacific', country: 'Japan', reps: ['Linus Torvalds'] },
  { region: 'Asia-Pacific', country: 'Australia', reps: ['Margaret Hamilton'] },
];
const SALE_PRODUCTS = [
  { category: 'Hardware', product: 'Laptop', price: 1_200 },
  { category: 'Hardware', product: 'Monitor', price: 320 },
  { category: 'Software', product: 'Licence', price: 480 },
  { category: 'Software', product: 'Support plan', price: 150 },
  { category: 'Services', product: 'Onboarding', price: 900 },
];
const SALE_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 360 deterministic sale records — enough to make a pivot worth pivoting. */
export const SALES: Sale[] = Array.from({ length: 360 }, (_, i) => {
  // Stepped by 3 with a slow drift, so every location gets a share (a step
  // of 7 over 7 locations would land every record on the first).
  const geo = SALE_GEO[(i * 3 + Math.floor(i / 7)) % SALE_GEO.length];
  const prod = SALE_PRODUCTS[(i * 3 + Math.floor(i / 5)) % SALE_PRODUCTS.length];
  const m = (i * 5) % 12;
  const units = 1 + ((i * 13) % 9);
  const revenue = Math.round(units * prod.price * (0.85 + ((i * 17) % 30) / 100));
  return {
    id: i + 1,
    region: geo.region,
    country: geo.country,
    rep: geo.reps[i % geo.reps.length],
    category: prod.category,
    product: prod.product,
    channel: ['Direct', 'Partner', 'Online'][(i * 11) % 3],
    quarter: `Q${Math.floor(m / 3) + 1}`,
    month: SALE_MONTHS[m],
    units,
    revenue,
    cost: Math.round(revenue * (0.55 + ((i * 7) % 20) / 100)),
  };
});
