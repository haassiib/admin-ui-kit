'use client';

import { useCallback, useId, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useDismiss } from '@/lib/use-dismiss';
import Tooltip, { type TooltipPlacement } from './Tooltip';

export type SpeedDialAction = {
  label: string;
  /** An icon component (a lucide icon, say), sized by the dial. */
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  disabled?: boolean;
};

/*
 * Each direction as an angle in SCREEN coordinates (y grows downward), so
 * `up` is -90°. Linear and circular layouts both come from this one table:
 * linear walks outward along the angle, the arcs are centred on it.
 */
const ANGLE = {
  up: -90,
  down: 90,
  left: 180,
  right: 0,
  'up-left': -135,
  'up-right': -45,
  'down-left': 135,
  'down-right': 45,
} as const;

/** Degrees of arc each circular type spreads its actions across. */
const SPAN = { circle: 360, 'semi-circle': 180, 'quarter-circle': 90 } as const;

const MAIN = 48; // h-12
const ACTION = 36; // h-9
const GAP = 8;

export type SpeedDialDirection = keyof typeof ANGLE;
export type SpeedDialType = 'linear' | keyof typeof SPAN;

function offsets(n: number, type: SpeedDialType, direction: SpeedDialDirection, radius: number) {
  const centre = ANGLE[direction];
  const rad = (d: number) => (d * Math.PI) / 180;
  if (type === 'linear') {
    const first = MAIN / 2 + GAP + ACTION / 2;
    return Array.from({ length: n }, (_, i) => {
      const d = first + i * (ACTION + GAP);
      return { x: Math.cos(rad(centre)) * d, y: Math.sin(rad(centre)) * d };
    });
  }
  const span = SPAN[type];
  return Array.from({ length: n }, (_, i) => {
    // A full circle divides by n (the last point would land on the first); an
    // arc divides by n-1 so its two ends sit exactly on the arc's ends.
    const a = span === 360 ? centre + (360 / n) * i : n === 1 ? centre : centre - span / 2 + (span / (n - 1)) * i;
    return { x: Math.cos(rad(a)) * radius, y: Math.sin(rad(a)) * radius };
  });
}

/** Put the label on the side AWAY from the fan, so it never covers a neighbour. */
function tooltipSide(x: number, y: number): TooltipPlacement {
  if (Math.abs(x) < 1 && Math.abs(y) < 1) return 'top';
  if (Math.abs(y) >= Math.abs(x)) return x > 1 ? 'right' : 'left';
  return y < 0 ? 'top' : 'bottom';
}

export interface SpeedDialProps {
  actions: SpeedDialAction[];
  /** Which way the actions fan out. The diagonals suit `quarter-circle` in a corner. */
  direction?: SpeedDialDirection;
  type?: SpeedDialType;
  /** Distance from the main button's centre to each action's, for the circular types. */
  radius?: number;
  /** Dim the page behind an open dial; a click on the dim closes it. */
  mask?: boolean;
  /** Controlled open state. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Accessible name for the main button. */
  'aria-label'?: string;
  /** Positions the dial's root — `absolute bottom-4 right-4`, say. It does not position itself. */
  className?: string;
}

/**
 * A floating action button that fans out into a handful of related actions.
 *
 * It renders WHERE IT IS PLACED and positions nothing itself: the caller puts
 * it in a corner with `className`. A dial that forced `position: fixed` would
 * escape the panel it belongs to and could not be demonstrated inside one.
 *
 * Every layout is the same arithmetic — an (x, y) offset from the main
 * button's centre, applied as a transform — so linear and the three arcs share
 * one transition. The stagger runs outward on open and inward on close, which
 * is what makes it read as the actions coming from, and returning to, the
 * button. Closed actions are `inert`, so they are neither clickable nor
 * reachable by Tab while invisible.
 *
 * Menu semantics: the main button has `aria-haspopup="menu"`, `aria-expanded`
 * and `aria-controls`; the actions are `menuitem`s with arrow-key navigation.
 * Opening from the keyboard moves focus to the first action, and Escape closes
 * and puts it back on the main button. Each action is labelled by `aria-label`
 * — the Tooltip is the sighted equivalent, not the accessible name.
 *
 * The root sits in the z-50 in-flow band, so an open fan paints over the
 * content around it; `mask` is a fixed dim INSIDE that same layer, beneath the
 * buttons.
 */
