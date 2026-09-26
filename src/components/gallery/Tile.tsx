'use client';

import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Code2 } from 'lucide-react';

import { cn } from '@/lib/cn';
import { displayName, type Entry } from '@/registry';
import { DEMOS } from '@/registry/demos/map';
import { demoWidth, type TileSize } from '@/registry/groups';

/**
 * Column (and row) span per size. Written out whole, since Tailwind only ships
 * classes it can find as literals. Spans cap at the grid's columns as it
 * narrows — two at `sm`, one below — so a 4x tile is never wider than the page.
 */
const SPAN: Record<TileSize, string> = {
  1: '',
  2: 'sm:col-span-2',
  // Two rows from `sm` up only: in a single phone-width column a two-row tile
  // is a whole screen of one thumbnail.
  3: 'sm:col-span-2 lg:col-span-3 sm:row-span-2',
  4: 'sm:col-span-2 lg:col-span-4 sm:row-span-2',
};

/**
 * One component on the browse-all grid: its live demo, shrunk to a thumbnail,
 * over its name, with an arrow button that opens the component's page.
 *
 * ── A live demo, not a screenshot ───────────────────────────────────────────
 *
 * Screenshots would drift from the components the day one changed. The demo is
 * rendered at a natural size and scaled down with a transform to fit the tile,
 * `contain`-style, never up past 1 — so a button sits at its real size and a
 * data grid shrinks until it fits. It is `inert`: no focus, no clicks, no
 * popovers opening inside a thumbnail. The transform also makes the thumbnail
 * the containing block for anything `position: fixed` inside it, so a demo's
 * floating button stays in its tile instead of pinning itself to the window.
 *
 * ── Mounted when near the viewport ──────────────────────────────────────────
 *
 * A hundred live demos — charts, grids, a whole app shell — mounted at once is
 * what made this page slow to open. Each tile mounts its demo the first time it
 * comes within a screen of view, and keeps it.
 *
 * ── Only the arrow navigates ────────────────────────────────────────────────
 *
 * A click anywhere else on the tile does nothing, so browsing the grid never
 * leaves it by accident. It is also why the link is the arrow and not a
 * wrapper: demos are full of buttons and links, which an `<a>` may not contain.
 */
export default function Tile({ entry, size }: { entry: Entry; size: TileSize }) {
  const Demo = DEMOS[entry.slug];
  const frameRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [scale, setScale] = useState(0);
  const width = demoWidth(entry.name);

  useEffect(() => {
    const el = frameRef.current;
    if (!el || visible) return;
    // `<main>` is the scroll container, not the window — see DashShell.
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setVisible(true),
      { root: document.querySelector('main'), rootMargin: '100% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  // Fit the demo to the frame, and refit whenever either changes size — a chart
  // lays itself out after mount, and the grid reflows as the window resizes.
  useLayoutEffect(() => {
    const frame = frameRef.current;
    const inner = innerRef.current;
    if (!frame || !inner) return;
    const fit = () => {
      const fw = frame.clientWidth;
      const fh = frame.clientHeight;
      // A `fill` demo's layout width follows the frame's. Set here, in the same
      // pass as the measurement, not from state: a render in between would
      // measure the old width and scale to it for a frame.
      if (width === 'fill') inner.style.width = `${Math.min(1280, Math.max(440, fw * 1.2))}px`;
      // `scroll*` as well: a demo wider than the box it was given (an org chart,
      // a two-month calendar) overflows it, and fitting the box alone clips it.
      const iw = Math.max(inner.offsetWidth, inner.scrollWidth);
      const ih = Math.max(inner.offsetHeight, inner.scrollHeight);
      if (!iw || !ih) return;
      setScale(Math.min(1, (fw * 0.92) / iw, (fh * 0.9) / ih));
    };
    const ro = new ResizeObserver(fit);
    ro.observe(frame);
    ro.observe(inner);
    fit();
    return () => ro.disconnect();
  }, [visible, width]);

  // What width the demo lays itself out at, before scaling. A `fill` demo has no
  // width of its own, so it gets one: the tile's, at 1.2x — a chart or a table
  // then renders roomily and shrinks a little to fit, rather than being squeezed
  // into a thumbnail's width. Much more and a 1x tile's text is unreadably small.
  const innerStyle: React.CSSProperties =
    width === 'fill'
      ? {} // set in `fit`, from the frame's width
      : width === 'field'
        ? { width: 360 }
        : // Wide cap, not a tight one: a demo that scrolls inside its own box
          // (an org chart) shows all of itself only at its full width.
          { width: 'max-content', maxWidth: 1200 };

  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white',
        'dark:border-slate-800 dark:bg-slate-900',
        SPAN[size],
      )}
    >
      <div
        ref={frameRef}
        aria-hidden
        className="relative min-h-0 flex-1 overflow-hidden border-b border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900"
      >
        {Demo && visible ? (
          <div
            ref={innerRef}
            inert
            className="pointer-events-none absolute left-1/2 top-1/2 select-none transition-opacity duration-300"
            style={{
              ...innerStyle,
              transform: `translate(-50%, -50%) scale(${scale})`,
              // Hidden until measured, or it flashes at full size first.
              opacity: scale ? 1 : 0,
            }}
          >
            <Suspense fallback={null}>
              <Demo />
            </Suspense>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {Demo ? (
              <div className="h-10 w-24 animate-pulse rounded-lg bg-slate-200/70 dark:bg-slate-800" />
            ) : (
              // A hook or a script tag: nothing to render, so say what it is.
              <span className="flex flex-col items-center gap-1.5 text-slate-400 dark:text-slate-500">
                <Code2 className="h-6 w-6" />
                <span className="text-[10px] font-medium uppercase tracking-wider">No visual preview</span>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 py-2.5 pl-3.5 pr-2.5">
        <div className="min-w-0" title={entry.blurb}>
          <h3 className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{displayName(entry.name)}</h3>
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{entry.blurb}</p>
        </div>
        <Link
          href={`/preview/${entry.slug}`}
          aria-label={`Open ${displayName(entry.name)}`}
          title={`Open ${displayName(entry.name)}`}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-500 dark:hover:bg-indigo-500/15 dark:hover:text-indigo-400"
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
