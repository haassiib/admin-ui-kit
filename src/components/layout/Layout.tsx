'use client';

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
  LogOut,
  Menu,
  Monitor,
  Moon,
  SlidersHorizontal,
  Sun,
  X,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useDismiss } from '@/lib/use-dismiss';

/* ------------------------------------------------------------------ types --- */

/** A sidebar row: a link (`href`), or a group of rows (`children`). */
export type ShellNavItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  /** A count beside the label; a dot on the icon when the rail is collapsed. */
  badge?: number;
  children?: ShellNavItem[];
};

/** Sidebar rows under an optional heading. */
export type ShellNavSection = { label?: string; items: ShellNavItem[] };

/** A header menu: a link, or a dropdown of links. */
export type ShellHeaderMenu = {
  id: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  items?: Array<{ label: string; href?: string; icon?: ReactNode; description?: string; onSelect?: () => void }>;
};

export type ShellUser = { name: string; email: string; avatarUrl?: string | null; role?: string };

export type ShellUserMenuItem = {
  label: string;
  icon?: ReactNode;
  href?: string;
  onSelect?: () => void;
  /** Draw a divider above this item. */
  divider?: boolean;
};

export type ShellCrumb = { label: string; href?: string };

export type ShellAccent = keyof typeof ACCENTS;

/** Everything the theme settings panel changes. */
export type ShellAppearance = {
  mode: 'light' | 'dark' | 'system';
  accent: ShellAccent;
  density: 'compact' | 'standard' | 'comfortable';
  content: 'fluid' | 'boxed';
};

export const DEFAULT_APPEARANCE: ShellAppearance = {
  mode: 'light',
  accent: 'indigo',
  density: 'standard',
  content: 'fluid',
};

/* ------------------------------------------------------------- constants --- */

/** Light ink, dark ink and the light tint of each accent — Tailwind's 600, 400 and 50 steps. */
const ACCENTS = {
  indigo: ['#4f46e5', '#818cf8', '#eef2ff'],
  violet: ['#7c3aed', '#a78bfa', '#f5f3ff'],
  sky: ['#0284c7', '#38bdf8', '#f0f9ff'],
  emerald: ['#059669', '#34d399', '#ecfdf5'],
  amber: ['#d97706', '#fbbf24', '#fffbeb'],
  rose: ['#e11d48', '#fb7185', '#fff1f2'],
} as const;

const DENSITY = {
  compact: { header: 'h-12', row: 'py-1.5', main: 'px-3 py-3 @3xl:px-4' },
  standard: { header: 'h-14', row: 'py-2', main: 'px-3 py-4 @3xl:px-6' },
  comfortable: { header: 'h-16', row: 'py-2.5', main: 'px-4 py-6 @3xl:px-8' },
} as const;

// The accent reaches the markup as CSS variables set on the root, so one
// setting recolours every active row, badge and focus ring without a class per
// colour. Dark mode reads the lighter step, which holds contrast on slate-900.
const ACCENT_INK = 'text-[var(--sh-a)] dark:text-[var(--sh-a-dark)]';
const ACCENT_FILL = 'bg-[var(--sh-a)] dark:bg-[var(--sh-a-dark)]';
const ACCENT_SOFT = 'bg-[var(--sh-a-soft)] dark:bg-[color-mix(in_srgb,var(--sh-a-dark)_16%,transparent)]';
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sh-a)] dark:focus-visible:ring-[var(--sh-a-dark)]';
// No display utility here: callers pick `inline-flex` or `hidden @3xl:inline-flex`,
// and two display classes on one element fight, since `cn()` does not merge.
const ICON_BTN = cn(
  'h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
  FOCUS,
);
const MENU_ITEM =
  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800';

const RAIL = '@3xl:w-[4.5rem]';
const WIDE = '@3xl:w-60';

/* ---------------------------------------------------------------- helpers --- */

/** Segment-aware, so `/reports` never lights up for `/reports-archive`. */
const matches = (active: string | undefined, href: string | undefined) =>
  !!active && !!href && (active === href || (href !== '/' && active.startsWith(`${href}/`)));

