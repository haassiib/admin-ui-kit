'use client';

import { useRef } from 'react';
import { cn } from '@/lib/cn';

export type SliderValue = number | [number, number];

export interface SliderProps {
  /**
   * A number for one thumb, a `[low, high]` pair for a range. `onChange` hands
   * back the same shape it was given, so the caller never has to narrow.
   */
  value: SliderValue;
  onChange: (value: SliderValue) => void;
  min?: number;
  max?: number;
  /** Values snap to `min + n * step`. Fractional steps are fine (0.1, 0.25). */
  step?: number;
  /** Print the current value(s) beside the track, through `formatValue`. */
  showValue?: boolean;
  /** Formats the readout AND `aria-valuetext` — "40%" is read out, not "40". */
  formatValue?: (value: number) => string;
  disabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
  /** Accessible name for a single thumb. A range labels its thumbs with `thumbLabels`. */
  label?: string;
  thumbLabels?: [string, string];
  className?: string;
}

/** Round away the float noise that `0.1 + 0.2` leaves behind, to the step's precision. */
function decimals(step: number) {
  const s = String(step);
  return s.includes('.') ? s.length - s.indexOf('.') - 1 : 0;
}

/**
 * Single-value or range slider.
 *
 * The thumbs are the focusable `role="slider"` elements — a range is two
 * sliders, one per thumb, which is what the ARIA pattern specifies and what a
 * screen reader expects ("Minimum, 20" then "Maximum, 80"). The track takes the
 * pointer: a press anywhere on it moves the NEAREST thumb there and keeps
 * dragging it, so the whole bar is a target rather than a 16px circle.
 */
