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