const isActiveTree = (item: ShellNavItem, active?: string): boolean =>
  matches(active, item.href) || (item.children ?? []).some((c) => isActiveTree(c, active));

/** The rows from the top of the nav down to the active one — the breadcrumb trail. */
function trailFor(sections: ShellNavSection[], active?: string): ShellCrumb[] {
  let best: ShellNavItem[] = [];
  const walk = (items: ShellNavItem[], path: ShellNavItem[]) => {
    for (const item of items) {
      const here = [...path, item];
      // The LONGEST matching href wins: on /tickets/42, "Tickets" and not "Home".
      if (matches(active, item.href) && (item.href?.length ?? 0) > (best.at(-1)?.href?.length ?? -1)) best = here;
      if (item.children) walk(item.children, here);
    }
  };
  for (const s of sections) walk(s.items, []);
  return best.map((i) => ({ label: i.label, href: i.href }));
}

/** Every group containing the active row — opened when the route changes. */
function activeGroups(sections: ShellNavSection[], active?: string): string[] {
  const out: string[] = [];
  const walk = (items: ShellNavItem[]) => {
    for (const item of items) {
      if (item.children?.length && isActiveTree(item, active)) {
        out.push(item.id);
        walk(item.children);
      }
    }
  };
  for (const s of sections) walk(s.items);
  return out;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

function UserAvatar({ user, size = 8 }: { user: ShellUser; size?: 8 | 10 }) {
  const box = size === 8 ? 'h-8 w-8 text-[11px]' : 'h-10 w-10 text-xs';
  return user.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={user.avatarUrl} alt="" className={cn(box, 'shrink-0 rounded-full object-cover')} />
  ) : (
    <span aria-hidden className={cn(box, ACCENT_FILL, 'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white dark:text-slate-900')}>
      {initials(user.name || user.email)}
    </span>
  );
}

const REDUCED_DARK = '(prefers-color-scheme: dark)';
const subscribeScheme = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED_DARK);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};

/* ------------------------------------------------------------------ shell --- */

/**
 * THE WHOLE APP FRAME — sidebar, header and content as one component, in the
 * shape of ticket-management's signed-in layout: a frosted sidebar beside a
 * column of header over content, on a soft gradient ground. Pass the nav and
 * the user; everything else has a working default.
 *
 *   sidebar      sections of links and nested groups with badges; collapses to
 *                an icon rail that widens OVER the page on hover or focus
 *                (so the content never reflows under the pointer), with a
 *                flyout per group when `hoverExpand` is off; off-canvas with a
 *                backdrop when the shell is narrow
 *   header       sidebar toggle, breadcrumbs derived from the nav, header
 *                menus with dropdowns, a slot for search and actions, theme
 *                settings, the user menu
 *   content      the one scroll container, fluid or boxed
 *   theming      light, dark or system; six accents; three densities; fluid or
 *                boxed content — from the header's settings panel
 *
 * ── Narrow is decided by the SHELL's width ──────────────────────────────────
 *
 * The desktop-or-drawer switch is a container query on the shell (`@3xl`), not
 * a viewport breakpoint, so a shell inside a preview pane, a split view or a
 * docs page is laid out for the room it actually has.
 *
 * ── State ───────────────────────────────────────────────────────────────────
 *
 * `appearance` and `collapsed` are controlled when passed with their change
 * callbacks, and otherwise kept here — in `localStorage` too, under
 * `storageKey`, read after mount so the server render never disagrees with the
 * first client one. An app that renders on the server and wants the rail at
 * the right width on the FIRST paint reads a cookie and passes it as
 * `defaultCollapsed`, which is what ticket-management does.
 *
 * `themeScope="document"` (the default) puts the `dark` class on <html>, as an
 * app wants; `"shell"` puts it on the shell alone, for a preview inside a page
 * with its own theme. Links are plain anchors; pass `onNavigate` to route them
 * through a client router instead.
 */
