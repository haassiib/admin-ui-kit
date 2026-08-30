import { notFound } from 'next/navigation';

import DocPage from '@/components/gallery/DocPage';
import { BY_SLUG, ENTRIES } from '@/registry';
import { EXAMPLE_META } from '@/registry/examples';
import { extendsNative, parseProps } from '@/registry/props';
import { readComponentSource, readExampleSource } from '@/registry/source';

const pascal = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Pre-render every entry — the catalog is static and small. */
export function generateStaticParams() {
  return ENTRIES.map((e) => ({ slug: e.slug }));
}

/**
 * Everything below is read and parsed at BUILD time. These pages are statically
 * generated, so the filesystem work happens once during `next build` and the
 * browser only ever receives the resulting strings.
 */
export default async function PreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = BY_SLUG.get(slug);
  if (!entry) notFound();

  const source = await readComponentSource(entry.path);

  // Example function names are DERIVED from the component name and the example
  // id — `splitter` + `min-max` -> `SplitterMinMax` — rather than read off
  // `Demo.name`. Two reasons: `examples.tsx` is a client module, so a server
  // component sees its exports as references rather than as the functions
  // themselves; and production minification renames functions anyway. A naming
  // convention is the only handle that survives both.
  const declared = EXAMPLE_META[slug];
  const ids = declared?.map((x) => x.id) ?? ['basic'];
  const fnNames = declared
    ? declared.map((x) => entry.name + x.id.split('-').map(pascal).join(''))
    : [`${entry.name}Demo`];

  const sources = await Promise.all(
    fnNames.map((fn) => readExampleSource(fn, entry.name)),
  );
  const examples = Object.fromEntries(ids.map((id, i) => [id, sources[i]]));

  const folder = entry.path.split('/').slice(-2)[0];
  const importPath =
    `import ${entry.name} from '@/components/${folder}/${entry.name}';`;

  return (
    <DocPage
      entry={entry}
      importPath={importPath}
      examples={examples}
      props={source ? parseProps(source) : []}
      nativeElement={source ? extendsNative(source) : null}
      source={source}
    />
  );
}
