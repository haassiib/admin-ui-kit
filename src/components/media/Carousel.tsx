'use client';

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface CarouselResponsiveOption {
  /** Applies while the carousel's OWN width is at most this many px. */
  breakpoint: number;
  numVisible: number;
  numScroll: number;
}

export interface CarouselProps<T> {
  items: T[];
  itemTemplate: (item: T, index: number) => ReactNode;
  /** Defaults to the index; pass one when items can be reordered. */
  itemKey?: (item: T, index: number) => string | number;
  /**
   * Slides in view at once. May be fractional: `1.5` shows one slide and half
   * of the next, the peek that says there is more. Ignored with `autoSize`.
   */
  numVisible?: number;
  /** Slides to move per step. */
  numScroll?: number;
  /**
   * Where a step's slides sit in the viewport. `center` puts them in the
   * middle with the neighbours peeking either side; both ends still sit flush,
   * so the strip never opens a gap before the first slide or after the last.
   */
  align?: 'start' | 'center';
  /**
   * Each slide keeps the size its template gives it, instead of a share of
   * the viewport — cards of different widths. Steps are measured from the
   * rendered slides, so they follow content and images as they load.
   */
  autoSize?: boolean;
  /** Next on the last page returns to the first, and prev on the first goes to the last. */
  circular?: boolean;
  /** Milliseconds between pages. 0 turns autoplay off; it is also off under `prefers-reduced-motion`. */
  autoplayInterval?: number;
  orientation?: 'horizontal' | 'vertical';
  /** The viewport's height in `vertical` orientation, where it cannot be taken from the content. */
  verticalViewportHeight?: string;
  /** Overrides by width, matched against the carousel's own box — not the window — so it adapts inside a sidebar or a split pane too. */
  responsiveOptions?: CarouselResponsiveOption[];
  showNavigators?: boolean;
  showIndicators?: boolean;
  /** Controlled page (0-based); pair with `onPageChange`. */
  page?: number;
  onPageChange?: (page: number) => void;
  'aria-label'?: string;
  className?: string;
}

const REDUCED = '(prefers-reduced-motion: reduce)';
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};

/**
 * Positions along the strip, in one unit throughout: slide widths for a fixed
 * strip (slide `i` starts at `i`), pixels for `autoSize`.
 */
type Metrics = { offsets: number[]; sizes: number[]; viewport: number };

/**
 * Where each step stops. One stop per `scroll` slides, shifted for `center`,
 * then clamped so the strip never scrolls past either end. Clamping makes
 * neighbouring stops collide at the ends — three slides centred in a
 * three-slide viewport all clamp to 0 — and a collided stop would be a dot
 * that goes nowhere, so duplicates are dropped.
 */
function snapPoints({ offsets, sizes, viewport }: Metrics, scroll: number, align: 'start' | 'center') {
  const n = offsets.length;
  if (n === 0) return [0];
  const max = Math.max(0, offsets[n - 1] + sizes[n - 1] - viewport);
  const eps = viewport * 1e-3;
  const snaps: number[] = [];
  const add = (pos: number) => {
    if (snaps.length === 0 || pos - snaps[snaps.length - 1] > eps) snaps.push(pos);
  };
  for (let s = 0; s < n; s += scroll) {
    const last = Math.min(s + scroll, n) - 1;
    const extent = offsets[last] + sizes[last] - offsets[s];
    const shift = align === 'center' ? (viewport - extent) / 2 : 0;
    add(Math.min(max, Math.max(0, offsets[s] - shift)));
  }
  // A last slide wider than the viewport ends past every stop; reach its end too.
  add(max);
  return snaps;
}

const sameMetrics = (a: Metrics | null, b: Metrics) =>
  !!a &&
  a.viewport === b.viewport &&
  a.offsets.length === b.offsets.length &&
  a.offsets.every((o, i) => o === b.offsets[i] && a.sizes[i] === b.sizes[i]);

const NAV =
  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 aria-disabled:cursor-default aria-disabled:opacity-30 aria-disabled:hover:bg-transparent dark:aria-disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200';

// `aria-disabled` rather than `disabled` at either end: disabling the button
// that has focus drops focus to <body>, so the Enter that reached the last
// page would leave the keyboard user nowhere.
const endProps = (off: boolean, go: () => void) => ({
  'aria-disabled': off || undefined,
  onClick: () => {
    if (!off) go();
  },
});

/**
 * A paged strip of items that slides by `numScroll` at a time.
 *
 * Pages are counted so the LAST page is flush with the end: with 7 items, 3
 * visible and a scroll of 3, the pages start at 0, 3 and 4 — never at 6 with
 * two empty slots. A strip that ends half-empty reads as missing content. The
 * same holds for `align="center"`, fractional `numVisible` and `autoSize`:
 * every mode computes its stops the one way, in `snapPoints`.
 *
 * `circular` wraps by rewinding, not by cloning slides at either end. Clones
 * duplicate every focusable element and id inside `itemTemplate`, and a screen
 * reader would announce the same slide twice; a visible slide back to the start
 * is the honest version of "we are at the beginning again".
 *
 * Off-screen slides are `inert` and `aria-hidden`, so Tab never lands on a
 * button the viewer cannot see. Autoplay pauses while the pointer or focus is
 * inside, and has its own pause button — WCAG 2.2.2 asks for one on anything
 * that moves by itself for more than five seconds.
 */
