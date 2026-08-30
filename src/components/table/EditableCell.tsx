'use client';

import { Pencil } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * The click-to-edit cell.
 *
 * MERGED from two copies. bonus-adjustment's is the base — it added the `as`
 * wrapper, `autoWidth`, `inputClassName` and the slate palette. Four props came
 * back across from marketing-stats, because without them a numeric or wrapping
 * column cannot be expressed at all: `inputType`, `step`, `alignRight` and
 * `wrap`. The number-input path also suppresses the spin buttons, which is
 * marketing-stats' behaviour — a stepper inside a table cell is a mis-click
 * waiting to happen.
 *
 * At rest it looks like plain text. On hover a DASHED bottom line appears under
 * the cell and a pencil fades in at the right, spaced away from the text — a
 * quiet "this is editable" hint that costs nothing when you aren't looking for
 * it. Click anywhere in the cell to edit; Enter or blur commits, Escape cancels.
 *
 * Presentational only — the parent owns which cell is open, the pending-changes
 * map, and whether the user may edit. Edits are meant to be BATCHED and
 * committed through SaveAllBar, never written per keystroke.
 *
 * The behaviour worth preserving, because each part fixes a specific jump:
 *
 * - Read and edit modes share ONE reserved box — same width, padding and 1px
 *   bottom border (transparent at rest). Entering or leaving edit never resizes
 *   the cell, so no row or column shifts.
 * - `min-w-0` on that box is what stops a narrow column widening when its cell
 *   becomes an <input>: an input's intrinsic preferred width would otherwise
 *   push the column out. With no minimum, the read cells alone dictate width in
 *   both modes.
 * - The pencil is always rendered, even mid-edit under the overlay, so its
 *   reserved width never changes.
 * - While editing, the display text stays in layout but hidden — the box keeps
 *   its size, and the dashed line stays put between hover and edit.
 * - A dirty cell gets a tinted background and amber text, so unsaved changes are
 *   visible before Save All.
 */
export default function EditableCell({
  editing,
  dirty,
  canEdit,
  value = '',
  display,
  onStartEdit,
  onChange,
  onCommit,
  onCancel,
  inputType = 'text',
  step,
  alignRight = false,
  editor,
  wrap = false,
  className = '',
  autoWidth = false,
  inputClassName = '',
  as: Wrapper = 'div',
}: {
  editing: boolean;
  dirty: boolean;
  canEdit: boolean;
  /** Read-mode content. Also the at-rest content when a custom `editor` is used. */
  display: React.ReactNode;
  onStartEdit: () => void;
  /** Built-in text input path — required unless `editor` is supplied. */
  value?: string;
  onChange?: (v: string) => void;
  onCommit?: () => void;
  onCancel?: () => void;
  /** `text` | `number` | `date` — the built-in input's type. */
  inputType?: string;
  /** Step for `inputType="number"`, e.g. '0.01' for a currency column. */
  step?: string;
  /** Right-align both modes. Numeric columns need this to stay readable. */
  alignRight?: boolean;
  /**
   * Custom control (a select, say). Rendered while editing INSTEAD of the
   * built-in input, overlaying the read box. The parent wires its value, change
   * and close behaviour; this component only supplies the affordance and the
   * no-jump overlay.
   */
  editor?: React.ReactNode;
  /**
   * Let the read display WRAP instead of truncating to one line — for a cell
   * holding a chip list rather than a value. Top-aligns the box so multi-line
   * content and the pencil still line up.
   */
  wrap?: boolean;
  /** Per-cell width/padding. Do NOT set a text colour — this owns it, so the
   *  dirty state can override cleanly. */
  className?: string;
  /**
   * Size the input to what is typed instead of filling the cell.
   *
   * OFF by default: the overlay input is what stops a fixed-width column
   * shifting when a cell opens, and in a grid of aligned columns that matters
   * more than a snug box. Worth turning on where the cell is the widest thing
   * in its column and a full-width input reads as a text area.
   */
  autoWidth?: boolean;
  /** Extra classes for the built-in input — usually to match `display`'s font. */
  inputClassName?: string;
  as?: 'td' | 'div';
}) {
  return (
    <Wrapper
      className={cn(
        'group/edit relative',
        className,
        alignRight && 'text-right',
        dirty
          ? 'text-amber-600 dark:text-amber-400 font-medium'
          : 'text-slate-600 dark:text-slate-300',
      )}
      onClick={() => {
        if (!editing) onStartEdit();
      }}
      title={canEdit && !editing ? (dirty ? 'Click to edit — unsaved' : 'Click to edit') : undefined}
    >
      <div
        className={cn(
          'box-border relative w-full flex gap-2.5 px-2 py-1 rounded text-xs align-middle',
          wrap ? 'items-start' : 'items-center',
          alignRight && 'text-right',
          dirty && 'bg-slate-100 dark:bg-slate-700/50',
          canEdit &&
            (editing
              ? 'cursor-pointer border-b border-dashed border-slate-400 dark:border-slate-500'
              : 'cursor-pointer border-b border-transparent group-hover/edit:border-dashed group-hover/edit:border-slate-400 dark:group-hover/edit:border-slate-500'),
        )}
      >
        {/* `invisible` not `hidden`: the read text keeps reserving its width so
            the column cannot shift when the overlay opens. With `autoWidth`
            there is no overlay and the input owns the width, so it goes. */}
        <span
          className={cn(
            'flex-1 min-w-0',
            wrap ? '' : 'truncate',
            editing && (autoWidth ? 'hidden' : 'invisible'),
          )}
        >
          {display}
        </span>

        {canEdit && (
          // Always rendered — even mid-edit, under the overlay — so the width it
          // reserves never changes and the column can't shift when a cell opens.
          // Only its opacity animates.
          <Pencil
            size={12}
            aria-hidden
            className="shrink-0 text-slate-400 dark:text-slate-500 opacity-0 group-hover/edit:opacity-100 transition-opacity"
          />
        )}

        {editing && editor && (
          <div
            className="absolute inset-0 flex items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {editor}
          </div>
        )}

        {editing && !editor && (
          <input
            type={inputType}
            step={step}
            autoFocus
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={() => onCommit?.()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onCommit?.();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                onCancel?.();
              }
            }}
            // `ch` is relative to the INPUT's own font, so the width tracks
            // whatever `inputClassName` sets. +1 leaves room for the caret at
            // the end; the floor stops an emptied field collapsing to nothing
            // and the ceiling stops a long paste escaping the cell.
            style={
              autoWidth
                ? { width: `${Math.min(Math.max(value.length + 1, 8), 60)}ch` }
                : undefined
            }
            className={cn(
              'box-border px-2 py-1 rounded text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 outline-none focus:outline-none',
              alignRight && 'text-right',
              // No stepper: a spin button inside a table cell is a mis-click
              // waiting to happen, and it eats the space the value needs.
              inputType === 'number' &&
                '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
              autoWidth
                ? 'relative -mx-2 -my-1 min-w-0 max-w-full'
                : 'absolute inset-0 w-full h-full',
              inputClassName,
            )}
          />
        )}
      </div>
    </Wrapper>
  );
}
