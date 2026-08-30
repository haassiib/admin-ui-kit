'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TriangleAlert } from 'lucide-react';

/**
 * A confirm step that opens next to its trigger instead of taking the whole
 * screen. Used for destructive row actions, where a full modal is heavier than
 * the decision warrants.
 *
 * PORTALLED and `position: fixed`, not absolute. Its triggers sit inside table
 * shells that are `overflow-hidden` (to keep a panel's rounded corners) or
 * `overflow-x-auto` (to scroll a wide table) — and CSS computes the other axis
 * to `auto` once one is not `visible`. An absolutely-positioned panel therefore
 * OPENED BUT WAS CLIPPED, which reads exactly like a broken button.
 *
 * Two refs, not one: with the panel in a portal it is no longer a DOM
 * descendant of the trigger, so an outside-click check against the trigger
 * alone would close the panel on the very click that hit Confirm.
 *
 * MERGED from two copies. bonus-adjustment's is the base — it is the one that
 * portals, so it cannot be clipped by the `overflow-hidden` table shell its
 * triggers live in. `variant` and `cancelText` came across from
 * marketing-stats: this confirm is not always destructive (publishing, or
 * releasing a batch, is a confirm too), and a rose Confirm button on a
 * non-destructive action miscolours the decision.
 */
const PANEL_WIDTH = 256; // w-64
const EDGE = 8;
const GAP = 4;

export default function ConfirmPopover({
  onConfirm,
  children,
  title = 'Are you sure?',
  description = 'This cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'destructive',
}: {
  onConfirm: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  /**
   * Tones the warning icon and the Confirm button. Defaults to `destructive`,
   * which is what most row actions behind this are — `default` is for a confirm
   * that is merely significant rather than irreversible.
   */
  variant?: 'destructive' | 'default';
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // Right-aligned to the trigger, then clamped so a button near either edge
    // still shows the whole panel.
    const left = Math.min(
      Math.max(r.right - PANEL_WIDTH, EDGE),
      Math.max(EDGE, window.innerWidth - PANEL_WIDTH - EDGE),
    );
    setPos({ top: r.bottom + GAP, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    // `true` for capture: a scroll inside the table's own scroll box does not
    // bubble, and that is exactly the container these triggers live in.
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // `inline-flex`, not `inline-block`, on BOTH the root and the trigger.
  //
  // Inline-block put the child button on a text baseline, so a trash icon in a
  // row of icon buttons sat a couple of pixels lower than its neighbours — the
  // others being flex-centred. Flex on both makes the trigger fill the root and
  // centre whatever it wraps, so a caller's icon lines up with any sibling.
  return (
    <div className="relative inline-flex" ref={triggerRef}>
      <span
        onClick={() => setOpen((o) => !o)}
        className="inline-flex w-full items-center justify-center cursor-pointer"
      >
        {children}
      </span>

      {open &&
        pos &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="false"
            aria-label={title}
            style={{ top: pos.top, left: pos.left, width: PANEL_WIDTH }}
            className="fixed z-[200] panel p-3 text-left"
          >
            <div className="flex items-start gap-2">
              <TriangleAlert
                className={
                  variant === 'destructive'
                    ? 'w-4 h-4 text-rose-500 shrink-0 mt-0.5'
                    : 'w-4 h-4 text-indigo-500 shrink-0 mt-0.5'
                }
              />
              <div>
                <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
                {cancelText}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => {
                  setOpen(false);
                  onConfirm();
                }}
                className={
                  variant === 'destructive'
                    ? 'btn-primary bg-rose-600 hover:bg-rose-700'
                    : 'btn-primary'
                }
              >
                {confirmText}
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
