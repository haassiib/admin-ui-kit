'use client';

/**
 * Every component on one page, with search and category filters.
 *
 * Filtering is client-side over the whole catalog — fifty entries, so anything
 * cleverer would be machinery without a payoff. The one filter that is not just
 * narrowing is "Merged", which shows only the components that came out of
 * reconciling two diverged copies; those are the ones whose props a migrating
 * call site most needs to check.
 */

import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';

import Stage from '@/components/gallery/Stage';
import { CATEGORY_LABEL, CATEGORY_ORDER, ENTRIES } from '@/registry';
import type { Category, Entry } from '@/registry';
import { DEMOS } from '@/registry/demos/map';

const CATEGORIES = CATEGORY_ORDER;

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? 'rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-semibold text-white'
          : 'rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
      }
    >
      {children}
    </button>
  );
}

export default function GalleryShell() {
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ENTRIES.filter((e) => {
      if (categories.length && !categories.includes(e.category)) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.blurb.toLowerCase().includes(q) ||
        e.path.toLowerCase().includes(q)
      );
    });
  }, [query, categories]);

  const grouped = useMemo(
    () =>
      CATEGORIES.map((c) => ({ category: c, entries: visible.filter((e) => e.category === c) })).filter(
        (g) => g.entries.length > 0,
      ),
    [visible],
  );

  const demoCount = useMemo(() => ENTRIES.filter((e) => DEMOS[e.slug]).length, []);

  return (
    <div className="flex flex-col">
      <header className="mb-5">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          Components
        </h1>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          Every component, rendered live. Open one for its examples, props and source — or search
          and filter here.
        </p>
      </header>

      <div className="panel panel-solid mb-6 flex flex-wrap items-center gap-x-4 gap-y-3 p-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, description or path…"
            className="field-input pl-8"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {CATEGORIES.map((c) => (
            <Pill
              key={c}
              active={categories.includes(c)}
              onClick={() =>
                setCategories(
                  categories.includes(c) ? categories.filter((v) => v !== c) : [...categories, c],
                )
              }
            >
              {CATEGORY_LABEL[c]}
            </Pill>
          ))}
        </div>


        {(query || categories.length) && (
          <button
            onClick={() => {
              setQuery('');
              setCategories([]);
            }}
            className="btn-ghost"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}

        <span className="ml-auto text-[11px] text-slate-500 dark:text-slate-400">
          showing {visible.length} of {ENTRIES.length}
        </span>
      </div>


      {grouped.length === 0 ? (
        <p className="note">Nothing matches those filters.</p>
      ) : (
        grouped.map(({ category, entries }) => (
          <section key={category} className="mb-10">
            <h2 className="panel-title mb-3 flex items-center gap-2">
              {CATEGORY_LABEL[category]}
              <span className="font-normal normal-case tracking-normal text-slate-400">
                {entries.length}
              </span>
            </h2>
            <div className="flex flex-col gap-4">
              {entries.map((entry: Entry) => (
                <Stage key={entry.slug} entry={entry} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
