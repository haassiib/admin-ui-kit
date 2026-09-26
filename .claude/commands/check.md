---
description: Run the verification gate — typecheck plus registry consistency — and fix whatever it reports.
allowed-tools: Bash, Read, Edit, Glob, Grep
---

Run the gate and get it green:

```bash
npm run check
```

That is `tsc --noEmit` followed by `node scripts/registry-check.mjs`, which
checks the catalog, the barrel, the demo map and the example tables agree — five
files that nothing type-checks against each other.

For each problem it reports, fix the **cause**, not the symptom:

- `orphan file` — a component with no catalog entry. Add the entry (and the
  barrel export, and the demo) per `.claude/skills/add-component/SKILL.md`. Only
  add it to `NOT_ENTRIES` in the script if it is genuinely not a component.
- `barrel` — add the missing export to `src/components/index.ts`. If the message
  says "but not `<Name>` itself", there is a type-only export line there
  masquerading as one.
- `demo map` / `demo` — wire `'<slug>': D.<Name>Demo` and write the demo.
- `examples` / `example source` — the two example tables disagree, or a function
  is not named `<Name><PascalCasedId>`, which is how the code panel finds its
  source. See `.claude/skills/component-docs/SKILL.md`.
- `stray` / `stray folder` — files outside the six category folders are
  unreachable from the gallery.

Then say plainly what was wrong and what you changed. If you touched a dropdown,
a portal, `overflow`, `z-index` or `.panel`, say so and recommend
`/popovers` — the gate cannot see either of those failures.

$ARGUMENTS
