/**
 * Where a tooltip bubble goes, as arithmetic.
 *
 * Split out of the component and kept free of `window` so it can be tested in
 * bare Node — the same reason `bo/types.ts` and `bo/totp.ts` carry no
 * dependencies. The caller passes the trigger rect and the viewport; nothing in
 * here touches the DOM.
 *
 * The bubble is positioned `fixed` and centred with a CSS transform, so this
 * returns an anchor point plus the transform that pulls the bubble onto it.
 * That is what lets the maths run without having measured the bubble.
 */

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

/** The fields of a DOMRect this needs — so a real DOMRect satisfies it. */
export type TooltipRect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
};

export type TooltipViewport = { width: number; height: number };

export type TooltipCoords = { top: number; left: number; transform: string };

/** Distance between the trigger's edge and the bubble, in px. */
export const TOOLTIP_GAP = 8;
/** Must match `max-w-[16rem]` on the bubble — the clamp works off its half. */
export const TOOLTIP_MAX_WIDTH = 256;
/** Keep this much clear of the viewport edge. */
export const TOOLTIP_EDGE = 8;
/** Below this much room, a top/bottom bubble flips to the other side. */
export const TOOLTIP_FLIP_THRESHOLD = 96;

/**
 * A `top` bubble with nothing above it (a hint on a drawer's first field) flips
 * below rather than running off-screen, and vice versa. Left and right never
 * flip: a horizontal hint is placed against a column edge deliberately.
 */
export function resolvePlacement(
  rect: TooltipRect,
  placement: TooltipPlacement,
  viewport: TooltipViewport,
): TooltipPlacement {
  if (placement === 'top' && rect.top < TOOLTIP_FLIP_THRESHOLD) return 'bottom';
  if (placement === 'bottom' && viewport.height - rect.bottom < TOOLTIP_FLIP_THRESHOLD) return 'top';
  return placement;
}

export function placeTooltip(
  rect: TooltipRect,
  placement: TooltipPlacement,
  viewport: TooltipViewport,
): TooltipCoords {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const resolved = resolvePlacement(rect, placement, viewport);

  if (resolved === 'left' || resolved === 'right') {
    return {
      top: centerY,
      left: resolved === 'left' ? rect.left - TOOLTIP_GAP : rect.right + TOOLTIP_GAP,
      transform: resolved === 'left' ? 'translate(-100%, -50%)' : 'translate(0, -50%)',
    };
  }

  // Clamped on the bubble's worst-case half-width, so a hint on the last column
  // of a wide table cannot push its own bubble off the right edge. A viewport
  // too narrow to hold the clamp centres instead of inverting.
  const half = TOOLTIP_MAX_WIDTH / 2;
  const min = TOOLTIP_EDGE + half;
  const max = viewport.width - TOOLTIP_EDGE - half;
  const left = max < min ? viewport.width / 2 : Math.min(Math.max(centerX, min), max);

  return {
    top: resolved === 'top' ? rect.top - TOOLTIP_GAP : rect.bottom + TOOLTIP_GAP,
    left,
    transform: resolved === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
  };
}
