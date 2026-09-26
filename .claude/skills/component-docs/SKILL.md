---
name: component-docs
description: Author or fix a component's gallery documentation page — named examples, their metadata and the build-time props table. Use when a page shows no examples, an empty or wrong props table, a blank code panel, or when adding a second/third example to a component.
---

# Documenting a component

Each page at `/preview/<slug>` is: an import line, up to three **examples**, a
**props table parsed from the component's types**, the full **source**, and an
on-this-page nav. All of it is generated at build time from the registry and
from the component file itself.

## One example, or several

Every component gets at least one, free: `examplesFor()` falls back to the
single `<Name>Demo` under the heading "Basic". Nothing to write.

Several examples is a deliberate step, and it is **two tables joined by id** —
metadata in a server-readable data module, components in a client module:

`src/registry/examples.ts`
```ts
'thing': [
    { id: 'tones', title: 'Tones', description: 'Five tones, all readable in both colour schemes.' },
    { id: 'dot', title: 'With a state dot', description: '`dot` prefixes a filled circle, for a state rather than a count.' },
],
```

`src/registry/example-demos.tsx`
```tsx
function ThingTones() { … }
function ThingDot() { … }

export const EXAMPLE_DEMOS = {
  'thing': { 'tones': ThingTones, 'dot': ThingDot },
};
```

Four rules, each of which has broken silently before:

1. **The function name is derived, not read.** The preview page extracts source
   by building `<Name>` + PascalCased id — `splitter` + `min-max` →
   `SplitterMinMax`. It cannot use `Demo.name`: `example-demos.tsx` is a client
   module (a server component sees a reference, not the function) and
   production minification renames functions anyway. Name the function exactly
   that, or the code panel is blank with no error.
2. **The two tables must have the same ids.** Metadata with no component is
   dropped; a component with no metadata never renders. `npm run check:registry`
   compares them.
3. **Metadata stays in `examples.ts`, which has no `'use client'`.** Moving it
   next to the components is the bug that once cost every example after the
   first its code panel — the server component received an opaque reference
   instead of the array.
4. **Three maximum.** Variants that differ by one prop fold into *one* example
   with a control — a row of `Button size="sm|md|lg"` is one example, not three.
   Reach for the fourth and the answer is usually that two of them are the same
   screenshot.

Ids are also the anchors in the on-this-page nav: unique within the component,
stable across edits.

## Writing the description

The description is the page's actual documentation — a sentence or two, in
prose, saying what the example demonstrates and **why the component behaves
that way**. Backticks render as code. Match the existing register:

> `loading` also disables the button — a spinner on a still-clickable control is
> how you get two submits.

> Skeleton rows keep the header and column widths so the table does not jump
> when data arrives; with no rows at all it renders its empty state instead of a
> bare header.

Not: "Shows the loading state." The live example already shows it.

Prefer one example that demonstrates features **working together** over three
that isolate them — `DataTable`'s "Every feature" is deliberate, because each
feature alone is a screenshot rather than a demonstration.

## The props table

`src/registry/props.ts` parses it out of the component's own source, anchored on
the exported component's declaration. It handles three shapes and gives up
cleanly on anything else, so **an empty props table means the parser gave up** —
never that the component takes no props. When that happens:

- It looks for, in order: `interface <Name>Props`, an inline object type on the
  destructured parameter (`}: {`), any `*Props` interface, then a `& { … }`
  intersection inside `forwardRef`.
- Fix it by giving the component one of those shapes — usually a named
  `interface <Name>Props`. Do not hand-write a table; there is nowhere to put
  one, on purpose.
- A compound component (`Pagination.Root`) needs `propsOf` on its catalog entry
  pointing at the sub-component that actually declares the props.

What the parser reads:

| Column | Where it comes from |
|---|---|
| name, type, required | the type member |
| default | the **destructuring default** (`tone = 'neutral'`), not the type |
| description | the JSDoc or `//` comment immediately above the member |

So: **document props with a comment above them**, put real defaults in the
destructuring pattern rather than inside the body, and spread native attributes
via `React.<X>HTMLAttributes` — `extendsNative()` picks that up and the table
says "plus everything `<button>` takes" instead of pretending they do not exist.

Props starting with `_` are omitted by design.

## Verify

```bash
npm run check          # ids agree, function names exist, cap of 3 respected
npm run dev            # then read /preview/<slug>
```

The checker cannot see whether the table is *populated* or the copy is right.
Open the page.
