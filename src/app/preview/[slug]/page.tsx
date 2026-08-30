import { notFound } from 'next/navigation';

import Stage from '@/components/gallery/Stage';
import { BY_SLUG, ENTRIES } from '@/registry';
import { readComponentSource, readDemoSource } from '@/registry/source';

/** Pre-render every entry — the catalog is static and small. */
export function generateStaticParams() {
  return ENTRIES.map((e) => ({ slug: e.slug }));
}

export default async function PreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = BY_SLUG.get(slug);
  if (!entry) notFound();

  // Read at BUILD time — these pages are statically generated, so the source
  // never reaches the browser as anything but the string the code view renders.
  const [source, usage] = await Promise.all([
    readComponentSource(entry.path),
    readDemoSource(entry.name),
  ]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <Stage entry={entry} linked={false} fill usage={usage} source={source} />
    </div>
  );
}
