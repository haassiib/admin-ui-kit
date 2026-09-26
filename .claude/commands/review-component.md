---
description: Audit one component (or the current diff) against this kit's conventions — copyability, dark mode, density, popover safety, docs.
argument-hint: [ComponentName | slug | --diff]
allowed-tools: Bash, Read, Grep, Glob
---

Audit **$ARGUMENTS** against the kit's conventions. With `--diff` or no
argument, audit the components touched by `git diff` (staged and unstaged).

Read `.claude/skills/ui-conventions/SKILL.md` first. Then check, in this order —
report only what is actually wrong, with a `file:line` for each:

**Copyability** (the thing this library is for — one file someone pastes in)
- Imports limited to `react`, `lucide-react`, declared optional peers, `@/lib/*`,
  `@/contexts/*` and sibling components. Any `@/registry/*` or
  `@/components/gallery/*` import inverts the dependency and is a bug.
- A new runtime dependency must be in `package.json` — as an optional peer if
  only one or two components need it.
- `'use client'` present iff there is state, a ref or a handler.

**Styling**
- Every colour utility has its `dark:` pair.
- Tones are the semantic five, used the way the rest of the kit uses them;
  `danger` reserved for irreversible actions.
- Type sizes from the kit's scale, not arbitrary values.
- Variants as a `const … as const` map with the prop typed `keyof typeof`, not a
  chain of ternaries.
- `cn()` for class joins — and no reliance on tailwind-merge behaviour, since
  `cn` does not resolve conflicts.
- `leading-none` on any inline-flex element that can land in a table cell.

**Structure**
- No `overflow-auto` or `overflow-hidden` added around anything that opens a
  popover; no nested scroller competing with `<main>`.
- Popovers at `z-50`, portalled overlays at `z-200`, table chrome at 1–20.
- Floating surfaces use `panel panel-solid`, not frosted `.panel`.

**Accessibility**
- Real `<button>`, visible `focus-visible` ring, labelled controls.
- Popover trigger has `aria-expanded`/`aria-controls`; Escape and click-outside
  close; focus returns to the trigger.
- `aria-hidden` on icons beside their own label.

**Docs**
- The props type is a shape `src/registry/props.ts` can parse, props carry
  comments above them, and defaults are in the destructuring pattern.
- Open `/preview/<slug>` if the dev server is up and confirm the props table is
  populated — an empty one means the parser gave up.

**Comments** — this codebase documents *why*, especially where the obvious code
was wrong. A non-obvious decision with no comment is a finding.

Finish by running `npm run check`. State clearly whether
`npm run check:popovers` is warranted for these changes.
