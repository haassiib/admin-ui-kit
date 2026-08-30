'use client';

import { Suspense, useState } from 'react';
import { Code2 } from 'lucide-react';

import CodeBlock from '@/components/gallery/CodeBlock';

/**
 * One documented example: heading, a sentence on what it shows, the live thing,
 * and its source behind a toggle.
 *
 * The code is COLLAPSED by default. A page of eleven examples with every snippet
 * expanded is a wall of source you have to scroll past to reach the next demo —
 * the running component is the thing worth seeing first.
 */
export default function DocSection({
  id,
  title,
  description,
  code,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  code?: string | null;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section id={id} className="scroll-mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {/* The heading is the anchor target, and linkable — an eleven-section
              page is one people send each other links into. */}
          <a href={`#${id}`} className="hover:underline">
            {title}
          </a>
        </h3>
        {code && (
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="btn-ghost"
          >
            <Code2 className="h-3.5 w-3.5" />
            {open ? 'Hide code' : 'Show code'}
          </button>
        )}
      </div>

      {description && (
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          {description}
        </p>
      )}

      {/* `data-demo` is a test hook: popover-check.mjs needs to find the live
          example without matching on styling classes, which move. */}
      <div data-demo className="panel panel-solid mt-3 p-4">
        <Suspense fallback={<p className="note">Loading…</p>}>{children}</Suspense>
      </div>

      {open && code && (
        <div className="mt-2">
          <CodeBlock code={code} />
        </div>
      )}
    </section>
  );
}
