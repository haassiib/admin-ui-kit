'use client';

/* Origin: ticket-management (96S2) `tickets/FilterPanel.tsx`. */

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Filter, Plus, X } from 'lucide-react';
import {
  DATE_MODE_OPTIONS,
  KIND,
  MAX_CONDITIONS,
  OPERATOR_LABELS,
  OP,
  dateModeOf,
  isValueless,
  operatorsFor,
  parseMultiValue,
  relativeDateValue,
  toMultiValue,
  type Condition,
  type DateMode,
  type FilterField,
  type FilterFieldOption,
  type MatchMode,
  type Operator,
} from '@/lib/conditions';
import { cn } from '@/lib/cn';
import {
  PANEL_EMPTY_CLASS,
  PANEL_REMOVE_CLASS,
  TOOLBAR_BADGE_CLASS,
  TOOLBAR_PANEL_CLASS,
  panelAddButtonClass,
  toolbarButtonClass,
} from '@/lib/toolbar';
import { useDismiss } from '@/lib/use-dismiss';
import { InfoTooltip } from '@/components/overlay/Tooltip';
import OptionPill, { optionTone } from '@/components/data/OptionPill';

/**
 * The filter panel — `[field] [operator] [value]` rows, matching all or any.
 * The Lark Base funnel.
 *
 * ── Why it holds a DRAFT ────────────────────────────────────────────────────
 *
 * A condition is built left to right: picking the field alone would refilter
 * the list, then the operator again, then each keystroke of the value again.
 * So the panel edits a local draft and commits on Apply — the same bargain
 * `CombinedSelect` makes. A half-built row is kept on screen and
 * simply not applied: `conditionsMatch` skips any valued operator with an
 * empty value, so choosing a field and pausing to think does not narrow the
 * list under you.
 *
 * CLOSE WITHOUT APPLYING — REVERTS. Closing by any path that is not the Apply
 * button (outside click, Escape, the trigger again) discards the draft and
 * puts it back to the last APPLIED value, so reopening a moment later shows
 * what is actually live rather than whatever was half-typed last time.
 *
 * `ConditionRow` and `ValueInput` are EXPORTED: `ColorRulesPanel` builds the
 * same predicate with a colour on the end, and `ConditionGroupsBuilder` lays
 * the same rows out in OR'd groups. Shared rather than copied, because the
 * options-vs-free-text fallback and the valueless case must be identical in
 * all three and two copies would drift the first time one gained a kind.
 */
