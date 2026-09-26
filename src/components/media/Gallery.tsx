'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, ImageOff, Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useDismiss } from '@/lib/use-dismiss';

export interface GalleryImage {
  src: string;
  /** A smaller file for the strip. Falls back to `src`. */
  thumbnail?: string;
  alt: string;
  caption?: ReactNode;
}

export type GalleryThumbnailsPosition = 'bottom' | 'top' | 'left' | 'right';

export interface GalleryProps {
  images: GalleryImage[];
  /** Controlled active image; pair with `onActiveIndexChange`. */
  activeIndex?: number;
  defaultActiveIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  showThumbnails?: boolean;
  thumbnailsPosition?: GalleryThumbnailsPosition;
  /** Dots under the stage — an alternative to thumbnails for a short set. */
  showIndicators?: boolean;
  /** Draws each image's `caption` over the bottom of the stage. */
  showCaption?: boolean;
  /** Next from the last image goes to the first, and back. */
  circular?: boolean;
  /** Shows the expand button that opens the lightbox. */
  allowFullscreen?: boolean;
  /** Controlled lightbox; pair with `onFullscreenChange`. Omit to let the expand button own it. */
  fullscreen?: boolean;
  onFullscreenChange?: (open: boolean) => void;
  /** CSS `aspect-ratio` of the stage. Fixing it keeps the page from jumping between images of different shapes. */
  stageAspect?: string;
  'aria-label'?: string;
  className?: string;
}

