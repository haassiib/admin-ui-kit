import { useEffect, useRef, type RefObject } from 'react';

/**
 * Close a floating panel on a click outside it or on Escape.
 *
 * ONE implementation, because there were thirteen. Every dropdown, calendar and
 * menu in the kit had grown its own `mousedown` listener, and about half of
 * them had forgotten Escape — so whether a picker closed on Escape depended on
 * which source app it came from. The hook makes both behaviours the same
 * everywhere, and a new popover gets them in one line.
 *
 * `refs` is the set of elements that count as INSIDE. Usually one — the
 * container that holds both trigger and panel. A portalled panel is not a DOM
 * descendant of its trigger, so it passes both refs and a click on either is
 * not "outside".
 *
 * Listeners are attached only while `active`, so a closed panel costs nothing
 * and an Escape pressed elsewhere on the page is never swallowed. Pass the same
 * `onDismiss` for both events; a component that wants Escape to do something
 * different (step back a level, say) supplies `onEscape`.
 */
export function useDismiss(
  refs: RefObject<HTMLElement | null> | Array<RefObject<HTMLElement | null>>,
  active: boolean,
  onDismiss: () => void,
  onEscape: () => void = onDismiss,
  /**
   * Treat every `[data-overlay]` surface as inside, and leave Escape to an
   * open `[data-overlay="panel"]`. For a popover that opens an
   * `AnchoredPanel` beside itself and must stay open while that form is in
   * use — a click in the form is not a click outside the popover that
   * opened it, and one Escape should close the form, not both.
   */
  ignoreOverlays = false,
) {
  // The callbacks are read through a ref, so an inline arrow — which is what
  // nearly every caller passes — does not re-subscribe both listeners on every
  // render (DateRangePicker re-renders on each day the pointer crosses).
  const latest = useRef({ refs, onDismiss, onEscape, ignoreOverlays });
  latest.current = { refs, onDismiss, onEscape, ignoreOverlays };

  useEffect(() => {
    if (!active) return;
    const onDown = (e: MouseEvent) => {
      const { refs, onDismiss, ignoreOverlays } = latest.current;
      const list = Array.isArray(refs) ? refs : [refs];
      const target = e.target as Node;
      if (list.some((r) => r.current?.contains(target))) return;
      if (ignoreOverlays && target instanceof Element && target.closest('[data-overlay]')) return;
      onDismiss();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const { onEscape, ignoreOverlays } = latest.current;
      if (ignoreOverlays && document.querySelector('[data-overlay="panel"]')) return;
      onEscape();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [active]);
}
