'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * The right-hand edit panel every admin form opens in. Resizable by dragging its
 * left edge, because a role's permission matrix and a user's detail form want
 * very different widths and a fixed panel makes one of them cramped.
 *
 * Below the `md` breakpoint it goes full-width and the resize handle is removed —
 * dragging a 375px panel narrower has no purpose.
 */
/**
 * MERGED from two copies — bonus-adjustment's `Drawer` and marketing-stats'
 * `ResizableSidebar`. This is the bonus-adjustment implementation, which adds
 * `anchorRef` (fit the panel to a card rather than the viewport) and the
 * `backdrop` toggle. `headerActions` and `maxWidth` came across from
 * marketing-stats.
 */
export default function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  /**
   * Pixels, or a FRACTION of the viewport when <= 1 — `0.5` is half the screen.
   *
   * One prop rather than two because the two are alternatives, never both, and a
   * `width`/`widthFraction` pair invites setting each and wondering which wins.
   * Widths under 1px are not a thing anyone wants, so the overlap is free.
   */
  initialWidth = 460,
  /**
   * Fit the panel to an ELEMENT rather than the viewport — the card whose
   * content it belongs to, so it covers that card instead of the whole window.
   *
   * Still `position: fixed`, not absolute inside the card: the card is
   * `overflow-hidden` to keep its rounded corners, and an absolute child would
   * be clipped by it. So the rect is measured and mirrored instead, which also
   * keeps the panel clear of the card's own scrolling.
   */
  anchorRef,
  /**
   * The dimmed sheet behind the panel. Turn it OFF for a panel that sits beside
   * work you are still meant to see and use — the drafts list keeps its rows
   * readable and clickable while a sheet is open.
   *
   * Without it the panel is no longer modal, so three things change together:
   * `aria-modal` becomes false (the rest of the page really is reachable), the
   * wrapper stops swallowing pointer events, and click-outside no longer closes
   * — a click outside is now a click ON something. Escape and the X still close.
   */
  backdrop = true,
  /**
   * Rendered in the header row, between the title and the close button — for a
   * panel-level action that belongs with the title bar rather than with a field
   * further down ("Pull from API", say). Absent by default, so a caller that
   * passes nothing gets the header it always had.
   */
  headerActions,
  /**
   * Widest the panel may be dragged, as a FRACTION of the viewport.
   *
   * Came across from marketing-stats, which let a caller set it; this was
   * hard-coded at 0.9. A panel that is meant to be read beside the page it
   * belongs to wants a lower ceiling than one that is effectively a full-screen
   * editor, and only the caller knows which it is.
   */
  maxWidth = 0.9,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  initialWidth?: number;
  anchorRef?: React.RefObject<HTMLElement | null>;
  backdrop?: boolean;
  headerActions?: React.ReactNode;
  maxWidth?: number;
}) {
  const [width, setWidth] = useState(initialWidth);
  const [isMobile, setIsMobile] = useState(false);
  /** The anchor's rect, mirrored. Null = fill the viewport, as before. */
  const [box, setBox] = useState<{ top: number; height: number; right: number } | null>(null);
  const resizing = useRef(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /**
   * Resolved on OPEN, not at render: a fraction needs `window`, which does not
   * exist while this is server-rendered. Re-resolving each time it opens also
   * means a panel sized as a fraction follows a window that has been resized
   * since it was last used.
   */
  useEffect(() => {
    if (!open) return;
    setWidth(
      initialWidth <= 1
        ? Math.round(window.innerWidth * initialWidth)
        : initialWidth,
    );
  }, [open, initialWidth]);

  /**
   * Track the anchor while open. `scroll` is captured because the card sits
   * inside `<main>`'s own scroll box, and a scroll there does not bubble to
   * window — without capture the panel would drift off its card.
   */
  useEffect(() => {
    if (!open || !anchorRef) return;

    const measure = () => {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setBox({ top: r.top, height: r.height, right: window.innerWidth - r.right });
    };
    measure();

    // Follows the card as the list above it grows, a note appears, or the window
    // changes — a single measurement would be right only on the first frame.
    const ro = new ResizeObserver(measure);
    if (anchorRef.current) ro.observe(anchorRef.current);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, anchorRef]);

  // Escape closes. Bound while open only, so it can't swallow Escape elsewhere.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!resizing.current) return;
    const next = window.innerWidth - e.clientX;
    if (next > 360 && next < window.innerWidth * maxWidth) setWidth(next);
  }, []);

  const onMouseUp = useCallback(() => {
    resizing.current = false;
    document.body.style.cursor = '';
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }, [onMouseMove]);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    resizing.current = true;
    document.body.style.cursor = 'col-resize';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  if (!open) return null;

  /*
    PORTALLED to <body>, which is not cosmetic.

    `.panel` carries `backdrop-blur-xl`, and a `backdrop-filter` on an ancestor
    makes THAT ancestor the containing block for any `position: fixed`
    descendant. The drafts list renders its panel inside the card, so a fixed
    `top` measured in viewport coordinates was being resolved against the card —
    the panel started below where it should and the anchored height was wrong.

    Any transform, filter or backdrop-filter anywhere above would do the same, so
    the fix is to stop being a descendant rather than to hunt for the ancestor.
  */
  const content = (
    <div
      className={
        backdrop
          ? 'fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm animate-fade-in'
          : 'fixed inset-0 z-50 pointer-events-none'
      }
      onClick={backdrop ? onClose : undefined}
    >
      <div
        role="dialog"
        aria-modal={backdrop}
        aria-label={title}
        onClick={backdrop ? (e) => e.stopPropagation() : undefined}
        style={
          isMobile
            ? undefined
            : {
                width,
                // Mirror the card when anchored; otherwise the classes below
                // leave it filling the viewport, as before.
                ...(box ? { top: box.top, height: box.height, right: box.right } : {}),
              }
        }
        className={cn(
          'fixed right-0 top-0 h-full w-full flex flex-col bg-white dark:bg-slate-900 animate-slide-in-right',
          // An ANCHORED panel is part of a card: all four edges show, so it takes
          // the panel radius and a plain border, and NO shadow — a lifted shadow
          // says "floating above", which is exactly what this one is not.
          //
          // A full-height drawer keeps the shadow: it really does float over the
          // page, and only its left edge is ever visible.
          box && !isMobile
            ? 'border border-slate-200 dark:border-slate-800 rounded-[1rem] overflow-hidden'
            : 'border-l border-slate-200 dark:border-slate-800 shadow-2xl',
          !backdrop && 'pointer-events-auto',
        )}
      >
        {!isMobile && (
          <div
            onMouseDown={startResize}
            className="absolute left-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-indigo-500/30"
          />
        )}

        {/*
          32px, the same height a `.data-table` header row comes to: `py-2`
          either side of the 16px line box that `.data-table`'s `text-xs`
          establishes. So a panel's header and the table header under it read as
          one band rather than two of different weights.

          The CLOSE BUTTON is what sets the floor here, not the title — at
          `p-1.5` its box was 28px and no amount of trimming `py` could reach 32.
          Hence `p-1` below.

          `min-h`, not a fixed `h`: a drawer WITH a subtitle needs the second
          line, and clipping it to match a table would lose real information.
        */}
        {/*
          The SAME recipe a `.data-table` header row uses — `py-2.5` around a 1rem
          line box — so the two are the same height at any root font size. The
          density setting changes that root, which is why this is padding plus a
          line box rather than a fixed `h-8`: a pixel height would match only at
          one density.

          `leading-4` on the title and a 1rem close button are the load-bearing
          part. `text-sm` alone carries a 1.25rem line box and the button was
          1.5rem, so a `min-h` floor of 2rem never bound — the content pushed
          straight past it, which is why this looked taller than the table.
        */}
        {/*
          `h-16`, the SAME class the app's Topbar uses — so a panel's header lines
          up with the main header rather than merely looking close to it.

          Deliberately the class and not the pixel figure it currently resolves
          to: `h-16` is 4rem, which is 56px at the default density and something
          else at the other two. Hardcoding 56 would match the Topbar at one
          density and drift at the rest, which is exactly the bug this avoids.

          One height for EVERY drawer, no per-caller variant, so two panels opened
          side by side can never disagree.
        */}
        <div className="shrink-0 flex h-16 items-center justify-between gap-3 px-5 border-b border-slate-200 dark:border-slate-800">
          <div className="min-w-0">
            <h2 className="text-sm font-bold leading-4 text-slate-800 dark:text-slate-100 truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>
            )}
          </div>
          <div className="shrink-0 flex items-center gap-3">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 inline-flex h-4 w-4 items-center justify-center rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/*
          A flex COLUMN, so a child that manages its own height can say
          `flex-1 min-h-0` and fill exactly what is left. `h-full` would have
          resolved against the content box and overflowed by this padding.
          Ordinary block children stack as before.
        */}
        <div className="flex flex-1 flex-col overflow-y-auto custom-scrollbar px-5 py-4">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document === 'undefined' ? content : createPortal(content, document.body);
}
