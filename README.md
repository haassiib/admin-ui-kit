# Admin UI Kit

104 React components for admin and dashboard interfaces, with a live gallery.
**Next.js 16 · React 19 · Tailwind 4 · TypeScript · MIT.**

**Live preview: [uikit.hasibcodes.com](https://uikit.hasibcodes.com)** — every
component running, with its code, an AI prompt to rebuild it, and its props.

Copy-in, not install: every component is a single self-contained file you paste
into your own `components/` folder. No build step to adopt, no version to keep in
sync, nothing to eject from later.

```bash
git clone https://github.com/haassiib/admin-ui-kit.git
cd admin-ui-kit
npm install
npm run dev            # gallery at http://localhost:3020
```

## The gallery

| Route | |
|---|---|
| `/` | All 104 components as a grid of live thumbnails, 1x–4x tiles by how much room each needs; the arrow on a tile opens its page |
| `/preview/<slug>` | One component's documentation page |

The header search filters the sidebar's component list.

(`/all` redirects to `/` — it was the listing's address before the overview page
was removed.)

Each component page is laid out like a docs site:

- **Preview** — at most three examples per component, each with a heading, a
  sentence on what it shows, the live thing, a *Show code* toggle over its own
  source, and one-click copy for the code and the AI prompt. Variants that differ
  by one prop are folded into a single example with a control, rather than
  repeated as near-identical screenshots
- **Code** — the exact import line, with a copy button
- **AI prompt** — a description of the design complete enough to paste into an
  AI coding tool and rebuild the component in your own stack
- **Source** — the whole file
- **Props** — name, type, default and description, **parsed from the component's
  own types at build time**, so the table cannot drift from the code
- **On this page** — a right-hand nav that tracks the section you are reading

`DataTable`, for instance, has three: Basic, Every feature, and Loading/empty.

## Components

**Layout & shell** (22) — Layout (the whole app frame: collapsible sidebar, header menus, breadcrumbs, theme settings, user menu) · NavMenu
(vertical/horizontal) · Sidebar · Topbar · Breadcrumbs · Splitter · Tabs · Card ·
Button · Alert · Avatar · EmptyState · MenuIcon · UserDropdown · ThemeSettings ·
ThemeScript · IdleLogout · Fieldset · Divider · Accordion · ButtonGroup (+ SegmentedControl) ·
SplitButton

**Form & input** (32) — Field (+ Input, Textarea, Select) · Checkbox · ToggleSwitch ·
PickList · MultiSelect · AutocompleteDropdown · TreeMultiSelectDropdown ·
CombinedSelect · DatePicker · DateRangePicker · MonthPicker ·
MonthRangePicker · MonthGrid · DayGrid · FilterPanel · ConditionGroupsBuilder ·
GroupPanel · SortPanel · ColorRulesPanel · FieldsPanel · FieldEditor · Slider ·
RadioGroup · Knob · InputGroup · IconField · InputMask · InputPassword · InputColor ·
FloatLabel · IftaLabel · CascadeSelect

**Tables & lists** (12) — DataTable · BaseTable (the whole Lark-Base table, with
saved views) · BaseGrid · ViewTabs · PivotTable (Filters, Columns, Rows and Data
zones, subtotals, CSV export) ·
GroupBandRow · PasteableGrid · EditableCell · Pagination (numbered links or page
input) · SortableList · SaveAllBar · AccountCell

**Data display** (24) — KpiTile · Badge · OptionPill · Progress · Skeleton ·
ActivityFeed · StatusBar · StatusSteps · Tree · OrganizationChart · **charts:** ChartCard · BarChart
(grouped, stacked, horizontal) · LineChart · AreaChart · DonutChart ·
ScatterChart · Heatmap · FunnelChart · DivergingBars · Sparkline · RankedBars ·
TrendChart · RetentionChart · chartTheme (the validated palette)

**Overlays** (11) — Modal (draggable, resizable) · MultilevelDialog (a stack of
dialogs) · MultilevelMenu (a cascading filter menu) · Drawer · AnchoredPanel (a
dialog that nests beside) · ContextMenu · SpeedDial · Tooltip · ConfirmPopover ·
NotificationBell · NotificationCard

**Media** (3) — MediaLibrary · Carousel · Gallery (with a fullscreen lightbox)

### The Lark-Base-style table

`BaseTable` is the whole thing in one component: tabs of saved views over a
`BaseGrid`. Pass columns and rows, answer the edit callbacks, and you get:

| Area | What it does |
|---|---|
| Views | Tabs of saved views, each a **grid** or a **board**. Add, rename in place, duplicate, delete, drag to reorder. Kept in `localStorage` with `storageKey`, or controlled with `views` / `onViewsChange` for a server. |
| Per view | Search, filter, group (grid), sort, conditional colour, column order and visibility, widths, columns frozen at the left or right edge, pinned rows, the board's lane field. |
| Columns | Drag a header to move it (into the frozen block freezes it), drag its edge to resize, and a header menu: edit, hide, move left/right, freeze up to / at start / at end, sort, group. |
| Editing | In-place cells chosen by type; a record panel per row with **Details**, **History** (timeline) and **Log** (table) tabs; drag a card between board lanes. Every edit is recorded. |
| Fields | "New field" in the Fields panel or the `+` header: eleven types (text, long text, number, currency, date, checkbox, single/multi select, person, URL, email), options with colours. `columnFromField` turns a definition into a column. |

The toolbar panels are components in their own right, each usable over any table:

| Panel | Model in `src/lib/` | What it does |
|---|---|---|
| `FieldsPanel` | — | search columns, eye to show/hide, drag to reorder, click a name to edit it, "New field" |
| `FieldEditor` | `fields.ts` | add or edit a column: name, type, options with colours |
| `FilterPanel` | `conditions.ts` | `[field] [operator] [value]` rows, matching all or any; relative dates ("this week") |
| `ConditionGroupsBuilder` | `conditions.ts` | the same rows in OR'd groups, for a rule editor |
| `GroupPanel` | `grouping.ts` | up to three levels, each with a direction, reordered by drag |
| `SortPanel` | `sort.ts` | up to three columns, directions labelled by meaning ("Old → New") |
| `ColorRulesPanel` | `coloring.ts` + `tones.ts` | a filter predicate with a tone; paints a cell or a row; first match wins |

One evaluator (`matches` in `conditions.ts`) answers both the filter and the
colour rules, so the two cannot disagree.

#### Cloning the table into another project

`BaseTable` is 31 files, about 7,200 lines, and needs only `react`,
`react-dom` and `lucide-react`. Copy these, keeping the paths (they import
each other through the `@/` alias → `src/`), plus the `.panel`, `.panel-solid`,
`.field-input`, `.field-label`, `.btn-primary`, `.btn-ghost`, `.panel-title`
and `.data-table` recipes and the `animate-*` tokens from `src/app/globals.css`:

```
src/components/table/   BaseTable  BaseGrid  ViewTabs  GroupBandRow  SortableList
src/components/form/    FieldsPanel  FieldEditor  FilterPanel  GroupPanel  SortPanel  ColorRulesPanel
src/components/overlay/ AnchoredPanel  ConfirmPopover  Drawer  Tooltip
src/components/layout/  Tabs  EmptyState
src/components/data/    OptionPill
src/lib/                conditions  coloring  grouping  sort  fields  tones  toolbar
                        use-dismiss  cn  dateUtils  events  initials  tooltip-position
```

Then mount it the way the gallery's demo does (`BaseTableDemo` in
`src/registry/demos/index.tsx`): rows, columns and history in state or your
data layer, `onRowChange` to save an edit, `onFieldAdd` / `onFieldChange` /
`onFieldDelete` to save a column, and `views` + `onViewsChange` if views
should live on the server rather than in the browser.

