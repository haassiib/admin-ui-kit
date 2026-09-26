'use client';

import CodeBlock from '@/components/gallery/CodeBlock';
import Hint from '@/components/gallery/Hint';
import DocSection from '@/components/gallery/DocSection';
import OnThisPage from '@/components/gallery/OnThisPage';
import PropsTable from '@/components/gallery/PropsTable';
import type { Entry } from '@/registry';
import { examplesFor } from '@/registry/example-demos';
import { demoWidth } from '@/registry/groups';
import type { PropDoc } from '@/registry/props';

/**
 * A component's documentation page: the live examples, then the import line,
 * the AI prompt, the full source and the props table.
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
  prompt,
}: {
  entry: Entry;
  importPath: string;
  /** Source for each example, read at build time and keyed by example id. */
  examples: Record<string, string | null>;
  props: PropDoc[];
  /** Native element whose attributes the component also accepts, if any. */
  nativeElement: string | null;
  source: string | null;
  /** Copy-ready AI prompt for rebuilding the design, house style included. */
  prompt?: string;
}) {
  const list = examplesFor(entry.slug);

  // Reading order: see it working, then how to bring it in — the import, the
  // prompt that rebuilds it, the file itself — and the full API last.
  const sections = [
    ...(list.length ? [{ id: 'preview', label: 'Preview' }] : []),
    ...list.map((x) => ({ id: x.id, label: x.title, depth: 1 })),
    { id: 'code', label: 'Code' },
    ...(prompt ? [{ id: 'ai-prompt', label: 'AI prompt' }] : []),
    ...(source ? [{ id: 'source', label: 'Source' }] : []),
    ...(props.length ? [{ id: 'props', label: 'Props' }] : []),
  ];

  return (
    <div className="flex min-w-0 gap-8">
      <div className="flex min-w-0 flex-1 flex-col gap-8">
        <header>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {entry.name}
            <Hint text={entry.blurb} label={`About ${entry.name}`} />
          </h1>
        </header>

        {list.length > 0 && (
          <section id="preview" className="scroll-mt-6">
            <h2 className="panel-title mb-3">Preview</h2>
            <div className="flex flex-col gap-8">
              {list.map(({ id, title, description, Demo }) => (
                <DocSection key={id} id={id} title={title} description={description} code={examples[id]} prompt={prompt} width={demoWidth(entry.name)}>
                  <Demo />
                </DocSection>
              ))}
            </div>
          </section>
        )}

        <section id="code" className="scroll-mt-6">
          <h2 className="panel-title mb-2">Code</h2>
          <CodeBlock code={importPath} language="ts" />
          <p className="mt-1.5 font-mono text-[10px] text-slate-400">{entry.path}</p>
        </section>

        {prompt && (
          <section id="ai-prompt" className="scroll-mt-6">
            <h2 className="panel-title mb-2 flex items-center gap-1.5">
              AI prompt
              <Hint text="Paste this into an AI coding tool to rebuild the design in your own project. It describes what the component looks like and does, so it works whatever your stack is." label="About the AI prompt" />
            </h2>
            <CodeBlock code={prompt} language="text" />
          </section>
        )}

        {source && (
          <section id="source" className="scroll-mt-6">
            <h2 className="panel-title mb-2">Source</h2>
            <CodeBlock code={source} />
          </section>
        )}

        {props.length > 0 && (
          <section id="props" className="scroll-mt-6">
            <h2 className="panel-title mb-3 flex items-center gap-1.5">
              Props
              <Hint text="Parsed from the component's own types at build time, so it cannot drift from the code." label="About the props table" />
            </h2>
            <PropsTable props={props} nativeElement={nativeElement} />
          </section>
        )}
      </div>

      <OnThisPage sections={sections} />
    </div>
  );
}
