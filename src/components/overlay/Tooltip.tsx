'use client';

import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  placeTooltip,
  type TooltipCoords,
  type TooltipPlacement,
} from '@/lib/tooltip-position';

/**
 * The one tooltip primitive. Hint and helper copy lives in here rather than
 * under the field it explains, so a form reads as a form.
 *
 * Three things drive the implementation:
 *
 * - It renders through a PORTAL with `position: fixed`. Half the anchors on this
 *   platform sit inside `overflow-x-auto custom-scrollbar` table shells, and
 *   CSS computes the other axis to `auto` as soon as one is not `visible` — so
 *   an absolutely-positioned bubble would be clipped by its own scroll box.
 *   A portal also puts it above the Drawer's `z-50` overlay without a z-index
 *   race.
 * - It opens on hover AND on focus, and closes on Escape. Focus is what makes it
 *   keyboard-reachable; hover alone would hide the copy from anyone tabbing.
 *   Hover and focus are tracked separately so moving the mouse away does not
 *   close a bubble the keyboard is still holding open.
 * - The trigger gets `aria-describedby` pointing at the bubble, which is where
 *   the text now lives for a screen reader too. That's the part that makes this
 *   a move rather than a deletion.
 *
 * `pointer-events-none` on the bubble is deliberate: a tooltip that can be
 * hovered can trap the pointer and flicker against its own trigger.
 *
 * MERGED from two copies. This is bonus-adjustment's implementation — it is the
 * one that flips on overflow, opens on focus, closes on Escape and wires
 * `aria-describedby`, none of which the marketing-stats copy did. Three
 * PRESENTATION props came across from that copy so its call sites can migrate:
 * `variant`, `wide` and `multiline`.
 *
 * One default deliberately did NOT come across. marketing-stats defaulted to a
 * single-line `whitespace-nowrap` bubble and treated wrapping as opt-in
 * (`multiline`); this one wraps inside a max-width and always did. Wrapping
 * stays the default, because a long hint in a nowrap bubble runs off the
 * viewport. `multiline={false}` is there for the genuinely short labels that
 * want one line.
 */
export type { TooltipPlacement };

export type TooltipVariant = 'dark' | 'light';

export default function Tooltip({
  content,
  children,
  placement = 'top',
  className,
  variant = 'dark',
  wide = false,
  multiline = true,
}: {
  /** The hint itself. Takes nodes, so copy carrying <code> survives the move. */
  content: React.ReactNode;
  /** The trigger. Must be focusable to be keyboard-reachable — see InfoTooltip. */
  children: React.ReactNode;
  placement?: TooltipPlacement;
  /** Applied to the inline wrapper, not the bubble. */
  className?: string;
  /**
   * 'light' is a pale bubble with dark text, for use ON a dark surface where the
   * default near-black bubble disappears into its background.
   */
  variant?: TooltipVariant;
  /** Widens the wrap width from 16rem to 28rem, for longer help copy. */
  wide?: boolean;
  /**
   * Wrapping. Defaults ON. Set false for a short label that should stay on one
   * line — note this inverts marketing-stats' default, which was nowrap.
   */
  multiline?: boolean;
}) {
  const id = useId();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [coords, setCoords] = useState<TooltipCoords | null>(null);

  const open = (hovered || focused) && !dismissed && content != null && content !== '';

  const measure = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    setCoords(
      placeTooltip(el.getBoundingClientRect(), placement, {
        width: window.innerWidth,
        height: window.innerHeight,
      }),
    );
  }, [placement]);

  useEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    measure();
    // Capture phase so a scroll inside a table shell repositions too, not just
    // the window's own.
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [open, measure]);

  const show = () => setDismissed(false);

  const trigger = isValidElement(children)
    ? cloneElement(children as React.ReactElement<{ 'aria-describedby'?: string }>, {
        'aria-describedby': open ? id : undefined,
      })
    : children;

  return (
    <>
      <span
        ref={anchorRef}
        className={cn('inline-flex', className)}
        onMouseEnter={() => {
          show();
          setHovered(true);
        }}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => {
          show();
          setFocused(true);
        }}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setDismissed(true);
        }}
      >
        {trigger}
      </span>

      {open &&
        coords &&
        createPortal(
          <span
            id={id}
            role="tooltip"
            style={{ top: coords.top, left: coords.left, transform: coords.transform }}
            className={cn(
              `fixed z-[200] pointer-events-none w-max rounded-lg text-[11px] leading-relaxed
               px-2.5 py-1.5 shadow-lg text-left font-normal normal-case tracking-normal`,
              multiline
                ? cn('whitespace-normal', wide ? 'max-w-[28rem]' : 'max-w-[16rem]')
                : 'whitespace-nowrap',
              variant === 'light'
                ? 'bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100'
                : 'bg-slate-900 dark:bg-slate-700 text-white',
            )}
          >
            {content}
          </span>,
          document.body,
        )}
    </>
  );
}

/**
 * The ⓘ affordance: the shape every migrated hint takes. Sits next to the label
 * or control the copy used to sit under.
 *
 * `preventDefault` on click is load-bearing — several of these live inside a
 * <label> or a click-to-edit row, where a bare button would toggle the checkbox
 * or open a cell editor on the way past.
 */
export function InfoTooltip({
  content,
  label = 'More information',
  placement = 'top',
  className,
  iconClassName,
  variant,
  wide,
}: {
  content: React.ReactNode;
  /** Accessible name for the trigger. Override where "more information" is vague. */
  label?: string;
  placement?: TooltipPlacement;
  className?: string;
  iconClassName?: string;
  variant?: TooltipVariant;
  /** Help copy behind an ⓘ is usually the long kind — see Tooltip's `wide`. */
  wide?: boolean;
}) {
  return (
    <Tooltip
      content={content}
      placement={placement}
      variant={variant}
      wide={wide}
      className={cn('align-middle', className)}
    >
      <button
        type="button"
        aria-label={label}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="inline-flex items-center justify-center rounded text-slate-400 hover:text-slate-600
                   dark:text-slate-500 dark:hover:text-slate-300 transition-colors
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
      >
        <Info className={cn('w-3.5 h-3.5', iconClassName)} aria-hidden />
      </button>
    </Tooltip>
  );
}