## Using a component

1. Open it in the gallery, find the example closest to what you need, and hit
   **Show code**.
2. Copy the file at the path shown in its header into your project.
3. Copy whatever it imports from `src/lib/` — those are small, pure and have no
   dependencies of their own. Every dropdown and picker imports `useDismiss`,
   the one click-outside-or-Escape hook they all share.
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

**Popovers: two ways to lose one.** Only five components render through a portal
— `Tooltip`, `ConfirmPopover`, `Drawer`, `Modal` and `AnchoredPanel` (plus the
column menus inside `DataTable` and `BaseGrid`). Every other dropdown,
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

`npm run check:popovers` drives all sixteen in a real browser, opens them, and
checks BOTH: it intersects every clipping ancestor's rect to measure what
survives, and hit-tests five points with `elementFromPoint` to confirm nothing is
painted on top. Neither failure is visible to `tsc` or `next build` — both stay
green throughout.

**Fill by growing, not by nesting a scroller.** For the same reason, `Layout`
keeps `<main>` as its single scroll container, and so does the gallery's own
frame, which fills space with `flex-1 min-h-full`. Giving a page or panel its
own `overflow-auto` to make it "fit" clips the same components.

The gallery's frame (`src/components/gallery/DashShell.tsx`) puts the library's
`NavMenu` in its sidebar, driven by the header search.

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
