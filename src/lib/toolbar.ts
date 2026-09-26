/**
 * The icon-toolbar vocabulary — a Lark Base / Airtable view bar.
 *
 * The bar is icons only, and that is a deliberate trade rather than a space
 * saving: the controls it holds (filter, group, sort, colour) are ones you
 * set once and then read at a glance for the rest of the session. A row of
 * glyphs, each TINTED when it is doing something, turns "what is this view
 * showing me" into a single look. That is why `active` drives a background
 * colour and not just a bolder label.
 *
 * The tints follow Lark's own: INDIGO for narrowing (filter, sort — controls
 * that change WHICH rows you see), AMBER for grouping (which changes how the
 * same rows are arranged).
 *
 * Shared by the four toolbar panels, so a control that owns its own trigger
 * can sit in the bar without looking pasted in. Origin: ticket-management
 * (96S2) `components/ui/ToolbarMenu.tsx`.
 */

export type ToolbarTint = 'indigo' | 'amber';

const TINT: Record<ToolbarTint, string> = {
  indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300',
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300',
};

const BASE =
  'relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ' +
  'disabled:cursor-not-allowed disabled:opacity-40';

const IDLE =
  'text-slate-500 hover:bg-slate-100 hover:text-slate-800 ' +
  'dark:text-slate-400 dark:hover:bg-slate-700/60 dark:hover:text-slate-100';

export function toolbarButtonClass(active = false, tint: ToolbarTint = 'indigo'): string {
  return `${BASE} ${active ? TINT[tint] : IDLE}`;
}

/** The count bubble on a tinted icon — how many things a control is doing. */
export const TOOLBAR_BADGE_CLASS =
  'absolute -right-0.5 -top-0.5 inline-flex h-3.5 min-w-3.5 items-center justify-center ' +
  'rounded-full bg-indigo-600 px-1 text-[9px] font-semibold leading-none text-white ' +
  'ring-2 ring-white dark:ring-slate-800';

/**
 * The floating panel every toolbar control opens. In-flow and absolute, per
 * this kit's popover rule (see CLAUDE.md), so it lives inside the trigger's
 * `relative` wrapper and dismisses through `useDismiss` with one ref. Width
 * is set inline by the caller and capped to the viewport here.
 */
export const TOOLBAR_PANEL_CLASS =
  'absolute left-0 top-full z-50 mt-1 max-w-[calc(100vw-2rem)] origin-top-left panel panel-solid p-3 animate-scale-in';

/** The empty-state strip inside a panel with nothing configured. */
export const PANEL_EMPTY_CLASS =
  'rounded-lg bg-slate-50 px-3 py-4 text-center text-xs text-slate-400 dark:bg-slate-900/40';

/** The "+ Add …" text button at a panel's foot. */
export function panelAddButtonClass(tint: ToolbarTint = 'indigo'): string {
  return tint === 'amber'
    ? 'inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-amber-600 hover:bg-amber-50 disabled:opacity-40 dark:text-amber-400 dark:hover:bg-amber-950/40'
    : 'inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 dark:text-indigo-400 dark:hover:bg-indigo-950/40';
}

/** The × at the end of a panel row. */
export const PANEL_REMOVE_CLASS =
  'shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600 disabled:opacity-40 dark:hover:bg-slate-700';

/** The grip at the start of a draggable panel row. */
export const PANEL_GRIP_CLASS =
  'shrink-0 cursor-grab touch-none rounded p-1 text-slate-300 hover:text-slate-500 active:cursor-grabbing dark:text-slate-600 dark:hover:text-slate-300';

/** The asc/desc segmented control's two halves. */
export function segmentClass(active: boolean, tint: ToolbarTint = 'indigo'): string {
  if (!active) return 'px-2 py-1 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700';
  return tint === 'amber'
    ? 'px-2 py-1 text-[11px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
    : 'px-2 py-1 text-[11px] font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300';
}
