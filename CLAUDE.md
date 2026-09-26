# Admin UI Kit — working notes

A **copy-in** component library: 104 self-contained React components plus a
Next.js gallery that documents them. Next.js 16 · React 19 · Tailwind 4 · TS.

Nothing is published to npm. The unit of delivery is **one file a person pastes
into their own project**, so a component that needs three other files to work
has failed at the thing this library is for.

## Commands

```bash
npm run dev              # gallery on :3020
npm run typecheck        # tsc --noEmit
npm run check            # typecheck + registry consistency  ← run this
npm run check:registry   # catalog / barrel / demo wiring agree
npm run check:popovers   # drives 31 popovers in real Chrome (needs `npm run dev` running)
npm run build            # next build
```

`npm run check` is the gate for any change. `check:popovers` needs the dev
server up in another terminal and real Chrome at
`/Applications/Google Chrome.app`; run it whenever you touch a dropdown,
a portal, `overflow`, `z-index`, or `.panel`.

## The two halves

| | |
|---|---|
| `src/components/{layout,form,table,data,overlay,media}/` + `src/lib/` + `src/contexts/` | **the library** — what people copy |
| `src/components/gallery/` + `src/registry/` + `src/app/` | **the gallery** — what documents it |

The dependency runs one way: the gallery imports the library, never the reverse.
A library component that imports from `@/registry` or `@/components/gallery` is
a bug — it makes the file uncopyable.

## Adding or renaming a component touches six files

Nothing type-checks these against each other, and every failure is silent and
shaped like a content bug — a blank examples section, a component missing from
the nav, an import line that does not resolve. `npm run check:registry` is what
catches them.

1. `src/components/<category>/<Name>.tsx` — the component
2. `src/components/index.ts` — barrel export (**the value**, not only its types)
3. `src/registry/index.ts` — the catalog entry; the slug is derived from the name
4. `src/registry/demos/index.tsx` — `export function <Name>Demo()`
5. `src/registry/demos/map.tsx` — `'<slug>': D.<Name>Demo`
6. `src/registry/groups.ts` — the menu group it is listed under, by purpose
   (`Dates`, `Filters & views`), not by folder

More than one example additionally needs `src/registry/examples.ts` (metadata)
and `src/registry/example-demos.tsx` (the components). Every component also
needs a copy-ready AI prompt for rebuilding its design, in
`src/registry/prompts/`, keyed by slug — only what is particular to it; the
shared look is `HOUSE_STYLE` in `prompts/index.ts`, appended automatically. See
`.claude/skills/add-component/` for the walked-through version.

The props table is **parsed from the component's own types at build time**
(`src/registry/props.ts`) — never hand-written. What that asks of a component is
in `.claude/skills/component-docs/`.

## Conventions

- `'use client'` at the top of anything with state, refs or handlers. Pure
  presentational components (`KpiTile`, `Badge`'s siblings) do without it.
- **Default export** the component; named-export its types. A few files
  (`Modal`, `MonthGrid`, `DayGrid`, `AutocompleteDropdown`) are named-only for historical
  reasons — match the file you are editing, and export both from the barrel.
- **Popovers dismiss through `useDismiss`** from `@/lib/use-dismiss` — never a
  hand-rolled `mousedown` listener. Thirteen components each had their own and
  half had forgotten Escape. Pass both refs when the panel is portalled.
- **Floating surfaces are `panel panel-solid z-50`; triggers are `field-input`.**
  Every picker and dropdown uses the same two recipes, so a new one that
  hand-rolls its shell is the odd one out on sight.
- `cn()` from `@/lib/cn` for class joins. It is a filter-and-join, **not**
  tailwind-merge: where two classes would collide, the call site picks one.
- Variant maps as `const VARIANT = { … } as const`, with the prop typed
  `keyof typeof VARIANT`. Adding a variant then means adding one line.
- Every colour needs its `dark:` pair. There is no `prefers-color-scheme` —
  dark mode is the `.dark` class, because a shared workstation has to keep what
  the person using it chose.
- Comments explain **why**, especially where the obvious code was wrong. That is
  the house style throughout and it is load-bearing documentation; keep it.

## Two ways to lose a popover

Only `Tooltip`, `ConfirmPopover`, `Drawer`, `Modal` and `AnchoredPanel` (plus the
column menus in `DataTable` and `BaseGrid`) portal to `<body>`. Every
other dropdown, calendar and filter panel positions itself absolutely inside its
trigger, which exposes it to both of:

- **Clipping** — an ancestor with `overflow-hidden` / `overflow-x-auto` cuts the
  popover's box away.
- **Stacking** — an ancestor that creates a stacking context traps the popover's
  `z-index` inside it, and a *later sibling* paints over it. `backdrop-filter`
  alone is enough, which is why `.panel` (frosted) creates one and
  `.panel panel-solid` deliberately does not.

Z-index bands, documented in `globals.css`: **1–20** table chrome · **50**
in-flow popovers · **200** portalled overlays. New popovers go at 50.

Corollary: **fill by growing, not by nesting a scroller.** `Layout` keeps
`<main>` as the single scroll container. Giving a page or panel its own
`overflow-auto` to make it "fit" clips every popover inside it.

Full reference: `.claude/skills/ui-conventions/`.

## Gotchas that have cost time

- `src/registry/index.ts` and `examples.ts` are **plain data with no
  `'use client'`** on purpose. The preview route is a server component and
  reaches a client module as an opaque reference, not as the array — importing
  the catalog from a client module silently yields `undefined`.
- An example's source is located by a **derived function name**:
  `<Name>` + PascalCased id (`splitter` + `min-max` → `SplitterMinMax`). Rename
  the function and the code panel goes blank with no error.
- Example ids are the on-this-page anchors. Unique per component, stable.
- **Three examples maximum** per component. Variants differing by one prop fold
  into a single example with a control, not near-identical screenshots.
- `Badge` and friends carry `leading-none` because the density rules put a
  32–48px line-height on every table cell and an inline-flex child inherits it.
- `src/components/ui/AvatarEditor.tsx` is uncatalogued — no entry, no barrel
  export, no demo. It is knowingly listed in `scripts/registry-check.mjs`.
