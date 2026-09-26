/**
 * Copy-ready AI prompts, keyed by slug: a description of a component's design
 * complete enough that a person can paste it into an AI coding tool and get the
 * same thing rebuilt in their own stack.
 *
 * Plain data, like the catalog, so any module may read it. A prompt describes
 * what the component LOOKS like and DOES, not how its file happens to be
 * written — it is for rebuilding the design, and the source is already on the
 * page for copying the code.
 *
 * Each prompt covers only what is particular to its component. The look every
 * component shares — palette, surfaces, fields, dark mode, dismissal — is
 * written once, in `HOUSE_STYLE`, and appended by `promptFor`, so a change to
 * the house style lands on all of them and no prompt restates it.
 *
 * Split by batch rather than kept in one file only so each file stays a
 * readable length. `npm run check:registry` fails if a catalog entry has no
 * prompt, or a prompt names a slug that is not in the catalog.
 */

import { DATA_A_PROMPTS } from './data-a';
import { DATA_B_PROMPTS } from './data-b';
import { FORM_A_PROMPTS } from './form-a';
import { FORM_B_PROMPTS } from './form-b';
import { LAYOUT_PROMPTS } from './layout';
import { OVERLAY_PROMPTS } from './overlay';
import { TABLE_A_PROMPTS } from './table-a';
import { TABLE_B_PROMPTS } from './table-b';

export const PROMPTS: Record<string, string> = {
  ...LAYOUT_PROMPTS,
  ...FORM_A_PROMPTS,
  ...FORM_B_PROMPTS,
  ...TABLE_A_PROMPTS,
  ...TABLE_B_PROMPTS,
  ...DATA_A_PROMPTS,
  ...DATA_B_PROMPTS,
  ...OVERLAY_PROMPTS,
};

export const HOUSE_STYLE = `## House style (applies to everything above)
- Stack: React 19 + TypeScript + Tailwind CSS v4, icons from lucide-react. One self-contained file; default-export the component and named-export its types. \`'use client'\` if it has state, refs or handlers.
- Font Inter; palette indigo on slate. Primary accent indigo-600 (hover indigo-700, dark mode indigo-400). Body text slate-700 / dark slate-200; secondary slate-500 / dark slate-400.
- Dark mode is a \`.dark\` class on <html> (not prefers-color-scheme). Every colour needs its \`dark:\` pair.
- Compact admin scale: text-xs (12px) for controls and body, 10–11px for meta, rounded-lg (8px) controls, rounded-2xl (16px) cards.
- Card surface ("panel"): \`bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/60 dark:border-slate-700/60 rounded-2xl shadow-lg\`, on a soft slate gradient page background.
- Floating surfaces (dropdowns, popovers, menus) are OPAQUE: \`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg\`, no backdrop blur (it creates a stacking context that traps the popover's z-index). In-flow popovers are z-50; portalled overlays z-200.
- Text inputs and select triggers: \`w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500\`.
- Field labels: 11px semibold slate-600. Section titles: 10px semibold uppercase wide-tracking slate-500.
- Primary button: indigo-600 fill, white 12px semibold text, rounded-lg, px-3 py-2, disabled at 50% opacity. Ghost button: slate-600 text, hover slate-100.
- Popovers close on outside click AND on Escape (listen to both; include the portalled panel's element in the outside-click check).
- Don't nest scroll containers around popovers: an ancestor with overflow hidden/auto clips an absolutely-positioned dropdown. Portal the panel to <body> when it must escape a scroller, and reposition it on scroll and resize.
- Accessible by default: visible focus rings, keyboard support that matches the WAI-ARIA pattern for the widget, \`aria-label\` on icon-only buttons, \`min-w-0\` so text truncates instead of overflowing.`;

/** The prompt shown on a component's page, with the house style appended. */
export function promptFor(slug: string): string | undefined {
  const own = PROMPTS[slug];
  return own && `${own}\n\n${HOUSE_STYLE}`;
}