export default function FilterPanel({
  fields,
  conditions,
  match,
  onApply,
  title = 'Filter',
  width = 580,
  className,
}: {
  fields: FilterField[];
  conditions: Condition[];
  match: MatchMode;
  /** Fired on Apply and on Clear all — never per keystroke. */
  onApply: (conditions: Condition[], match: MatchMode) => void;
  /** The panel's heading. */
  title?: string;
  /**
   * Measured, not chosen: the fixed skeleton of a row (joiner, field select,
   * operator select, remove button, gaps, padding) is 430px, and the value
   * column needs 150 to show a date input and its placeholder in full.
   */
  width?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Condition[]>(conditions);
  const [draftMatch, setDraftMatch] = useState<MatchMode>(match);
  const root = useRef<HTMLDivElement>(null);

  // Re-seed whenever the committed value changes underneath — a back button,
  // or a "clear everything" from elsewhere, must not leave a stale draft.
  useEffect(() => {
    setDraft(conditions);
    setDraftMatch(match);
  }, [conditions, match]);

  const revertAndClose = () => {
    setDraft(conditions);
    setDraftMatch(match);
    setOpen(false);
  };

  useDismiss(root, open, revertAndClose);

  const setAt = (i: number, patch: Partial<Condition>) =>
    setDraft((prev) => prev.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const removeAt = (i: number) => setDraft((prev) => prev.filter((_, j) => j !== i));
  const add = () => {
    const blank = blankCondition(fields);
    if (blank) setDraft((prev) => [...prev, blank]);
  };
  const changeField = (i: number, fieldId: string) => {
    const next = nextConditionForField(fields, draft[i], fieldId);
    if (next) setDraft((prev) => prev.map((c, j) => (j === i ? next : c)));
  };
  const apply = () => {
    onApply(draft, draftMatch);
    setOpen(false);
  };
  const clear = () => {
    setDraft([]);
    onApply([], 'all');
    setOpen(false);
  };

  const label = conditions.length ? `${title} — ${conditions.length} condition${conditions.length === 1 ? '' : 's'}` : title;

  return (
    <div ref={root} className={cn('relative inline-block', className)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        title={label}
        // Re-clicking the trigger while open is a CLOSE, same as an outside
        // click — it reverts too.
        onClick={() => (open ? revertAndClose() : setOpen(true))}
        className={toolbarButtonClass(open || conditions.length > 0)}
      >
        <Filter className="h-4 w-4" aria-hidden />
        {conditions.length > 0 && <span className={TOOLBAR_BADGE_CLASS}>{conditions.length}</span>}
      </button>

      {open && (
        <div style={{ width }} className={TOOLBAR_PANEL_CLASS}>
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-200">{title}</span>
            <span className="ml-auto flex items-center gap-1.5">
              Matching
              <select
                value={draftMatch}
                onChange={(e) => setDraftMatch(e.target.value as MatchMode)}
                className="field-input w-auto py-1 text-xs"
              >
                <option value="all">all</option>
                <option value="any">any</option>
              </select>
              of the conditions
            </span>
          </div>

          {draft.length === 0 && <p className={PANEL_EMPTY_CLASS}>No conditions. Every row is shown.</p>}

          <div className="space-y-1.5">
            {draft.map((c, i) => (
              <ConditionRow
                key={i}
                fields={fields}
                condition={c}
                joiner={joinerFor(i, draftMatch)}
                onChangeField={(fieldId) => changeField(i, fieldId)}
                onChangeOp={(op) => setAt(i, { op, value: '' })}
                onChangeValue={(v) => setAt(i, { value: v })}
                onRemove={() => removeAt(i)}
              />
            ))}
          </div>

          <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-2 dark:border-slate-700">
            <button
              type="button"
              onClick={add}
              disabled={draft.length >= MAX_CONDITIONS || fields.length === 0}
              className={panelAddButtonClass()}
            >
              <Plus className="h-3.5 w-3.5" /> Add condition
            </button>
            {draft.length >= MAX_CONDITIONS && (
              <InfoTooltip content={`${MAX_CONDITIONS} conditions is the limit.`} label="Why can't I add more?" iconClassName="w-3 h-3" />
            )}
            <button type="button" onClick={clear} className="ml-auto btn-ghost text-xs">
              Clear all
            </button>
            <button type="button" onClick={apply} className="btn-primary">
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** "Where" on the first row, then the match mode's own word — so a list reads as one sentence. */
export function joinerFor(index: number, match: MatchMode): string {
  return index === 0 ? 'Where' : match === 'any' ? 'or' : 'and';
}

/**
 * Changing the FIELD can invalidate the operator — "contains" means nothing on
 * a number, ">" nothing on a select. The operator falls back to the new kind's
 * first, and the value is cleared, because a category id is not a status
 * name. `null` when the field id is unknown, so the caller leaves the row alone.
 */
export function nextConditionForField(
  fields: readonly FilterField[],
  current: Condition,
  fieldId: string,
): Condition | null {
  const field = fields.find((f) => f.id === fieldId);
  if (!field) return null;
  const ops = operatorsFor(field.kind);
  return { field: fieldId, op: ops.includes(current.op) ? current.op : ops[0], value: '' };
}

/** A fresh, half-built row on the first field — what "+ Add condition" appends. */
export function blankCondition(fields: readonly FilterField[]): Condition | null {
  const first = fields[0];
  return first ? { field: first.id, op: operatorsFor(first.kind)[0], value: '' } : null;
}

/**
 * ONE `[joiner] [field] [operator] [value] [×]` row. Stateless: the owner keeps
 * the list and decides what a change means (this panel: a draft until Apply).
 */
export function ConditionRow({
  fields,
  condition,
  joiner,
  disabled = false,
  onChangeField,
  onChangeOp,
  onChangeValue,
  onRemove,
}: {
  fields: readonly FilterField[];
  condition: Condition;
  joiner: string;
  disabled?: boolean;
  onChangeField: (fieldId: string) => void;
  onChangeOp: (op: Operator) => void;
  onChangeValue: (value: string) => void;
  onRemove: () => void;
}) {
  const field = fields.find((f) => f.id === condition.field);
  const ops = operatorsFor(field?.kind ?? 'text');
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-10 shrink-0 text-right text-[11px] text-slate-400">{joiner}</span>

      <select
        value={condition.field}
        disabled={disabled}
        onChange={(e) => onChangeField(e.target.value)}
        className="field-input w-44 shrink-0 py-1.5 text-xs"
      >
        {fields.map((f) => (
          <option key={f.id} value={f.id}>{f.label}</option>
        ))}
      </select>

      <select
        value={condition.op}
        disabled={disabled}
        onChange={(e) => onChangeOp(e.target.value as Operator)}
        className="field-input w-36 shrink-0 py-1.5 text-xs"
      >
        {ops.map((op) => (
          <option key={op} value={op}>{OPERATOR_LABELS[op]}</option>
        ))}
      </select>

      <ValueInput field={field} op={condition.op} value={condition.value} onChange={onChangeValue} disabled={disabled} />

      <button type="button" aria-label="Remove this condition" disabled={disabled} onClick={onRemove} className={PANEL_REMOVE_CLASS}>
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/**
 * The value control, chosen by the field's kind.
 *
 * A picker wherever the values are a known set, because typing an id into a
 * text box is not a filter anyone can write. `isValueless` operators render
 * NOTHING — "is empty" with a disabled text box beside it looks broken rather
 * than complete.
 */
export function ValueInput({
  field,
  op,
  value,
  onChange,
  disabled = false,
}: {
  field: FilterField | undefined;
  op: Operator;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  if (isValueless(op)) {
    return <div className="flex-1 text-xs text-slate-400">—</div>;
  }

  if (field?.options?.length) {
    // "Contains" / "doesn't contain" name a SET of picked choices ("any of"),
    // not one — Lark Base's own reading. Every other operator is a plain
    // dropdown.
    if (field.kind === KIND.SELECT && (op === OP.CONTAINS || op === OP.NOT_CONTAINS)) {
      return <MultiSelectInput options={field.options} value={value} onChange={onChange} disabled={disabled} />;
    }
    return (
      <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="field-input min-w-0 flex-1 py-1.5 text-xs">
        <option value="">Select…</option>
        {field.options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }

  if (field?.kind === 'bool') {
    return (
      <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="field-input min-w-0 flex-1 py-1.5 text-xs">
        <option value="">Select…</option>
        <option value="true">Checked</option>
        <option value="false">Unchecked</option>
      </select>
    );
  }

  // A DATE field's `is` offers Lark Base's second dropdown — exact date, or a
  // relative window resolved at evaluation time. `before`/`after` keep the
  // plain date input.
  if (field?.kind === 'date' && op === OP.IS) {
    return <RelativeDateInput value={value} onChange={onChange} disabled={disabled} />;
  }

  return (
    <input
      // `date` gives the browser's own picker in the `YYYY-MM-DD` the evaluator
      // reads; `number` keeps a number field from accepting text.
      type={field?.kind === 'date' ? 'date' : field?.kind === 'number' ? 'number' : 'text'}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter a value"
      className="field-input min-w-0 flex-1 py-1.5 text-xs"
    />
  );
}

/**
 * The DATE `is` control — a mode dropdown and, only for "Exact date", the day
 * input beside it. Module-scope, never declared inside another component's
 * render body: a fresh component TYPE on every render remounts it and drops
 * focus after one keystroke.
 */
function RelativeDateInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const mode = dateModeOf(value);
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5">
      <select
        value={mode}
        disabled={disabled}
        onChange={(e) => {
          const next = e.target.value as DateMode;
          onChange(next === 'exact' ? '' : relativeDateValue(next));
        }}
        className="field-input min-w-0 flex-1 py-1.5 text-xs"
      >
        {DATE_MODE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {mode === 'exact' && (
        <input type="date" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="field-input min-w-0 flex-1 py-1.5 text-xs" />
      )}
    </div>
  );
}

/**
 * The "contains" / "doesn't contain" control for a select field — several
 * choices at once, in a Lark-Base-style dropdown: a search box pinned above a
 * list of coloured pills, a checkmark on the selected side, picking one
 * keeping the list open so several can be picked in one visit.
 *
 * In-flow and absolute inside its trigger, like every other popover here; the
 * panel it sits in is `panel-solid`, which creates no stacking context, so
 * this stacks above the rows below it at the same `z-50`.
 */
function MultiSelectInput({
  options,
  value,
  onChange,
  disabled,
}: {
  options: readonly FilterFieldOption[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const selected = parseMultiValue(value);
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const close = () => {
    setOpen(false);
    setQuery('');
  };
  useDismiss(root, open, close);

  // TOGGLE, NEVER CLOSE — several picks are one edit.
  const toggle = (v: string) =>
    onChange(toMultiValue(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]));

  const label =
    selected.length === 0
      ? 'Select…'
      : selected.length === 1
        ? options.find((o) => o.value === selected[0])?.label ?? selected[0]
        : `${selected.length} selected`;

  const needle = query.trim().toLowerCase();
  const rows = needle === '' ? options : options.filter((o) => o.label.toLowerCase().includes(needle));

  return (
    <div ref={root} className="relative min-w-0 flex-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => (open ? close() : setOpen(true))}
        className="field-input flex w-full items-center justify-between gap-1 py-1.5 text-left text-xs disabled:opacity-40"
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 flex w-64 flex-col overflow-hidden panel panel-solid p-0">
          <div className="shrink-0 border-b border-slate-200 p-1.5 dark:border-slate-700">
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full bg-transparent px-1.5 py-1 text-xs outline-none placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>
          <ul className="max-h-56 min-h-0 flex-1 overflow-y-auto p-1">
            {rows.length === 0 && <li className="px-2 py-3 text-center text-xs text-slate-400">No match.</li>}
            {rows.map((o) => {
              const checked = selected.includes(o.value);
              return (
                <li
                  key={o.value}
                  role="option"
                  aria-selected={checked}
                  // `mousedown`, not `click` — taken before the search input's
                  // blur, so the list never closes under the click.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    toggle(o.value);
                  }}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1.5',
                    checked && 'bg-slate-100 dark:bg-slate-700/60',
                  )}
                >
                  <OptionPill label={o.label} tone={optionTone(o, options.indexOf(o))} />
                  {checked && <Check className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-300" aria-hidden />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
