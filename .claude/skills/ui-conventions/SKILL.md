---
name: ui-conventions
description: The visual and structural rules every component here follows — surfaces, the type and colour scale, dark mode, density, z-index bands, and the popover clipping/stacking traps. Use before writing or restyling any markup in src/components/, and whenever a dropdown, portal, overflow or z-index is involved.
---

# UI conventions

One theme: **indigo on slate, Inter**, defined in `src/app/globals.css`. There
is no second palette and no per-component token file. A component that needs a
colour uses a Tailwind class; Tailwind 4 compiles `bg-indigo-600` to
`var(--color-indigo-600)`, so reassigning the scale in `@theme` restyles every
component without editing one of them.

## Surfaces

| Class | For |
|---|---|
| `panel` | the frosted card — the default surface, on the gradient ground |
| `panel panel-solid` | the same card made **opaque**, for anything floating *over* page content |
| `panel-title` | the 10px uppercase tracking-wide label |
| `note` | the grey explanatory strip ("Read-only by design") |
| `data-table` | the shared table shell — sticky header, divided rows, `.sticky-col` |
| `field-label` / `field-input` | form control recipes |
| `btn-primary` / `btn-ghost` | button recipes, for markup that cannot use `<Button>` |
| `scrollbar-thin` / `custom-scrollbar` | opt-in thin scrollbars, for compact popups only |

`.panel` includes **no padding** — callers set their own.

Use `panel panel-solid` for any menu, dropdown or popover. A translucent menu
lets the table rows behind it read straight through, and its 1px translucent
border leaks content back in. It also matters structurally: see stacking, below.

## Scale

This is a **dense admin UI**. The type scale runs small and the whole kit is
consistent about it:

- `text-[10px]` uppercase tracking-wider — table headers, badges, panel titles
- `text-[11px]` — field labels, hints, footers, `sm` buttons
- `text-xs` — the body size for tables, inputs and `md` buttons
- `text-sm` — headings and `lg` buttons
- Radii: `rounded-lg` on controls, `rounded-[1rem]` (via `.panel`) on surfaces,
  `rounded-full` on pills
- Icons: `h-3.5 w-3.5` beside `xs` text, `h-4 w-4` standalone. Always
  `aria-hidden` when a label sits next to them.

Semantic tones, used consistently across `Badge`, `Alert`, `KpiTile`,
`Progress` and `StatusBar`: `neutral` slate · `info` indigo · `success`
emerald · `warning` amber · `danger` rose. `danger` is for irreversible actions
only, so it keeps its signal.

`leading-none` on any inline-flex thing that can land in a table cell — the
density rules put a 32–48px line-height on every cell and children inherit it,
which stretches a badge into an oval.

## Dark mode

Class-driven (`.dark`), **not** `prefers-color-scheme` — a shared workstation
has to keep what the person using it chose. `ThemeScript` applies the stored
choice pre-paint to kill the flash.

Every colour utility needs its `dark:` pair, in the same string. Typical
mappings: `white`→`slate-800`, `slate-50`→`slate-900`, `slate-200`→`slate-700`
(borders), `slate-700`→`slate-200` (text), and for tinted surfaces
`indigo-50`→`indigo-500/10` with `indigo-700`→`indigo-300`.

## Density

`html[data-density='compact'|'standard'|'comfortable']` rewrites the
line-height of every `td` and `th` in the document. Those rules are
**deliberately unlayered** so they outrank each table's own `py-*` utilities —
unlayered CSS beats layered, which is what lets one setting normalise every
table with no per-page edit. Do not try to win against them with padding; set
`leading-none` on the cell's children instead.

## Z-index — three bands, and the gaps are the point

```
1–20    table chrome: frozen column (1), sticky header (10),
        the header cell of a frozen column, sticky on both axes (20)
50      in-flow popovers: every dropdown, calendar and filter panel
200     portalled overlays: Tooltip, ConfirmPopover, Modal, Drawer, AnchoredPanel,
        and the column menus of DataTable and BaseGrid
```

