'use client';

/* Origin: ticket-management (96S2) `tickets/ConditionGroupsBuilder.tsx`. */

import { Plus, X } from 'lucide-react';
import {
  MAX_CONDITION_GROUPS,
  MAX_CONDITIONS,
  type ConditionGroup,
  type FilterField,
  type MatchMode,
  type Operator,
} from '@/lib/conditions';
import { PANEL_EMPTY_CLASS, panelAddButtonClass } from '@/lib/toolbar';
import { ConditionRow, blankCondition, nextConditionForField } from './FilterPanel';

/** The first row of a GROUP carries no joiner word — the group's own card and
 *  the "Or" divider above it already say where it sits. */
function groupJoiner(index: number, matchMode: MatchMode): string {
  return index === 0 ? '' : matchMode === 'any' ? 'or' : 'and';
}

/**
 * OR-of-AND condition GROUPS — Lark Base's automation shape. Each group is a
 * light-grey card of one or more `[field] [operator] [value]` rows, built from
 * `FilterPanel`'s own exported `ConditionRow` (never a second implementation
 * of it); rows within a group are joined by the SHARED `matchMode`; a plain
 * "Or" LABEL sits between groups — never a control, because groups are
 * always OR'd.
 *
 * Stateless, like `ConditionRow`: the owner keeps the draft and decides what a
 * change means. An empty group beside a filled one is allowed here as a DRAFT
 * state (the editor is mid-edit); `groupsMatch` reads an empty group as
 * "matches everything", so an owner that saves should refuse that shape.
 */
export default function ConditionGroupsBuilder({
  fields,
  groups,
  matchMode,
  onChange,
  emptyText = 'No conditions — matches every row.',
}: {
  fields: FilterField[];
  groups: ConditionGroup[];
  matchMode: MatchMode;
  onChange: (groups: ConditionGroup[], matchMode: MatchMode) => void;
  /** What the builder says when there are no groups at all. */
  emptyText?: string;
}) {
  const setGroupConditions = (gi: number, conditions: ConditionGroup['conditions']) =>
    onChange(groups.map((g, i) => (i === gi ? { conditions } : g)), matchMode);

  const addGroup = () => {
    if (groups.length >= MAX_CONDITION_GROUPS) return;
    onChange([...groups, { conditions: [] }], matchMode);
  };
  const removeGroup = (gi: number) => onChange(groups.filter((_, i) => i !== gi), matchMode);
  const addRow = (gi: number) => {
    const blank = blankCondition(fields);
    if (blank) setGroupConditions(gi, [...groups[gi].conditions, blank]);
  };
  const changeRowField = (gi: number, ci: number, fieldId: string) => {
    const next = nextConditionForField(fields, groups[gi].conditions[ci], fieldId);
    if (next) setGroupConditions(gi, groups[gi].conditions.map((c, i) => (i === ci ? next : c)));
  };
  const changeRowOp = (gi: number, ci: number, op: Operator) =>
    setGroupConditions(gi, groups[gi].conditions.map((c, i) => (i === ci ? { ...c, op, value: '' } : c)));
  const changeRowValue = (gi: number, ci: number, value: string) =>
    setGroupConditions(gi, groups[gi].conditions.map((c, i) => (i === ci ? { ...c, value } : c)));
  const removeRow = (gi: number, ci: number) =>
    setGroupConditions(gi, groups[gi].conditions.filter((_, i) => i !== ci));

  return (
    <div className="space-y-2">
      {groups.length > 0 && (
        <div className="flex items-center justify-end gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          Matching
          <select value={matchMode} onChange={(e) => onChange(groups, e.target.value as MatchMode)} className="field-input w-auto py-1 text-xs">
            <option value="all">all</option>
            <option value="any">any</option>
          </select>
          of the conditions in each group
        </div>
      )}

      {groups.length === 0 ? (
        <p className={PANEL_EMPTY_CLASS}>{emptyText}</p>
      ) : (
        <div className="space-y-1.5">
          {groups.map((group, gi) => (
            <div key={gi}>
              {gi > 0 && (
                <div className="my-1.5 flex items-center gap-2">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Or</span>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                </div>
              )}

              <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-900/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    {group.conditions.length === 0 ? (
                      <p className="rounded bg-white px-2 py-2 text-center text-[11px] text-slate-400 dark:bg-slate-800/60">
                        No conditions in this group.
                      </p>
                    ) : (
                      group.conditions.map((c, ci) => (
                        <ConditionRow
                          key={ci}
                          fields={fields}
                          condition={c}
                          joiner={groupJoiner(ci, matchMode)}
                          onChangeField={(fieldId) => changeRowField(gi, ci, fieldId)}
                          onChangeOp={(op) => changeRowOp(gi, ci, op)}
                          onChangeValue={(v) => changeRowValue(gi, ci, v)}
                          onRemove={() => removeRow(gi, ci)}
                        />
                      ))
                    )}
                    <button
                      type="button"
                      onClick={() => addRow(gi)}
                      disabled={group.conditions.length >= MAX_CONDITIONS || fields.length === 0}
                      className={panelAddButtonClass()}
                    >
                      <Plus className="h-3 w-3" /> {matchMode === 'any' ? 'Or' : 'And'}
                    </button>
                  </div>
                  <button
                    type="button"
                    aria-label="Remove this condition group"
                    onClick={() => removeGroup(gi)}
                    className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-rose-600 dark:hover:bg-slate-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addGroup}
        disabled={groups.length >= MAX_CONDITION_GROUPS || fields.length === 0}
        className={panelAddButtonClass()}
      >
        <Plus className="h-3.5 w-3.5" /> Add condition group
      </button>
    </div>
  );
}
