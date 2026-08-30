'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check, Copy } from 'lucide-react';

import CodeBlock from '@/components/gallery/CodeBlock';
import Tabs from '@/components/layout/Tabs';
import type { Entry } from '@/registry';
import { DEMOS } from '@/registry/demos/map';

function CopyPath({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(path).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        });
      }}
      title="Copy path"
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px] text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      {path}
    </button>
  );
}

/**
 * The frame every demo renders inside.
 *
 * NO `overflow-hidden` on this section, deliberately. Only four components
 * render through a portal; every other dropdown, calendar and filter panel
 * positions itself ABSOLUTELY inside its trigger, and a clipping ancestor paints
 * exactly those away — the menu opens and is invisible. The rounded corners are
 * handled by rounding the header strip instead. If a demo genuinely spills, clip
 * that demo, never this frame.
 */
export default function Stage({
  entry,
  linked = true,
  fill = false,
  usage,
  source,
}: {
  entry: Entry;
  linked?: boolean;
  /** Grow to fill the content area. For the single-component page only. */
  fill?: boolean;
  /** Demo source, read at build time. Absent on the browse-all page. */
  usage?: string | null;
  /** Component source, read at build time. */
  source?: string | null;
}) {
  const Demo = DEMOS[entry.slug];
  const hasCode = !!(usage || source);

  const preview = Demo ? (
    /* Suspense is required: some demos drive components that call
       `useSearchParams()`, which forces a client bailout the prerender rejects
       unless a boundary catches it. Wrapping every demo means adding such a
       component later is not a build break. */
    <Suspense fallback={<p className="note">Loading…</p>}>
      <Demo />
    </Suspense>
  ) : (
    <p className="note">
      No standalone demo — this one is a hook or a script tag. Read it at the path above.
    </p>
  );

  return (
    <section
      id={entry.slug}
      className={`panel panel-solid scroll-mt-24${fill ? ' flex min-h-0 flex-1 flex-col' : ''}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 rounded-t-[1rem] border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{entry.name}</h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {entry.blurb}
          </p>
          <div className="mt-2">
            <CopyPath path={entry.path} />
          </div>
        </div>
        {linked && (
          <Link href={`/preview/${entry.slug}`} className="btn-ghost shrink-0" title="Open on its own page">
            Open <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </header>

      <div className={`p-4${fill ? ' min-h-0 flex-1' : ''}`}>
        {hasCode ? (
          <Tabs
            tabs={[
              { id: 'preview', label: 'Preview' },
              { id: 'usage', label: 'Usage', disabled: !usage },
              { id: 'source', label: 'Source', disabled: !source },
            ]}
          >
            {(tab) =>
              tab === 'preview' ? (
                preview
              ) : tab === 'usage' && usage ? (
                <CodeBlock code={usage} />
              ) : source ? (
                <CodeBlock code={source} />
              ) : null
            }
          </Tabs>
        ) : (
          preview
        )}
      </div>
    </section>
  );
}
