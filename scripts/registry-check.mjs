/**
 * Checks the catalog, the barrel, the demo map and the example tables agree.
 *
 * Adding a component touches FIVE files that nothing type-checks against each
 * other: the component, `components/index.ts`, `registry/index.ts`,
 * `registry/demos/map.tsx` and — if it has more than one example —
 * `registry/examples.ts` plus `registry/example-demos.tsx`. Miss one and the
 * failure is silent and shaped like a content bug: a page with no examples, a
 * component absent from the nav, an import line that does not resolve. `tsc`
 * sees none of it, because every one of those files is independently valid.
 *
 * Read-only, no dependencies, no browser. Run it after any registry edit.
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const read = (p) => readFile(path.join(ROOT, p), 'utf8');

/* Component files that are deliberately NOT catalog entries. Anything else
   under components/<category>/ is either a component to document or a mistake,
   and the checker cannot tell which — so it asks. */
const NOT_ENTRIES = new Set([
  'src/components/data/types.ts',   // shared row/point types, no component
  'src/components/data/chartSeries.ts', // series type + colour helper the charts share, no component
]);

/* Folders beside the six categories that are knowingly outside the gallery.
   `ui/` holds AvatarEditor, which is a real component with no catalog entry, no
   barrel export and no demo — it is reachable only by its file path. Listed
   here so the checker stays green on a known gap rather than being ignored
   wholesale; catalogue it as `media('AvatarEditor', …)` and delete this line. */
const UNCATALOGUED_FOLDERS = new Set(['ui']);

const CATEGORIES = ['layout', 'form', 'table', 'data', 'overlay', 'media'];

const problems = [];
const fail = (what, detail) => problems.push([what, detail]);

/* ---------------------------------------------------------------- sources --- */

const catalog = await read('src/registry/index.ts');
const barrel = await read('src/components/index.ts');
const demoMap = await read('src/registry/demos/map.tsx');
// Demos are split across demos/*.tsx by area; index.tsx re-exports the rest.
const demoSrc = (
  await Promise.all(
    (await readdir(path.join(ROOT, 'src/registry/demos')))
      .filter((f) => f.endsWith('.tsx'))
      .map((f) => read(`src/registry/demos/${f}`)),
  )
).join('\n');
const exampleMeta = await read('src/registry/examples.ts');
const exampleDemos = await read('src/registry/example-demos.tsx');
const popovers = await read('scripts/popover-check.mjs');
const groupsSrc = await read('src/registry/groups.ts');
// Prompts are split across prompts/*.ts by batch; index.ts only merges them.
const promptFiles = (await readdir(path.join(ROOT, 'src/registry/prompts')))
  .filter((f) => f.endsWith('.ts') && f !== 'index.ts');
const promptsSrc = (await Promise.all(promptFiles.map((f) => read(`src/registry/prompts/${f}`)))).join('\n');

/**
 * The catalog entries, re-derived from source rather than imported — this file
 * is plain Node with no TypeScript loader, and the builders (`layout('Card', …)`)
 * are a fixed enough shape to read with a regex.
 */
const ENTRIES = [...catalog.matchAll(
  /^\s*(layout|form|table|data|overlay|media)\(\s*'([^']+)'\s*,\s*'(?:[^'\\]|\\.)*'\s*(?:,\s*\{([^}]*)\})?\s*\)/gm,
)].map(([, category, name, opts = '']) => {
  const file = /file:\s*'([^']+)'/.exec(opts)?.[1] ?? `${name}.tsx`;
  return {
    category,
    name,
    file,
    path: `src/components/${category}/${file}`,
    slug: name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(),
  };
});

if (ENTRIES.length === 0) fail('catalog', 'parsed zero entries — the builder shape in registry/index.ts changed, fix this script');

const bySlug = new Map(ENTRIES.map((e) => [e.slug, e]));

/* --------------------------------------------- 1. files <-> catalog entries --- */

const onDisk = new Set();
for (const category of CATEGORIES) {
  const dir = `src/components/${category}`;
  let names;
  try {
    names = await readdir(path.join(ROOT, dir));
  } catch {
    fail('category', `${dir} does not exist but the catalog uses it`);
    continue;
  }
  for (const n of names) {
    if (!/\.tsx?$/.test(n)) continue;
    const rel = `${dir}/${n}`;
    if (NOT_ENTRIES.has(rel)) continue;
    onDisk.add(rel);
  }
}