export default function SpeedDial({
  actions,
  direction = 'up',
  type = 'linear',
  radius = 80,
  mask = false,
  open: openProp,
  onOpenChange,
  'aria-label': ariaLabel = 'Actions',
  className,
}: SpeedDialProps) {
  const menuId = useId();
  const [internal, setInternal] = useState(false);
  const open = openProp ?? internal;
  const rootRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setInternal(next);
      onOpenChange?.(next);
    },
    [openProp, onOpenChange],
  );
  const close = useCallback(() => setOpen(false), [setOpen]);
  const escape = useCallback(() => {
    setOpen(false);
    mainRef.current?.focus();
  }, [setOpen]);
  useDismiss(rootRef, open, close, escape);

  const points = offsets(actions.length, type, direction, radius);
  const enabled = actions.map((a, i) => (a.disabled ? -1 : i)).filter((i) => i !== -1);

  const focusAt = (i: number | undefined) => {
    if (i !== undefined) itemRefs.current[i]?.focus();
  };

  /*
   * For a linear dial the arrow pointing along the fan moves outward, so the
   * keys match what the eye sees. Arcs have no single outward arrow, so
   * Right/Down go forward and Left/Up go back.
   */
  const forward = (key: string) => {
    if (type !== 'linear')
      return key === 'ArrowRight' || key === 'ArrowDown' ? 1 : key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 0;
    const a = ANGLE[direction];
    const out =
      Math.abs(Math.sin((a * Math.PI) / 180)) > 0.5
        ? a < 0
          ? 'ArrowUp'
          : 'ArrowDown'
        : Math.abs(a) > 90
          ? 'ArrowLeft'
          : 'ArrowRight';
    const back = { ArrowUp: 'ArrowDown', ArrowDown: 'ArrowUp', ArrowLeft: 'ArrowRight', ArrowRight: 'ArrowLeft' }[out];
    return key === out ? 1 : key === back ? -1 : 0;
  };

  const onMenuKey = (e: React.KeyboardEvent) => {
    const current = itemRefs.current.findIndex((el) => el === document.activeElement);
    const pos = enabled.indexOf(current);
    let next: number | undefined;
    const step = forward(e.key);
    if (step) next = enabled[(pos + step + enabled.length) % enabled.length];
    else if (e.key === 'Home') next = enabled[0];
    else if (e.key === 'End') next = enabled[enabled.length - 1];
    if (next === undefined) return;
    e.preventDefault();
    focusAt(next);
  };

  return (
    // Two boxes because `cn()` does not merge: a `relative` here would beat the
    // caller's `absolute` (Tailwind emits `relative` later), so the caller's
    // positioning goes on the outer box and the fan's origin on the inner one.
    // z-50 on both — the outer one counts when the caller positions it, the
    // inner one when they do not.
    <div ref={rootRef} className={cn('z-50 inline-flex', className)}>
      <div className="relative z-50 h-12 w-12">
        {mask && (
          <div
            aria-hidden
            onClick={close}
            className={cn(
              'fixed inset-0 bg-slate-900/30 transition-opacity duration-200 dark:bg-black/50',
              open ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
          />
        )}

        <ul
          id={menuId}
          role="menu"
          aria-label={ariaLabel}
          inert={!open}
          onKeyDown={onMenuKey}
          className="pointer-events-none absolute inset-0 m-0 list-none p-0"
        >
          {actions.map((a, i) => {
            const { x, y } = points[i];
            const Icon = a.icon;
            // Outward on open, inward on close: the farthest action leaves last
            // and comes home first.
            const delay = open ? i * 35 : (actions.length - 1 - i) * 25;
            return (
              <li
                key={i}
                role="none"
                className="absolute left-1/2 top-1/2 transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none"
                style={{
                  transitionDelay: `${delay}ms`,
                  transform: open
                    ? `translate(-50%, -50%) translate(${x}px, ${y}px) scale(1)`
                    : 'translate(-50%, -50%) scale(0.4)',
                  opacity: open ? 1 : 0,
                }}
              >
                <Tooltip content={a.label} placement={tooltipSide(x, y)} multiline={false}>
                  <button
                    ref={(el) => {
                      itemRefs.current[i] = el;
                    }}
                    type="button"
                    role="menuitem"
                    tabIndex={-1}
                    aria-label={a.label}
                    disabled={a.disabled}
                    onClick={() => {
                      setOpen(false);
                      mainRef.current?.focus();
                      a.onClick?.();
                    }}
                    className={cn(
                      'pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-colors',
                      'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-indigo-600',
                      'dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-indigo-300',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </button>
                </Tooltip>
              </li>
            );
          })}
        </ul>

        <button
          ref={mainRef}
          type="button"
          aria-label={ariaLabel}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={(e) => {
            const next = !open;
            setOpen(next);
            // `detail === 0` is Enter/Space: keyboard users land on the first
            // action (after the fan has rendered un-inert); a mouse user keeps focus here.
            if (next && e.detail === 0) requestAnimationFrame(() => focusAt(enabled[0]));
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault();
              if (!open) setOpen(true);
              requestAnimationFrame(() => focusAt(enabled[0]));
            }
          }}
          className={cn(
            'relative flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-colors',
            'hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2',
            'dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:focus-visible:ring-offset-slate-900',
          )}
        >
          {/* Plus turned 45° IS an ×, so one icon animates between the two
            states instead of cross-fading two. */}
          <Plus className={cn('h-5 w-5 transition-transform duration-200', open && 'rotate-45')} aria-hidden />
        </button>
      </div>
    </div>
  );
}
