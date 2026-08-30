# Admin UI Kit

58 React components for admin and dashboard interfaces, with a live gallery.
**Next.js 16 · React 19 · Tailwind 4 · TypeScript · MIT.**

Copy-in, not install: every component is a single self-contained file you paste
into your own `components/` folder. No build step to adopt, no version to keep in
sync, nothing to eject from later.

```bash
git clone <this-repo> admin-ui-kit
cd admin-ui-kit
npm install
npm run dev            # gallery at http://localhost:3020
```

## The gallery

| Route | |
|---|---|
| `/` | All 58 components on one page, with search and filters |
| `/preview/<slug>` | One component's documentation page |

(`/all` redirects to `/` — it was the listing's address before the overview page
was removed.)

Each component page is laid out like a docs site:

- **Import** — the exact import line, with a copy button
- **Examples** — one section per mode, each with a heading, a sentence on what it
  shows, the live thing, and a *Show code* toggle over that example's own source
- **Props** — name, type, default and description, **parsed from the component's
  own types at build time**, so the table cannot drift from the code
- **Source** — the whole file
- **On this page** — a right-hand nav that tracks the section you are reading

`Splitter`, for instance, has six examples: Basic, Vertical, Size, Min and max
size, Nested, and Resize events.

## Components

**Layout & shell** (17) — AppShell (nav left/right/top/bottom) · NavMenu
(vertical/horizontal) · Sidebar · Topbar · Breadcrumbs · Splitter · Tabs · Card ·
Button · Alert · Avatar · EmptyState · MenuIcon · UserDropdown · ThemeSettings ·
ThemeScript · IdleLogout

**Form & input** (13) — Field (+ Input, Textarea, Select) · Checkbox · ToggleSwitch ·
PickList · MultiSelect · AutocompleteDropdown · TreeMultiSelectDropdown ·
CombinedFilterDropdown · DatePicker · DateRangePicker · MonthPicker ·
MonthRangePicker · MonthGrid

**Tables & lists** (9) — DataTable · PasteableGrid · EditableCell · Pagination
(numbered links or page input) ·
UrlPagination · SortableTh · SortableList · SaveAllBar · AccountCell

**Data display** (12) — KpiTile · RankedTable · RankedBars · TrendChart ·
RetentionChart · ActivityFeed · StatusBar · StatusSteps · Badge · Progress ·
Skeleton · chartTheme

**Overlays** (6) — Modal · Drawer · Tooltip · ConfirmPopover · NotificationBell ·
NotificationCard

**Media** (1) — MediaLibrary

## Using a component

1. Open it in the gallery, find the example closest to what you need, and hit
   **Show code**.
2. Copy the file at the path shown in its header into your project.
3. Copy whatever it imports from `src/lib/` — those are small, pure and have no
   dependencies of their own.
4. If it calls `useTheme` or `useSidebar`, copy `src/contexts/` too.

Or import from the barrel if you vendor the whole `src/components` folder:

```tsx
import { Button, DataTable, Drawer, Tooltip } from '@/components';
```

## Requirements

Tailwind 4 with `src/app/globals.css` imported — it defines the `.panel`,
`.data-table`, `.field-*` and `.btn-*` recipes the components use, plus the
dark-mode variant and the density rules.

| | |
|---|---|
| Required | `react` ≥19, `react-dom` ≥19, `lucide-react` ≥1, Tailwind 4 |
| Only for charts | `recharts` — TrendChart, RetentionChart, RankedBars |
| Only for AvatarEditor | `react-easy-crop` |
| Only for toasts | `sonner` |

Nothing else. There is no CSS-in-JS runtime, no component framework underneath,
and no state library.

## Two things worth knowing before you build on it

**Popovers: two ways to lose one.** Only four components render through a portal
— `Tooltip`, `ConfirmPopover`, `Drawer` and `Modal`. Every other dropdown,
calendar and filter panel positions itself *absolutely* inside its trigger, which
leaves it exposed to both of these:

- **Clipping.** A card, table shell or panel with `overflow-hidden` or
  `overflow-x-auto` around it cuts the popover's box away — the menu opens and is
  painted outside the visible area.
- **Stacking.** An ancestor that creates a stacking context traps the popover's
  `z-index` inside it, and a *later sibling* then paints over the open menu.
  `backdrop-filter` alone is enough to create one, which is why `.panel`
  (frosted) does and `.panel panel-solid` deliberately does not. Wrap a popover
  in a frosted panel and it will disappear behind whatever follows it.

The z-index bands are documented at the top of the density section in
`globals.css`: **1–20** table chrome, **50** in-flow popovers, **200** portalled
overlays. Keep new popovers at 50 — the gaps exist so a menu opened over a table
clears its sticky header.

`npm run check:popovers` drives all fifteen in a real browser, opens them, and
checks BOTH: it intersects every clipping ancestor's rect to measure what
survives, and hit-tests five points with `elementFromPoint` to confirm nothing is
painted on top. Neither failure is visible to `tsc` or `next build` — both stay
green throughout.

**Fill by growing, not by nesting a scroller.** For the same reason, `AppShell`
keeps `<main>` as its single scroll container and fills space with
`flex-1 min-h-full`. Giving a page or panel its own `overflow-auto` to make it
"fit" clips the same components.

The gallery you are running is itself built from `AppShell` and `NavMenu` — the
shell the docs live in is the shell the docs document.

## Layout

```
src/
  components/
    index.ts        barrel — the public surface
    layout/  form/  table/  data/  overlay/  media/
    gallery/        the preview app itself (not part of the library)
  contexts/         ThemeContext, SidebarContext
  lib/              small pure helpers: cn, sort, pagination, dates, menu
  registry/         the catalog, demos and fixtures that drive the gallery
  app/              the gallery routes
scripts/
  popover-check.mjs browser test for popover clipping
```

`src/components/gallery/` and `src/registry/` exist to run the gallery. Nothing
in the library imports them, so you can delete both if you vendor the components.

## Provenance

Extracted from two internal Next.js dashboards and merged into one set: where
both had grown their own copy of a component, the better implementation became
the base and the other's capabilities were ported onto it rather than dropped.
Each file's header records which app it came from. All demo data is fictional.

## License

MIT — see [LICENSE](LICENSE).
