'use client';

/* Origin: ticket-management (96S2) `components/ui/AnchoredPanel.tsx`. */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export type Anchor = { top: number; left: number; right: number; bottom: number };

/** An element's viewport rect as an `Anchor` — what a caller measures on click. */
export function anchorOf(node: Element | null | undefined): Anchor | null {
  const r = node?.getBoundingClientRect();
  return r ? { top: r.top, left: r.left, right: r.right, bottom: r.bottom } : null;
}

/**
 * The rect of the PANEL a node sits inside, not the node's own — for a panel
 * opened from INSIDE another panel.
 *
 * Anchoring the second panel to the button that opened it measures a box
 * inset by the outer panel's own padding and border, tens of pixels short of
 * its REAL edges. Every `beside` candidate computed from that inset anchor
 * lands INSIDE the outer panel, so the collision check can never find a
 * candidate that clears it — an overlap, not a cascade. Climbing to the
 * nearest `[data-overlay="panel"]` ancestor and measuring THAT gives the
 * outer panel's real edges. A node with no such ancestor measures itself.
 */
export function closestPanelRect(node: HTMLElement | null): Anchor | null {
  return anchorOf(node?.closest<HTMLElement>('[data-overlay="panel"]') ?? node);
}

/** Below Tailwind's `sm` — a phone, where a card beside an anchor has nowhere to be. */
const PHONE_QUERY = '(max-width: 639px)';

/**
 * A form that opens BESIDE what it belongs to, rather than in a drawer at the
 * edge of the window — and that can open ANOTHER one beside itself.
 *
 * ── Why not the Drawer or the Modal ─────────────────────────────────────────
 *
 * The drawer is the right shape for a record: it is the subject of the screen
 * while it is open. Editing one field is not that. It is a follow-up to a
 * click in a small popup that sits mid-screen, and answering it 900px away —
 * past everything the reader was just looking at — makes a two-field edit
 * feel like leaving the page. This opens where the click was.
 *
 * ── Nesting ─────────────────────────────────────────────────────────────────
 *
 * Panels CASCADE: a columns panel opens a field editor beside it, the editor
 * opens an option manager beside itself. Three rules make that work, and they
 * are the whole reason this is not `Modal` with a different width:
 *
 *   1. PLACEMENT avoids every other open panel. A side that overlaps any
 *      `[data-overlay="panel"]` counts as not fitting, so the chain keeps going
 *      OUTWARD — a third panel that flipped back over the first, because that
 *      side was "free" as far as the window edge was concerned, would hide the
 *      thing the reader started from.
 *   2. AN OUTSIDE CLICK is one that lands in no `[data-overlay]` at all. A
 *      click in a child panel is not "outside" its parent, and a click in the
 *      parent (toggling something while the child is open) does not close the
 *      child either. This is why it does not use `useDismiss`, whose notion of
 *      inside is a fixed set of refs.
 *   3. ONE ESCAPE, ONE PANEL — the topmost. Portals mount in opening order, so
 *      the last `[data-overlay="panel"]` in the document is the one on top;
 *      only that one answers the key. A `[data-overlay="picker"]` (a dropdown
 *      that wants Escape for itself) takes it first.
 *
 * Vertically it is TOP-ALIGNED to the anchor and pushed up only as far as it
 * must be to fit — a form pinned to the middle of the screen would jump on
 * every open as its own height changed.
 *
 * Portalled at the overlay band (`z-[200]`, see `globals.css`), like the
 * other surfaces that escape their table shell. On a PHONE it is a bottom
 * sheet.
 */
