'use client';

import { useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useDismiss } from '@/lib/use-dismiss';

/** Hue 0–360, saturation / value / alpha 0–1. */
export type Hsv = { h: number; s: number; v: number; a: number };

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Parse `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa` (the `#` optional) into HSV.
 * Returns null for anything else, so a half-typed hex in the text box is simply
 * ignored rather than snapping the picker to black.
 */
export function hexToHsv(hex: string): Hsv | null {
  let body = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-f]+$/i.test(body) || ![3, 4, 6, 8].includes(body.length)) return null;
  if (body.length <= 4) body = [...body].map((c) => c + c).join('');
  const n = (i: number) => parseInt(body.slice(i, i + 2), 16) / 255;
  const r = n(0);
  const g = n(2);
  const b = n(4);
  const a = body.length === 8 ? n(6) : 1;

  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max ? d / max : 0, v: max, a };
}

/**
 * HSV back to lower-case hex. Alpha is written only when it is below 1 (or
 * when `withAlpha` forces it), so an opaque colour stays the familiar six
 * digits every other system accepts.
 */
export function hsvToHex({ h, s, v, a }: Hsv, withAlpha = a < 1): string {
  const f = (k: number) => {
    const x = (k + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(x, 4 - x, 1));
  };
  const byte = (n: number) => Math.round(clamp01(n) * 255).toString(16).padStart(2, '0');
  return `#${byte(f(5))}${byte(f(3))}${byte(f(1))}${withAlpha ? byte(a) : ''}`;
}

// Grey-on-white checks behind anything translucent. Inline rather than a
// utility because it is a transparency INDICATOR, not a themed surface — it has
// to read as "see-through" identically in both colour schemes.
const CHECKER = 'repeating-conic-gradient(#cbd5e1 0 25%, #f8fafc 0 50%) 0 0 / 8px 8px';

const FALLBACK: Hsv = { h: 239, s: 0.7, v: 0.9, a: 1 };

/**
 * Pointer handling shared by the square and both sliders. Pointer capture keeps
 * the drag alive when the cursor leaves the element (dragging hue past the end
 * of the bar is the normal way to reach 0 or 360), and `touch-none` on the
 * element stops a touch drag from scrolling the page instead.
 */
function drag(update: (fx: number, fy: number) => void) {
  const at = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    update(clamp01((e.clientX - r.left) / r.width), clamp01((e.clientY - r.top) / r.height));
  };
  return {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      // preventDefault suppresses text selection mid-drag, which also skips the
      // browser's focus-on-press — so focus by hand to keep arrow keys working.
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.focus();
      at(e);
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) at(e);
    },
  };
}

/** Arrow-key step for a 0–1 channel: 1%, or 10% with Shift. */
const step = (e: React.KeyboardEvent) => (e.shiftKey ? 0.1 : 0.01);

const THUMB = 'pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]';
const TRACK = 'relative h-3 rounded-full cursor-pointer touch-none outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-800';

