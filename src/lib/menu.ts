/**
 * The sidebar. ONE implementation, shared — the role editor's live preview must
 * call this same function, or the two drift and the preview starts lying.
 *
 * Navigation split (DASHBOARD-SPEC §3.2): the sidebar owns cross-section
 * navigation and is what the `menus` table describes. The four adjustment views
 * (List / Individual / Batch) are in-page tabs under
 * /requests, gated by requests:view and requests:create — not menu rows.
 */

export type MenuRow = {
  id: number;
  name: string;
  icon: string | null;
  href: string | null;
  order: number;
  parentId: number | null;
};

export type MenuItem = {
  id: number;
  name: string;
  href?: string;
  icon: string;
  children: MenuItem[];
};

/**
 * The permission a menu needs, derived from its href's LAST segment.
 * null = ungated.
 *
 * This is why the catalog uses the short form: '/settings/roles' must yield
 * 'roles:view', and a long-form 'settings/roles:view' would never match.
 */
export function menuViewPermission(href: string | null | undefined): string | null {
  if (!href || href === '/') return null; // the dashboard root is never gated here
  const segment = href.split('/').filter(Boolean).pop();
  return segment ? `${segment}:view` : null;
}

export function buildMenuTree(
  menus: MenuRow[],
  permissions: Set<string>,
  isSuperUser: boolean,
  parentId: number | null = null,
): MenuItem[] {
  return menus
    .filter((m) => m.parentId === parentId)
    .sort((a, b) => a.order - b.order)
    .reduce<MenuItem[]>((acc, menu) => {
      const children = buildMenuTree(menus, permissions, isSuperUser, menu.id);

      const required = menuViewPermission(menu.href);
      const allowed = required === null || permissions.has(required);

      // Visible if it has a visible child, or it links somewhere you may go.
      // So a grouping parent disappears once every child under it is gated away.
      const visible =
        children.length > 0 || (!!menu.href && (isSuperUser || allowed));
      if (!visible) return acc;

      acc.push({
        id: menu.id,
        name: menu.name,
        href: menu.href || undefined,
        icon: menu.icon || FALLBACK_ICON,
        children,
      });
      return acc;
    }, []);
}

/**
 * Deliberately neutral — it must read as "no icon assigned". An earlier version
 * of this system fell back to `Home`, which made several unrelated menus render
 * an identical icon and looked intentional; the bug was invisible.
 */
export const FALLBACK_ICON = 'KeyRound';

/** Positions are multiples of this, so a row can be slotted in by hand. */
export const ORDER_STEP = 10;

/**
 * The default sidebar, seeded once. `sync-permissions` links permission rows to
 * these by matching the href's last segment.
 */
export const DEFAULT_MENUS: ReadonlyArray<{
  name: string;
  icon: string;
  href: string | null;
  children?: ReadonlyArray<{ name: string; icon: string; href: string }>;
}> = [
  { name: 'Dashboard',   icon: 'LayoutDashboard', href: '/' },
  { name: 'Adjustments', icon: 'Wallet',          href: '/requests' },
  { name: 'Approvals',   icon: 'ClockCheck',      href: '/approvals' },
  {
    name: 'Settings',
    icon: 'Settings',
    href: null, // grouping parent — vanishes when every child is gated away
    children: [
      { name: 'Users',       icon: 'Users',     href: '/settings/users' },
      { name: 'Roles',       icon: 'Shield',    href: '/settings/roles' },
      // Appended rather than slotted in by name order: the two above already
      // hold orders 10/20 in every seeded database, and re-ordering them here
      // would only diverge from what those rows actually say. (Menus held 30
      // until its editor was removed; the gap is deliberate — renumbering would
      // rewrite rows an operator may have reordered by hand.)
      { name: 'Departments', icon: 'Building2', href: '/settings/departments' },
    ],
  },
];

// ── Derived slug and icon ────────────────────────────────────────────────────
//
// Neither is hand-editable any more. Both are computed from the menu's name (and
// its parent's path), server-side on save — so a client cannot post an arbitrary
// href, and two rows can't drift into naming the same route differently.

