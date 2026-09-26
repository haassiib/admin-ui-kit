import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { TONE_CLASSES, isTone, toneAt } from '@/lib/tones';

/* Origin: ticket-management (96S2) `tickets/OptionPill.tsx`. */

/**
 * ONE SELECT OPTION, as a tinted pill in the option's own tone — the shape a
 * grid cell, a filter checklist and a record form all draw a choice with, so
 * a value reads identically everywhere.
 *
 * `Badge` is its sibling for a STATUS in one of five semantic tones. This is
 * for a user-defined option, which needs the full seventeen-tone palette so
 * two options in one field never share a colour until the palette wraps.
 *
 * `onRemove` turns the pill into a CHIP: the same pill with a small × inside
 * it. The × is a real button with a label, and its `mousedown` is swallowed so
 * an editor's input keeps focus — a chip removed by a click that also blurred
 * the field would commit the removal and close the editor in one gesture.
 */
export default function OptionPill({
  label,
  tone = 'slate',
  onRemove,
  className,
  title,
}: {
  label: string;
  /** A tone name from `lib/tones`. An unknown one draws slate. */
  tone?: string;
  onRemove?: () => void;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title ?? label}
      className={cn(
        // `leading-none` and `align-middle`: the density rules put a fixed
        // line-height on every table cell and an inline-flex child inherits it.
        'inline-flex max-w-full items-center gap-1 rounded-full py-1 text-[11px] font-medium leading-none ring-1 ring-inset align-middle',
        onRemove ? 'pl-2.5 pr-1' : 'px-2.5',
        TONE_CLASSES[isTone(tone) ? tone : 'slate'],
        className,
      )}
    >
      <span className="truncate">{label}</span>
      {onRemove ? (
        <button
          type="button"
          aria-label={`Remove ${label}`}
          tabIndex={-1}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full opacity-60 transition-opacity hover:bg-black/10 hover:opacity-100 dark:hover:bg-white/10"
        >
          <X className="h-2.5 w-2.5" aria-hidden />
        </button>
      ) : null}
    </span>
  );
}

/**
 * The tone an option draws in: its own when it carries one, else a colour by
 * POSITION in the full option list. Index against the unfiltered list, or a
 * removed option recolours every one after it.
 */
export function optionTone(option: { tone?: string } | undefined, index: number): string {
  return option?.tone && isTone(option.tone) ? option.tone : toneAt(index);
}

/**
 * A STORED VALUE of a select or multi-select, as pills. A value no option
 * matches shows the RAW value in slate rather than nothing: hiding it would
 * hide a wiring mistake. `wrap` is for a form, where chips may flow onto
 * several lines; a grid cell keeps them on one line and clips at the right.
 */
export function OptionPills({
  value,
  options,
  wrap = false,
  className,
}: {
  value: unknown;
  options: readonly { value: string; label: string; tone?: string }[];
  wrap?: boolean;
  className?: string;
}) {
  const picked = Array.isArray(value)
    ? value.map((v) => String(v))
    : value == null || value === ''
      ? []
      : [String(value)];
  if (picked.length === 0) return null;

  return (
    <span
      className={cn(
        wrap ? 'flex flex-wrap gap-1' : 'inline-flex max-w-full items-center gap-1 overflow-hidden whitespace-nowrap align-middle',
        className,
      )}
    >
      {picked.map((v) => {
        const at = options.findIndex((o) => o.value === v);
        const option = at >= 0 ? options[at] : undefined;
        return <OptionPill key={v} label={option?.label ?? v} tone={option ? optionTone(option, at) : 'slate'} className="shrink-0" />;
      })}
    </span>
  );
}
