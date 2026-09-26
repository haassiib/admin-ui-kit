/**
 * THE PALETTE — every tone a select option, a colouring rule or a pill can
 * carry, and the classes that draw it.
 *
 * ── Tone is data, class is view ─────────────────────────────────────────────
 *
 * A colouring rule and a select option each carry a TONE NAME (`'sky'`,
 * `'orange'`), never a colour. The Tailwind classes for each name live here,
 * once, so the grid, a pill and a colour swatch cannot disagree about what
 * `amber` looks like.
 *
 * ── Whole class strings, never interpolated ─────────────────────────────────
 *
 * Tailwind scans source TEXT for class names, so `bg-${tone}-50` compiles to
 * nothing at all. Every entry below is spelled out in full for that reason,
 * and a tone added to `TONES` without an entry in every map renders as slate
 * (the pill) or grey (the swatch) — visibly wrong, not silently absent.
 *
 * Origin: ticket-management (96S2) `lib/ticket/tones.ts`, with the row and
 * cell tints (which lived in its `ColorRulesPanel`) moved in beside the other
 * two maps. They covered eight of the seventeen tones there, so picking
 * orange or teal in a rule drew nothing; every tone has all four entries now.
 */

/** Every tone, in palette order. */
export const TONES = [
  'sky',
  'amber',
  'slate',
  'emerald',
  'zinc',
  'rose',
  'violet',
  'indigo',
  'orange',
  'yellow',
  'lime',
  'teal',
  'cyan',
  'blue',
  'purple',
  'fuchsia',
  'pink',
] as const;

export type Tone = (typeof TONES)[number];

export function isTone(v: unknown): v is Tone {
  return typeof v === 'string' && (TONES as readonly string[]).includes(v);
}

/** The pill recipe: tinted background, readable text, a hairline ring. */
export const TONE_CLASSES: Record<Tone, string> = {
  rose: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-900',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-900',
  sky: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900',
  slate: 'bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:ring-slate-700',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900',
  zinc: 'bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-400 dark:ring-zinc-700',
  orange: 'bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:ring-orange-900',
  yellow: 'bg-yellow-50 text-yellow-700 ring-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:ring-yellow-900',
  lime: 'bg-lime-50 text-lime-700 ring-lime-200 dark:bg-lime-950/40 dark:text-lime-300 dark:ring-lime-900',
  teal: 'bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:ring-teal-900',
  cyan: 'bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:ring-cyan-900',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900',
  purple: 'bg-purple-50 text-purple-700 ring-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:ring-purple-900',
  fuchsia: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200 dark:bg-fuchsia-950/40 dark:text-fuchsia-300 dark:ring-fuchsia-900',
  pink: 'bg-pink-50 text-pink-700 ring-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:ring-pink-900',
};

/** ONE SOLID COLOUR per tone, for a colour picker's swatch. */
export const TONE_DOT: Record<Tone, string> = {
  sky: 'bg-sky-400',
  amber: 'bg-amber-400',
  slate: 'bg-slate-400',
  emerald: 'bg-emerald-400',
  zinc: 'bg-zinc-400',
  rose: 'bg-rose-400',
  violet: 'bg-violet-400',
  indigo: 'bg-indigo-400',
  orange: 'bg-orange-400',
  yellow: 'bg-yellow-400',
  lime: 'bg-lime-400',
  teal: 'bg-teal-400',
  cyan: 'bg-cyan-400',
  blue: 'bg-blue-400',
  purple: 'bg-purple-400',
  fuchsia: 'bg-fuchsia-400',
  pink: 'bg-pink-400',
};

/**
 * ROW TINTS — the background a whole row takes from a colouring rule.
 *
 * Deliberately weaker than `TONE_CLASSES`: a pill is a small object that has
 * to hold its own against the text beside it, and a row tint sits UNDER a
 * dozen columns of content including those pills. Translucent so the row's
 * `hover:` state still registers on top.
 */
export const ROW_TINT: Record<Tone, string> = {
  sky: 'bg-sky-50/60 dark:bg-sky-950/20',
  amber: 'bg-amber-50/60 dark:bg-amber-950/20',
  slate: 'bg-slate-100/60 dark:bg-slate-800/30',
  emerald: 'bg-emerald-50/60 dark:bg-emerald-950/20',
  zinc: 'bg-zinc-100/60 dark:bg-zinc-800/30',
  rose: 'bg-rose-50/60 dark:bg-rose-950/20',
  violet: 'bg-violet-50/60 dark:bg-violet-950/20',
  indigo: 'bg-indigo-50/60 dark:bg-indigo-950/20',
  orange: 'bg-orange-50/60 dark:bg-orange-950/20',
  yellow: 'bg-yellow-50/60 dark:bg-yellow-950/20',
  lime: 'bg-lime-50/60 dark:bg-lime-950/20',
  teal: 'bg-teal-50/60 dark:bg-teal-950/20',
  cyan: 'bg-cyan-50/60 dark:bg-cyan-950/20',
  blue: 'bg-blue-50/60 dark:bg-blue-950/20',
  purple: 'bg-purple-50/60 dark:bg-purple-950/20',
  fuchsia: 'bg-fuchsia-50/60 dark:bg-fuchsia-950/20',
  pink: 'bg-pink-50/60 dark:bg-pink-950/20',
};

/** CELL TINTS — stronger than the row ones, because a cell tint has to be
 *  visible inside a single column rather than across the whole width. */
export const CELL_TINT: Record<Tone, string> = {
  sky: 'bg-sky-100/70 dark:bg-sky-950/40',
  amber: 'bg-amber-100/70 dark:bg-amber-950/40',
  slate: 'bg-slate-200/70 dark:bg-slate-800/50',
  emerald: 'bg-emerald-100/70 dark:bg-emerald-950/40',
  zinc: 'bg-zinc-200/70 dark:bg-zinc-800/50',
  rose: 'bg-rose-100/70 dark:bg-rose-950/40',
  violet: 'bg-violet-100/70 dark:bg-violet-950/40',
  indigo: 'bg-indigo-100/70 dark:bg-indigo-950/40',
  orange: 'bg-orange-100/70 dark:bg-orange-950/40',
  yellow: 'bg-yellow-100/70 dark:bg-yellow-950/40',
  lime: 'bg-lime-100/70 dark:bg-lime-950/40',
  teal: 'bg-teal-100/70 dark:bg-teal-950/40',
  cyan: 'bg-cyan-100/70 dark:bg-cyan-950/40',
  blue: 'bg-blue-100/70 dark:bg-blue-950/40',
  purple: 'bg-purple-100/70 dark:bg-purple-950/40',
  fuchsia: 'bg-fuchsia-100/70 dark:bg-fuchsia-950/40',
  pink: 'bg-pink-100/70 dark:bg-pink-950/40',
};

/**
 * A tone for an option that has none stored — by POSITION in the full option
 * list, so two options never share a colour until the palette wraps. Index
 * against the unfiltered list: an index taken after filtering would recolour
 * every option that follows a removed one.
 */
export function toneAt(index: number): Tone {
  return TONES[((index % TONES.length) + TONES.length) % TONES.length];
}
