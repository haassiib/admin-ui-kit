'use client';

/* Origin: ticket-management (96S2) `components/ui/GroupLevelsPanel.tsx`. */

import { useEffect, useRef, useState } from 'react';
import { GripVertical, Group, Plus, X } from 'lucide-react';
import { MAX_GROUP_LEVELS, type GroupLevel } from '@/lib/grouping';
import { cn } from '@/lib/cn';
import {
  PANEL_EMPTY_CLASS,
  PANEL_GRIP_CLASS,
  PANEL_REMOVE_CLASS,
  TOOLBAR_BADGE_CLASS,
  TOOLBAR_PANEL_CLASS,
  panelAddButtonClass,
  segmentClass,
  toolbarButtonClass,
} from '@/lib/toolbar';
import { useDismiss } from '@/lib/use-dismiss';
import { InfoTooltip } from '@/components/overlay/Tooltip';
import SortableList from '@/components/table/SortableList';

/**
 * Group by several fields at once, each level with its own direction — the
 * Lark Base / Airtable "group by" builder.
 *
 * Generic over the field id (`TBy`), so one component serves any table: the
 * caller supplies the vocabulary (`options`) and how to name it (`labelOf`).
 *
 * Commits IMMEDIATELY by default — a grouping change is one deliberate act
 * with one visible outcome, so there is no Apply button. `requireApply` opts
 * into the other bargain (a local draft, an Apply button, revert on any close
 * that is not Apply), for a grid where re-grouping is a round trip or where
 * the other three toolbar panels already work that way and this one should
 * not be the odd one out.
 *
 * Reordering is DRAG on `SortableList`: the grip at the start of each row is
 * the handle, so nesting order (which level sits at which depth) is a drag
 * rather than a remove-then-add-at-the-end round trip.
 */
export default function GroupPanel<TBy extends string = string>({
  levels,
  onChange,
  options,
  labelOf,
  maxLevels = MAX_GROUP_LEVELS,
  title = 'Group by',
  width = 420,
  requireApply = false,
  className,
}: {
  levels: GroupLevel<TBy>[];
  onChange: (levels: GroupLevel<TBy>[]) => void;
  /** Every field that MAY be grouped by — the caller's own vocabulary. */
  options: readonly TBy[];
  labelOf: (by: TBy) => string;
  maxLevels?: number;
  /** The popover's own heading. */
  title?: string;
  width?: number;
  /** A local draft, an Apply button and revert-on-close, instead of committing on every change. */
  requireApply?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<GroupLevel<TBy>[]>(levels);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(levels);
  }, [levels]);

  const close = () => {
    if (requireApply) setDraft(levels);
    setOpen(false);
  };
  useDismiss(root, open, close);

  const apply = () => {
    onChange(draft);
    setOpen(false);
  };

  // THE EFFECTIVE LIST — the draft while `requireApply` holds one open, the
  // committed `levels` otherwise. Every row reads and writes through this
  // pair, so the two modes are one code path.
  const effective = requireApply ? draft : levels;
  const commit = requireApply ? setDraft : onChange;

  /** A field already used at another level would make a band of one child. */
  const unused = options.filter((g) => !effective.some((l) => l.by === g));

  const setAt = (i: number, patch: Partial<GroupLevel<TBy>>) =>
    commit(effective.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const removeAt = (i: number) => commit(effective.filter((_, j) => j !== i));
  const add = () => {
    if (unused.length) commit([...effective, { by: unused[0], dir: 'asc' }]);
  };

  // The trigger reflects what is ACTUALLY GROUPED — the committed `levels`,
  // never a draft sitting inside a still-open panel.
  const label = levels.length
    ? `Grouped by ${levels.map((l) => labelOf(l.by).toLowerCase()).join(', then ')}`
    : 'Group';

  return (
    <div ref={root} className={cn('relative inline-block', className)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        title={label}
        onClick={() => (open ? close() : setOpen(true))}
        className={toolbarButtonClass(open || levels.length > 0, 'amber')}
      >
        <Group className="h-4 w-4" aria-hidden />
        {levels.length > 0 && <span className={TOOLBAR_BADGE_CLASS}>{levels.length}</span>}
      </button>

      {open && (
        <div style={{ width }} className={TOOLBAR_PANEL_CLASS}>
          <p className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-200">{title}</p>

          {effective.length === 0 && <p className={PANEL_EMPTY_CLASS}>Not grouped. Rows appear in sort order.</p>}

          {effective.length > 0 && (
            <SortableList<GroupLevel<TBy>>
              items={effective}
              getId={(l) => l.by}
              onReorder={commit}
              group="group-levels"
              className="space-y-1.5"
              renderItem={(level, { isDragging, handleProps }) => {
                const i = effective.indexOf(level);
                return (
                  <div className={cn('flex items-center gap-1.5 rounded', isDragging && 'bg-slate-100 dark:bg-slate-700')}>
                    <button type="button" aria-label="Drag to reorder this grouping level" {...handleProps} className={PANEL_GRIP_CLASS}>
                      <GripVertical className="h-3.5 w-3.5" aria-hidden />
                    </button>

                    <span className="w-8 shrink-0 text-right text-[11px] text-slate-400">{i === 0 ? 'By' : 'then'}</span>

                    <select
                      value={level.by}
                      onChange={(e) => setAt(i, { by: e.target.value as TBy })}
                      className="field-input min-w-0 flex-1 py-1.5 text-xs"
                    >
                      {/* The level's OWN field stays selectable while the others
                          already in use are not, so a duplicate cannot be built. */}
                      {options
                        .filter((g) => g === level.by || unused.includes(g))
                        .map((g) => (
                          <option key={g} value={g}>{labelOf(g)}</option>
                        ))}
                    </select>

                    <div className="flex shrink-0 overflow-hidden rounded-lg border border-slate-300 dark:border-slate-700">
                      {(['asc', 'desc'] as const).map((dir) => (
                        <button key={dir} type="button" onClick={() => setAt(i, { dir })} className={segmentClass(level.dir === dir, 'amber')}>
                          {dir === 'asc' ? 'A → Z' : 'Z → A'}
                        </button>
                      ))}
                    </div>

                    <button type="button" aria-label="Remove this grouping level" onClick={() => removeAt(i)} className={PANEL_REMOVE_CLASS}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              }}
            />
          )}

          <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-2 dark:border-slate-700">
            <button type="button" onClick={add} disabled={effective.length >= maxLevels || unused.length === 0} className={panelAddButtonClass('amber')}>
              <Plus className="h-3.5 w-3.5" /> Add a level
            </button>
            {effective.length >= maxLevels && <InfoTooltip content={`${maxLevels} levels is the limit.`} label="Why can't I add more?" iconClassName="w-3 h-3" />}
            {effective.length > 0 && (
              <button type="button" onClick={() => commit([])} className="ml-auto btn-ghost text-xs">
                Ungroup
              </button>
            )}
            {requireApply && (
              // Its OWN `ml-auto`: Ungroup is conditional, and Apply has to land
              // at the right edge whether or not that button is there.
              <button type="button" onClick={apply} className="ml-auto btn-primary">
                Apply
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
