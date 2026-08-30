'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * Two resizable panes with a draggable divider.
 *
 * Sizes are held as a PERCENTAGE of the container, not pixels, so the split
 * survives a window resize instead of drifting toward one edge. `min` and `max`
 * clamp it so neither pane can be dragged out of existence.
 *
 * The drag listeners go on `window`, not the handle: the pointer routinely
 * leaves a 5px divider mid-drag, and a handle-scoped listener drops the gesture
 * the moment it does.
 */
export default function Splitter({
  first,
  second,
  direction = 'horizontal',
  initial = 50,
  min = 15,
  max = 85,
  className,
  onResize,
}: {
  first: React.ReactNode;
  second: React.ReactNode;
  /** `horizontal` splits left|right; `vertical` splits top/bottom. */
  direction?: 'horizontal' | 'vertical';
  /** Starting size of the first pane, as a percentage. */
  initial?: number;
  min?: number;
  max?: number;
  className?: string;
  onResize?: (percent: number) => void;
}) {
  const [percent, setPercent] = useState(initial);
  const [dragging, setDragging] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isH = direction === 'horizontal';

  const move = useCallback(
    (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const raw = isH ? ((e.clientX - r.left) / r.width) * 100 : ((e.clientY - r.top) / r.height) * 100;
      const next = Math.min(Math.max(raw, min), max);
      setPercent(next);
      onResize?.(next);
    },
    [isH, min, max, onResize],
  );

  useEffect(() => {
    if (!dragging) return;
    const stop = () => setDragging(false);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    // A drag that crosses text would otherwise select it, which looks like a bug.
    const prev = document.body.style.userSelect;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = isH ? 'col-resize' : 'row-resize';
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      document.body.style.userSelect = prev;
      document.body.style.cursor = '';
    };
  }, [dragging, move, isH]);

  const nudge = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 2;
    const back = isH ? 'ArrowLeft' : 'ArrowUp';
    const fwd = isH ? 'ArrowRight' : 'ArrowDown';
    if (e.key !== back && e.key !== fwd) return;
    e.preventDefault();
    setPercent((p) => Math.min(Math.max(p + (e.key === fwd ? step : -step), min), max));
  };

  return (
    <div ref={ref} className={cn('flex h-full w-full', isH ? 'flex-row' : 'flex-col', className)}>
      <div className="min-h-0 min-w-0 overflow-auto" style={{ flexBasis: `${percent}%` }}>
        {first}
      </div>

      <div
        role="separator"
        aria-orientation={isH ? 'vertical' : 'horizontal'}
        aria-valuenow={Math.round(percent)}
        aria-valuemin={min}
        aria-valuemax={max}
        tabIndex={0}
        onPointerDown={() => setDragging(true)}
        onKeyDown={nudge}
        className={cn(
          'group relative shrink-0 bg-slate-200 dark:bg-slate-700 transition-colors',
          'hover:bg-indigo-400 focus-visible:bg-indigo-500 focus-visible:outline-none',
          dragging && 'bg-indigo-500',
          isH ? 'w-px cursor-col-resize' : 'h-px cursor-row-resize',
        )}
      >
        {/* A 1px divider is nearly impossible to grab, so an invisible padded
            hit area straddles it. The visible line stays 1px. */}
        <span
          className={cn(
            'absolute',
            isH ? 'inset-y-0 -left-1.5 -right-1.5' : 'inset-x-0 -top-1.5 -bottom-1.5',
          )}
        />
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-auto">{second}</div>
    </div>
  );
}
