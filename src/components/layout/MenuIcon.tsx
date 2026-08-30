'use client';

/* Origin: bonus-adjustment (96S2), verbatim. */

import {
  Activity,
  Bell,
  Building2,
  ClipboardList,
  ClockAlert,
  ClockCheck,
  Coins,
  Database,
  FileText,
  HandCoins,
  History,
  KeyRound,
  Layers,
  LayoutDashboard,
  ListTree,
  Receipt,
  Settings,
  Shield,
  ShieldCheck,
  SquareCheckBig,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { FALLBACK_ICON } from '@/lib/menu';

/**
 * Menu rows store a lucide icon NAME, never markup — this rehydrates it.
 *
 * The map is EXPLICIT rather than `import * as Icons from 'lucide-react'`: a
 * namespace import pulls the entire icon set into the client bundle, and the
 * sidebar needs about twenty of them. Adding a menu row with an icon not listed
 * here is not an error — it renders the fallback, and the fix is one line.
 *
 * The fallback is deliberately neutral (`KeyRound`) so an unassigned icon reads
 * as unassigned. An earlier version fell back to `Home`, which made several
 * unrelated menus render the same icon and looked intentional.
 */
export const ICON_MAP: Record<string, LucideIcon> = {
  Activity,
  Bell,
  Building2,
  ClipboardList,
  ClockAlert,
  ClockCheck,
  Coins,
  Database,
  FileText,
  HandCoins,
  History,
  KeyRound,
  Layers,
  LayoutDashboard,
  ListTree,
  Receipt,
  Settings,
  Shield,
  ShieldCheck,
  SquareCheckBig,
  UserCog,
  Users,
  Wallet,
};

/** The names offered in the menus editor's icon picker. */
export const ICON_NAMES = Object.keys(ICON_MAP).sort();

export function resolveMenuIcon(name?: string | null): LucideIcon {
  return (name && ICON_MAP[name]) || ICON_MAP[FALLBACK_ICON] || KeyRound;
}

export default function MenuIcon({
  name,
  className,
  title,
}: {
  name?: string | null;
  className?: string;
  /** Tooltip. Lucide's props don't include `title`, so it goes on a wrapper. */
  title?: string;
}) {
  const Cmp = resolveMenuIcon(name);
  const icon = <Cmp className={className} />;
  return title ? (
    <span title={title} className="inline-flex shrink-0">
      {icon}
    </span>
  ) : (
    icon
  );
}