// Keyed by `src` at the call site, so a failed image's fallback does not
// stick to the next image shown in the same slot.
function Img({ image, className, lazy = true }: { image: GalleryImage; className?: string; lazy?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-slate-400 dark:text-slate-500">
        <ImageOff aria-hidden className="h-6 w-6" />
        <span className="px-3 text-center text-[11px]">{image.alt}</span>
      </div>
    );
  }
  return (
    // Plain <img>, not next/image: the file has to work pasted into any React
    // project, and next/image would also need every remote host whitelisted.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.src}
      alt={image.alt}
      loading={lazy ? 'lazy' : 'eager'}
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

const OVERLAY_NAV =
  'absolute top-1/2 z-[1] inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/45 text-white backdrop-blur-sm transition-colors hover:bg-slate-900/70 aria-disabled:cursor-default aria-disabled:opacity-30 aria-disabled:hover:bg-slate-900/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:bg-slate-950/55 dark:hover:bg-slate-950/80';

// End-of-set nav buttons are `aria-disabled`, not `disabled`: a real
// `disabled` on the button that has focus drops focus to <body> the moment
// you reach the first image, and the next arrow key goes nowhere.
const endProps = (off: boolean, go: () => void) => ({
  'aria-disabled': off || undefined,
  onClick: () => {
    if (!off) go();
  },
});

/**
 * A stage for one image at a time, with a thumbnail strip, optional dots and
 * caption, and a fullscreen lightbox.
 *
 * The strip keeps the active thumbnail in view by setting ITS OWN scroll
 * position, not with `scrollIntoView`. That method scrolls every scrollable
 * ancestor to reveal the element — including the page — so a gallery below the
 * fold yanked the page down to itself on mount, and again on every autoplayed
 * or keyboard change.
 *
 * The strip is allowed to overflow (the kit otherwise avoids nested scrollers,
 * because they clip popovers): nothing inside it opens one.
 *
 * The lightbox is PORTALLED to <body> at z-[200], the portalled-overlay band,
 * for the same reason `Modal` is: `fixed` resolves against any ancestor with a
 * transform or backdrop-filter, and `.panel` has one. Focus moves into it on
 * open, Tab is kept inside, and focus returns to whatever opened it.
 */
export default function Gallery({
  images,
  activeIndex,
  defaultActiveIndex = 0,
  onActiveIndexChange,
  showThumbnails = true,
  thumbnailsPosition = 'bottom',
  showIndicators = false,
  showCaption = true,
  circular = false,
  allowFullscreen = true,
  fullscreen,
  onFullscreenChange,
  stageAspect = '16 / 10',
  'aria-label': ariaLabel = 'Image gallery',
  className,
}: GalleryProps) {
  const [innerIndex, setInnerIndex] = useState(defaultActiveIndex);
  const [innerOpen, setInnerOpen] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const count = images.length;
  const index = count ? Math.min(Math.max(0, activeIndex ?? innerIndex), count - 1) : 0;
  const open = fullscreen ?? innerOpen;
  const current = images[index];

  const goTo = (i: number) => {
    if (!count) return;
    const next = circular ? (i + count) % count : Math.min(Math.max(0, i), count - 1);
    if (next === index) return;
    if (activeIndex === undefined) setInnerIndex(next);
    onActiveIndexChange?.(next);
  };

  const setOpen = (v: boolean) => {
    if (fullscreen === undefined) setInnerOpen(v);
    onFullscreenChange?.(v);
  };

  const vertical = thumbnailsPosition === 'left' || thumbnailsPosition === 'right';

  useEffect(() => {
    const strip = stripRef.current;
    const thumb = thumbRefs.current[index];
    if (!strip || !thumb) return;
    // Centre the thumb in the strip. `offsetLeft/Top` are relative to the
    // strip because it is the thumb's offsetParent (it is `relative`).
    if (vertical) strip.scrollTo({ top: thumb.offsetTop - (strip.clientHeight - thumb.offsetHeight) / 2, behavior: 'smooth' });
    else strip.scrollTo({ left: thumb.offsetLeft - (strip.clientWidth - thumb.offsetWidth) / 2, behavior: 'smooth' });
  }, [index, vertical]);

  const onStageKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const map: Record<string, number | undefined> = {
      ArrowLeft: index - 1,
      ArrowRight: index + 1,
      Home: 0,
      End: count - 1,
    };
    if (e.key in map) {
      e.preventDefault();
      goTo(map[e.key]!);
    } else if (e.key === 'Enter' && allowFullscreen && e.target === e.currentTarget) {
      // Only on the stage itself: Enter on the prev/next buttons inside it
      // bubbles here too, and must stay a click on that button.
      e.preventDefault();
      setOpen(true);
    }
  };

  if (!count) {
    return (
      <div className={cn('flex items-center justify-center rounded-lg border border-dashed border-slate-200 p-6 text-[11px] text-slate-400 dark:border-slate-700 dark:text-slate-500', className)}>
        No images.
      </div>
    );
  }

  const atStart = !circular && index === 0;
  const atEnd = !circular && index === count - 1;

  const stage = (
    // `relative` anchors the `sr-only` live region below: it is absolute, and
    // unanchored it escapes a scrolling container and lengthens the document.
    <div className="relative flex min-w-0 flex-1 flex-col gap-2">
      <div
        tabIndex={0}
        role="group"
        aria-roledescription="image viewer"
        aria-label={`Image ${index + 1} of ${count}: ${current.alt}`}
        onKeyDown={onStageKey}
        className="group relative w-full overflow-hidden rounded-lg bg-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:bg-slate-900"
        style={{ aspectRatio: stageAspect }}
      >
        <Img key={current.src} image={current} lazy={false} className="h-full w-full object-contain" />

        {count > 1 && (
          <>
            <button type="button" {...endProps(atStart, () => goTo(index - 1))} aria-label="Previous image" className={cn(OVERLAY_NAV, 'left-2')}>
              <ChevronLeft aria-hidden className="h-4 w-4" />
            </button>
            <button type="button" {...endProps(atEnd, () => goTo(index + 1))} aria-label="Next image" className={cn(OVERLAY_NAV, 'right-2')}>
              <ChevronRight aria-hidden className="h-4 w-4" />
            </button>
          </>
        )}

        {allowFullscreen && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="View fullscreen"
            className="absolute right-2 top-2 z-[1] inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-900/45 text-white backdrop-blur-sm transition-colors hover:bg-slate-900/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:bg-slate-950/55 dark:hover:bg-slate-950/80"
          >
            <Maximize2 aria-hidden className="h-3.5 w-3.5" />
          </button>
        )}

        {showCaption && current.caption && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-950/75 to-transparent px-3 pb-2.5 pt-8 text-xs text-white">
            {current.caption}
          </div>
        )}
      </div>

      {showIndicators && count > 1 && (
        <div className="flex items-center justify-center gap-1.5">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to image ${i + 1}`}
              aria-current={i === index || undefined}
              className={cn(
                'h-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
                i === index
                  ? 'w-5 bg-indigo-600 dark:bg-indigo-400'
                  : 'w-1.5 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500',
              )}
            />
          ))}
        </div>
      )}

      {/* The index a screen reader hears after using the buttons or arrows. */}
      <p aria-live="polite" className="sr-only">
        Image {index + 1} of {count}: {current.alt}
      </p>
    </div>
  );

  const strip = showThumbnails && count > 1 && (
    <div className={cn(vertical ? 'relative w-20 shrink-0 self-stretch' : 'w-full')}>
      <div
        ref={stripRef}
        className={cn(
          // Positioned either way, so it is the thumbs' offsetParent (see the
          // scroll effect). Vertical is absolute so the strip takes the STAGE's
          // height instead of stretching the row to fit every thumb.
          'flex gap-1.5 scrollbar-thin',
          vertical ? 'absolute inset-0 flex-col overflow-y-auto pr-0.5' : 'relative overflow-x-auto pb-1',
        )}
      >
        {images.map((img, i) => (
          <button
            key={img.src + i}
            ref={(el) => {
              thumbRefs.current[i] = el;
            }}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Show image ${i + 1}: ${img.alt}`}
            aria-current={i === index || undefined}
            className={cn(
              'relative shrink-0 overflow-hidden rounded-md bg-slate-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:bg-slate-800',
              vertical ? 'aspect-[4/3] w-full' : 'h-14 w-20',
              i === index
                ? 'opacity-100 ring-2 ring-inset ring-indigo-500 dark:ring-indigo-400'
                : 'opacity-60 hover:opacity-100',
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.thumbnail ?? img.src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <section aria-label={ariaLabel} className={cn('flex gap-2', vertical ? 'flex-row' : 'flex-col', className)}>
      {(thumbnailsPosition === 'top' || thumbnailsPosition === 'left') && strip}
      {stage}
      {(thumbnailsPosition === 'bottom' || thumbnailsPosition === 'right') && strip}
      {open && (
        <Lightbox
          images={images}
          index={index}
          onIndex={goTo}
          circular={circular}
          onClose={() => setOpen(false)}
        />
      )}
    </section>
  );
}

function Lightbox({
  images,
  index,
  onIndex,
  circular,
  onClose,
}: {
  images: GalleryImage[];
  index: number;
  onIndex: (i: number) => void;
  circular: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const figureRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const count = images.length;
  const current = images[index];

  // The dark space around the image is the backdrop: a press there is
  // "outside" everything that has a job, and closes, as Escape does.
  useDismiss([figureRef, barRef, prevRef, nextRef], true, onClose);

  // Mounted only while open, so mount/unmount IS open/close: remember the
  // opener, move focus in, and hand it back on the way out.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => opener?.focus?.();
  }, []);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') onIndex(index - 1);
    else if (e.key === 'ArrowRight') onIndex(index + 1);
    else if (e.key === 'Home') onIndex(0);
    else if (e.key === 'End') onIndex(count - 1);
    else if (e.key === 'Tab') {
      // A minimal focus trap: wrap Tab at either end of the dialog's own
      // controls, so focus cannot wander into the page hidden behind it.
      const focusables = [...(dialogRef.current?.querySelectorAll<HTMLElement>('button') ?? [])];
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
      return;
    } else return;
    e.preventDefault();
  };

  const navBtn =
    'absolute top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 aria-disabled:cursor-default aria-disabled:opacity-25 aria-disabled:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400';

  const content = (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      // -1 so a click on the image or the dark space focuses the dialog rather
      // than <body>, which would take the arrow keys with it.
      tabIndex={-1}
      onKeyDown={onKeyDown}
      // Dark in BOTH themes, deliberately, so no `dark:` pairs below: a
      // photo is judged against black, and a white lightbox in light mode
      // would glare around every image.
      className="fixed outline-none inset-0 z-[200] flex flex-col bg-slate-950/90 backdrop-blur-sm animate-fade-in"
    >
      <div ref={barRef} className="flex items-center justify-between gap-3 self-stretch px-4 py-3 text-xs text-slate-300">
        <span aria-live="polite">
          {index + 1} / {count}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close viewer"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <X aria-hidden className="h-4 w-4" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-16 pb-6">
        <figure ref={figureRef} className="flex max-h-full max-w-full flex-col items-center gap-2">
          <Img key={current.src} image={current} lazy={false} className="max-h-[80vh] max-w-full rounded-md object-contain animate-fade-in" />
          {current.caption && <figcaption className="max-w-2xl text-center text-xs text-slate-300">{current.caption}</figcaption>}
        </figure>
        {count > 1 && (
          <>
            <button ref={prevRef} type="button" {...endProps(!circular && index === 0, () => onIndex(index - 1))} aria-label="Previous image" className={cn(navBtn, 'left-3')}>
              <ChevronLeft aria-hidden className="h-5 w-5" />
            </button>
            <button ref={nextRef} type="button" {...endProps(!circular && index === count - 1, () => onIndex(index + 1))} aria-label="Next image" className={cn(navBtn, 'right-3')}>
              <ChevronRight aria-hidden className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );

  return typeof document === 'undefined' ? content : createPortal(content, document.body);
}