export default function Carousel<T>({
  items,
  itemTemplate,
  itemKey,
  numVisible = 1,
  numScroll = 1,
  align = 'start',
  autoSize = false,
  circular = false,
  autoplayInterval = 0,
  orientation = 'horizontal',
  verticalViewportHeight = '320px',
  responsiveOptions,
  showNavigators = true,
  showIndicators = true,
  page: pageProp,
  onPageChange,
  'aria-label': ariaLabel = 'Carousel',
  className,
}: CarouselProps<T>) {
  const rootRef = useRef<HTMLElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState<Metrics | null>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const [width, setWidth] = useState(0);
  const [innerPage, setInnerPage] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [stopped, setStopped] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED).matches, () => false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The narrowest breakpoint that still contains the current width wins,
  // matching `max-width` media-query semantics. Before the first measurement
  // (width 0, and always on the server) the base props apply.
  const match =
    width > 0
      ? [...(responsiveOptions ?? [])].sort((a, b) => a.breakpoint - b.breakpoint).find((o) => width <= o.breakpoint)
      : undefined;
  const visible = Math.max(1, Math.min(match?.numVisible ?? numVisible, items.length || 1));
  const scroll = Math.max(1, Math.round(match?.numScroll ?? numScroll));
  const vertical = orientation === 'vertical';

  // `autoSize` reads its geometry off the rendered slides. Measured after
  // every render but stored only when it changed, so this settles in one pass;
  // the observer catches what a render does not cause — an image arriving.
  const measure = () => {
    const vp = viewportRef.current;
    const track = trackRef.current;
    if (!autoSize || !vp || !track) return;
    const slides = [...track.children] as HTMLElement[];
    const next: Metrics = {
      offsets: slides.map((el) => (vertical ? el.offsetTop : el.offsetLeft)),
      sizes: slides.map((el) => (vertical ? el.offsetHeight : el.offsetWidth)),
      viewport: vertical ? vp.clientHeight : vp.clientWidth,
    };
    setMeasured((prev) => (sameMetrics(prev, next) ? prev : next));
  };
  useLayoutEffect(measure);
  useEffect(() => {
    const track = trackRef.current;
    if (!autoSize || !track) return;
    const ro = new ResizeObserver(() => measure());
    for (const el of track.children) ro.observe(el);
    return () => ro.disconnect();
  }, [autoSize, items, vertical]); // eslint-disable-line react-hooks/exhaustive-deps

  // Until `autoSize` has measured (and always on the server) there is one
  // stop at 0 and every slide counts as shown.
  const metrics: Metrics | null = autoSize
    ? measured
    : { offsets: items.map((_, i) => i), sizes: items.map(() => 1), viewport: visible };
  const snaps = metrics ? snapPoints(metrics, scroll, align) : [0];
  const pageCount = snaps.length;
  // Clamped at render, not in an effect: a resize that lowers the page count
  // must not paint one frame past the end.
  const page = Math.min(Math.max(0, pageProp ?? innerPage), pageCount - 1);
  const pos = snaps[page];

  const isShown = (i: number) => {
    if (!metrics || i >= metrics.offsets.length) return true;
    const eps = metrics.viewport * 1e-3;
    const a = metrics.offsets[i];
    const b = a + metrics.sizes[i];
    const inside = a >= pos - eps && b <= pos + metrics.viewport + eps;
    // A slide bigger than the viewport is never wholly inside it; it is shown while any of it is.
    return inside || (metrics.sizes[i] > metrics.viewport && b > pos && a < pos + metrics.viewport);
  };

  const autoplay = autoplayInterval > 0 && !reducedMotion && pageCount > 1;
  // Autoplay has nowhere to go from the last page but back, so it implies wrapping.
  const wraps = circular || autoplay;

  const goTo = (p: number) => {
    const next = wraps ? (p + pageCount) % pageCount : Math.min(Math.max(0, p), pageCount - 1);
    if (next === page) return;
    if (pageProp === undefined) setInnerPage(next);
    onPageChange?.(next);
  };

  // The interval calls the LATEST step through a ref, so it is armed once per
  // run rather than torn down and re-armed on every page change — which would
  // also restart its clock each time.
  const advance = useRef(() => {});
  useEffect(() => {
    advance.current = () => goTo(page + 1);
  });
  const running = autoplay && !stopped && !hovered && !focused;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => advance.current(), autoplayInterval);
    return () => window.clearInterval(id);
  }, [running, autoplayInterval]);

  const PrevIcon = vertical ? ChevronUp : ChevronLeft;
  const NextIcon = vertical ? ChevronDown : ChevronRight;
  const share = 100 / visible;
  // Fixed slides move in shares of the track (percent survives a resize with
  // no re-measure); measured ones in pixels.
  const offset = autoSize ? `${-pos}px` : `${-pos * share}%`;

  const onDotsKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const back = vertical ? 'ArrowUp' : 'ArrowLeft';
    const fwd = vertical ? 'ArrowDown' : 'ArrowRight';
    if (e.key !== back && e.key !== fwd && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const target =
      e.key === 'Home' ? 0 : e.key === 'End' ? pageCount - 1 : e.key === back ? page - 1 : page + 1;
    goTo(target);
    const wrapped = wraps ? (target + pageCount) % pageCount : Math.min(Math.max(0, target), pageCount - 1);
    dotsRef.current?.querySelectorAll('button')[wrapped]?.focus();
  };

  return (
    <section
      ref={rootRef}
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
      className={cn('flex flex-col gap-2', className)}
    >
      <div className={cn('flex items-center gap-1.5', vertical && 'flex-col')}>
        {showNavigators && (
          <button type="button" {...endProps(!wraps && page === 0, () => goTo(page - 1))} aria-label="Previous page" className={NAV}>
            <PrevIcon aria-hidden className="h-4 w-4" />
          </button>
        )}

        <div
          ref={viewportRef}
          className={cn('min-w-0 overflow-hidden', vertical ? 'w-full' : 'flex-1 self-stretch')}
          style={vertical ? { height: verticalViewportHeight } : undefined}
          onPointerDown={(e) => {
            if (e.pointerType !== 'mouse') swipe.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerUp={(e) => {
            const s = swipe.current;
            swipe.current = null;
            if (!s) return;
            const d = vertical ? e.clientY - s.y : e.clientX - s.x;
            if (Math.abs(d) > 40) goTo(d < 0 ? page + 1 : page - 1);
          }}
        >
          <div
            ref={trackRef}
            // Announce page changes a person made; stay quiet while autoplay
            // turns them over, or a screen reader narrates a slideshow.
            aria-live={running ? 'off' : 'polite'}
            className={cn(
              // `relative`: slide offsets are measured against the track.
              'relative flex transition-transform duration-500 ease-out motion-reduce:transition-none',
              vertical ? 'h-full flex-col' : 'w-full',
            )}
            style={{ transform: vertical ? `translateY(${offset})` : `translateX(${offset})` }}
          >
            {items.map((item, i) => {
              // Partly visible slides — a peek — stay inert: focusing one would
              // scroll the clipped viewport out from under the transform.
              const shown = isShown(i);
              return (
                <div
                  key={itemKey ? itemKey(item, i) : i}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${i + 1} of ${items.length}`}
                  aria-hidden={!shown || undefined}
                  inert={!shown}
                  // `overflow-hidden` in vertical: the slide's height is a
                  // share of the viewport, and content taller than that would
                  // otherwise paint over the next slide.
                  className={cn(
                    'min-h-0 min-w-0 shrink-0',
                    vertical ? 'py-1' : 'px-1',
                    vertical && !autoSize && 'overflow-hidden',
                  )}
                  style={autoSize ? undefined : { flexBasis: `${share}%` }}
                >
                  {itemTemplate(item, i)}
                </div>
              );
            })}
          </div>
        </div>

        {showNavigators && (
          <button
            type="button"
            {...endProps(!wraps && page === pageCount - 1, () => goTo(page + 1))}
            aria-label="Next page"
            className={NAV}
          >
            <NextIcon aria-hidden className="h-4 w-4" />
          </button>
        )}
      </div>

      {(showIndicators || autoplay) && pageCount > 1 && (
        <div className="flex items-center justify-center gap-2">
          {autoplay && (
            <button
              type="button"
              onClick={() => setStopped((s) => !s)}
              aria-label={stopped ? 'Start automatic slide show' : 'Stop automatic slide show'}
              className={cn(NAV, 'h-5 w-5')}
            >
              {stopped ? <Play aria-hidden className="h-3 w-3" /> : <Pause aria-hidden className="h-3 w-3" />}
            </button>
          )}
          {showIndicators && (
            <div ref={dotsRef} className="flex items-center gap-1.5" onKeyDown={onDotsKey}>
              {Array.from({ length: pageCount }, (_, p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => goTo(p)}
                  aria-label={`Go to page ${p + 1}`}
                  aria-current={p === page || undefined}
                  // One tab stop for the row; arrows move along it.
                  tabIndex={p === page ? 0 : -1}
                  className={cn(
                    'h-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900',
                    p === page
                      ? 'w-5 bg-indigo-600 dark:bg-indigo-400'
                      : 'w-1.5 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500',
                  )}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
