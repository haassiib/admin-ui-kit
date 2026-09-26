---
name: add-component
description: Add, rename, move or delete a component in this kit — the six-file registry wiring, the demo, the examples, and the verification gauntlet. Use whenever a component enters or leaves src/components/, or when its name, category or file path changes.
---

# Adding a component

A component is not "added" until it appears in the gallery with a live example,
a props table and a source view. Five files, in this order. **Nothing
type-checks them against each other** — `npm run check:registry` does.

## 1. The component — `src/components/<category>/<Name>.tsx`

Categories: `layout` `form` `table` `data` `overlay` `media`. Pick by what the
component is *for*, not by what it renders — `Button` lives in `layout/`
because it is page furniture.

It must be **copyable as one file**. Allowed imports:

- `react`, `lucide-react`, and the optional peers (`recharts`, `date-fns`,
  `react-easy-crop`, `sonner`) — each already declared in `package.json`
- `@/lib/*` — small, pure, dependency-free helpers
- `@/contexts/*` — only if it genuinely needs theme or sidebar state
- sibling components in the same or another category

Never `@/registry/*` or `@/components/gallery/*`. That inverts the dependency
and makes the file uncopyable.

Shape to match:

```tsx
'use client';                       // omit only if there is no state/ref/handler

import { cn } from '@/lib/cn';

const TONE = {                      // variant map, not a switch
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  danger:  'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
} as const;

export type ThingTone = keyof typeof TONE;

/** One line on what it is. */
export default function Thing({
  tone = 'neutral',
  className,
  children,
}: {
  /** Which way the thing leans. */      // ← this comment becomes the props table
  tone?: ThingTone;
  className?: string;
  children: React.ReactNode;
}) {
  return <span className={cn('inline-flex items-center', TONE[tone], className)}>{children}</span>;
}
```

Read `.claude/skills/ui-conventions/SKILL.md` before writing any markup — the
`.panel` recipes, the z-index bands and the density rules all constrain it. If
it opens a popover, that file is not optional.

## 2. Barrel — `src/components/index.ts`

In the category's block, alphabetically:

```ts
export { default as Thing } from './data/Thing';
export type { ThingTone } from './data/Thing';
```

**Export the value, not only its types.** A lone `export type { ThingProps }`
line reads like the component is exported and is not — four components were
missing from the public surface this exact way.

## 3. Catalog — `src/registry/index.ts`

One line in the right category block:

```ts
data('Thing', 'One sentence, present tense, saying what it does and what is notable about it.'),
```

- The **slug is derived** from the name: `MonthGrid` → `month-grid`. Do not
  write it anywhere by hand; it is the URL, the demo-map key and the anchor.
- `{ file: 'thing.ts' }` when the filename is not `<Name>.tsx`.
- `{ propsOf: 'Thing.Root' }` when the props live on a sub-component — a
  compound component has no `Thing(props)` for the parser to read, and without
  this its page shows an empty table, which reads as "takes no props".
- Blurbs are the nav's only description. Say the thing that is *particular* to
  this component, not its category ("Two resizable panes with a draggable,
  keyboard-nudgeable divider", not "A layout component").

## 4. Demo — `src/registry/demos/index.tsx`

```tsx
export function ThingDemo() {
  return <Thing tone="danger">Overdue</Thing>;
}
```

- Drive the **real component with realistic props**. Fictional data only;
  fixtures live in `src/registry/fixtures.ts` — reuse them.
- Helpers in `src/registry/demos/kit.tsx`: `Row`, `Variant`, `DemoTable`, and
  `useEcho` (state plus a readout of the emitted value — a controlled
  component's whole contract is invisible if the demo only renders the widget).
- The demo renders inside `.panel.panel-solid` with `p-4`. Do not add your own
  panel or padding.

## 5. Demo map — `src/registry/demos/map.tsx`

```tsx
'thing': D.ThingDemo,
```

Keep it in catalog order. A missing key is a page with no live example and no
error.

## 6. Menu group — `src/registry/groups.ts`

Add the name to the ONE group a person would look under — `Dates`, `Filters &
views`, `Charts` — not the group matching its folder. The folder is where the
file lives; the group is where it is found. A name in no group is missing from
the sidebar and the browse page, and `check:registry` fails on it.

The group's `widths` also decide how the demo sits in its preview card:
centred at its own size by default, `field` for an input whose `w-full` field
has no width of its own (a 24rem floor), `fill` for anything as wide as its
container by nature — a chart, a table, a progress bar. Run a component page
after adding it: a demo that looks shrunken or collapsed needs one of those.

## Then

- **More than one example?** → `.claude/skills/component-docs/SKILL.md`. Cap: 3.
- **Opens a popover?** → dismiss it with `useDismiss` from `@/lib/use-dismiss`,
  style the panel `panel panel-solid z-50`, and add `['thing', 'click']` to `CASES` in
  `scripts/popover-check.mjs`, with a trigger selector if the first button in
  the demo is not the one that opens it.
- **Headless or a hook** (nothing to render)? → skip steps 4–5 and add the slug
  to `NO_DEMO` in `scripts/registry-check.mjs`, as `ThemeScript` and
  `chartTheme` do.
- Add it to the component list in `README.md` and bump the count there and in
  `package.json`'s `description`.

## Verify — not optional

```bash
npm run check          # typecheck + registry wiring
```

Then look at the page: `npm run dev`, open `/preview/<slug>`, and confirm four
things the checker cannot see — the example renders, the **props table is
populated** (an empty one means the parser gave up; see component-docs), the
source view shows the file, and it reads correctly in both colour schemes.

If it has a popover, `npm run check:popovers` with the dev server up.

## Renaming, moving, deleting

The slug is derived from the name, so **a rename changes the URL** and every
key built from it. Renaming `Thing` → `Widget` means: the file, the barrel, the
catalog, `ThingDemo` → `WidgetDemo` in both demo files, every
`EXAMPLE_META`/`EXAMPLE_DEMOS` key, every example function name
(`ThingBasic` → `WidgetBasic` — the code panel is found by that derived name),
the popover-check case, and the README.

Deleting means the same list in reverse. `npm run check:registry` catches every
half-done one of these — run it before assuming you are finished.