/** 'Bulk Adjustments' -> 'bulk-adjustments' */
export function slugify(name: string): string {
  return String(name ?? '')
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * The path PREFIX a menu contributes to its children.
 *
 * Distinct from its own href, and that distinction is the whole point: a
 * grouping parent has no page of its own but still owns a path segment. Without
 * it, `Settings` (href null) would give its children `/users` instead of
 * `/settings/users`.
 *
 * The dashboard root contributes nothing, so a child of `/` becomes `/child`
 * rather than `//child`.
 */
export function menuPathPrefix(
  name: string,
  parentPrefix: string | null,
  currentHref: string | null,
): string {
  if (currentHref === '/') return '';
  const base = (parentPrefix ?? '').replace(/\/+$/, '');
  const slug = slugify(name);
  return slug ? `${base}/${slug}` : base;
}

/**
 * The path a menu should have, from its name and its parent's prefix.
 *
 * Two rules keep this from breaking the sidebar:
 *
 *   * A row with NO href is a grouping parent and stays one. Deriving a path for
 *     it would turn a group into a link pointing at a route that doesn't exist.
 *     It still contributes a prefix — see menuPathPrefix.
 *   * The dashboard root keeps '/'. It is a genuine special case: buildMenuTree
 *     already treats '/' as never-gated, and '/dashboard' would both 404 and
 *     start demanding a permission the root is meant not to need.
 */
export function deriveHref(
  name: string,
  parentPrefix: string | null,
  currentHref: string | null,
): string | null {
  if (currentHref === null) return null; // group stays a group
  if (currentHref === '/') return '/';   // dashboard root
  if (!slugify(name)) return currentHref; // unnameable — leave it alone
  return menuPathPrefix(name, parentPrefix, currentHref);
}

/**
 * Icon from the menu's name, by keyword. Ordered most-specific first, because
 * 'Bulk Adjustments' must match 'adjust' before it ever reaches 'bulk'.
 * The fallback is deliberately neutral — see FALLBACK_ICON.
 *
 * Each pattern is anchored at a WORD START only — `\b(role)` and not
 * `\brole\b` — so plurals and suffixes match without a separate entry:
 * "Role", "Roles" and "Role Templates" all land on Shield.
 *
 * The group parentheses matter too. `\ba|b|c\b` anchors only the first and last
 * alternative, so the middle ones would match inside any word.
 */
const ICON_KEYWORDS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\b(dashboard|overview|home)/i,          'LayoutDashboard'],
  [/\b(adjust|wallet|credit|bonus)/i,       'Wallet'],
  [/\b(approv|audit)/i,                     'ClockCheck'],
  [/\b(pending|awaiting|queue)/i,           'ClockAlert'],
  [/\b(department|team|room|branch)/i,      'Building2'],
  [/\b(permission|access|security)/i,       'ShieldCheck'],
  [/\b(role)/i,                             'Shield'],
  [/\b(user|member|account|staff)/i,        'Users'],
  [/\b(menu|navigation|nav)/i,              'ListTree'],
  [/\b(setting|config|preference)/i,        'Settings'],
  [/\b(report|statement|document)/i,        'FileText'],
  [/\b(request|submission|task)/i,          'ClipboardList'],
  [/\b(payout|payment|fund|money)/i,        'HandCoins'],
  [/\b(transaction|receipt|invoice)/i,      'Receipt'],
  [/\b(history|log|activity|event)/i,       'History'],
  [/\b(amount|balance|coin)/i,              'Coins'],
  [/\b(batch|bulk|group|layer)/i,           'Layers'],
  [/\b(check|verify|complete|done)/i,       'SquareCheckBig'],
  [/\b(profile)/i,                          'UserCog'],
  [/\b(data|record|table)/i,                'Database'],
  [/\b(alert|notification)/i,               'Bell'],
  [/\b(monitor|status|health)/i,            'Activity'],
];

export function autoIcon(name: string): string {
  for (const [pattern, icon] of ICON_KEYWORDS) {
    if (pattern.test(name)) return icon;
  }
  return FALLBACK_ICON;
}
