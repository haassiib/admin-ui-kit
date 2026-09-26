/** AI prompts for the Layout & shell components. See `./index.ts` for what a prompt is for. */

export const LAYOUT_PROMPTS: Record<string, string> = {
  layout: `Build a responsive admin app layout component in React + TypeScript + Tailwind CSS (v4, with the container-queries syntax \`@container\` / \`@3xl:\`). One component, one file, no context provider needed. Icons from lucide-react.

## Structure
- Root: full-height flex row (height prop, default \`100dvh\`), \`overflow-hidden\`, a soft diagonal gradient ground — light: slate-100 → slate-200 → slate-300; dark: slate-900 → slate-950 → black.
- Left: a sidebar. Right: a column of header over content.
- \`<main>\` is the ONLY scroll container (\`min-h-0 flex-1 overflow-auto\`). Never nest another scroller — absolutely-positioned dropdowns inside would get clipped.

## Sidebar
- Frosted panel: \`bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl\`, hairline right border (\`black/10\`, dark \`white/10\`).
- Top: brand row the same height as the header — a 32px rounded-lg square filled with the accent colour holding the logo (or the brand's initials), then the product name in bold.
- Below: nav sections, each with an optional heading (10px, bold, uppercase, wide tracking, slate-400). Rows are 13px medium text, rounded-lg, an 18px icon, then the label, then an optional count badge (accent-filled pill, 10px, tabular numbers).
- Active row: soft accent tint background + accent text and icon. Hover: slate-100 (dark: slate-800/70).
- Groups: a row with a chevron that expands its children, indented under the parent with a thin left border. The group containing the active route opens automatically.
- Only the nav list scrolls; the brand stays put.
- Optional footer slot pinned to the bottom.

## Collapse to an icon rail
- A header button (chevron left/right) collapses the sidebar from 15rem to a 4.5rem icon rail: labels become screen-reader only, section headings become a thin divider, and badges become an accent dot on the icon.
- Hovering or focusing the collapsed rail widens it back to full width OVER the page with a large shadow (the rail keeps a fixed footprint in the row, the panel is absolutely positioned) so the content never reflows under the pointer.
- Option \`hoverExpand={false}\`: no widening — links show a tooltip on hover, groups open as a flyout panel beside the rail (portalled, with a short close delay so the pointer can cross the gap).
- Animate width with a 300ms ease-in-out transition.

## Narrow widths
- Decide by the COMPONENT's width, not the viewport: a container query at 48rem (\`@3xl\`), plus a ResizeObserver for the logic that must know it. The layout works inside a preview pane or split view.
- Below 48rem the sidebar becomes an off-canvas drawer: slides in from the left with a shadow, a dimmed, slightly blurred backdrop, a close button, and Escape closes it. The header shows a hamburger button instead of the collapse button.

## Header
- Frosted bar: \`bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl\`, bottom hairline border, height set by density (48 / 56 / 64px).
- Left to right: drawer/collapse button, breadcrumbs, header menus, a search slot, an actions slot (e.g. notification bell), theme settings button, user menu.
- Breadcrumbs are derived from the nav tree and the active route (optional home crumb with a house icon). The current page is bold and truncates; on narrow widths only the current page is shown.
- Header menus: links or dropdowns (panel with icon, label and a one-line description per item); hidden below 56rem.
- Icon buttons: 32px, rounded-lg, slate-500, hover slate-100, accent-coloured focus ring.

## Theme settings panel (from the header)
- A dropdown panel with: Mode (Light / Dark / System, segmented control with icons), Accent (six swatches: indigo, violet, sky, emerald, amber, rose — the selected one shows a check), Density (compact / standard / comfortable), Content (fluid or boxed at max-w-5xl, centred), Sidebar (expanded / collapsed), and a Reset link.
- The accent reaches the markup as CSS variables on the root (\`--accent\` = Tailwind 600 step, \`--accent-dark\` = 400 step for dark mode, \`--accent-soft\` = 50 step), so one setting recolours every active row, badge and focus ring.
- Density changes header height, row padding and content padding.
- \`themeScope\`: "document" toggles the \`dark\` class on <html>; "shell" applies it to the layout root only (for previews).

## User menu (far right)
- Trigger: avatar (image or initials) + chevron. Panel: avatar, name, email, role in accent colour, then menu items with icons, optional dividers, and a red "Sign out" item at the bottom when \`onSignOut\` is passed.

## Behaviour & API
- Props: \`brand {name, logo?, href?}\`, \`nav\` (sections of items: \`{id, label, icon?, href?, badge?, children?}\`), \`activeHref\`, \`onNavigate(href)\` (to route through a client router; without it links are plain anchors), \`breadcrumbs\` override, \`home\`, \`headerMenus\`, \`search\`, \`actions\`, \`user\`, \`userMenu\`, \`onSignOut\`, \`appearance\` / \`onAppearanceChange\` / \`defaultAppearance\`, \`collapsed\` / \`onCollapsedChange\` / \`defaultCollapsed\`, \`hoverExpand\`, \`storageKey\`, \`themeScope\`, \`sidebarFooter\`, \`height\`, \`className\`, \`children\`.
- Appearance and collapsed state are controlled when passed with their callbacks, otherwise kept internally and persisted to localStorage under \`storageKey\` — read after mount, never during render, so server and first client render agree.
- Every popover (header menus, theme panel, user menu) closes on outside click and on Escape.

## Quality bar
- Every colour has a \`dark:\` pair. Visible focus rings on everything interactive. Correct ARIA: \`aria-current="page"\` on the active link, \`aria-expanded\` on toggles, \`role="menu"\` / \`role="radiogroup"\` where they apply, \`aria-label\` on icon-only buttons.
- Text truncates instead of pushing controls off the edge (\`min-w-0\` on flex children).
- Include a small demo: a helpdesk app with Dashboard, Tickets (with a badge and child routes), Reports and Settings, a notification bell in the actions slot, and a user named Avery Stone.`,

  'nav-menu': `Build a documentation-style navigation menu component in React + TypeScript + Tailwind CSS.

Plain text links under section headings — deliberately NO icon per row. Once a menu is long enough to need grouping (a component index, an API reference, a settings tree) the icons all end up the same generic glyph and the eye reads the text anyway; text-only rows scan faster and let a section hold twenty items. Two orientations and an optional filter.

## Look — vertical (default)
- \`<nav>\` as a flex column, \`gap-6\` between sections. Section heading: \`mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500\`. Items in a \`<ul>\`.
- Row: a link, \`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-[13px]\`; the label truncates; an optional badge sits at the right in \`text-[10px] text-slate-400\`.
- Inactive: \`text-slate-600 dark:text-slate-400\`, hover \`bg-slate-100 text-slate-900\` (dark \`bg-slate-800 text-slate-100\`).
- Active: a filled pill — \`bg-indigo-50 font-semibold text-indigo-700\`, dark \`bg-indigo-500/10 text-indigo-300\`.

## Look — horizontal (for a top or bottom bar)
Not the vertical menu turned sideways:
- One row, \`flex items-center gap-4\`. Each section is inline: its heading shrinks to an inline group label (same 10px uppercase style) followed by its links at \`gap-3\`. Groups are separated by a 1px × 16px vertical rule (\`bg-slate-200 dark:bg-slate-700\`) instead of vertical space.
- Links: \`whitespace-nowrap border-b-2 px-1 py-1\`, transparent border, hover only darkens the text. Active is an UNDERLINE — \`border-indigo-600 font-semibold text-indigo-700\`, dark \`border-indigo-400 text-indigo-300\`. A pill in a one-row bar reads as a button, not as "you are here".
- \`showSectionLabels={false}\` drops the group labels (a flat bar); it works in vertical mode too.

## Filter
- Opt-in: below ~20 items it is chrome to skip past. \`filterable\` makes the menu render its own field at the top (full width; \`w-44\` at the start of a horizontal bar): the standard text input with a 14px lucide \`Search\` icon inset at the left (\`pl-8\`), placeholder "Filter…", which is also its aria-label.
- \`filter\` (a string) is the other arrangement: the query comes from outside (e.g. a header search) and the menu renders NO input. If both are passed the external query wins.
- Match: trimmed, case-insensitive substring on the item label. Sections left with no items drop out entirely — a heading with nothing under it is noise. With nothing left, show one \`text-[11px] text-slate-400\` line (\`emptyLabel\`, "No matches").

## API
- \`sections: { label: string; items: { label: string; href: string; badge?: ReactNode }[] }[]\`
- \`activeHref?: string\` — matched EXACTLY, not by prefix (a menu is a list of destinations).
- \`orientation?: 'vertical' | 'horizontal'\` (vertical), \`filterable?\` (false), \`filter?: string\`, \`filterPlaceholder\` ('Filter…'), \`emptyLabel\` ('No matches'), \`showSectionLabels\` (true), \`className\`.
- Links use the app's client-side link component (e.g. Next.js \`Link\`); the active one gets \`aria-current="page"\`.

## Demo
Sections "Workspace" (Overview, Members with badge "8", Projects) and "Settings" (Billing, Roles, Integrations). Two 224px bordered boxes side by side — one with \`activeHref="/members"\`, one \`filterable\` with \`activeHref="/roles"\` — and the same sections as a horizontal bar in an \`overflow-x-auto\` strip.`,

  sidebar: `Build a collapsible admin sidebar navigation component in React + TypeScript + Tailwind CSS.

A frosted panel over a nested menu tree (any depth): full width on desktop, collapsible to an icon rail that widens on hover, and an off-canvas drawer below the \`lg\` breakpoint.

## Look
- Panel: \`fixed inset-y-0 left-0 z-50 flex flex-col overflow-y-auto\` with \`bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-r border-black/10 dark:border-white/10\`; at \`lg\` it becomes \`static\` in the page's flex row. Thin 5px scrollbar (slate-300 thumb, dark slate-700). \`transition-all duration-300 ease-in-out\`.
- Width: \`lg:w-60\` expanded (sized to the widest nested label plus the row chrome), \`lg:w-20\` as a rail; the mobile drawer is always \`w-64\`.
- Top: an \`h-16\` row with a bottom border (slate-200 / dark slate-700), \`px-6\` (rail: \`px-4\`, centred): the signed-in user's 36px round avatar (photo, or white semibold initials on an indigo-600 circle) then their name, or email if no name, in \`ml-3 text-sm font-bold text-slate-900 dark:text-white\`, truncating. In the rail the name fades to \`opacity-0 w-0\`.
- Nav: \`mt-4 space-y-1\`, \`px-4\` (rail \`px-2\`).
- Row: \`flex items-center w-full px-3 py-3 text-sm font-medium rounded-lg\`, a 20px icon then the label (\`ml-3 flex-1 truncate\`); the rail centres the icon. Child rows are indented \`ml-6\` and stacked in \`mt-1 space-y-1\`.
- Inactive: \`text-slate-700 dark:text-slate-300\`, icon slate-400, hover \`bg-slate-100 dark:bg-slate-700/50\`.
- Active — the row's own href OR any descendant matches the route, so a group lights up when you are inside it: \`bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400\`, icon indigo too.
- A group row (children, no href) ends with a 16px \`ChevronDown\` in slate-400 that rotates 180° when open.

## Behaviour
- Active matching is segment-aware: \`pathname === href || pathname.startsWith(href + '/')\`, so '/requests' never lights up for '/requests-archive'.
- On every route change, each group containing the current route is added to the expanded set; groups the user closed by hand stay closed until they navigate into them. Clicking a group row toggles it. Expansion is keyed by item id, since two items at different depths may share a name. An item with both an href and children shows its children while it is active.
- Rail (collapsed and not hovered): labels hide. A leaf's label turns into a hover tooltip to the right (\`absolute left-full ml-2 px-2 py-1 rounded bg-slate-900 text-white text-xs shadow-lg z-50\`), so the icon-only rail stays navigable. A group cannot expand in place, so on hover its children open in a flyout instead: \`absolute left-full top-0 ml-2 w-48 z-50\`, opaque, rounded-lg, bordered, shadow, \`p-2\`, the group name as a \`text-xs font-semibold\` header over the child rows.
- Hover-expand: hovering the collapsed rail widens it to full width temporarily. It does NOT change the stored preference; when the pointer leaves it is a rail again.
- Below \`lg\`: the panel sits at \`-translate-x-full\` until opened; while open, a \`fixed inset-0 z-40 bg-slate-600/50\` backdrop closes it on click, and clicking any link closes it.
- Icons are stored as lucide icon NAMES (strings) and resolved through an explicit name → component map with a neutral fallback (\`KeyRound\`), never a namespace import of the whole icon set.

## State
Keep sidebar state in a small React context with a provider and a \`useSidebar()\` hook, shared with the header's toggle buttons: \`collapsed\` + \`toggleCollapsed()\` (persisted to localStorage, read after mount — it is a workspace preference), \`open\` + \`setOpen()\` for the mobile drawer (deliberately NOT persisted — a drawer that reopens itself on the next load is a bug), and \`expanded: Set<number>\` with \`toggleExpanded(id)\` and \`setExpanded(ids)\` (merges into the set).

## API
- \`items: MenuItem[]\`, \`MenuItem = { id: number; name: string; href?: string; icon: string; children: MenuItem[] }\` — an already permission-filtered tree; filtering belongs on the server, not here.
- \`user: { name: string | null; email: string; avatarUrl: string | null }\`.
- Reads the current path from the router (e.g. \`usePathname()\`); links are the router's \`Link\`.

## Demo
Dashboard (LayoutDashboard, "/"); a Reports group (Layers) with Revenue and Usage; a Settings group (Settings) with Members, Roles and one item whose icon name is unknown, showing the fallback. User Ada Lovelace, inside a 26rem-tall bordered frame.`,

  topbar: `Build an admin app header bar component in React + TypeScript + Tailwind CSS.

The one header row of the app shell: sidebar toggle, breadcrumb trail, then notifications, appearance and account controls. Pages don't render their own heading — the trail's last crumb IS the page title, which keeps the two from ever disagreeing.

## Look
- \`<header>\`: \`relative z-40 h-16 shrink-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-black/10 dark:border-white/10\`; inside, \`flex items-center justify-between h-full px-6\`.
- Left cluster \`flex items-center gap-4 flex-1 min-w-0\` — the \`min-w-0\` is what lets the page name truncate instead of pushing the right cluster off screen:
  - \`lg\` and up: collapse toggle, 32px \`rounded-lg\`, \`text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700\`, 16px \`ChevronLeft\` when expanded / \`ChevronRight\` when collapsed, title "Collapse sidebar" / "Expand sidebar".
  - Below \`lg\`: a hamburger (20px \`Menu\`, \`p-2 rounded-md text-slate-400\`), aria-label "Open navigation", which opens the sidebar drawer.
  - The breadcrumb trail.
- Right cluster \`flex items-center gap-4 shrink-0\`: notification bell, appearance button, account menu.

## Parts it composes
Build these alongside (or reuse your own):
- Sidebar state: the two toggles read \`collapsed\`, \`toggleCollapsed\` and \`setOpen\` from a small sidebar context (provider + hook) shared with the sidebar.
- Breadcrumbs, from the current path: a Home icon + home label, "/" separators in slate-300, intermediate segments as plain slate-500 text (not links), and the current page as the page's \`<h1>\` (\`text-base font-semibold text-slate-800 dark:text-slate-100 truncate\`). Labels come from an href → name map, falling back to the humanised segment; below \`md\` only the current page shows.
- Notification bell: a \`p-2 rounded-lg\` slate-400 icon button with a 16px \`Bell\` and an unread badge \`absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none tabular-nums\` (capped at "99+"), aria-label "Notifications, 2 unread". It opens a \`w-80\` right-aligned dropdown: a header row (indigo bell, bold "Notifications", "N unread" meta, a "Mark all read" link at the right), a \`max-h-96\` scrolling list of notification cards, and a footer link "See all notifications →" pinned below the list.
- Appearance button: a \`SlidersHorizontal\` icon button opening a light/dark + density panel.
- Account menu: avatar + chevron trigger opening a panel with name, email, roles and "Sign out".

## API
\`labels: Record<string, string>\` (href → crumb label), \`user: { name, email, avatarUrl, roleNames: string[], departmentCode }\`, \`notifications\`, \`unreadCount: number\`, \`logoutAction: () => Promise<void>\` (the sign-out server action).

## Demo
At /settings/members with labels for Settings and Members, user Ada Lovelace (Administrator · ENG), and four notifications — "Grace Hopper approved REQ-4471", "Alan Turing submitted REQ-4470" (both unread), a rejection and a batch release.`,

  breadcrumbs: `Build a path-derived breadcrumb trail component in React + TypeScript + Tailwind CSS.

It lives in the app's top bar and is the page's only \`<h1>\`: the last crumb is the page title.

## Look
- \`<nav aria-label="Breadcrumb" class="min-w-0">\` → \`<ol class="flex items-center gap-2 min-w-0 text-xs">\`.
- First item: a link to "/", \`flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200\`, a 14px lucide \`Home\` icon + the home label (\`labels['/']\`, else "Dashboard").
- Separators: a "/" in \`text-slate-300 dark:text-slate-600\`.
- Intermediate crumbs: plain \`text-slate-500 dark:text-slate-400\` text, NOT links — a grouping parent like "Settings" often has no page of its own, and a link to a 404 is worse than no link.
- Current page: \`<h1 class="text-base font-semibold text-slate-800 dark:text-slate-100 truncate">\`, in an \`li\` with \`min-w-0\` so a long title truncates.

## Behaviour
- Read the pathname from the router, split into segments; each crumb's href is the cumulative path.
- Label lookup, in order: \`labels[href]\` (the same href → name map the sidebar nav is built from, so the trail can never disagree with the nav) → a small static map for routes with no nav entry ('/profile' "My Profile", '/notifications' "Notifications", '/change-password' "Change Password", '/settings' "Settings") → the humanised segment (URI-decoded, split on "-", each word capitalised).
- Responsive: below \`md\` only the current page shows — home, intermediates and the separator before the current crumb are hidden. At "/" there is no current crumb and the home link shows at every width.

## API
\`labels: Record<string, string>\` — href → label.

## Demo
At /settings/members with \`{ '/settings': 'Settings', '/settings/members': 'Members' }\`: "⌂ Dashboard / Settings / **Members**".`,

  splitter: `Build a two-pane resizable splitter component in React + TypeScript + Tailwind CSS.

## Look
- Root \`flex h-full w-full\`: \`flex-row\` for \`horizontal\` (left | right), \`flex-col\` for \`vertical\` (top / bottom).
- First pane \`min-h-0 min-w-0 overflow-auto\` sized by \`flex-basis: <percent>%\`; second pane \`min-h-0 min-w-0 flex-1 overflow-auto\`.
- Divider: a 1px line (\`w-px\` or \`h-px\`, \`shrink-0\`), \`bg-slate-200 dark:bg-slate-700\`, \`hover:bg-indigo-400\`, \`focus-visible:bg-indigo-500\` with no outline, \`bg-indigo-500\` while dragging, \`cursor-col-resize\` / \`cursor-row-resize\`, colour transition.
- A 1px line is nearly impossible to grab, so an invisible absolutely-positioned hit area straddles it, 6px each side (\`inset-y-0 -left-1.5 -right-1.5\`, or \`inset-x-0 -top-1.5 -bottom-1.5\`). The visible line stays 1px.

## Behaviour
- The size is a PERCENTAGE of the container, not pixels, so the split survives a window resize instead of drifting toward one edge. Always clamped to \`[min, max]\` so neither pane can be dragged out of existence.
- Pointer-down on the divider starts a drag. \`pointermove\` / \`pointerup\` listeners go on \`window\`, not the handle — the pointer routinely leaves a thin divider mid-drag. The percent is the pointer's position within the container's bounding rect.
- While dragging, set \`user-select: none\` and the matching resize cursor on \`<body>\` (a drag across text would otherwise select it), and restore both afterwards.
- Keyboard: the divider is focusable; ArrowLeft/ArrowRight (horizontal) or ArrowUp/ArrowDown (vertical) nudge by 2%, 10% with Shift, clamped.
- \`onResize(percent)\` fires on every drag move — for persisting the layout or reflowing a chart.
- Splitters nest in either direction.

## API
\`first\`, \`second: ReactNode\`; \`direction?: 'horizontal' | 'vertical'\` ('horizontal'); \`initial?: number\` (50, first pane %); \`min?\` (15); \`max?\` (85); \`onResize?: (percent: number) => void\`; \`className\`.

## Accessibility
Divider: \`role="separator"\`, \`tabIndex={0}\`, \`aria-orientation\` = the LINE's orientation (\`vertical\` for a left|right split), \`aria-valuenow\` (rounded percent), \`aria-valuemin\` / \`aria-valuemax\`.

## Demo
In an \`h-72\` rounded, bordered frame: a left pane at 35% ("Left pane — drag the divider, or focus it and use the arrow keys") and a right pane that is a vertical splitter at 60% ("Top right" / "Bottom right"). Each pane: a \`text-xs font-semibold\` title over an 11px slate-500 hint, \`p-4\`.`,

  tabs: `Build an accessible underline tabs component in React + TypeScript + Tailwind CSS.

## Look
- Root \`flex min-h-0 flex-col\`. Tab strip: \`flex shrink-0 items-center gap-1 border-b border-slate-200 dark:border-slate-700\`.
- Tab: \`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium\` — the \`-mb-px\` puts the active underline ON the strip's border.
- Active: \`border-indigo-600 text-indigo-600 dark:text-indigo-400\`. Inactive: transparent border, \`text-slate-500 hover:text-slate-700\` (dark \`slate-400 → slate-200\`). Disabled: \`opacity-40\`. Focus: \`focus-visible:ring-2 ring-indigo-400\`, no outline.
- Optional count badge after the label: \`rounded-full bg-slate-100 px-1.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300\`.
- Panel area below: \`min-h-0 flex-1 pt-3\`.

## Behaviour
- Uncontrolled until \`value\` is passed (starts at \`defaultValue\`, else the first tab), so a simple panel switch needs no state and a URL-driven one still works. \`onChange(id)\` fires in both modes.
- \`children\` is a render function \`(activeId) => ReactNode\`: the caller decides which panel to show; omit it for a bare tab strip.
- ArrowLeft / ArrowRight move to the previous/next tab, wrap around, skip disabled tabs, and select as they go (focus follows). Roving tabindex: only the active tab is \`tabIndex=0\`, the rest \`-1\`.

## API
\`tabs: { id: string; label: ReactNode; badge?: ReactNode; disabled?: boolean }[]\`, \`value?\`, \`defaultValue?\`, \`onChange?: (id: string) => void\`, \`className\`, \`children?: (activeId: string) => ReactNode\`.

## Accessibility
\`role="tablist"\` on the strip; each tab \`role="tab"\` with \`aria-selected\` and \`aria-controls\`; the panel \`role="tabpanel"\` with \`aria-labelledby\` pointing at the active tab (ids from \`useId\`).

## Demo
Overview, Members (badge 8), Billing, Archived (disabled). The panel is a \`rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 text-xs\` box reading "Panel: **overview**".`,

  card: `Build a card (panel surface) component in React + TypeScript + Tailwind CSS.

The frosted panel every surface sits on, as a component with an optional header, actions and footer.

## Look
- \`<section>\`: the frosted card surface, \`flex flex-col\`.
- \`solid\`: the same card with no translucency or backdrop blur (opaque \`bg-white dark:bg-slate-800\`) — for anything that floats OVER page content, where a translucent surface lets the rows behind read through.
- Header (rendered when \`title\` or \`actions\` is set): \`flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-700 px-4 py-3\`. Left, in a \`min-w-0\` block: title as \`<h3>\` \`text-sm font-semibold text-slate-800 dark:text-slate-100\`, subtitle \`mt-0.5 text-[11px] text-slate-500 dark:text-slate-400\`. Right: actions in \`flex shrink-0 items-center gap-2\`.
- Body: \`min-h-0 flex-1\`, with \`p-4\` unless \`padded={false}\` (for a full-bleed table or list).
- Footer: \`border-t border-slate-200 dark:border-slate-700 px-4 py-2.5\`.

## API
\`title?\`, \`subtitle?\`, \`actions?\`, \`footer?\`, \`children?\`: ReactNode; \`solid?\` (false); \`padded?\` (true); \`className\`.

## Demo
Two cards in \`grid gap-3 sm:grid-cols-2\`: "Usage" / "Last 30 days" with a small ghost "Export" button as its action; and "Plan", \`solid\`, with a small primary "Upgrade" button in the footer.`,

  button: `Build a button component in React + TypeScript + Tailwind CSS.

Four variants, three sizes, and a loading state.

## Look
- Base: \`inline-flex items-center justify-center rounded-lg font-semibold transition-colors\`, \`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400\`, \`disabled:cursor-not-allowed disabled:opacity-50\`.
- Variants:
  - \`primary\`: \`bg-indigo-600 text-white hover:bg-indigo-700\`
  - \`secondary\`: \`bg-white text-slate-700 border border-slate-300 hover:bg-slate-50\`, dark \`bg-slate-800 text-slate-200 border-slate-600 hover:bg-slate-700\`
  - \`ghost\`: \`text-slate-600 hover:bg-slate-100\`, dark \`text-slate-300 hover:bg-slate-800\`
  - \`danger\`: \`bg-rose-600 text-white hover:bg-rose-700\` — for irreversible actions only, so it keeps its signal.
- Sizes: \`sm\` \`px-2.5 py-1 text-[11px] gap-1\`; \`md\` \`px-3 py-2 text-xs gap-1.5\`; \`lg\` \`px-4 py-2.5 text-sm gap-2\`.
- Keep variants and sizes as \`as const\` maps so adding one is one line.

## Behaviour
- \`loading\` shows a 14px lucide \`Loader2\` with \`animate-spin\` before the children AND disables the button. A spinner on a still-clickable control is how you get two submits.
- Forward the ref and pass every native \`<button>\` attribute through; \`className\` is appended last.

## API
\`variant?: 'primary' | 'secondary' | 'ghost' | 'danger'\` ('primary'), \`size?: 'sm' | 'md' | 'lg'\` ('md'), \`loading?\` (false), plus \`ButtonHTMLAttributes\`.

## Demo
"Save changes" in all four variants; a row of sm/md/lg; a "Submit" that goes loading for 1.2s when clicked; a disabled "Unavailable".`,

  alert: `Build an inline alert (callout) component in React + TypeScript + Tailwind CSS.

A message that stays on the page, for a condition the user has to read before acting. Transient feedback belongs in a toast, not here.

## Look
- Container: \`flex gap-2.5 rounded-lg border px-3 py-2.5\`, tinted per tone:
  - \`info\` (lucide \`Info\`): \`border-indigo-200 bg-indigo-50 text-indigo-900\`, dark \`border-indigo-500/30 bg-indigo-500/10 text-indigo-200\`
  - \`success\` (\`CircleCheck\`): the same recipe in emerald
  - \`warning\` (\`TriangleAlert\`): amber
  - \`danger\` (\`CircleAlert\`): rose
- Icon: 16px, \`mt-0.5 shrink-0\`, inherits the tone's text colour.
- Text block \`min-w-0 flex-1 text-xs leading-relaxed\`: an optional \`font-semibold\` title, then the body at \`opacity-90\` (\`mt-0.5\` when there is a title).
- Dismiss: when \`onDismiss\` is passed, a 14px \`X\` button at the right, \`shrink-0 opacity-60 hover:opacity-100\`, aria-label "Dismiss". Without it the alert is permanent.

## API
\`tone?: 'info' | 'success' | 'warning' | 'danger'\` ('info'), \`title?: ReactNode\`, \`children?\`, \`onDismiss?: () => void\`, \`className\`.

## Accessibility
\`role="alert"\` for \`danger\` only; the other tones use \`role="status"\`. The icon is \`aria-hidden\`.

## Demo
A stack: info "Scheduled maintenance — Read replicas are read-only until 02:00 UTC."; success "Invite sent — Alan Turing will receive an email shortly."; warning "Approaching your seat limit — 7 of 8 seats in use."; a dismissible danger "Payment failed — Update the card on file to avoid suspension."`,

  avatar: `Build a user avatar component with an initials fallback in React + TypeScript + Tailwind CSS.

## Look
- Sizes: \`sm\` 28px (\`w-7 h-7 text-[10px]\`, the default), \`md\` 36px (\`w-9 h-9 text-xs\`), \`lg\` 64px (\`w-16 h-16 text-lg\`). Always \`rounded-full shrink-0\`.
- With an image: a plain \`<img alt="">\`, \`object-cover bg-slate-100 dark:bg-slate-800\`.
- Without: a circle \`bg-indigo-600 text-white font-semibold\` holding the initials, \`aria-hidden\`.

## Initials
- From the trimmed name: two or more words → first letter of the first and last word ("Ada Lovelace" → "AL"); one word → its first two letters ("Ada" → "AD"). Upper-cased.
- No name (an admin-created user may have none) → the first letter of the email. Never an empty circle, which reads as a broken avatar.

## Centring (load-bearing)
- The fallback is \`inline-flex items-center justify-center leading-none\`. Pin \`leading-none\`: an arbitrary size like \`text-[10px]\` sets font-size alone, so the line box is whatever is inherited — inside a table row with a 40px line-height, the initials sit visibly below the circle's middle. Use flex, not \`grid place-items-center\`, which degrades the same way in an auto row.

## API
\`name?: string | null\`, \`email: string\`, \`avatarUrl?: string | null\`, \`size?: 'sm' | 'md' | 'lg'\`.

## Demo
Ada Lovelace (ada@example.com) at sm, md and lg, plus an email-only "ops@example.com" at md showing "O".`,

  'empty-state': `Build an empty-state placeholder component in React + TypeScript + Tailwind CSS.

A quiet placeholder for an empty list or table.

## Look
- \`flex flex-col items-center justify-center gap-1 py-16 text-center\`.
- Title: \`text-sm font-medium text-slate-700 dark:text-slate-200\`, as a \`flex items-center gap-1.5\` line.
- The optional hint does NOT sit as a second line under the title: it hides behind a 14px lucide \`Info\` (ⓘ) button right after the title (\`text-slate-400 hover:text-slate-600\`, dark \`slate-500 → slate-300\`, rounded, focus ring), aria-label "Why is this empty?". Hovering or focusing it shows the hint in a small dark tooltip bubble above — the same ⓘ treatment every other hint in the kit uses.

## API
\`title: string\`, \`hint?: string\`.

## Demo
Inside a card: title "No projects yet", hint "Create one to get started."`,

  'menu-icon': `Build an icon-name resolver component in React + TypeScript + Tailwind CSS (icons from lucide-react).

Menu rows stored in a database keep a lucide icon NAME (a string like "Settings"), never markup. This turns that name back into an icon.

## Behaviour
- An EXPLICIT map of name → lucide component — not \`import * as Icons from 'lucide-react'\`, which pulls the whole icon set into the client bundle when the menu needs about twenty. Include: Activity, Bell, Building2, ClipboardList, ClockAlert, ClockCheck, Coins, Database, FileText, HandCoins, History, KeyRound, Layers, LayoutDashboard, ListTree, Receipt, Settings, Shield, ShieldCheck, SquareCheckBig, UserCog, Users, Wallet.
- An unknown or empty name is not an error: it renders the fallback, and the fix is adding one line to the map.
- The fallback is deliberately neutral — \`KeyRound\` — so an unassigned icon reads as unassigned. Falling back to \`Home\` made unrelated menus share an icon and look intentional.

## API
- Default export \`MenuIcon({ name?: string | null; className?: string; title?: string })\` — renders the icon with \`className\`. Lucide icons don't accept \`title\`, so when a tooltip is given, wrap the icon in \`<span title={title} class="inline-flex shrink-0">\`.
- Also export \`ICON_MAP\`, \`ICON_NAMES\` (the map's keys, sorted — for an icon picker in a menu editor) and \`resolveMenuIcon(name)\` returning the component.

## Demo
A row of LayoutDashboard, Layers, Settings, Users, Shield and "NoSuchIcon" (showing the key fallback), each 20px slate-600, labelled with its name.`,

  'user-dropdown': `Build an account dropdown menu component for an app header in React + TypeScript + Tailwind CSS.

## Look
- Trigger: \`flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800\` (kept on that background while open): a 28px round avatar then a 14px \`ChevronDown\` in slate-400 that rotates 180° when open.
- Avatar: the user's photo (\`object-cover\`), else white semibold initials on an indigo-600 circle — first + last word initials of the name, else the email's first letter.
- Panel: floating surface, \`absolute right-0 mt-2 w-64 p-2 z-50\`.
- Identity header: \`flex items-center gap-3 px-2 py-2 mb-1 border-b border-slate-100 dark:border-slate-800\`, a 36px avatar, then in a \`min-w-0\` block, each line truncating: name (or email) \`text-xs font-semibold text-slate-800 dark:text-slate-100\`; email \`text-[11px] text-slate-500 dark:text-slate-400\`; roles joined with ", " (or "No role assigned") plus " · ENG"-style department code, \`mt-0.5 text-[10px] text-slate-400 dark:text-slate-500\`.
- Items: \`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800\`, each with a 14px slate-400 icon: "My profile" (\`User\`, links to /profile), "Change password" (\`KeyRound\`, /change-password). Clicking a link closes the menu.
- "Sign out" (\`LogOut\`): same row in \`text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40\`.

## Behaviour
- Sign-out is a submit button inside \`<form action={logoutAction}>\`, posting a real server action that clears the session server-side so the cookie cannot be replayed — not a client-side redirect.

## API
\`user: { name: string | null; email: string; avatarUrl: string | null; roleNames: string[]; departmentCode: string | null }\`, \`logoutAction: () => Promise<void>\`.

## Demo
Right-aligned in a row: Ada Lovelace, ada@example.com, Administrator · ENG.`,

  'theme-settings': `Build an appearance settings dropdown (light/dark theme and row density) in React + TypeScript + Tailwind CSS.

## Look
- Trigger: \`p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800\`, a 16px lucide \`SlidersHorizontal\`, title and aria-label "Appearance"; while open it keeps \`bg-slate-100 text-slate-600\` (dark \`bg-slate-800 text-slate-200\`).
- Panel: floating surface, \`absolute right-0 mt-2 w-60 p-3 z-50 space-y-3\`.
- Theme row, \`flex items-center justify-between\`: label "Theme" with a 14px \`Sun\` (\`flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300\`); at the right a two-button track \`flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5\`. Each button \`p-1.5 rounded-md\` with a 14px icon: \`Sun\` (aria-label "Light theme") and \`Moon\` ("Dark theme"). Selected: \`bg-white dark:bg-slate-700 shadow-sm\` with the icon in amber-500 for Sun, indigo-500 (dark indigo-300) for Moon. Unselected: \`text-slate-400 hover:text-slate-600 dark:hover:text-slate-200\`.
- Density block, \`space-y-1.5\`: label "Density" with a 14px \`Type\` icon, then a \`grid grid-cols-3 gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5\` of compact / standard / comfortable, each \`px-2 py-1.5 text-[10px] font-medium rounded-md capitalize truncate\`; selected \`bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white\`, others \`text-slate-500 hover:text-slate-700 dark:hover:text-slate-200\`.

## Theme state (build it too)
A small React context with a \`ThemeProvider\` and \`useTheme()\` hook exposing \`theme: 'light' | 'dark'\`, \`setTheme\`, \`density: 'compact' | 'standard' | 'comfortable'\`, \`setDensity\`:
- On mount, read \`localStorage\` keys \`app.theme\` and \`app.density\`. With no stored theme, follow the OS \`prefers-color-scheme\` ONCE, then persist whatever the user picks.
- Only after that first read (a \`mounted\` flag), apply and persist on every change: toggle the \`dark\` class on \`<html>\`; set the root font-size (compact 13px, standard 14px, comfortable 16px) and a \`data-density\` attribute on \`<html>\` that global CSS can key table row heights off. Writing before the read would overwrite the stored preference with the default.
- Pair it with an inline pre-paint script in \`<head>\` that applies the same keys before hydration, so dark-mode users don't see a white flash.

## Demo
The trigger alone in a header row; open it and switch theme and density.`,

  'theme-script': `Build a pre-paint theme script component for a Next.js (App Router) + React + TypeScript app.

A tiny component that applies the stored theme and density BEFORE first paint. Without it the page renders light, then the theme provider's effect flips it to dark a frame later — a white flash on every load for dark-mode users.

## Behaviour
- Renders a single \`<script dangerouslySetInnerHTML={{ __html: SCRIPT }} />\`. It must be inline and synchronous in \`<head>\`, which is why it is a raw script string rather than anything React-driven. No \`'use client'\`, no state.
- The script, wrapped entirely in \`try { … } catch (e) {}\` because \`localStorage\` throws outright in a locked-down browser:
  1. \`t = localStorage.getItem('app.theme')\`; if absent, \`'dark'\` when \`matchMedia('(prefers-color-scheme: dark)')\` matches, else \`'light'\`.
  2. If dark, add the \`dark\` class to \`document.documentElement\`.
  3. \`d = localStorage.getItem('app.density') || 'standard'\`; set \`data-density\` on \`<html>\` and the root font-size — compact 13px, standard 14px, comfortable 16px.
- Keep the keys and sizes identical to the theme provider's, or the two fight.
- Written in plain ES5 (\`var\`) so it runs before any bundle.

## Usage
Render \`<ThemeScript />\` inside \`<head>\` in the root layout, and put \`suppressHydrationWarning\` on \`<html>\` — the script changes its class and style before React hydrates.`,

  'idle-logout': `Build a headless idle-logout (auto-lock) component in React + TypeScript.

Signs the user out after 15 minutes with no activity — for consoles that run on shared workstations. Renders nothing (\`return null\`).

## Behaviour
- Constants: idle limit 15 min, activity-stamp throttle 5s, check interval 30s, storage key \`app.lastActivity\`.
- The last-activity timestamp lives in \`localStorage\`, not a ref, so activity in ANY tab keeps every tab alive — otherwise someone working in one tab gets signed out by an idle one next to it.
- On mount, stamp \`Date.now()\`. Listen on \`window\` (passive) for \`mousemove\`, \`mousedown\`, \`keydown\`, \`wheel\`, \`touchstart\`; re-stamp at most once per 5s.
- Check every 30s AND on \`visibilitychange\` when the page becomes visible, so a laptop waking from sleep locks immediately instead of at the next tick. The check reads the stored stamp; if it is missing or younger than the limit, do nothing.
- Once expired, set a \`loggingOut\` ref (so the check never fires twice) and \`await logoutAction()\` — a real server action that revokes the session, not just a client redirect. If it throws, fall back to \`window.location.href = '/login'\`. (In Next.js, a server action that calls \`redirect()\` throws a redirect that the framework handles.)
- Every storage read/write is in try/catch: if storage is unavailable, never lock rather than lock on every tick off a value that can't be written.
- Clean up all listeners and the interval on unmount; re-run the effect if \`logoutAction\` changes.

## API
\`logoutAction: () => Promise<void>\`.

## Usage
Mount once in the authenticated layout: \`<IdleLogout logoutAction={logout} />\`.`,

  fieldset: `Build a fieldset (bordered control group with a legend, optionally collapsible) component in React + TypeScript + Tailwind CSS.

A real \`<fieldset>\` / \`<legend>\` rather than a div with a label: the legend becomes the group's accessible name, so each control inside is announced with the question it answers ("Notifications, Email, checkbox"), and \`disabled\` switches off every control in one native attribute.

## Look
- \`<fieldset>\`: \`min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 px-4\`, \`pb-4\` — shrinking to \`pb-1\` when collapsed, so a collapsed fieldset is a tidy single rule with the legend on it, not an empty box.
- \`<legend>\`: sits on the top border, \`px-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200\`.
- Body: \`pt-2 text-xs text-slate-600 dark:text-slate-300\`.
- Toggleable: the legend holds a button (\`-mx-1 flex items-center gap-1 rounded-md px-1 py-0.5\`, \`hover:text-indigo-600 dark:hover:text-indigo-400\`, focus ring indigo-400) with a 14px \`ChevronDown\` (slate-400 / dark slate-500) before the text, rotated \`-rotate-90\` when collapsed.

## Behaviour
- The button goes INSIDE the legend rather than replacing it: the legend still names the group, the button takes focus.
- Collapse animates height with a \`grid-template-rows\` 1fr ↔ 0fr transition (\`duration-200 ease-out\`, none under reduced motion) — no measuring. The inner wrapper is \`min-h-0\` so the 0fr row can reach zero.
- The body clips (\`overflow-hidden\`) only while collapsed and for 250ms while expanding (a timer, not \`transitionend\`, which never fires under reduced motion). Once open it stops clipping, so a dropdown inside is never cut off.
- The collapsed body is \`inert\`, so Tab cannot land on a hidden control.
- Only a toggleable fieldset can be collapsed — a stray \`collapsed\` on a static one is ignored rather than hiding content with no way back.
- Controlled when \`collapsed\` is passed, otherwise internal from \`defaultCollapsed\`. \`onToggle(next)\` gets the NEXT collapsed state.

## API
\`legend: ReactNode\`, \`toggleable?\` (false), \`collapsed?: boolean\`, \`defaultCollapsed?\` (false), \`onToggle?: (collapsed: boolean) => void\`, \`disabled?\` (false), \`className\`, \`children\`.

## Accessibility
The toggle button has \`aria-expanded\` and \`aria-controls\` pointing at the body (id from \`useId\`).

## Demo
A two-column grid: "Notifications" (Email ✓, Push, Weekly digest ✓ checkboxes); a controlled toggleable "Advanced" with a "Retry limit" input; a toggleable one that starts collapsed; and a disabled group with two locked checkboxes.`,

  divider: `Build a divider (separator rule with optional label) component in React + TypeScript + Tailwind CSS.

## Look
- The rule is a BORDER, not a background — \`border-style\` is the only way to get dashed and dotted variants that stay crisp at 1px. Colour \`border-slate-200 dark:border-slate-700\`; \`border-t\` for horizontal, \`border-l\` for vertical; \`solid\` / \`dashed\` / \`dotted\`.
- No label: horizontal is \`my-4 w-full\`; vertical is \`mx-3 self-stretch\` — it stretches to the height of its flex row, for sitting between inline items.
- With a label: a flex container (horizontal \`my-4 w-full gap-2\`; vertical \`mx-3 flex-col self-stretch gap-1.5\`, \`items-center\`) holding rule · label · rule. Label: \`shrink-0 text-[11px] font-medium text-slate-500 dark:text-slate-400\`.
- Alignment sets each side's rule: \`center\` both \`flex-1\`; \`left\` (or \`top\`) a short fixed stub before (\`w-4\` / \`h-3\`) and \`flex-1\` after; \`right\` (\`bottom\`) the mirror. The stub keeps a left-aligned label reading as ON the line, not beside it. A value from the other axis falls back to \`center\`.

## API
\`layout?: 'horizontal' | 'vertical'\` ('horizontal'), \`type?: 'solid' | 'dashed' | 'dotted'\` ('solid'), \`align?: 'left' | 'center' | 'right' | 'top' | 'bottom'\` ('center'), \`className\`, \`children?\` (a label: "OR", a section name, an icon). Empty string / false / null count as no label.

## Accessibility
\`role="separator"\` with \`aria-orientation\` on the element that draws the rule; the two rule spans are \`aria-hidden\`. The separator role makes its children presentational, so a plain-string label is ALSO set as \`aria-label\` — otherwise "Or continue with" is flattened away and the separator is nameless.

## Demo
"Section above", a plain rule, a dashed "OR", a dotted left-aligned "Details", a right-aligned "End of list"; then an \`h-16\` flex row "Left | Middle ┆or┆ Right" with a solid and a dashed labelled vertical divider.`,

  accordion: `Build an accessible accordion component in React + TypeScript + Tailwind CSS.

Stacked sections that expand in place, one at a time or several.

## Look
- Shell: \`rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700\`. NO \`overflow-hidden\` on it — clipping the shell would also clip any dropdown opened inside a section. The rounded corners come from rounding the first header (\`rounded-t-lg\`) and the last header while closed (\`rounded-b-lg\`) instead.
- Header button: \`flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60\`; optional 14px leading icon (slate-400 / dark slate-500); title \`min-w-0 flex-1\`; a 14px \`ChevronRight\` at the end (slate-400) that rotates 90° when open (\`duration-200\`). Focus: an INSET ring (\`ring-2 ring-inset ring-indigo-400\`, \`relative\` so it sits above neighbours). Disabled: \`opacity-50 cursor-not-allowed\`, no hover tint.
- Panel content: \`border-t border-slate-100 dark:border-slate-800 px-3 py-3 text-xs text-slate-600 dark:text-slate-300\`.

## Behaviour
- Open/close animates height with a \`grid-template-rows\` 0fr ↔ 1fr transition (\`duration-200 ease-out\`, none under reduced motion), inner wrapper \`min-h-0\` — no measuring. It clips only while closed and for 250ms while expanding (a timer, since \`transitionend\` never fires under reduced motion), so an open section never cuts off a popover. Closed panels are \`inert\`, keeping hidden controls out of the Tab order.
- \`multiple\` off: opening one closes the other; \`multiple\` on: independent. Clicking an open header closes it.
- \`value\` is ALWAYS an array of open ids, in single mode too — flipping \`multiple\` never changes the type a caller stores, and "all closed" is just \`[]\`. Controlled when \`value\` is passed, else internal from \`defaultValue\`; \`onChange(openIds)\` fires in both.
- Keyboard: every header stays in the Tab order (they are independent controls, unlike tabs); ArrowDown/ArrowUp move focus to the next/previous header (wrapping), Home/End to first/last, all skipping disabled items.

## API
\`items: { id: string; title: ReactNode; content: ReactNode; disabled?: boolean; icon?: ComponentType<{ className?: string }> }[]\`, \`multiple?\` (false), \`value?: string[]\`, \`defaultValue?\` ([]), \`onChange?\`, \`headingLevel?: 2–6\` (3), \`className\`.

## Accessibility
WAI-ARIA accordion: each header is a \`<button>\` inside a real \`<hN>\` (level from \`headingLevel\`, \`m-0\`), with \`aria-expanded\` and \`aria-controls\`; each panel is \`role="region"\` with \`aria-labelledby\` the header.

## Demo
Account (User icon) "Name, email address and sign-in preferences."; Security (Shield) "Password, two-factor authentication and active sessions."; Notifications (Bell) "Choose which events send an email or a push message."; Billing (FileText), disabled. Side by side: single uncontrolled with Account open, and multiple controlled with Account and Notifications open.`,

  'button-group': `Build a button group and a segmented control (two exports, one file) in React + TypeScript + Tailwind CSS.

## ButtonGroup (default export)
Joins adjacent buttons into one control: shared borders, only the outer corners rounded.
- \`<div role="group">\`, \`isolate inline-flex\` (\`flex-col\` when \`vertical\`).
- It restyles its CHILDREN through arbitrary child selectors, so any button, link or your own Button works without knowing it is grouped:
  - horizontal: \`[&>*:not(:first-child)]:-ml-px [&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none\`
  - vertical: \`[&>*:not(:first-child)]:-mt-px [&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none\`
  - The \`:not(...)\` pseudo-classes are load-bearing: they add the specificity needed to beat a child's own \`rounded-lg\` without a class-merging utility.
- Neighbours overlap by 1px so two 1px borders read as one. A focused child is lifted (\`[&>*:focus-visible]:relative [&>*:focus-visible]:z-10\`) so its ring isn't painted under the next button; \`isolate\` keeps that z-index local.
- Props: \`vertical?\` (false), \`aria-label\` (names the group: "Text alignment", "Pagination"), plus any div attributes.

## SegmentedControl (named export)
A single-choice toggle — list/grid, day/week/month.
- Track: \`inline-flex items-center gap-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5\`.
- Option: \`inline-flex items-center justify-center rounded-md font-medium leading-none\`, optional 14px icon before the label; \`md\` \`px-2.5 py-1 text-xs gap-1.5\`, \`sm\` \`px-2 py-0.5 text-[11px] gap-1\`. Selected: \`bg-white text-indigo-700 shadow-sm\`, dark \`bg-slate-700 text-indigo-300\`. Others: \`text-slate-500 hover:text-slate-800\`, dark \`slate-400 → slate-100\`. Disabled \`opacity-40 cursor-not-allowed\`. Focus ring indigo-400.
- Radio semantics, not \`aria-pressed\` buttons: \`role="radiogroup"\` (with \`aria-label\` — required in practice), each option \`role="radio"\` + \`aria-checked\`, so screen readers announce "2 of 3".
- Keyboard per the radio pattern: ONE Tab stop (roving tabindex on the checked option — or the first enabled option if none matches \`value\`); Arrow Right/Down and Left/Up move AND select, wrapping, Home/End jump to the ends, all skipping disabled options.
- Always controlled. Props: \`options: { value: T; label: ReactNode; icon?: ComponentType<{ className?: string }>; disabled?: boolean; 'aria-label'?: string }[]\` (per-option label for icon-only options), \`value: T\`, \`onChange(value: T)\`, \`size?: 'sm' | 'md'\` ('md'), \`aria-label\`, \`className\`. Generic over \`T extends string\`.

## Demo
- Three secondary icon buttons (AlignLeft / AlignCenter / AlignRight) grouped as "Text alignment".
- A small "‹ Prev · 1 · 2 · Next ›" pagination group.
- A vertical group of plain bordered Open / Save / Close buttons.
- A List / Grid segmented control with icons, and a small Day / Week / Month / Year (Year disabled).`,

  'split-button': `Build a split button (primary action + caret menu of secondary actions) component in React + TypeScript + Tailwind CSS.

"Save" beside a caret that opens "Save as draft / Save and close / Discard". Two REAL buttons, not one with a hot zone — the main action and "show more" are different operations, each needing its own focus stop and name.

## Look
- Root \`relative inline-flex\`. Both halves are the standard button in the chosen variant and size (primary indigo, secondary bordered white, ghost, danger rose; sm/md/lg). Main half \`rounded-r-none\`; caret half \`rounded-l-none\`, padding \`px-1.5\` / \`px-2\` / \`px-2.5\` for sm/md/lg, a 14px \`ChevronDown\` that rotates 180° while open. Both lift on focus (\`focus-visible:relative z-10\`).
- The seam between halves, per variant: primary and danger get \`border-l border-white/25\`; secondary drops the caret's left border (\`border-l-0\`) so the main button's right border is the seam; ghost borrows \`border-l border-slate-200 dark:border-slate-700\`.
- Optional 14px icon before the label; hidden while \`loading\` (the spinner takes its place).
- Menu: floating surface, \`absolute top-full z-50 mt-1 min-w-44 p-1\`, \`right-0\` or \`left-0\`. Items \`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs\`, 14px icon at \`opacity-70\`, label truncating; normal \`text-slate-700 dark:text-slate-200\` with \`hover:\` and \`focus:bg-slate-100\` (dark \`slate-800\`); \`danger\` items \`text-rose-600 dark:text-rose-400\` with \`bg-rose-50\` / dark \`bg-rose-500/10\` highlight; disabled \`opacity-40\`. Separators \`my-1 h-px bg-slate-200 dark:bg-slate-700\`.

## Behaviour
- \`disabled\` disables both halves; \`loading\` puts a spinner on (and disables) the main half only — the menu stays usable.
- \`menuAlign\`: \`auto\` (default) aligns the menu's right edge to the button, then — measured in a layout effect after render, before paint — flips to left-aligned if that would push it past the left edge (+8px) of the nearest ancestor whose \`overflow-x\` isn't visible (or the window), where it would be clipped or painted under a sidebar. \`left\` / \`right\` force it.
- Opening from the keyboard (Enter/Space on the caret — a click with \`event.detail === 0\` — or ArrowDown) focuses the first enabled item; ArrowUp opens and focuses the last. Opening with the mouse leaves focus on the caret. Focus items on the next animation frame, after they have rendered.
- In the menu: ArrowDown/Up cycle enabled items (wrapping), Home/End jump; Tab closes the menu and lets focus move on (a menu that holds Tab is a trap); Escape closes and returns focus to the caret; outside click closes.
- Choosing an item closes the menu, returns focus to the caret FIRST (so it isn't stranded on an unmounted item, and an action that opens a modal can take it from there), then runs \`onClick\`.
- The menu is in-flow (absolute), so an \`overflow-hidden\` ancestor such as a table shell will clip it; portal it there.

## API
\`label: ReactNode\`, \`onClick?\`, \`items: ({ label: ReactNode; icon?: ComponentType<{ className?: string }>; onClick?: () => void; disabled?: boolean; danger?: boolean } | { separator: true })[]\`, \`variant?\` ('primary'), \`size?\` ('md'), \`icon?\`, \`disabled?\`, \`loading?\`, \`menuAlign?: 'left' | 'right' | 'auto'\` ('auto'), \`menuLabel?\` ('More actions', the caret's aria-label), \`className\`.

## Accessibility
Caret: \`aria-haspopup="menu"\`, \`aria-expanded\`, \`aria-controls\` (while open). Menu \`role="menu"\` \`aria-orientation="vertical"\`; items \`role="menuitem"\` \`tabIndex={-1}\`; separators \`role="separator"\`.

## Demo
Items: Save as draft (FileText), Save and close (Save), Export… (Download, disabled), a separator, Discard changes (Trash2, danger). In a row: primary "Save" with a Save icon, secondary "Export" with \`menuAlign="left"\`, small ghost "Options", large danger "Delete", and a disabled one.`,
};
