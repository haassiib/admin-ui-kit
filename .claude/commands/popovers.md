---
description: Drive every popover in real Chrome to check none is clipped or painted over.
allowed-tools: Bash, Read, Edit, Grep
---

Run the browser check. It needs the dev server up and real Chrome at
`/Applications/Google Chrome.app`.

1. Check whether :3020 is already serving: `curl -sf -o /dev/null http://localhost:3020 && echo up`.
   If not, start `npm run dev` in the background and wait for it to answer.
2. `npm run check:popovers`

It opens each of the sixteen dropdown-bearing demos and measures two
independent failures:

- **CLIPPED** — an `overflow` ancestor cut the popover's box away. It intersects
  every clipping ancestor's rect with the popover's to measure what survives.
- **COVERED** — the popover paints *under* later content, usually because an
  ancestor made a stacking context (`backdrop-filter` is enough) and trapped its
  `z-index`. It hit-tests five points with `elementFromPoint`.

Neither is visible to `tsc` or `next build`; both stay green throughout, which
is the whole reason this script exists.

For a failure, read `.claude/skills/ui-conventions/SKILL.md` — the fix is
usually one of: drop an `overflow-*` from an ancestor, swap a frosted `.panel`
for `.panel panel-solid`, move the popover to the z-50 band, or portal it the
way `Tooltip` does.

`NO TRIGGER` is a *test* problem, not a component one: the case needs an
explicit trigger selector in `CASES`, because the first control in that demo is
not the one that opens the popover.

If you started the dev server, stop it when you are done.

$ARGUMENTS
