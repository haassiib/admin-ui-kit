'use client';

import Link from 'next/link';
import { Boxes, Layers, MonitorPlay, Package } from 'lucide-react';

import Card from '@/components/layout/Card';
import Badge from '@/components/data/Badge';
import KpiTile from '@/components/data/KpiTile';
import { CATEGORY_LABEL, CATEGORY_ORDER, ENTRIES } from '@/registry';
import { DEMOS } from '@/registry/demos/map';

/**
 * The landing panel, built out of the catalogued components themselves — so the
 * page that summarises the library is also a working sample of it.
 */
export default function Overview() {
  const demoCount = ENTRIES.filter((e) => DEMOS[e.slug]).length;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          Component Library
        </h1>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          {ENTRIES.length} React components for admin and dashboard interfaces — Next.js 16, React
          19, Tailwind 4, no runtime dependencies beyond lucide icons. Pick one from the sidebar to
          see it running, copy its usage snippet, or read its full source. Or{' '}
          <Link href="/all" className="underline decoration-dotted underline-offset-2">
            browse them all on one page
          </Link>
          .
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile title="Components" value={String(ENTRIES.length)} icon={<Boxes className="h-4 w-4" />} tone="indigo" />
        <KpiTile title="Live demos" value={String(demoCount)} icon={<MonitorPlay className="h-4 w-4" />} tone="emerald" />
        <KpiTile title="Categories" value={String(CATEGORY_ORDER.length)} icon={<Layers className="h-4 w-4" />} tone="violet" />
        <KpiTile title="Runtime deps" value="1" icon={<Package className="h-4 w-4" />} tone="amber" subtitle="lucide-react" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {CATEGORY_ORDER.map((category) => {
          const inCategory = ENTRIES.filter((e) => e.category === category);
          return (
            <Card
              key={category}
              title={CATEGORY_LABEL[category]}
              actions={<Badge>{inCategory.length}</Badge>}
              solid
            >
              <ul className="flex flex-wrap gap-1.5">
                {inCategory.map((e) => (
                  <li key={e.slug}>
                    <Link
                      href={`/preview/${e.slug}`}
                      className="inline-block rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:bg-indigo-100 hover:text-indigo-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-300"
                    >
                      {e.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      <Card title="Using a component" solid>
        <ol className="ml-4 list-decimal space-y-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          <li>Open it from the sidebar and check the <strong>Usage</strong> tab for a working snippet.</li>
          <li>Copy the file from the path in its header into your own <code>components/</code>.</li>
          <li>
            Take whatever it imports from <code>src/lib/</code> — those are small, pure and have no
            dependencies of their own.
          </li>
          <li>
            If it calls <code>useTheme</code> or <code>useSidebar</code>, copy <code>src/contexts/</code> too.
          </li>
        </ol>
      </Card>
    </div>
  );
}