const catalogued = new Set(ENTRIES.map((e) => e.path));
for (const rel of onDisk) {
  if (!catalogued.has(rel)) fail('orphan file', `${rel} has no catalog entry — add one in src/registry/index.ts, or list it in NOT_ENTRIES here`);
}
for (const e of ENTRIES) {
  if (!onDisk.has(e.path)) fail('missing file', `catalog entry ${e.name} points at ${e.path}, which is not there`);
}

/* Component files outside the six categories are invisible to the gallery. */
try {
  for (const n of await readdir(path.join(ROOT, 'src/components'))) {
    if (/\.tsx?$/.test(n) && n !== 'index.ts') fail('stray', `src/components/${n} sits beside the category folders — move it into one`);
    if (!/\./.test(n) && ![...CATEGORIES, 'gallery'].includes(n) && !UNCATALOGUED_FOLDERS.has(n)) fail('stray folder', `src/components/${n}/ is not a category and not gallery/ — its contents are unreachable from the gallery`);
  }
} catch {}

/* ------------------------------------------------------- 2. barrel exports --- */

/**
 * Every VALUE the barrel exports.
 *
 * `export type { … }` lines are skipped deliberately: exporting only a
 * component's props type reads, at a glance, like the component is exported —
 * it is the exact mistake this check exists to catch, and matching on the
 * module path instead of the name cannot see it.
 */
const barrelValues = new Set();
for (const [, clause] of barrel.matchAll(/^export\s+(?!type\b)\{([^}]*)\}/gm)) {
  for (const spec of clause.split(',')) {
    const name = spec.trim().replace(/^type\s+/, '').split(/\s+as\s+/).pop()?.trim();
    if (name) barrelValues.add(name);
  }
}

/* Entries that export no value under their own name — a module of helpers
   rather than a component. The barrel still has to re-export the module. */
const VALUE_EXEMPT = new Set(['chartTheme']);

for (const e of ENTRIES) {
  const module = `./${e.category}/${e.file.replace(/\.tsx?$/, '')}`;
  if (!barrel.includes(`'${module}'`)) {
    fail('barrel', `${e.name} is in the catalog but nothing re-exports ${module} from src/components/index.ts`);
  } else if (!VALUE_EXEMPT.has(e.name) && !barrelValues.has(e.name)) {
    fail('barrel', `src/components/index.ts exports something from ${module} but not ${e.name} itself — check for a type-only export line`);
  }
}

/* --------------------------------------------------------- 3. demo wiring --- */

const mapped = new Set([...demoMap.matchAll(/'([a-z0-9-]+)':\s*D\.(\w+)/g)].map(([, slug]) => slug));

/* Entries with nothing to show live: `ThemeScript` renders an inline <script>
   and `chartTheme` is a hook. Their pages are props and source only. */
const NO_DEMO = new Set(['theme-script', 'chart-theme']);

for (const e of ENTRIES) {
  if (NO_DEMO.has(e.slug)) {
    if (mapped.has(e.slug)) fail('demo map', `'${e.slug}' is in NO_DEMO here but also wired into DEMOS — drop it from one`);
    continue;
  }
  if (!mapped.has(e.slug)) fail('demo map', `'${e.slug}' is missing from DEMOS in src/registry/demos/map.tsx — its page renders no live example`);
  if (!demoSrc.includes(`function ${e.name}Demo(`)) fail('demo', `export function ${e.name}Demo() is missing from src/registry/demos/index.tsx`);
}
for (const slug of mapped) {
  if (!bySlug.has(slug)) fail('demo map', `DEMOS has '${slug}', which is not a catalog slug`);
}

/* ------------------------------------------------------ 4. named examples --- */

const pascal = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** slug -> ids, from EXAMPLE_META. */
const metaIds = new Map(
  [...exampleMeta.matchAll(/'([a-z0-9-]+)':\s*\[([\s\S]*?)\n\s*\],/g)].map(([, slug, body]) => [
    slug,
    [...body.matchAll(/\{\s*id:\s*'([^']+)'/g)].map(([, id]) => id),
  ]),
);
/** slug -> ids, from EXAMPLE_DEMOS. */
const demoIds = new Map(
  [...exampleDemos.matchAll(/'([a-z0-9-]+)':\s*\{([^}]*)\}/g)].map(([, slug, body]) => [
    slug,
    [...body.matchAll(/'([^']+)':\s*(\w+)/g)].map(([, id]) => id),
  ]),
);