New popovers go at **50**. They were once scattered across 10/20/30/50, which
put `DatePicker` level with a sticky `<th>`; on a tie the later element in the
document wins, so a menu opened above a table vanished behind its header.

## Two ways to lose a popover

Only five components portal to `<body>`: `Tooltip`, `ConfirmPopover`, `Drawer`,
`Modal`, `AnchoredPanel` (and the column menus inside `DataTable` and
`BaseGrid`). `AnchoredPanel` dismisses with its own listeners rather than
`useDismiss`, because a nested panel needs "inside" to mean any `[data-overlay]`
and Escape to reach only the topmost panel. Everything else positions itself absolutely inside its trigger, and is
exposed to both of these independently — a popover can pass one and fail the
other:

**Clipping.** An ancestor with `overflow-hidden` or `overflow-x-auto` cuts the
box away. The element is in the DOM with a real rect; the pixels just land
outside an ancestor's paint area.

**Stacking.** An ancestor that creates a stacking context traps the popover's
`z-index` inside it, and a later *sibling* of that ancestor paints over the open
menu. `backdrop-filter` alone creates one — which is why `.panel` (frosted) does
and `.panel.panel-solid` deliberately does not, via Tailwind's
`backdrop-filter-none` utility at two-class specificity. Wrap a popover in a
frosted panel and it disappears behind whatever follows it.

Consequences to design around:

- **Fill by growing, not by nesting a scroller.** `Layout` keeps `<main>` as the
  single scroll container and fills space with `flex-1 min-h-full`. Giving a
  page or panel its own `overflow-auto` to make it "fit" clips every popover
  inside it.
- A popover inside a table needs the table's shell not to clip it, or it needs a
  portal. Choosing the portal means also handling scroll and resize
  repositioning — look at `Tooltip` and `ConfirmPopover` first.
- Anything opaque and floating: `panel panel-solid`, `z-50`. Its trigger, when
  it is a field, is `field-input` — a `<button className="field-input text-left">`
  is how every picker here opens.
- Dismissal is `useDismiss(ref, open, close)` from `@/lib/use-dismiss` — outside
  click and Escape in one line. A portalled panel passes `[triggerRef, panelRef]`.

Neither failure is visible to `tsc` or `next build` — both stay green
throughout. `npm run check:popovers` drives all sixteen in real Chrome, opens
them, intersects every clipping ancestor's rect to measure what survives, and
hit-tests five points with `elementFromPoint` to confirm nothing paints on top.
**Run it after touching a dropdown, a portal, `overflow`, `z-index` or
`.panel`** — it needs `npm run dev` up in another terminal.

## Accessibility floor

Not decoration; these are the patterns already in the kit and new components are
expected to match.

- Real `<button>` for anything clickable. `focus-visible:ring-2
  focus-visible:ring-indigo-400` — never remove the ring without replacing it.
- Label every control. `Field` wires the id and `aria-describedby` for you;
  outside it, do it by hand.
- Popovers: `aria-expanded` + `aria-controls` on the trigger, Escape closes,
  click-outside closes, focus returns to the trigger. Listboxes get `role`s and
  arrow keys (`AutocompleteDropdown`, `MultiSelect`, `Tabs` are the references).
- `role="alert"` for `danger`, `role="status"` for everything else.
- `aria-hidden` on icons that sit beside their own label.
- Non-modal overlays: dropping the backdrop means click-outside must stop
  closing — a click outside is now a click on something (see `Drawer`).

## Adding to globals.css

Reach for a component recipe only when the same class string repeats across
several components. Component-local styling belongs in the component's own
`className`, where it stays with the file someone copies. When you do add a
recipe, write the comment explaining *why* — `globals.css` is dense with them
because the non-obvious cascade behaviour is the reason those rules are shaped
that way.

Class strings that only exist inside injected HTML (like `CodeBlock`'s
`.tok-*`) must live here as plain CSS: Tailwind's scanner never sees them and
would purge the utilities.
