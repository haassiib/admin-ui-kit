/**
 * The catalog, shaped as a Sidebar menu tree.
 *
 * The gallery is laid out with the library's own `Sidebar` and `Topbar`, driven
 * by its own `MenuItem` type — so the shell is not a reproduction of the
 * bonus-adjustment dashboard, it IS that dashboard, with the component list
 * where the adjustments menu would be. Dogfooding: if the sidebar mis-renders
 * fifty rows at two levels, that is a finding about the component.
 *
 * Ids are positional and assigned here. `SidebarContext` keys group expansion by
 * id, so they only have to be unique and stable within one render.
 */

import type { MenuItem } from '@/lib/menu';
import { CATEGORY_LABEL, CATEGORY_ORDER, ENTRIES } from './index';
import type { Category } from './index';

/**
 * Icons must come from `MenuIcon`'s explicit allowlist — it maps about twenty
 * names and renders a neutral fallback for anything else, deliberately, so an
 * unassigned icon reads as unassigned. Extending that map would mean editing a
 * library component to suit the gallery, so the gallery works within it.
 */
const CATEGORY_ICON: Record<Category, string> = {
  layout: 'Building2',
  form: 'SquareCheckBig',
  table: 'ListTree',
  data: 'Activity',
  overlay: 'Layers',
  media: 'FileText',
};

export const OVERVIEW_HREF = '/';
export const BROWSE_HREF = '/all';

export function buildGalleryMenu(): MenuItem[] {
  let nextId = 1;
  const id = () => nextId++;

  const tree: MenuItem[] = [
    { id: id(), name: 'Overview', href: OVERVIEW_HREF, icon: 'LayoutDashboard', children: [] },
    { id: id(), name: 'Browse all', href: BROWSE_HREF, icon: 'ListTree', children: [] },
  ];

  for (const category of CATEGORY_ORDER) {
    const entries = ENTRIES.filter((e) => e.category === category);
    if (entries.length === 0) continue;

    tree.push({
      id: id(),
      // No `href`: a parent WITH one is a link, and only an href-less parent
      // renders as a collapsible group in this Sidebar.
      name: CATEGORY_LABEL[category],
      icon: CATEGORY_ICON[category],
      children: entries.map((e) => ({
        id: id(),
        name: e.name,
        href: `/preview/${e.slug}`,
        icon: CATEGORY_ICON[category],
        children: [],
      })),
    });
  }

  return tree;
}

/**
 * href -> label, for Topbar's breadcrumbs.
 *
 * Every linkable row registers its own label, and `/preview` is registered once
 * so the intermediate crumb is named rather than falling back to a humanised
 * slug.
 */
export function buildBreadcrumbLabels(): Record<string, string> {
  const labels: Record<string, string> = { '/preview': 'Components' };
  for (const entry of ENTRIES) labels[`/preview/${entry.slug}`] = entry.name;
  labels[BROWSE_HREF] = 'Browse all';
  return labels;
}

/**
 * Ids of every group row in a menu tree.
 *
 * `Sidebar` renders a group's children only while the group is expanded, and
 * nothing is expanded on first load — correct for an app with eight menus, and
 * useless for an index of fifty components, where the whole point of the
 * sidebar is that the list is visible. The shell expands these once on mount
 * through `SidebarContext.setExpanded`, which is additive and is the same entry
 * point `Sidebar` itself uses to open the active group. Groups the user closes
 * by hand stay closed.
 */
export function collectGroupIds(items: MenuItem[], acc: number[] = []): number[] {
  for (const item of items) {
    if (item.children.length > 0) {
      acc.push(item.id);
      collectGroupIds(item.children, acc);
    }
  }
  return acc;
}
