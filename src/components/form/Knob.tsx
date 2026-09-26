'use client';

import { useRef } from 'react';
import { cn } from '@/lib/cn';

/** The dial sweeps 270°, from -135° (bottom-left) to +135° (bottom-right), measured clockwise from 12 o'clock. */
const START = -135;
const SWEEP = 270;

function point(c: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return `${c + r * Math.sin(rad)} ${c - r * Math.cos(rad)}`;
}

/** An SVG arc from START to `deg`, clockwise. */
function arc(c: number, r: number, deg: number) {
  const large = deg - START > 180 ? 1 : 0;
  return `M ${point(c, r, START)} A ${r} ${r} 0 ${large} 1 ${point(c, r, deg)}`;
}

function decimals(step: number) {
  const s = String(step);
  return s.includes('.') ? s.length - s.indexOf('.') - 1 : 0;
}

export interface KnobProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Diameter in px. The value text scales with it. */
  size?: number;
  /** Arc thickness in px. */
  strokeWidth?: number;
  /** How the value is printed and announced. `{value}` is replaced, e.g. "{value}%". */
  valueTemplate?: string;
  /** Hide the centre text, e.g. when a label beside the knob already shows it. */
  showValue?: boolean;
  disabled?: boolean;
  /** Focusable and announced, but pointer and keys do not change it. */
  readOnly?: boolean;
  /** Accessible name — a dial has no visible label of its own. */
  label?: string;
  className?: string;
}

/**
 * A circular dial: the arc fills clockwise as the value rises.
 *
 * Dragging is ANGLE-based — the value follows where the pointer is around the
 * centre, not how far it has moved vertically. That makes a click land where it
 * is aimed. The cost is the 90° gap at the bottom, where no value lives: a
 * pointer dragged round through it would otherwise snap from max straight to
 * min, so a drag stops at the end it reached, like the real thing.
 */
export default function Knob({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  size = 96,
  strokeWidth = 8,
  valueTemplate = '{value}',
  showValue = true,
  disabled = false,
  readOnly = false,
  label,
  className,
}: KnobProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const span = max - min || 1;
  const clamped = Math.min(max, Math.max(min, value));
  const fraction = (clamped - min) / span;
  const inert = disabled || readOnly;
  const text = valueTemplate.replace('{value}', String(clamped));

  const commit = (raw: number) => {
    const snapped = min + Math.round((Math.min(max, Math.max(min, raw)) - min) / step) * step;
    const next = Number(Math.min(max, snapped).toFixed(decimals(step)));
    if (next !== value) onChange(next);
  };

  const fromPointer = (e: React.PointerEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    // Clockwise from 12 o'clock, in -180..180.
    const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
    let f = (deg - START) / SWEEP;
    // In the dead zone on a fresh press: take the end on the pressed side.
    if (f < 0 || f > 1) f = deg > 0 ? 1 : 0;
    // Mid-drag, a jump of more than half the dial can only mean the pointer
    // went round through the gap — hold the end the value was already at
    // instead of flipping from max to min, as a physical knob would stop.
    if (dragging.current && Math.abs(f - fraction) > 0.5) f = fraction >= 0.5 ? 1 : 0;
    return min + f * span;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (inert || e.button !== 0) return;
    e.preventDefault();
    ref.current?.focus();
    e.currentTarget.setPointerCapture(e.pointerId);
    commit(fromPointer(e));
    dragging.current = true;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragging.current) commit(fromPointer(e));
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    // The last coalesced pointermove can be dropped when the release lands in
    // the same frame; commit the release point so a flick does not stop short.
    if (e.type === 'pointerup') commit(fromPointer(e));
    dragging.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (inert) return;
    const big = Math.max(step, Math.round(span / 10 / step) * step);
    const next: Record<string, number> = {
      ArrowUp: clamped + step,
      ArrowRight: clamped + step,
      ArrowDown: clamped - step,
      ArrowLeft: clamped - step,
      PageUp: clamped + big,
      PageDown: clamped - big,
      Home: min,
      End: max,
    };
    if (!(e.key in next)) return;
    e.preventDefault();
    commit(next[e.key]);
  };

  const c = size / 2;
  const r = c - strokeWidth / 2 - 1;

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={clamped}
      aria-valuetext={text}
      aria-disabled={disabled || undefined}
      aria-readonly={readOnly || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      className={cn(
        'relative inline-block shrink-0 rounded-full touch-none select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
        disabled ? 'opacity-50 cursor-not-allowed' : readOnly ? 'cursor-default' : 'cursor-pointer',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <path
          d={arc(c, r, START + SWEEP)}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="stroke-slate-200 dark:stroke-slate-700"
        />
        {/* A zero-length arc still paints a round-capped dot, which reads as "a little" rather than "none". */}
        {fraction > 0 && (
          <path
            d={arc(c, r, START + fraction * SWEEP)}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="stroke-indigo-600 dark:stroke-indigo-400"
          />
        )}
        {showValue && (
          <text
            x={c}
            y={c}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={Math.max(10, size * 0.2)}
            className="fill-slate-700 dark:fill-slate-200 font-semibold tabular-nums"
          >
            {text}
          </text>
        )}
      </svg>
    </div>
  );
}
