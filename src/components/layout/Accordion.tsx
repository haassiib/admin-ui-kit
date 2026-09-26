'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export type AccordionItem = {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
  /** An icon component (a lucide icon, say), sized by the accordion. */
  icon?: React.ComponentType<{ className?: string }>;
};

export interface AccordionProps {
  items: AccordionItem[];
  /** Allow several sections open at once. Off, opening one closes the other. */
  multiple?: boolean;
  /** Controlled: the ids of the open sections. */
  value?: string[];
  /** Uncontrolled initial open ids. */
  defaultValue?: string[];
  onChange?: (openIds: string[]) => void;
  /** Heading level wrapping each header button, to fit the page outline. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

/**
 * Stacked sections that expand in place.
 *
 * `value` is always an array of open ids, in single mode too. One shape for
 * both modes means flipping `multiple` never changes the type a caller stores,
 * and "all closed" is simply `[]` rather than a nullable string.
 *
 * Built to the WAI-ARIA accordion pattern: each header is a `<button>` inside a
 * real heading, with `aria-expanded` and `aria-controls` pointing at a
 * `role="region"` labelled by it. Every header stays in the Tab order (unlike
 * Tabs' roving tabindex — an accordion's headers are independent controls),
 * and Up/Down/Home/End move between them as a shortcut, skipping disabled
 * ones.
 *
 * No `overflow-hidden` on the outer border box. Its rounded corners come from
 * rounding the first and last header instead, because clipping the shell would
 * also clip any dropdown opened from inside a section's content.
 */
export default function Accordion({
  items,
  multiple = false,
  value,
  defaultValue = [],
  onChange,
  headingLevel = 3,
  className,
}: AccordionProps) {
  const base = useId();
  const [internal, setInternal] = useState<string[]>(defaultValue);
  const open = value ?? internal;
  const headers = useRef<Record<string, HTMLButtonElement | null>>({});
  const Heading = `h${headingLevel}` as const;

  const toggle = (id: string) => {
    const isOpen = open.includes(id);
    const next = isOpen ? open.filter((x) => x !== id) : multiple ? [...open, id] : [id];
    if (value === undefined) setInternal(next);
    onChange?.(next);
  };

  const onKey = (e: React.KeyboardEvent, id: string) => {
    const usable = items.filter((it) => !it.disabled);
    const i = usable.findIndex((it) => it.id === id);
    let target: AccordionItem | undefined;
    if (e.key === 'ArrowDown') target = usable[(i + 1) % usable.length];
    else if (e.key === 'ArrowUp') target = usable[(i - 1 + usable.length) % usable.length];
    else if (e.key === 'Home') target = usable[0];
    else if (e.key === 'End') target = usable[usable.length - 1];
    if (!target) return;
    e.preventDefault();
    headers.current[target.id]?.focus();
  };

  return (
    <div className={cn('divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-700 dark:border-slate-700', className)}>
      {items.map((it, idx) => {
        const isOpen = open.includes(it.id);
        const headerId = `${base}-h-${it.id}`;
        const panelId = `${base}-p-${it.id}`;
        const Icon = it.icon;
        const last = idx === items.length - 1;
        return (
          <div key={it.id}>
            <Heading className="m-0">
              <button
                ref={(el) => {
                  headers.current[it.id] = el;
                }}
                type="button"
                id={headerId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                disabled={it.disabled}
                onClick={() => toggle(it.id)}
                onKeyDown={(e) => onKey(e, it.id)}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold transition-colors',
                  'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/60',
                  'focus-visible:relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400',
                  'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent',
                  idx === 0 && 'rounded-t-lg',
                  last && !isOpen && 'rounded-b-lg',
                )}
              >
                {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden />}
                <span className="min-w-0 flex-1">{it.title}</span>
                <ChevronRight
                  className={cn(
                    'h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 dark:text-slate-500',
                    isOpen && 'rotate-90',
                  )}
                  aria-hidden
                />
              </button>
            </Heading>
            <Panel id={panelId} labelledBy={headerId} open={isOpen}>
              {it.content}
            </Panel>
          </div>
        );
      })}
    </div>
  );
}

/**
 * One collapsible region. Same technique as Fieldset: a `grid-template-rows`
 * 0fr↔1fr transition needs no height measuring, `inert` keeps a closed
 * section's controls out of the Tab order, and the clip is on only while
 * closed or mid-expand so an open section never cuts off a popover.
 */
function Panel({ id, labelledBy, open, children }: { id: string; labelledBy: string; open: boolean; children: React.ReactNode }) {
  const [opening, setOpening] = useState(false);
  const [prev, setPrev] = useState(open);
  if (prev !== open) {
    setPrev(open);
    setOpening(open);
  }
  useEffect(() => {
    if (!opening) return;
    const t = setTimeout(() => setOpening(false), 250);
    return () => clearTimeout(t);
  }, [opening]);

  return (
    <div
      id={id}
      role="region"
      aria-labelledby={labelledBy}
      inert={!open}
      className={cn(
        'grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none',
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
      )}
    >
      <div className={cn('min-h-0', (!open || opening) && 'overflow-hidden')}>
        <div className="border-t border-slate-100 px-3 py-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
          {children}
        </div>
      </div>
    </div>
  );
}
