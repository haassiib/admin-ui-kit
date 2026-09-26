'use client';

import Hint from '@/components/gallery/Hint';
import PreviewCard from '@/components/gallery/PreviewCard';
import type { DemoWidth } from '@/registry/groups';

/**
 * One documented example: heading (with what it shows behind an ⓘ), then the
 * live thing in a `PreviewCard`, whose code toggle opens the source inside the
 * same frame.
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
  prompt,
  width,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  code?: string | null;
  /** The component's AI prompt; adds a copy button beside the code controls. */
  prompt?: string | null;
  /** How wide the demo sits in its card. */
  width?: DemoWidth;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
        {/* The heading is the anchor target, and linkable — an eleven-section
            page is one people send each other links into. */}
        <a href={`#${id}`} className="hover:underline">
          {title}
        </a>
        <Hint text={description} label={`About ${title}`} />
      </h3>
      <PreviewCard code={code} prompt={prompt} width={width}>{children}</PreviewCard>
    </section>
  );
}
