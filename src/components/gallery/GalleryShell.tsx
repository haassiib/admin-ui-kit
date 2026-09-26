'use client';

/**
 * Every component on one page, as a gallery of live thumbnails under the same
 * groups as the menu. Each tile opens the component's own page; finding one by
 * name is the job of the sidebar and the header search.
 *
 * `grid-flow-dense` lets a 1x tile drop into the gap a wider one left at the
 * end of a row, so a group packs without holes instead of in reading order.
 */

import Tile from '@/components/gallery/Tile';
import { GROUPED_ENTRIES } from '@/registry';
import type { Entry } from '@/registry';
import { tileSize } from '@/registry/groups';

export default function GalleryShell() {
  return (
    <div className="flex flex-col">
      {GROUPED_ENTRIES.map(({ label, entries }) => (
        <section key={label} className="mb-10">
          <h2 className="panel-title mb-3 flex items-center gap-2">
            {label}
            <span className="font-normal normal-case tracking-normal text-slate-400">
              {entries.length}
            </span>
          </h2>
          <div className="grid grid-flow-dense auto-rows-[20rem] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {entries.map((entry: Entry) => (
              <Tile key={entry.slug} entry={entry} size={tileSize(entry.name)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