export default function Layout({
  brand,
  nav,
  activeHref,
  onNavigate,
  breadcrumbs,
  home,
  headerMenus = [],
  search,
  actions,
  user,
  userMenu = [],
  onSignOut,
  appearance: appearanceProp,
  onAppearanceChange,
  defaultAppearance,
  collapsed: collapsedProp,
  onCollapsedChange,
  defaultCollapsed = false,
  hoverExpand = true,
  storageKey,
  themeScope = 'document',
  sidebarFooter,
  height = '100dvh',
  className,
  children,
}: {
  brand: { name: string; logo?: ReactNode; href?: string };
  nav: ShellNavSection[];
  /** The current route; lights its row, opens its group and builds the breadcrumbs. */
  activeHref?: string;
  /** Route a link click yourself (a client router). Without it links are plain navigations. */
  onNavigate?: (href: string) => void;
  /** Override the trail derived from the nav. */
  breadcrumbs?: ShellCrumb[];
  /** A first crumb with a home icon, before the derived trail. */
  home?: ShellCrumb;
  headerMenus?: ShellHeaderMenu[];
  search?: ReactNode;
  /** Header controls before the settings button — a notification bell, a help link. */
  actions?: ReactNode;
  user: ShellUser;
  userMenu?: ShellUserMenuItem[];
  /** Adds "Sign out" to the user menu. */
  onSignOut?: () => void;
  appearance?: ShellAppearance;
  onAppearanceChange?: (next: ShellAppearance) => void;
  defaultAppearance?: Partial<ShellAppearance>;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  defaultCollapsed?: boolean;
  /** A collapsed rail widens while the pointer or focus is in it. Off: groups open as flyouts. */
  hoverExpand?: boolean;
  /** Keep uncontrolled appearance and collapse in `localStorage` under this key. */
  storageKey?: string;
  themeScope?: 'document' | 'shell';
  sidebarFooter?: ReactNode;
  /** The shell's height. The content column scrolls inside it. */
  height?: string | number;
  className?: string;
  children: ReactNode;
}) {
  const [innerAppearance, setInnerAppearance] = useState<ShellAppearance>({ ...DEFAULT_APPEARANCE, ...defaultAppearance });
  const [innerCollapsed, setInnerCollapsed] = useState(defaultCollapsed);
  const appearance = appearanceProp ?? innerAppearance;
  const collapsed = collapsedProp ?? innerCollapsed;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [peek, setPeek] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const loaded = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  // Flyouts and tooltips from the rail render here: the sidebar clips its
  // overflow, and the body would lose the shell's `dark` class and accent
  // variables. The root has no transform, so `fixed` inside it is still
  // relative to the viewport and its `overflow-hidden` does not clip it.
  const [layer, setLayer] = useState<HTMLDivElement | null>(null);

  // Narrow means the drawer layout — the same line as the `@3xl` container
  // query (48rem), measured, because the rail's labels are markup, not CSS.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      setNarrow(entry.contentRect.width < 48 * rem);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const systemDark = useSyncExternalStore(subscribeScheme, () => window.matchMedia(REDUCED_DARK).matches, () => false);
  const dark = appearance.mode === 'dark' || (appearance.mode === 'system' && systemDark);

  const save = (next: { appearance?: ShellAppearance; collapsed?: boolean }) => {
    if (!storageKey) return;
    try {
      const prev = JSON.parse(window.localStorage.getItem(storageKey) ?? '{}');
      window.localStorage.setItem(storageKey, JSON.stringify({ ...prev, ...next }));
    } catch {
      // Storage is a convenience; losing it loses nothing live.
    }
  };

  // Stored preferences, once, after mount — never during render, which the
  // server has no `localStorage` for.
  useEffect(() => {
    if (!storageKey || loaded.current) return;
    loaded.current = true;
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? 'null') as {
        appearance?: Partial<ShellAppearance>;
        collapsed?: boolean;
      } | null;
      if (saved?.appearance && !appearanceProp) setInnerAppearance((a) => ({ ...a, ...saved.appearance }));
      if (typeof saved?.collapsed === 'boolean' && collapsedProp === undefined) setInnerCollapsed(saved.collapsed);
    } catch {
      // Corrupt or blocked storage: the defaults stand.
    }
  }, [storageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const setAppearance = (patch: Partial<ShellAppearance>) => {
    const next = { ...appearance, ...patch };
    onAppearanceChange?.(next);
    if (!appearanceProp) {
      setInnerAppearance(next);
      save({ appearance: next });
    }
  };
  const setCollapsed = (next: boolean) => {
    onCollapsedChange?.(next);
    if (collapsedProp === undefined) {
      setInnerCollapsed(next);
      save({ collapsed: next });
    }
    setPeek(false);
  };

  // Document scope: the app's theme is the page's theme.
  useEffect(() => {
    if (themeScope !== 'document') return;
    document.documentElement.classList.toggle('dark', dark);
  }, [dark, themeScope]);

  // The drawer is a modal on a narrow shell: Escape closes it.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const go = (href: string | undefined, e?: MouseEvent) => {
    setMobileOpen(false);
    if (!href || !onNavigate) return;
    e?.preventDefault();
    onNavigate(href);
  };

  const [a, aDark, aSoft] = ACCENTS[appearance.accent] ?? ACCENTS.indigo;
  const density = DENSITY[appearance.density] ?? DENSITY.standard;
  const trail = [...(home ? [home] : []), ...(breadcrumbs ?? trailFor(nav, activeHref))];
  // A collapsed rail exists only on a wide shell; the narrow drawer always has labels.
  const rail = collapsed && !peek && !narrow;
  const openIds = activeGroups(nav, activeHref);

  return (
    <div
      ref={rootRef}
      className={cn(
        '@container relative flex overflow-hidden bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 text-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-black dark:text-slate-100',
        themeScope === 'shell' && dark && 'dark',
        className,
      )}
      style={{ height, '--sh-a': a, '--sh-a-dark': aDark, '--sh-a-soft': aSoft } as CSSProperties}
    >
      <div ref={setLayer} />
      {/* Narrow shell: the drawer's backdrop — over the header (z-40), under the drawer (z-50). */}
      {mobileOpen && (
        <div aria-hidden className="absolute inset-0 z-[45] bg-slate-900/40 backdrop-blur-[1px] @3xl:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* The rail's footprint in the row. The panel itself is absolute over
          it, so widening on hover overlays the page instead of reflowing it. */}
      <div className={cn('relative w-0 shrink-0 transition-[width] duration-300', collapsed ? RAIL : WIDE)}>
        <aside
          aria-label="Main navigation"
          onMouseEnter={() => collapsed && hoverExpand && setPeek(true)}
          onMouseLeave={() => setPeek(false)}
          onFocus={() => collapsed && hoverExpand && setPeek(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPeek(false);
          }}
          className={cn(
            'absolute inset-y-0 left-0 z-50 flex w-64 flex-col overflow-hidden border-r border-black/10 bg-white/85 backdrop-blur-xl transition-[width,transform,box-shadow] duration-300 ease-in-out dark:border-white/10 dark:bg-slate-900/85',
            mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
            '@3xl:translate-x-0',
            rail ? RAIL : WIDE,
            collapsed && peek && '@3xl:shadow-2xl',
          )}
        >
          <div className={cn('flex shrink-0 items-center gap-3 border-b border-slate-200 dark:border-slate-700/70', density.header, rail ? 'justify-center px-2' : 'px-4')}>
            <a
              href={brand.href ?? '#'}
              onClick={(e) => (brand.href ? go(brand.href, e) : e.preventDefault())}
              className={cn('flex min-w-0 items-center gap-2.5 rounded-lg', FOCUS)}
            >
              <span className={cn(ACCENT_FILL, 'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white dark:text-slate-900 [&>svg]:h-4 [&>svg]:w-4')}>
                {brand.logo ?? <span className="text-xs font-bold">{initials(brand.name)}</span>}
              </span>
              <span className={cn('truncate text-sm font-bold text-slate-900 transition-opacity duration-200 dark:text-white', rail && 'sr-only')}>{brand.name}</span>
            </a>
            <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation" className={cn(ICON_BTN, 'ml-auto inline-flex @3xl:hidden')}>
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* The scroll lives here, not on the panel, so the brand stays put
              and a long nav scrolls under it. */}
          <nav className={cn('custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-4 pt-3', rail ? 'px-2' : 'px-3')}>
            {nav.map((section, si) => (
              <div key={section.label ?? si} className={cn(si > 0 && 'mt-4')}>
                {section.label &&
                  (rail ? (
                    <div aria-hidden className="mx-3 mb-2 border-t border-slate-200 dark:border-slate-700/70" />
                  ) : (
                    <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{section.label}</p>
                  ))}
                <ul className="space-y-0.5">
                  {section.items.map((item) => (
                    <NavRow
                      key={item.id}
                      item={item}
                      level={0}
                      rail={rail}
                      flyouts={collapsed && !hoverExpand}
                      activeHref={activeHref}
                      rowPad={density.row}
                      go={go}
                      openIds={openIds}
                      layer={layer}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {sidebarFooter && !rail && <div className="shrink-0 border-t border-slate-200 p-3 dark:border-slate-700/70">{sidebarFooter}</div>}
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={cn(
            'relative z-40 flex shrink-0 items-center gap-2 border-b border-black/10 bg-white/70 px-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/70 @3xl:gap-3 @3xl:px-5',
            density.header,
          )}
        >
          <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation" className={cn(ICON_BTN, 'inline-flex @3xl:hidden')}>
            <Menu className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(ICON_BTN, 'hidden @3xl:inline-flex')}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          <Crumbs trail={trail} go={go} homeIcon={!!home} />

          {headerMenus.length > 0 && (
            <nav aria-label="Header" className="hidden items-center gap-0.5 @4xl:flex">
              {headerMenus.map((m) => (
                <HeaderMenu key={m.id} menu={m} active={matches(activeHref, m.href)} go={go} />
              ))}
            </nav>
          )}
          {search}
          {actions}
          <ThemePanel appearance={appearance} set={setAppearance} collapsed={collapsed} setCollapsed={setCollapsed} />
          <UserMenu user={user} items={userMenu} onSignOut={onSignOut} go={go} />
        </header>

        <main className="custom-scrollbar min-h-0 flex-1 overflow-auto">
          <div className={cn(density.main, appearance.content === 'boxed' && 'mx-auto w-full max-w-5xl')}>{children}</div>
        </main>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- nav row --- */

function NavRow({
  item,
  level,
  rail,
  flyouts,
  activeHref,
  rowPad,
  go,
  openIds,
  layer,
}: {
  item: ShellNavItem;
  level: number;
  rail: boolean;
  flyouts: boolean;
  activeHref?: string;
  rowPad: string;
  go: (href: string | undefined, e?: MouseEvent) => void;
  openIds: string[];
  layer: HTMLElement | null;
}) {
  const group = !!item.children?.length;
  const liRef = useRef<HTMLLIElement>(null);
  const [at, setAt] = useState<{ left: number; top: number } | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const floating = rail && flyouts;
  // The pointer crosses an 8px gap between the rail and a flyout; closing on a
  // short timer, cancelled by entering the flyout, keeps it from vanishing mid-way.
  const show = () => {
    if (!floating) return;
    window.clearTimeout(closeTimer.current);
    const r = liRef.current?.getBoundingClientRect();
    if (r) setAt({ left: r.right + 8, top: r.top });
  };
  const hide = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setAt(null), 120);
  };
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);
  const active = isActiveTree(item, activeHref);
  const [open, setOpen] = useState(() => openIds.includes(item.id));

  // Navigating into a group opens it; a group closed by hand stays closed
  // until the route moves into it again.
  const containsActive = openIds.includes(item.id);
  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive, activeHref]);

  const row = cn(
    'group relative flex w-full items-center rounded-lg text-[13px] font-medium transition-colors',
    rowPad,
    rail ? 'justify-center px-2' : 'gap-3 px-3',
    FOCUS,
    active && !group
      ? cn(ACCENT_SOFT, ACCENT_INK)
      : active
        ? 'text-slate-900 dark:text-white'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white',
  );

  const icon = item.icon ? (
    <span className={cn('relative inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center [&>svg]:h-[18px] [&>svg]:w-[18px]', active ? ACCENT_INK : 'text-slate-400 group-hover:text-slate-500 dark:text-slate-500')}>
      {item.icon}
      {/* A rail has no room for the number; a dot says "something is waiting". */}
      {rail && (item.badge ?? 0) > 0 && (
        <span className={cn(ACCENT_FILL, 'absolute -right-1 -top-1 h-2 w-2 rounded-full ring-2 ring-white dark:ring-slate-900')} />
      )}
    </span>
  ) : (
    // An icon-less child still lines up under its parent's label.
    !rail && level > 0 && <span aria-hidden className="w-[18px] shrink-0" />
  );

  const label = rail ? (
    <span className="sr-only">{item.label}</span>
  ) : (
    <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
  );

  const badge = !rail && (item.badge ?? 0) > 0 && (
    <span className={cn(ACCENT_FILL, 'shrink-0 rounded-full px-1.5 text-[10px] font-semibold leading-4 tabular-nums text-white dark:text-slate-900')}>
      {item.badge! > 99 ? '99+' : item.badge}
    </span>
  );

  const children = group && (
    <ul className={cn('mt-0.5 space-y-0.5', !rail && 'ml-[1.35rem] border-l border-slate-200 pl-2 dark:border-slate-700/70')}>
      {item.children!.map((c) => (
        <NavRow key={c.id} item={c} level={level + 1} rail={false} flyouts={false} activeHref={activeHref} rowPad={rowPad} go={go} openIds={openIds} layer={layer} />
      ))}
    </ul>
  );

  return (
    <li
      ref={liRef}
      className="relative"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) hide();
      }}
    >
      {group ? (
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} title={rail ? item.label : undefined} className={row}>
          {icon}
          {label}
          {badge}
          {!rail && <ChevronDown aria-hidden className={cn('h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} />}
        </button>
      ) : (
        <a
          href={item.href ?? '#'}
          onClick={(e) => go(item.href, e)}
          aria-current={matches(activeHref, item.href) ? 'page' : undefined}
          title={rail ? item.label : undefined}
          className={row}
        >
          {icon}
          {label}
          {badge}
        </a>
      )}

      {group && !rail && open && children}

      {/* Collapsed, with no hover-widen: a link gets a tooltip naming it, and a
          group's rows open beside the rail rather than becoming unreachable. */}
      {floating &&
        at &&
        layer &&
        createPortal(
          group ? (
            <div
              data-overlay="menu"
              onMouseEnter={show}
              onMouseLeave={hide}
              style={{ left: at.left, top: at.top }}
              className="panel panel-solid fixed z-[200] w-52 p-2 animate-fade-in"
            >
              <p className="px-3 pb-1.5 pt-1 text-[11px] font-semibold text-slate-900 dark:text-white">{item.label}</p>
              {children}
            </div>
          ) : (
            <span
              role="tooltip"
              style={{ left: at.left, top: at.top + 6 }}
              className="pointer-events-none fixed z-[200] whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow-lg dark:bg-slate-700"
            >
              {item.label}
            </span>
          ),
          layer,
        )}
    </li>
  );
}