export default function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  showValue = false,
  formatValue = String,
  disabled = false,
  orientation = 'horizontal',
  label,
  thumbLabels = ['Minimum', 'Maximum'],
  className,
}: SliderProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<Array<HTMLDivElement | null>>([]);
  /** Index being dragged; -1 = two thumbs stacked, decided by the first move. */
  const dragRef = useRef<number | null>(null);

  const isRange = Array.isArray(value);
  const values: number[] = isRange ? [value[0], value[1]] : [value];
  const vertical = orientation === 'vertical';
  const span = max - min || 1;
  const pct = (v: number) => ((Math.min(max, Math.max(min, v)) - min) / span) * 100;

  const snap = (v: number) => {
    const clamped = Math.min(max, Math.max(min, v));
    const snapped = min + Math.round((clamped - min) / step) * step;
    return Number(Math.min(max, snapped).toFixed(decimals(step)));
  };

  /**
   * Commit a new value for one thumb. A range thumb is clamped at its partner
   * rather than allowed to cross it — swapping them mid-drag would move focus
   * out from under the keyboard user and flip which thumb is "low".
   */
  const commit = (index: number, raw: number) => {
    let next = snap(raw);
    if (!isRange) {
      if (next !== value) onChange(next);
      return;
    }
    const [lo, hi] = values;
    if (index === 0) next = Math.min(next, hi);
    else next = Math.max(next, lo);
    const pair: [number, number] = index === 0 ? [next, hi] : [lo, next];
    if (pair[0] !== lo || pair[1] !== hi) onChange(pair);
  };

  const valueAt = (clientX: number, clientY: number) => {
    const rect = railRef.current!.getBoundingClientRect();
    const ratio = vertical
      ? (rect.bottom - clientY) / (rect.height || 1)
      : (clientX - rect.left) / (rect.width || 1);
    return min + Math.min(1, Math.max(0, ratio)) * span;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    // Without this the drag also selects the page's text and, on touch, the
    // browser treats it as the start of a scroll.
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    const v = valueAt(e.clientX, e.clientY);
    let index = 0;
    if (isRange) {
      const [lo, hi] = values;
      if (lo === hi) {
        // Stacked thumbs: which one the user "meant" is only knowable from the
        // direction they drag, so defer — otherwise the low thumb wins, is
        // clamped at its partner, and the drag appears stuck.
        index = v > hi ? 1 : v < lo ? 0 : -1;
      } else {
        index = Math.abs(v - lo) <= Math.abs(v - hi) ? 0 : 1;
      }
    }
    dragRef.current = index;
    if (index !== -1) {
      commit(index, v);
      thumbRefs.current[index]?.focus();
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current === null) return;
    const v = valueAt(e.clientX, e.clientY);
    if (dragRef.current === -1) {
      if (snap(v) === values[0]) return;
      dragRef.current = v < values[0] ? 0 : 1;
      thumbRefs.current[dragRef.current]?.focus();
    }
    commit(dragRef.current, v);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current === null) return;
    // Browsers coalesce pointermoves to the frame, and the last one can be
    // dropped when the release lands in the same frame — commit the release
    // point too, or a quick flick stops short of where the pointer let go.
    if (e.type === 'pointerup' && dragRef.current !== -1) commit(dragRef.current, valueAt(e.clientX, e.clientY));
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const onKeyDown = (index: number) => (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const current = values[index];
    const big = Math.max(step, snap(min + span / 10) - min);
    // Home/End go to the ends of the range this thumb may occupy, which for a
    // range thumb is its partner, not the track's end.
    const floor = isRange && index === 1 ? values[0] : min;
    const ceil = isRange && index === 0 ? values[1] : max;
    const next: Record<string, number> = {
      ArrowRight: current + step,
      ArrowUp: current + step,
      ArrowLeft: current - step,
      ArrowDown: current - step,
      PageUp: current + big,
      PageDown: current - big,
      Home: floor,
      End: ceil,
    };
    if (!(e.key in next)) return;
    e.preventDefault();
    commit(index, next[e.key]);
  };

  const [lo, hi] = isRange ? [pct(values[0]), pct(values[1])] : [0, pct(values[0])];
  const fillStyle: React.CSSProperties = vertical
    ? { bottom: `${lo}%`, height: `${hi - lo}%` }
    : { left: `${lo}%`, width: `${hi - lo}%` };

  const readout = values.map(formatValue).join(' – ');
  // Reserve the readout's widest possible width up front. Sized to the current
  // text, it grows as the value crosses 99 → 100, the rail shrinks under the
  // pointer, and the value being dragged shifts by itself.
  const widest = Math.max(formatValue(min).length, formatValue(max).length);
  const readoutWidth = `${(isRange ? widest * 2 + 3 : widest) + 1}ch`;

  return (
    <div
      className={cn(
        'flex gap-3 text-xs',
        vertical ? 'flex-col items-center h-40' : 'items-center w-full',
        disabled && 'opacity-50',
        className,
      )}
    >
      <div
        // The padded wrapper is the pointer target; the thin rail inside it is
        // what positions are measured against, so the padding widens the hit
        // area without skewing the value under the pointer.
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={cn(
          'relative touch-none select-none',
          vertical ? 'h-full px-2 py-2' : 'flex-1 py-2 px-2',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        )}
      >
        <div
          ref={railRef}
          className={cn(
            'relative rounded-full bg-slate-200 dark:bg-slate-700',
            vertical ? 'h-full w-1.5' : 'h-1.5 w-full',
          )}
        >
          <div
            className={cn(
              'absolute rounded-full bg-indigo-600 dark:bg-indigo-500',
              vertical ? 'left-0 w-full' : 'top-0 h-full',
            )}
            style={fillStyle}
          />
          {values.map((v, i) => {
            const at = pct(v);
            return (
              <div
                key={i}
                ref={(el) => {
                  thumbRefs.current[i] = el;
                }}
                role="slider"
                tabIndex={disabled ? -1 : 0}
                aria-label={isRange ? thumbLabels[i] : label}
                aria-valuemin={isRange && i === 1 ? values[0] : min}
                aria-valuemax={isRange && i === 0 ? values[1] : max}
                aria-valuenow={v}
                aria-valuetext={formatValue(v)}
                aria-orientation={orientation}
                aria-disabled={disabled || undefined}
                onKeyDown={onKeyDown(i)}
                className={cn(
                  'absolute h-4 w-4 rounded-full border-2 shadow-sm transition-shadow',
                  'bg-white border-indigo-600 dark:bg-slate-900 dark:border-indigo-400',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900',
                  vertical ? 'left-1/2 -translate-x-1/2 translate-y-1/2' : 'top-1/2 -translate-x-1/2 -translate-y-1/2',
                  !disabled && 'hover:shadow-md active:cursor-grabbing',
                )}
                style={vertical ? { bottom: `${at}%` } : { left: `${at}%` }}
              />
            );
          })}
        </div>
      </div>

      {showValue && (
        <span
          className={cn(
            'shrink-0 whitespace-nowrap tabular-nums font-semibold text-slate-700 dark:text-slate-200',
            vertical ? 'text-center' : 'text-right',
          )}
          style={{ minWidth: readoutWidth }}
          aria-hidden
        >
          {readout}
        </span>
      )}
    </div>
  );
}