export default function AnchoredPanel({
  open,
  anchor,
  onClose,
  title,
  subtitle,
  titleHint,
  width: panelWidth = 340,
  placement = 'beside',
  gap = 8,
  footer,
  children,
}: {
  open: boolean;
  /** Where the thing being edited is, in viewport coordinates. Null centres the panel. */
  anchor: Anchor | null;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** An `InfoTooltip` beside the title, for a hint about the form itself. */
  titleHint?: React.ReactNode;
  width?: number;
  /**
   * `beside` (default): right of the anchor, else left, top-aligned — a form
   * hanging off a panel. `below`: under the anchor like a dropdown, left edges
   * aligned when that fits, else right edges — a form opened from a column
   * header, which should read as belonging to that column.
   */
  placement?: 'beside' | 'below';
  /** Pixels between the anchor and the panel. 8 reads as two surfaces; 3 reads as a submenu. */
  gap?: number;
  /** A pinned row under the scrolling body — Cancel/Save, typically. */
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);
  const [phone, setPhone] = useState(false);

  // False on the server and the first client render, then the real answer —
  // seeding from `matchMedia` during render would be a hydration mismatch.
  useEffect(() => {
    const m = window.matchMedia(PHONE_QUERY);
    const sync = () => setPhone(m.matches);
    sync();
    m.addEventListener('change', sync);
    return () => m.removeEventListener('change', sync);
  }, []);

  // Measured AFTER layout and before paint, so the panel is never visible in
  // the wrong place.
  useLayoutEffect(() => {
    if (!open || phone) return setPos(null);

    const place = () => {
      const EDGE = 8;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const width = Math.min(panelWidth, vw - EDGE * 2);

      // A null anchor means the caller could not measure; centring beats a
      // form that refuses to open.
      const a = anchor ?? { top: vh / 4, left: vw / 2 - width / 2, right: vw / 2 - width / 2, bottom: vh / 4 };

      const [first, second] = placement === 'below' ? [a.left, a.right - width] : [a.right + gap, a.left - width - gap];
      const inWindow = (x: number) => x >= EDGE && x + width <= vw - EDGE;
      const others = Array.from(document.querySelectorAll<HTMLElement>('[data-overlay="panel"], [data-overlay="menu"]')).filter(
        (el) => el !== box.current,
      );
      const clear = (x: number) =>
        others.every((el) => {
          const r = el.getBoundingClientRect();
          return x + width <= r.left || x >= r.right;
        });
      const x = [first, second].find((c) => inWindow(c) && clear(c)) ?? [first, second].find(inWindow) ?? Math.max(EDGE, vw - width - EDGE);

      // `maxHeight` is the room BELOW where the panel actually lands, not the
      // window's height — a form two thirds of the way down must not run off
      // the bottom with its buttons unreachable.
      const room = vh - EDGE * 2;
      const height = Math.min(box.current?.offsetHeight || room, room);
      const wanted = placement === 'below' ? a.bottom + gap : a.top;
      const y = Math.max(EDGE, Math.min(wanted, vh - height - EDGE));

      setPos({ top: y, left: x, width, maxHeight: vh - y - EDGE });
    };

    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open, anchor, panelWidth, placement, gap, phone]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      // `composedPath`, not `contains`: this panel may hold portalled
      // overlays of its own.
      const path = e.composedPath();
      if (box.current && path.includes(box.current)) return;
      if ((e.target as HTMLElement | null)?.closest?.('[data-overlay]')) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (document.querySelector('[data-overlay="picker"]')) return;
      const panels = document.querySelectorAll('[data-overlay="panel"]');
      if (panels.length && panels[panels.length - 1] !== box.current) return;
      onClose();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={box}
      role="dialog"
      aria-label={title}
      data-overlay="panel"
      style={
        phone
          ? undefined
          : {
              // Off-screen for the first frame, when `pos` is still null —
              // never at 0,0, which reads as a flash in the corner.
              top: pos?.top ?? -9999,
              left: pos?.left ?? -9999,
              width: pos?.width ?? panelWidth,
              maxHeight: pos?.maxHeight,
            }
      }
      className={
        phone
          ? 'fixed inset-x-0 bottom-0 z-[200] flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-xl border-t border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800'
          : 'fixed z-[200] flex flex-col overflow-hidden panel panel-solid p-0 shadow-2xl animate-fade-in'
      }
    >
      <div className="flex min-h-[2.75rem] shrink-0 items-center gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-700">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xs font-semibold leading-4 text-slate-900 dark:text-slate-100">{title}</h2>
          {subtitle && <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {titleHint && <span className="flex shrink-0 items-center">{titleHint}</span>}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* The body scrolls, the header and footer do not — a long list must
          not push the close button or the Save button off the screen. */}
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

      {footer && <div className="shrink-0 border-t border-slate-200 px-3 py-2 dark:border-slate-700">{footer}</div>}
    </div>,
    document.body,
  );
}