/* ------------------------------------------------------------ breadcrumbs --- */

function Crumbs({ trail, go, homeIcon }: { trail: ShellCrumb[]; go: (href: string | undefined, e?: MouseEvent) => void; homeIcon: boolean }) {
  return (
    // `flex-1 min-w-0` lets the page name truncate instead of pushing the
    // header's controls off the edge.
    <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
      <ol className="flex min-w-0 items-center gap-1.5 text-xs">
        {trail.map((c, i) => {
          const last = i === trail.length - 1;
          return (
            <li
              key={`${c.label}-${i}`}
              // Only the page itself survives a narrow header; the trail above it drops out first.
              className={cn('flex min-w-0 items-center gap-1.5', !last && 'hidden @2xl:flex')}
            >
              {i > 0 && <ChevronRight aria-hidden className="h-3 w-3 shrink-0 text-slate-400" />}
              {last ? (
                <span aria-current="page" className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {c.label}
                </span>
              ) : c.href ? (
                <a href={c.href} onClick={(e) => go(c.href, e)} className={cn('flex items-center gap-1 truncate rounded text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100', FOCUS)}>
                  {i === 0 && homeIcon && <Home aria-hidden className="h-3.5 w-3.5" />}
                  {c.label}
                </a>
              ) : (
                <span className="truncate text-slate-500 dark:text-slate-400">{c.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ------------------------------------------------------------ header menu --- */

function HeaderMenu({ menu, active, go }: { menu: ShellHeaderMenu; active: boolean; go: (href: string | undefined, e?: MouseEvent) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));
  const trigger = cn(
    'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors [&>svg]:h-3.5 [&>svg]:w-3.5',
    FOCUS,
    active || open
      ? cn(ACCENT_SOFT, ACCENT_INK)
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
  );

  if (!menu.items?.length) {
    return (
      <a href={menu.href ?? '#'} onClick={(e) => go(menu.href, e)} aria-current={active ? 'page' : undefined} className={trigger}>
        {menu.icon}
        {menu.label}
      </a>
    );
  }
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu" className={trigger}>
        {menu.icon}
        {menu.label}
        <ChevronDown aria-hidden className={cn('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div role="menu" className="panel panel-solid absolute right-0 top-full z-50 mt-2 w-64 p-1.5">
          {menu.items.map((it) => (
            <a
              key={it.label}
              role="menuitem"
              href={it.href ?? '#'}
              onClick={(e) => {
                setOpen(false);
                if (it.onSelect) {
                  e.preventDefault();
                  it.onSelect();
                } else go(it.href, e);
              }}
              className={cn(MENU_ITEM, 'items-start')}
            >
              {it.icon && <span className="mt-0.5 shrink-0 text-slate-400 [&>svg]:h-4 [&>svg]:w-4">{it.icon}</span>}
              <span className="min-w-0">
                <span className="block font-medium">{it.label}</span>
                {it.description && <span className="block text-[11px] text-slate-500 dark:text-slate-400">{it.description}</span>}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------- theme settings --- */

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: Array<{ value: T; label: string; icon?: ReactNode }>;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-0.5 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'inline-flex items-center justify-center gap-1 truncate rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors [&>svg]:h-3.5 [&>svg]:w-3.5',
            FOCUS,
            value === o.value
              ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-white'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100',
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ThemePanel({
  appearance,
  set,
  collapsed,
  setCollapsed,
}: {
  appearance: ShellAppearance;
  set: (patch: Partial<ShellAppearance>) => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));
  const heading = 'mb-1.5 block text-[11px] font-semibold text-slate-600 dark:text-slate-300';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Theme settings"
        title="Theme settings"
        className={cn(ICON_BTN, 'inline-flex', open && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200')}
      >
        <SlidersHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div role="dialog" aria-label="Theme settings" className="panel panel-solid absolute right-0 top-full z-50 mt-2 w-72 space-y-3.5 p-3.5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Theme settings</p>
            <button
              type="button"
              onClick={() => {
                set(DEFAULT_APPEARANCE);
                setCollapsed(false);
              }}
              className="text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
            >
              Reset
            </button>
          </div>

          <div>
            <span className={heading}>Mode</span>
            <Segmented
              label="Mode"
              value={appearance.mode}
              onChange={(mode) => set({ mode })}
              options={[
                { value: 'light', label: 'Light', icon: <Sun aria-hidden /> },
                { value: 'dark', label: 'Dark', icon: <Moon aria-hidden /> },
                { value: 'system', label: 'System', icon: <Monitor aria-hidden /> },
              ]}
            />
          </div>

          <div>
            <span className={heading}>Accent</span>
            <div role="radiogroup" aria-label="Accent" className="flex flex-wrap gap-2">
              {(Object.keys(ACCENTS) as ShellAccent[]).map((name) => {
                const on = appearance.accent === name;
                return (
                  <button
                    key={name}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={name}
                    title={name[0].toUpperCase() + name.slice(1)}
                    onClick={() => set({ accent: name })}
                    style={{ background: ACCENTS[name][0] }}
                    className={cn(
                      'inline-flex h-7 w-7 items-center justify-center rounded-full text-white ring-offset-2 ring-offset-white transition-shadow focus-visible:outline-none dark:ring-offset-slate-800',
                      on ? 'ring-2 ring-slate-400 dark:ring-slate-500' : 'hover:ring-2 hover:ring-slate-200 focus-visible:ring-2 focus-visible:ring-slate-400 dark:hover:ring-slate-600',
                    )}
                  >
                    {on && <Check aria-hidden className="h-3.5 w-3.5" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className={heading}>Density</span>
            <Segmented
              label="Density"
              value={appearance.density}
              onChange={(density) => set({ density })}
              options={[
                { value: 'compact', label: 'Compact' },
                { value: 'standard', label: 'Standard' },
                { value: 'comfortable', label: 'Roomy' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className={heading}>Content</span>
              <Segmented
                label="Content width"
                value={appearance.content}
                onChange={(content) => set({ content })}
                options={[
                  { value: 'fluid', label: 'Fluid' },
                  { value: 'boxed', label: 'Boxed' },
                ]}
              />
            </div>
            <div>
              <span className={heading}>Sidebar</span>
              <Segmented
                label="Sidebar"
                value={collapsed ? 'rail' : 'full'}
                onChange={(v) => setCollapsed(v === 'rail')}
                options={[
                  { value: 'full', label: 'Full' },
                  { value: 'rail', label: 'Rail' },
                ]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------- user menu --- */

function UserMenu({
  user,
  items,
  onSignOut,
  go,
}: {
  user: ShellUser;
  items: ShellUserMenuItem[];
  onSignOut?: () => void;
  go: (href: string | undefined, e?: MouseEvent) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account: ${user.name}`}
        className={cn('flex items-center gap-1.5 rounded-lg p-1 pr-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800', FOCUS, open && 'bg-slate-100 dark:bg-slate-800')}
      >
        <UserAvatar user={user} />
        <ChevronDown aria-hidden className={cn('h-3.5 w-3.5 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div role="menu" className="panel panel-solid absolute right-0 top-full z-50 mt-2 w-64 p-1.5">
          <div className="mb-1 flex items-center gap-3 border-b border-slate-100 px-2 pb-2.5 pt-1.5 dark:border-slate-700/70">
            <UserAvatar user={user} size={10} />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{user.name}</p>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{user.email}</p>
              {user.role && <p className={cn('mt-0.5 truncate text-[10px] font-medium', ACCENT_INK)}>{user.role}</p>}
            </div>
          </div>
          {items.map((it) => (
            <div key={it.label}>
              {it.divider && <div className="my-1 border-t border-slate-100 dark:border-slate-700/70" />}
              <a
                role="menuitem"
                href={it.href ?? '#'}
                onClick={(e) => {
                  setOpen(false);
                  if (it.onSelect) {
                    e.preventDefault();
                    it.onSelect();
                  } else go(it.href, e);
                }}
                className={MENU_ITEM}
              >
                {it.icon && <span className="shrink-0 text-slate-400 [&>svg]:h-3.5 [&>svg]:w-3.5">{it.icon}</span>}
                {it.label}
              </a>
            </div>
          ))}
          {onSignOut && (
            <>
              <div className="my-1 border-t border-slate-100 dark:border-slate-700/70" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onSignOut();
                }}
                className={cn(MENU_ITEM, 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40')}
              >
                <LogOut aria-hidden className="h-3.5 w-3.5" />
                Sign out
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
