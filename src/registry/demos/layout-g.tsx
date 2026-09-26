'use client';

/** Live demo for Layout: a small working app inside a frame whose width can be switched. */

import { useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Code2,
  CreditCard,
  Inbox,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  Ticket,
  TrendingUp,
  User,
  Users,
} from 'lucide-react';

import Layout, { type ShellHeaderMenu, type ShellNavSection } from '@/components/layout/Layout';
import { SegmentedControl } from '@/components/layout/ButtonGroup';
import NotificationBell from '@/components/overlay/NotificationBell';
import ToggleSwitch from '@/components/form/ToggleSwitch';
import { NOTIFICATIONS } from '../fixtures';

const NAV: ShellNavSection[] = [
  {
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard />, href: '/' },
      { id: 'inbox', label: 'Inbox', icon: <Inbox />, href: '/inbox', badge: 3 },
      { id: 'tickets', label: 'Tickets', icon: <Ticket />, href: '/tickets', badge: 12 },
    ],
  },
  {
    label: 'Insights',
    items: [
      {
        id: 'reports',
        label: 'Reports',
        icon: <BarChart3 />,
        children: [
          { id: 'sales', label: 'Sales', href: '/reports/sales' },
          { id: 'traffic', label: 'Traffic', href: '/reports/traffic' },
          { id: 'retention', label: 'Retention', href: '/reports/retention' },
        ],
      },
      { id: 'growth', label: 'Growth', icon: <TrendingUp />, href: '/growth' },
    ],
  },
  {
    label: 'Admin',
    items: [
      {
        id: 'settings',
        label: 'Settings',
        icon: <Settings />,
        children: [
          { id: 'general', label: 'General', href: '/settings/general' },
          { id: 'users', label: 'Users', href: '/settings/users' },
          { id: 'billing', label: 'Billing', href: '/settings/billing' },
        ],
      },
      { id: 'team', label: 'Team', icon: <Users />, href: '/team' },
    ],
  },
];

const HEADER_MENUS: ShellHeaderMenu[] = [
  { id: 'overview', label: 'Overview', href: '/' },
  {
    id: 'help',
    label: 'Help',
    icon: <LifeBuoy />,
    items: [
      { label: 'User guide', description: 'How each page works', icon: <BookOpen />, href: '/guide' },
      { label: 'API reference', description: 'For integrations', icon: <Code2 />, href: '/api-docs' },
    ],
  },
];

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/inbox': 'Inbox',
  '/tickets': 'Tickets',
  '/reports/sales': 'Sales',
  '/reports/traffic': 'Traffic',
  '/reports/retention': 'Retention',
  '/growth': 'Growth',
  '/settings/general': 'General',
  '/settings/users': 'Users',
  '/settings/billing': 'Billing',
  '/team': 'Team',
  '/guide': 'User guide',
  '/api-docs': 'API reference',
  '/profile': 'My profile',
  '/change-password': 'Change password',
};

const WIDTHS = { desktop: '100%', tablet: '720px', phone: '390px' } as const;

/** A stand-in page, so each route looks like somewhere. */
function Page({ href }: { href: string }) {
  const title = TITLES[href] ?? 'Page';
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          You are on <code className="font-mono">{href}</code>. The breadcrumb above is built from the sidebar rows.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 @xl:grid-cols-2 @4xl:grid-cols-4">
        {['Open', 'In progress', 'Resolved', 'SLA breached'].map((label, i) => (
          <div key={label} className="panel panel-solid p-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">{[128, 42, 1_204, 3][i]}</p>
          </div>
        ))}
      </div>
      <div className="panel panel-solid divide-y divide-slate-100 dark:divide-slate-700/70">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center justify-between gap-3 px-4 py-3 text-xs">
            <span className="truncate text-slate-700 dark:text-slate-200">
              {title} item {i + 1} — the content column scrolls on its own
            </span>
            <span className="shrink-0 text-slate-400">{i + 2}h ago</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LayoutDemo() {
  const [href, setHref] = useState('/tickets');
  const [width, setWidth] = useState<keyof typeof WIDTHS>('desktop');
  const [signedOut, setSignedOut] = useState(false);
  const [hoverExpand, setHoverExpand] = useState(true);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4">
      <SegmentedControl
        aria-label="Frame width"
        size="sm"
        value={width}
        onChange={setWidth}
        options={[
          { value: 'desktop', label: 'Desktop' },
          { value: 'tablet', label: 'Tablet' },
          { value: 'phone', label: 'Phone' },
        ]}
      />
      <ToggleSwitch id="layout-hover" checked={hoverExpand} onChange={setHoverExpand} label="Widen rail on hover" />
      </div>
      {/* A frame, not the page: the real shell is `100dvh`, which would take
          over the documentation it is shown on. `themeScope="shell"` keeps its
          dark mode inside the frame, and the width switch shows the layout
          answering to the room it has rather than to the window. */}
      <div
        className="mx-auto max-w-full overflow-hidden rounded-xl border border-slate-200 transition-[width] duration-300 dark:border-slate-700"
        style={{ width: WIDTHS[width] }}
      >
        <Layout
          brand={{ name: 'Helpdesk', logo: <Ticket />, href: '/' }}
          nav={NAV}
          activeHref={href}
          onNavigate={setHref}
          home={{ label: 'Home', href: '/' }}
          headerMenus={HEADER_MENUS}
          actions={<NotificationBell items={NOTIFICATIONS} unread={2} />}
          user={{ name: signedOut ? 'Signed out' : 'Avery Stone', email: 'avery@example.com', role: 'Team lead · Support' }}
          userMenu={[
            { label: 'My profile', icon: <User />, href: '/profile' },
            { label: 'Change password', icon: <KeyRound />, href: '/change-password' },
            { label: 'Billing', icon: <CreditCard />, href: '/settings/billing', divider: true },
          ]}
          onSignOut={() => setSignedOut(true)}
          hoverExpand={hoverExpand}
          themeScope="shell"
          storageKey="kit.layout-demo"
          height="640px"
        >
          <Page href={href} />
        </Layout>
      </div>
    </div>
  );
}