function ColorPanel({
  hsv,
  onChange,
  alpha,
  presets,
}: {
  hsv: Hsv;
  onChange: (next: Hsv) => void;
  alpha: boolean;
  presets?: string[];
}) {
  const hex = hsvToHex(hsv, alpha && hsv.a < 1);
  // The text box keeps its own draft while focused: re-deriving it from `hsv`
  // on every keystroke would rewrite "#1a" to "#11aa…" under the cursor.
  const [draft, setDraft] = useState<string | null>(null);
  const pure = `hsl(${hsv.h} 100% 50%)`;
  const opaque = hsvToHex({ ...hsv, a: 1 }, false);

  const svKeys = (e: React.KeyboardEvent) => {
    const d = step(e);
    const moves: Record<string, Partial<Hsv>> = {
      ArrowLeft: { s: clamp01(hsv.s - d) },
      ArrowRight: { s: clamp01(hsv.s + d) },
      ArrowDown: { v: clamp01(hsv.v - d) },
      ArrowUp: { v: clamp01(hsv.v + d) },
    };
    if (!moves[e.key]) return;
    e.preventDefault();
    onChange({ ...hsv, ...moves[e.key] });
  };

  // One handler for both 1-D sliders; `value` and `set` speak 0–1, so hue
  // scales by 360 at the call site.
  const sliderKeys = (value: number, set: (n: number) => void) => (e: React.KeyboardEvent) => {
    const d = step(e);
    const next: Record<string, number> = {
      ArrowLeft: value - d, ArrowDown: value - d, ArrowRight: value + d, ArrowUp: value + d, Home: 0, End: 1,
    };
    if (!(e.key in next)) return;
    e.preventDefault();
    set(clamp01(next[e.key]));
  };

  return (
    <div className="flex w-56 flex-col gap-3">
      <div
        role="slider"
        tabIndex={0}
        aria-label="Saturation and brightness"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsv.s * 100)}
        aria-valuetext={`Saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`}
        onKeyDown={svKeys}
        {...drag((fx, fy) => onChange({ ...hsv, s: fx, v: 1 - fy }))}
        className="relative h-36 cursor-crosshair touch-none rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-800"
        // White fades in from the left (saturation), black from the bottom
        // (value), over the fully-saturated hue — the standard HSV square.
        style={{ background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), ${pure}` }}
      >
        <span className={THUMB} style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: opaque }} />
      </div>

      <div
        role="slider"
        tabIndex={0}
        aria-label="Hue"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(hsv.h)}
        onKeyDown={sliderKeys(hsv.h / 360, (n) => onChange({ ...hsv, h: n * 360 }))}
        {...drag((fx) => onChange({ ...hsv, h: fx * 360 }))}
        className={TRACK}
        style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
      >
        <span className={cn(THUMB, 'top-1/2')} style={{ left: `${(hsv.h / 360) * 100}%`, background: pure }} />
      </div>

      {alpha && (
        <div
          role="slider"
          tabIndex={0}
          aria-label="Opacity"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(hsv.a * 100)}
          aria-valuetext={`${Math.round(hsv.a * 100)}%`}
          onKeyDown={sliderKeys(hsv.a, (a) => onChange({ ...hsv, a }))}
          {...drag((fx) => onChange({ ...hsv, a: fx }))}
          className={TRACK}
          style={{ background: `linear-gradient(to right, transparent, ${opaque}), ${CHECKER}` }}
        >
          <span className={cn(THUMB, 'top-1/2')} style={{ left: `${hsv.a * 100}%`, background: hex }} />
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="h-7 w-7 shrink-0 overflow-hidden rounded-md border border-slate-200 dark:border-slate-700" style={{ background: CHECKER }}>
          <span className="block h-full w-full" style={{ background: hex }} />
        </span>
        <input
          aria-label="Hex colour"
          spellCheck={false}
          autoComplete="off"
          value={draft ?? hex}
          onFocus={() => setDraft(hex)}
          onBlur={() => setDraft(null)}
          onChange={(e) => {
            setDraft(e.target.value);
            const parsed = hexToHsv(e.target.value);
            if (parsed) onChange(parsed);
          }}
          onKeyDown={(e) => {
            // Enter normalises the draft to what was committed; without
            // preventDefault it would also submit the surrounding form.
            if (e.key === 'Enter') {
              e.preventDefault();
              setDraft(hex);
            }
          }}
          className="field-input py-1.5 font-mono uppercase"
        />
      </div>

      {presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Preset colours">
          {presets.map((p) => {
            // Compare normalised, so a preset written `#fff` still lights up.
            const parsed = hexToHsv(p);
            const active = !!parsed && hsvToHex(parsed, alpha && parsed.a < 1) === hex;
            return (
              <button
                key={p}
                type="button"
                title={p}
                aria-label={p}
                aria-pressed={active}
                onClick={() => parsed && onChange(parsed)}
                className={cn(
                  'h-5 w-5 overflow-hidden rounded-md border border-black/10 dark:border-white/15 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
                  active && 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-800',
                )}
                style={{ background: CHECKER }}
              >
                <span className="block h-full w-full" style={{ background: p }} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export interface InputColorProps {
  /** Hex string: `#rrggbb`, or `#rrggbbaa` when `alpha` is on and the colour is translucent. Empty shows the placeholder. */
  value: string;
  onChange: (hex: string) => void;
  /** Adds an opacity slider and lets the emitted hex carry an alpha byte. */
  alpha?: boolean;
  /** Hex swatches shown under the picker, for a house palette. */
  presets?: string[];
  /** Render the picker panel in place, with no trigger or popover. */
  inline?: boolean;
  placeholder?: string;
  disabled?: boolean;
  /** Lands on the trigger, so `<Field>`'s `<label for>` reaches it. */
  id?: string;
  className?: string;
}

/**
 * Colour picker: a swatch-and-hex trigger opening a saturation/value square,
 * hue slider, optional opacity slider, hex box and preset row.
 *
 * The picker keeps its OWN hsv state rather than re-deriving from `value`
 * every render. Hex cannot represent hue at zero saturation or zero brightness,
 * so a derived picker would fling the hue slider to red the moment the square
 * is dragged into a corner. The incoming value is re-read only when it changes
 * to something this picker did not just emit.
 */
export default function InputColor({
  value,
  onChange,
  alpha = false,
  presets,
  inline = false,
  placeholder = 'Pick a colour',
  disabled = false,
  id,
  className,
}: InputColorProps) {
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(value) ?? FALLBACK);
  const [seen, setSeen] = useState(value);
  // Adjust-state-during-render (React's documented alternative to a syncing
  // effect): no extra paint with the stale colour, no effect loop.
  if (value !== seen) {
    setSeen(value);
    const next = hexToHsv(value);
    if (next && hsvToHex(next, alpha) !== hsvToHex(hsv, alpha)) setHsv(next);
  }

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const close = () => setOpen(false);
  useDismiss(ref, open, close, () => {
    close();
    triggerRef.current?.focus();
  });

  const commit = (next: Hsv) => {
    const n = alpha ? next : { ...next, a: 1 };
    setHsv(n);
    const hex = hsvToHex(n);
    setSeen(hex);
    onChange(hex);
  };

  const panel = <ColorPanel hsv={hsv} onChange={commit} alpha={alpha} presets={presets} />;

  if (inline) {
    return <div className={cn('panel panel-solid inline-block p-3', className)}>{panel}</div>;
  }

  const valid = hexToHsv(value) !== null;

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="field-input flex items-center gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="h-4 w-4 shrink-0 overflow-hidden rounded border border-black/10 dark:border-white/15" style={{ background: CHECKER }}>
          {valid && <span className="block h-full w-full" style={{ background: value }} />}
        </span>
        <span className={cn('flex-1 truncate', valid ? 'font-mono uppercase' : 'text-slate-400 dark:text-slate-500')}>
          {valid ? value : placeholder}
        </span>
        <ChevronDown aria-hidden className={cn('h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div id={panelId} role="dialog" aria-label="Colour picker" className="absolute left-0 z-50 mt-1 panel panel-solid p-3 animate-fade-in">
          {panel}
        </div>
      )}
    </div>
  );
}
