# Admin UI Kit

55 React components for admin and dashboard interfaces, with a live gallery.
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
| `/` | Overview — every component grouped by category |
| `/all` | All 55 on one page, with search and filters |
| `/preview/<slug>` | One component, full width, with three tabs |

Each component page has **Preview** (running, interactive), **Usage** (the demo's
own source — a working snippet you can paste), and **Source** (the whole
component file). Both code views have a copy button.

## Components

**Layout & shell** (15) — Sidebar · Topbar · Breadcrumbs · Splitter · Tabs · Card ·
Button · Alert · Avatar · EmptyState · MenuIcon · UserDropdown · ThemeSettings ·
ThemeScript · IdleLogout

**Form & input** (12) — Field (+ Input, Textarea, Select) · Checkbox · ToggleSwitch ·
MultiSelect · AutocompleteDropdown · TreeMultiSelectDropdown ·
CombinedFilterDropdown · DatePicker · DateRangePicker · MonthPicker ·
MonthRangePicker · MonthGrid

**Tables & lists** (9) — DataTable · PasteableGrid · EditableCell · Pagination ·
UrlPagination · SortableTh · SortableList · SaveAllBar · AccountCell

**Data display** (12) — KpiTile · RankedTable · RankedBars · TrendChart ·
RetentionChart · ActivityFeed · StatusBar · StatusSteps · Badge · Progress ·
Skeleton · chartTheme

**Overlays** (6) — Modal · Drawer · Tooltip · ConfirmPopover · NotificationBell ·
NotificationCard

**Media** (1) — MediaLibrary

## Using a component

1. Open it in the gallery and copy the **Usage** snippet.
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

**Popovers and clipping.** Only four components render through a portal —
`Tooltip`, `ConfirmPopover`, `Drawer` and `Modal`. Every other dropdown, calendar
and filter panel positions itself *absolutely* inside its trigger, so a card,
table shell or panel with `overflow-hidden` or `overflow-x-auto` around one of
them will clip its popover: the menu opens, and is painted away. Either drop the
clip, or use one of the four portalled components.

`npm run check:popovers` drives all fifteen in a real browser, opens them, and
measures how much of each popover survives its clipping ancestors. This class of
bug is invisible to `tsc` and to `next build` — both stay green while the
popovers are broken.

**Fill by growing, not by nesting a scroller.** For the same reason, the gallery
shell keeps `<main>` as its single scroll container and fills space with
`flex-1 min-h-full`. Giving a page or panel its own `overflow-auto` to make it
"fit" clips the same components.

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
