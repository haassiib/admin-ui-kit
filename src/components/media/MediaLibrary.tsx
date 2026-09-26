'use client';

import { useMemo, useState } from 'react';
import { Check, File, FileText, Film, Grid2x2, List, Music, Search, Upload } from 'lucide-react';
import { cn } from '@/lib/cn';
import EmptyState from '@/components/layout/EmptyState';

export type MediaItem = {
  id: string;
  name: string;
  /** Drives the placeholder icon and the preview treatment. */
  kind: 'image' | 'video' | 'audio' | 'document' | 'other';
  /** Bytes. Rendered human-readable. */
  size?: number;
  url?: string;
  thumbnailUrl?: string;
  uploadedAt?: string;
};

const ICON = {
  image: File,
  video: Film,
  audio: Music,
  document: FileText,
  other: File,
} as const;

function humanSize(bytes?: number) {
  if (bytes == null) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let n = bytes;
  let u = 0;
  while (n >= 1024 && u < units.length - 1) {
    n /= 1024;
    u++;
  }
  return `${n < 10 && u > 0 ? n.toFixed(1) : Math.round(n)} ${units[u]}`;
}

/**
 * A picker for files that already exist, with an upload affordance beside them.
 *
 * Selection is CONTROLLED and always an array, even when `multiple` is false —
 * one shape for the caller to handle rather than a union that every call site
 * has to narrow.
 *
 * Thumbnails fall back to a kind icon rather than a broken-image glyph: a media
 * library is exactly where a dead URL is most likely, and a grid of broken
 * images reads as a broken component.
 */
export default function MediaLibrary({
  items,
  selected = [],
  onSelectedChange,
  multiple = true,
  onUpload,
  accept,
  className,
}: {
  items: MediaItem[];
  selected?: string[];
  onSelectedChange?: (next: string[]) => void;
  multiple?: boolean;
  /** Omit to hide the upload control entirely. */
  onUpload?: (files: FileList) => void;
  accept?: string;
  className?: string;
}) {
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [dragging, setDragging] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((i) => i.name.toLowerCase().includes(q)) : items;
  }, [items, query]);

  const toggle = (id: string) => {
    if (!onSelectedChange) return;
    if (!multiple) return onSelectedChange(selected.includes(id) ? [] : [id]);
    onSelectedChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  const Thumb = ({ item, size }: { item: MediaItem; size: 'sm' | 'lg' }) => {
    const [failed, setFailed] = useState(false);
    const src = item.thumbnailUrl ?? (item.kind === 'image' ? item.url : undefined);
    const Icon = ICON[item.kind];
    const box = size === 'lg' ? 'aspect-square w-full' : 'h-9 w-9 shrink-0';
    if (src && !failed) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          onError={() => setFailed(true)}
          className={cn(box, 'rounded-md object-cover bg-slate-100 dark:bg-slate-800')}
        />
      );
    }
    return (
      <div className={cn(box, 'grid place-items-center rounded-md bg-slate-100 dark:bg-slate-800')}>
        <Icon className="h-5 w-5 text-slate-400" />
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search media…"
            className="field-input pl-8"
          />
        </div>

        <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
          {([['grid', Grid2x2], ['list', List]] as const).map(([v, Icon]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-label={`${v} view`}
              aria-pressed={view === v}
              className={cn(
                'rounded-md p-1.5',
                view === v
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        {onUpload && (
          // `relative` anchors the input: `sr-only` is `position: absolute`, and
          // with no positioned ancestor it escapes the scrolling `<main>` and
          // stretches the document itself — a second, page-length scrollbar.
          <label className="btn-primary relative cursor-pointer">
            <Upload className="h-3.5 w-3.5" />
            Upload
            <input
              type="file"
              multiple={multiple}
              accept={accept}
              className="sr-only"
              onChange={(e) => e.target.files?.length && onUpload(e.target.files)}
            />
          </label>
        )}
      </div>

      <div
        onDragOver={onUpload ? (e) => { e.preventDefault(); setDragging(true); } : undefined}
        onDragLeave={onUpload ? () => setDragging(false) : undefined}
        onDrop={
          onUpload
            ? (e) => {
                e.preventDefault();
                setDragging(false);
                if (e.dataTransfer.files.length) onUpload(e.dataTransfer.files);
              }
            : undefined
        }
        className={cn(
          'min-h-0 flex-1 rounded-xl border border-dashed p-3 transition-colors',
          dragging
            ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/10'
            : 'border-slate-200 dark:border-slate-700',
        )}
      >
        {visible.length === 0 ? (
          <EmptyState
            title={query ? 'Nothing matches that search' : 'No media yet'}
            hint={onUpload ? 'Drop files here, or use Upload.' : undefined}
          />
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {visible.map((item) => {
              const on = selected.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggle(item.id)}
                  aria-pressed={on}
                  className={cn(
                    'group relative rounded-lg border p-2 text-left transition-colors',
                    on
                      ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-500/10'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
                  )}
                >
                  <Thumb item={item} size="lg" />
                  <p className="mt-1.5 truncate text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-slate-400">{humanSize(item.size)}</p>
                  {on && (
                    <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-indigo-600">
                      <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {visible.map((item) => {
              const on = selected.includes(item.id);
              return (
                <li key={item.id}>
                  <button
                    onClick={() => toggle(item.id)}
                    aria-pressed={on}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left',
                      on ? 'bg-indigo-50/60 dark:bg-indigo-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
                    )}
                  >
                    <Thumb item={item} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                        {item.name}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {item.kind} · {humanSize(item.size)}
                        {item.uploadedAt ? ` · ${item.uploadedAt}` : ''}
                      </span>
                    </span>
                    {on && <Check className="h-3.5 w-3.5 shrink-0 text-indigo-600" strokeWidth={3} />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
