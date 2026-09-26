'use client';

import { useCallback, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';

/** An edge or corner being dragged, or `move` for the whole panel. */
type Grip = 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

/** How far the panel has been moved from where layout put it, and the size it was given. */
type Box = { dx: number; dy: number; w?: number; h?: number };

const HOME: Box = { dx: 0, dy: 0 };
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Edges are 6px strips just inside the border; corners are 12px squares over
// them, so a corner wins where the two meet. `touch-none` stops a touch drag
// from scrolling the page instead.
const GRIPS: Array<{ grip: Exclude<Grip, 'move'>; className: string }> = [
  { grip: 'n', className: 'inset-x-3 top-0 h-1.5 cursor-ns-resize' },
  { grip: 's', className: 'inset-x-3 bottom-0 h-1.5 cursor-ns-resize' },
  { grip: 'e', className: 'inset-y-3 right-0 w-1.5 cursor-ew-resize' },
  { grip: 'w', className: 'inset-y-3 left-0 w-1.5 cursor-ew-resize' },
  { grip: 'nw', className: 'left-0 top-0 h-3 w-3 cursor-nwse-resize' },
  { grip: 'ne', className: 'right-0 top-0 h-3 w-3 cursor-nesw-resize' },
  { grip: 'sw', className: 'bottom-0 left-0 h-3 w-3 cursor-nesw-resize' },
  { grip: 'se', className: 'bottom-0 right-0 h-3 w-3 cursor-nwse-resize' },
];

/**
 * Drag a centred panel by its header and resize it from any edge or corner.
 *
 * The panel stays where layout puts it — centred by its flex container — and
 * this only adds an OFFSET (a translate) and, once resized, an explicit size.
 * That keeps the open animation, the centring on first open and the viewport
 * caps all in CSS. The one consequence is in the arithmetic: a centred box
 * grows equally both ways, so dragging the right edge by 40px widens it by 40
 * and moves the offset by 20, which is what keeps the LEFT edge still.
 *
 * Both are clamped to the viewport, so the header — the only thing that can
 * move it back — can never be dragged off-screen. Double-clicking the header
 * puts the panel back where it opened; `reset` does the same from code, and
 * the caller calls it on close so a reopened dialog starts centred.
 */
export function useDragResize<T extends HTMLElement = HTMLDivElement>({
  draggable = true,
  resizable = true,
  minWidth = 280,
  minHeight = 160,
}: {
  draggable?: boolean;
  resizable?: boolean;
  minWidth?: number;
  minHeight?: number;
} = {}) {
  const ref = useRef<T>(null);
  const [box, setBox] = useState<Box>(HOME);
  const [active, setActive] = useState<Grip | null>(null);
  const latest = useRef(box);
  latest.current = box;

  const reset = useCallback(() => setBox(HOME), []);
  /** Swap in another size, keeping the offset — for a stack whose top level changes. */
  const setSize = useCallback((size: { w?: number; h?: number }) => setBox((b) => ({ dx: b.dx, dy: b.dy, w: size.w, h: size.h })), []);

  const begin = (grip: Grip, e: ReactPointerEvent) => {
    const el = ref.current;
    if (!el || e.button !== 0) return;
    e.preventDefault();
    const r = el.getBoundingClientRect();
    const b0 = latest.current;
    const x0 = e.clientX;
    const y0 = e.clientY;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const onMove = (ev: PointerEvent) => {
      const mx = ev.clientX - x0;
      const my = ev.clientY - y0;
      if (grip === 'move') {
        setBox({ ...b0, dx: b0.dx + clamp(mx, -r.left, vw - r.right), dy: b0.dy + clamp(my, -r.top, vh - r.bottom) });
        return;
      }
      let { left, right, top, bottom } = r;
      if (grip.includes('e')) right = clamp(r.right + mx, r.left + minWidth, vw);
      if (grip.includes('w')) left = clamp(r.left + mx, 0, r.right - minWidth);
      if (grip.includes('s')) bottom = clamp(r.bottom + my, r.top + minHeight, vh);
      if (grip.includes('n')) top = clamp(r.top + my, 0, r.bottom - minHeight);
      setBox({
        dx: b0.dx + (left + right - r.left - r.right) / 2,
        dy: b0.dy + (top + bottom - r.top - r.bottom) / 2,
        // Only the axis being dragged gets a fixed size; the other keeps following its content.
        w: grip.includes('e') || grip.includes('w') ? right - left : b0.w,
        h: grip.includes('n') || grip.includes('s') ? bottom - top : b0.h,
      });
    };
    const onUp = () => {
      setActive(null);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
    };
    setActive(grip);
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
  };

  /** Spread onto the header. Presses on its buttons and fields are left alone. */
  const handleProps = draggable
    ? {
        onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
          if ((e.target as HTMLElement).closest('button, a, input, select, textarea, [contenteditable]')) return;
          begin('move', e);
        },
        onDoubleClick: (e: React.MouseEvent<HTMLElement>) => {
          if (!(e.target as HTMLElement).closest('button, a, input, select, textarea')) reset();
        },
        className: 'cursor-move select-none touch-none',
      }
    : { className: '' };

  // `translate`, not `transform`: it composes with whatever transform the
  // panel already has — an open animation, a stacked level's recede.
  const offsetStyle: CSSProperties = { translate: box.dx || box.dy ? `${box.dx}px ${box.dy}px` : undefined };
  const sizeStyle = sizeToStyle(box);
  /** The panel's own style: the offset, and the size once it has been resized. */
  const style: CSSProperties = { ...offsetStyle, ...sizeStyle };

  /** The edge and corner grips; render inside the panel, which must be `relative` or `absolute`. */
  const grips = resizable
    ? GRIPS.map(({ grip, className }) => (
        <div key={grip} aria-hidden onPointerDown={(e) => begin(grip, e)} className={`absolute z-10 touch-none ${className}`} />
      ))
    : null;

  return {
    ref,
    style,
    offsetStyle,
    sizeStyle,
    size: { w: box.w, h: box.h },
    setSize,
    handleProps,
    grips,
    reset,
    dragging: active !== null,
  };
}

/** A resized size as style. The caps win over it, so a window made smaller never strands the panel past its edge. */
export function sizeToStyle({ w, h }: { w?: number; h?: number }): CSSProperties {
  return {
    ...(w !== undefined && { width: w, maxWidth: 'calc(100vw - 1rem)' }),
    ...(h !== undefined && { height: h, maxHeight: 'calc(100vh - 1rem)' }),
  };
}

/** The corner mark that says "this resizes". Decorative; the grip under it does the work. */
export function ResizeMark() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 10 10"
      className="pointer-events-none absolute bottom-1 right-1 h-2.5 w-2.5 text-slate-300 dark:text-slate-600"
    >
      <path
        d="M9 3 3 9M9 6.5 6.5 9"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