for (const [slug, ids] of metaIds) {
  const entry = bySlug.get(slug);
  if (!entry) { fail('examples', `EXAMPLE_META has '${slug}', which is not a catalog slug`); continue; }
  if (ids.length > 3) fail('examples', `${entry.name} declares ${ids.length} examples — the cap is 3; fold prop variants into one example with a control`);
  if (new Set(ids).size !== ids.length) fail('examples', `${entry.name} repeats an example id — ids are anchors and must be unique`);

  const wired = demoIds.get(slug);
  if (!wired) { fail('examples', `EXAMPLE_META lists '${slug}' but EXAMPLE_DEMOS does not — every example falls back to the single demo, silently`); continue; }
  for (const id of ids) {
    if (!wired.includes(id)) fail('examples', `${entry.name} example '${id}' has metadata but no component in EXAMPLE_DEMOS`);
    /* The preview page DERIVES the source-extraction name from name + id, so a
       function called anything else shows an empty code panel. */
    const fn = entry.name + id.split('-').map(pascal).join('');
    if (!exampleDemos.includes(`function ${fn}(`)) fail('example source', `${entry.name}/'${id}' needs a function named exactly ${fn} in example-demos.tsx — the code panel is found by that name, not by the map key`);
  }
  for (const id of wired) {
    if (!ids.includes(id)) fail('examples', `${entry.name} wires example '${id}' with no entry in EXAMPLE_META — it will not render`);
  }
}
for (const slug of demoIds.keys()) {
  if (!metaIds.has(slug)) fail('examples', `EXAMPLE_DEMOS has '${slug}' with no EXAMPLE_META — none of its examples render`);
}

/* -------------------------------------------------- 5. popover check cases --- */

for (const [, slug] of popovers.matchAll(/^\s*\['([a-z0-9-]+)',\s*'(?:click|hover)'/gm)) {
  if (!bySlug.has(slug)) fail('popover check', `scripts/popover-check.mjs drives '${slug}', which is not a catalog slug`);
}

/* ------------------------------------------------------- 6. menu groups --- */

// Every component in exactly one menu group: in none and it is missing from
// the menu and the browse page; in two and it is listed twice.
const grouped = new Map();
for (const [, label, list] of groupsSrc.matchAll(/group\(\s*'([^']+)'\s*,\s*\[([^\]]*)\]/g)) {
  for (const [, name] of list.matchAll(/'([^']+)'/g)) {
    if (grouped.has(name)) fail('menu groups', `${name} is in both '${grouped.get(name)}' and '${label}'`);
    grouped.set(name, label);
  }
}
if (grouped.size === 0) fail('menu groups', 'parsed zero groups — the group(…) shape in registry/groups.ts changed, fix this script');
const names = new Set(ENTRIES.map((e) => e.name));
for (const e of ENTRIES) if (!grouped.has(e.name)) fail('menu groups', `${e.name} is in no group in src/registry/groups.ts — it will not appear in the menu`);
for (const name of grouped.keys()) if (!names.has(name)) fail('menu groups', `groups.ts lists '${name}', which is not a catalog entry`);

/* ---------------------------------------------------------- 7. AI prompts --- */

// Every component has one. A prompt keyed by a slug that no longer exists (a
// rename) is silently never shown — the page just loses its AI prompt section.
const prompted = new Set();
for (const [, slug] of promptsSrc.matchAll(/^\s*'?([a-z0-9-]+)'?:\s*`/gm)) {
  if (prompted.has(slug)) fail('prompts', `'${slug}' has two prompts in src/registry/prompts/`);
  prompted.add(slug);
  if (!bySlug.has(slug)) fail('prompts', `src/registry/prompts/ has a prompt for '${slug}', which is not a catalog slug`);
}
for (const e of ENTRIES) if (!prompted.has(e.slug)) fail('prompts', `${e.name} has no AI prompt in src/registry/prompts/`);

/* --------------------------------------------------------------- report --- */

if (problems.length === 0) {
  console.log(`registry OK — ${ENTRIES.length} components, ${[...metaIds.values()].flat().length} named examples`);
  process.exit(0);
}
const width = Math.max(...problems.map(([w]) => w.length));
for (const [what, detail] of problems) console.error(`${what.padEnd(width)}  ${detail}`);
console.error(`\n${problems.length} problem${problems.length === 1 ? '' : 's'}`);
process.exit(1);
