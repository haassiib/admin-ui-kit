'use client';

import CodeBlock from '@/components/gallery/CodeBlock';
import DocSection from '@/components/gallery/DocSection';
import OnThisPage from '@/components/gallery/OnThisPage';
import PropsTable from '@/components/gallery/PropsTable';
import type { Entry } from '@/registry';
import { examplesFor } from '@/registry/example-demos';
import type { PropDoc } from '@/registry/props';

/**
 * A component's documentation page: import line, worked examples, API table,
 * full source.
 *
 * Examples come from the registry rather than from one catch-all demo, so a
 * component with several modes gets a section per mode with its own anchor and
 * its own snippet — which is the difference between a gallery and documentation.
 */
export default function DocPage({
  entry,
  importPath,
  examples,
  props,
  nativeElement,
  source,
}: {
  entry: Entry;
  importPath: string;
  /** Source for each example, read at build time and keyed by example id. */
  examples: Record<string, string | null>;
  props: PropDoc[];
  /** Native element whose attributes the component also accepts, if any. */
  nativeElement: string | null;
  source: string | null;
}) {
  const list = examplesFor(entry.slug);

  const sections = [
    { id: 'import', label: 'Import' },
    ...(list.length ? [{ id: 'examples', label: 'Examples' }] : []),
    ...list.map((x) => ({ id: x.id, label: x.title, depth: 1 })),
    ...(props.length ? [{ id: 'props', label: 'Props' }] : []),
    ...(source ? [{ id: 'source', label: 'Source' }] : []),
  ];

  return (
    <div className="flex min-w-0 gap-8">
      <div className="flex min-w-0 flex-1 flex-col gap-8">
        <header>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {entry.name}
          </h1>
          <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {entry.blurb}
          </p>
        </header>

        <section id="import" className="scroll-mt-6">
          <h2 className="panel-title mb-2">Import</h2>
          <CodeBlock code={importPath} language="ts" />
          <p className="mt-1.5 font-mono text-[10px] text-slate-400">{entry.path}</p>
        </section>

        {list.length > 0 && (
          <section id="examples" className="scroll-mt-6">
            <h2 className="panel-title mb-3">Examples</h2>
            <div className="flex flex-col gap-8">
              {list.map(({ id, title, description, Demo }) => (
                <DocSection key={id} id={id} title={title} description={description} code={examples[id]}>
                  <Demo />
                </DocSection>
              ))}
            </div>
          </section>
        )}

        {props.length > 0 && (
          <section id="props" className="scroll-mt-6">
            <h2 className="panel-title mb-1">Props</h2>
            <p className="mb-3 text-[11px] text-slate-500 dark:text-slate-400">
              Parsed from the component&apos;s own types at build time, so it cannot drift from the code.
            </p>
            <PropsTable props={props} nativeElement={nativeElement} />
          </section>
        )}

        {source && (
          <section id="source" className="scroll-mt-6">
            <h2 className="panel-title mb-2">Source</h2>
            <CodeBlock code={source} />
          </section>
        )}
      </div>

      <OnThisPage sections={sections} />
    </div>
  );
}
