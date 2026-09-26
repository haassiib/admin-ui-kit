'use client';

/* Origin: ticket-management (96S2) `tickets/GroupBandRow.tsx`. */

import { ChevronDown, ChevronRight } from 'lucide-react';

/** Pixels of indent per nesting depth, for a band's label. */
export const INDENT_STEP = 18;

/**
 * A GROUP BAND — one `<tr>` spanning every column, carrying the group's
 * label, its size and a collapse chevron. `flattenGroups` (`lib/grouping`)
 * emits these between the rows they head, each with a depth, so nesting is a
 * matter of indent rather than of nested tbodies.
 *
 * THE CHEVRON is the control, not the band. The band used to be one button
 * all the way across, and a click meant for a row's edge, or to drag the
 * pointer over a group's name, folded the group instead. The chevron is a
 * real `<button>`, so Enter and Space toggle it from the keyboard.
 *
 * THE LABEL IS PINNED TO THE VISIBLE EDGE. The band spans every column, so
 * its content would sit at the TABLE's left edge — which scrolls away the
 * moment you move sideways, taking the group name with it. `sticky left-0`
 * inside the full-width cell keeps it at the left of the SCROLL BOX instead.
 */
export default function GroupBandRow({
  label,
  count,
  depth = 0,
  collapsed,
  onToggle,
  columnCount,
  noun = 'record',
}: {
  label: string;
  /** The group's REAL size — every row under it, not only those on screen. */
  count: number;
  depth?: number;
  collapsed: boolean;
  onToggle: () => void;
  /** Every column the table draws, so the band spans them all. */
  columnCount: number;
  /** What one row is called in the count: "3 records", "3 tasks". */
  noun?: string;
}) {
  return (
    <tr className="bg-slate-50/80 dark:bg-slate-800/40">
      <td colSpan={columnCount} className="!p-0">
        <div className="flex w-full text-left">
          <span className="sticky left-0 flex items-stretch pl-3 text-xs font-medium text-slate-700 dark:text-slate-200">
            {/* A fixed-width slot for the chevron, never indented, so it lines
                up with the row numbers beneath at every depth; only the label
                indents. */}
            <span className="flex w-5 shrink-0 items-center justify-center py-1.5">
              <button
                type="button"
                onClick={onToggle}
                aria-expanded={!collapsed}
                aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${label}`}
                className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
              >
                {collapsed ? <ChevronRight className="h-3.5 w-3.5" aria-hidden /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden />}
              </button>
            </span>
            <span style={{ paddingLeft: depth * INDENT_STEP }} className="inline-flex items-center gap-1.5 py-1.5 pr-4">
              {label}
              <span className="whitespace-nowrap text-[11px] font-normal text-slate-400">
                {count} {noun}{count === 1 ? '' : 's'}
              </span>
            </span>
          </span>
        </div>
      </td>
    </tr>
  );
}
