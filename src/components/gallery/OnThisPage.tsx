'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * The right-hand section nav.
 *
 * The active link is driven by an IntersectionObserver rather than by scroll
 * position arithmetic, because the scroll container here is `<main>` and not the
 * window — offset maths against the wrong element is the usual reason these
 * highlight the wrong entry.
 *
 * `rootMargin` pulls the detection band up to the top third of the viewport, so
 * a heading counts as current once it reaches reading position rather than when
 * it is about to leave.
 */
export default function OnThisPage({
  sections,
}: {
  sections: { id: string; label: string; depth?: number }[];
}) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const targets = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => !!el);
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { root: document.querySelector('main'), rootMargin: '0px 0px -66% 0px', threshold: 0 },
    );

    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [sections]);

  if (sections.length < 2) return null;

  return (
    <nav aria-label="On this page" className="sticky top-0 hidden w-52 shrink-0 self-start py-1 xl:block">
      <p className="panel-title mb-2">On this page</p>
      <ul className="space-y-0.5 border-l border-slate-200 dark:border-slate-700">
        {sections.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              onClick={() => setActive(s.id)}
              className={cn(
                '-ml-px block border-l py-1 text-[11px] leading-snug transition-colors',
                s.depth ? 'pl-5' : 'pl-3',
                active === s.id
                  ? 'border-indigo-500 font-semibold text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
              )}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
