'use client';

/* Origin: ticket-management (96S2) `tickets/ColorRulesPanel.tsx`. */

import { useEffect, useRef, useState } from 'react';
import { GripVertical, PaintBucket, Plus, X } from 'lucide-react';
import { OPERATOR_LABELS, operatorsFor, type FilterField, type Operator } from '@/lib/conditions';
import { COLOR_TONES, MAX_COLOR_RULES, newRuleId, type ColorRule, type ColorScope } from '@/lib/coloring';
import { TONE_DOT, type Tone } from '@/lib/tones';
import { cn } from '@/lib/cn';
import {
  PANEL_EMPTY_CLASS,
  PANEL_GRIP_CLASS,
  PANEL_REMOVE_CLASS,
  TOOLBAR_BADGE_CLASS,
  TOOLBAR_PANEL_CLASS,
  panelAddButtonClass,
  toolbarButtonClass,
} from '@/lib/toolbar';
import { useDismiss } from '@/lib/use-dismiss';
import SortableList from '@/components/table/SortableList';
import { InfoTooltip } from '@/components/overlay/Tooltip';
import { ValueInput } from './FilterPanel';

const SCOPE_LABELS: Record<ColorScope, string> = { cell: 'Cell', row: 'Row' };

/**
 * CONDITIONAL COLOURING — `[colour] [scope] [field] [operator] [value]` rows.
 *
 * A colouring rule IS a filter predicate with a colour attached, so the field
 * select, the operator select and the value control are the same vocabulary
 * and — for the value — literally the same component (`ValueInput`, exported
 * from `FilterPanel`). Nothing here decides what an operator means;
 * `resolveRowColors` in `lib/coloring` does, from the same evaluator the
 * filter uses.
 *
 * Holds a DRAFT and commits on Apply, matching the other toolbar panels. A
 * reader still previews a rule's own swatch inline in the still-open panel;
 * what does not happen is the grid repainting mid-edit.
 *
 * ORDER IS PRIORITY. First match wins per target, so dragging a rule up is a
 * real edit rather than tidying — which is why the handle is here.
 */
export default function ColorRulesPanel({
  fields,
  rules,
  onChange,
  title = 'Conditional colouring',
  width = 540,
  className,
}: {
  fields: FilterField[];
  rules: ColorRule[];
  onChange: (rules: ColorRule[]) => void;
  title?: string;
  width?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ColorRule[]>(rules);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraft(rules);
  }, [rules]);

  const revertAndClose = () => {
    setDraft(rules);
    setOpen(false);
  };
  useDismiss(root, open, revertAndClose);

  const apply = () => {
    onChange(draft);
    setOpen(false);
  };

  const byId = new Map(fields.map((f) => [f.id, f]));
  const setAt = (id: string, patch: Partial<ColorRule>) =>
    setDraft((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const removeAt = (id: string) => setDraft((prev) => prev.filter((r) => r.id !== id));

  const add = () => {
    const first = fields[0];
    if (!first) return;
    setDraft((prev) => [
      ...prev,
      {
        id: newRuleId(),
        // CELL is the default: a wrong cell rule tints one column, a wrong
        // row rule repaints the grid.
        scope: 'cell',
        field: first.id,
        op: operatorsFor(first.kind)[0],
        value: '',
        // The first tone not already spoken for, so three rules added in a
        // row are three different colours.
        tone: COLOR_TONES.find((t) => !prev.some((r) => r.tone === t)) ?? COLOR_TONES[0],
      },
    ]);
  };

  // Changing the FIELD can invalidate the operator — the filter panel's rule.
  const changeField = (id: string, fieldId: string) => {
    const field = byId.get(fieldId);
    const current = draft.find((r) => r.id === id);
    if (!field || !current) return;
    const ops = operatorsFor(field.kind);
    setAt(id, { field: fieldId, op: ops.includes(current.op) ? current.op : ops[0], value: '' });
  };

  const label = rules.length ? `${title} — ${rules.length} rule${rules.length === 1 ? '' : 's'}` : title;

  return (
    <div ref={root} className={cn('relative inline-block', className)}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        title={label}
        onClick={() => (open ? revertAndClose() : setOpen(true))}
        className={toolbarButtonClass(open || rules.length > 0)}
      >
        <PaintBucket className="h-4 w-4" aria-hidden />
        {rules.length > 0 && <span className={TOOLBAR_BADGE_CLASS}>{rules.length}</span>}
      </button>

      {open && (
        <div style={{ width }} className={TOOLBAR_PANEL_CLASS}>
          <div className="mb-2 flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-200">{title}</span>
            <InfoTooltip
              label="How colouring works"
              content="Rules are checked top to bottom and the FIRST match wins, so drag the one that should take precedence upwards. Cell tints just that column; Row tints the whole row."
            />
          </div>

          {draft.length === 0 && <p className={PANEL_EMPTY_CLASS}>No colouring rules. Every row is drawn the same.</p>}

          <SortableList
            group="color-rules"
            items={draft}
            getId={(r) => r.id}
            onReorder={setDraft}
            className="space-y-1.5"
            renderItem={(rule, { isDragging, handleProps }) => {
              const field = byId.get(rule.field);
              const ops = operatorsFor(field?.kind ?? 'text');
              return (
                <div className={cn('flex items-center gap-1.5 rounded', isDragging && 'bg-slate-100 dark:bg-slate-700')}>
                  <button type="button" aria-label="Reorder — the first matching rule wins" {...handleProps} className={PANEL_GRIP_CLASS}>
                    <GripVertical className="h-3.5 w-3.5" aria-hidden />
                  </button>

                  <SwatchPicker tone={rule.tone} onPick={(tone) => setAt(rule.id, { tone })} />

                  <select
                    aria-label="Where this colour is applied"
                    value={rule.scope}
                    onChange={(e) => setAt(rule.id, { scope: e.target.value as ColorScope })}
                    className="field-input w-20 shrink-0 py-1.5 text-xs"
                  >
                    {(Object.keys(SCOPE_LABELS) as ColorScope[]).map((s) => (
                      <option key={s} value={s}>{SCOPE_LABELS[s]}</option>
                    ))}
                  </select>

                  <select value={rule.field} onChange={(e) => changeField(rule.id, e.target.value)} className="field-input w-36 shrink-0 py-1.5 text-xs">
                    {fields.map((f) => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>

                  <select
                    value={rule.op}
                    onChange={(e) => setAt(rule.id, { op: e.target.value as Operator, value: '' })}
                    className="field-input w-32 shrink-0 py-1.5 text-xs"
                  >
                    {ops.map((op) => (
                      <option key={op} value={op}>{OPERATOR_LABELS[op]}</option>
                    ))}
                  </select>

                  {/* THE FILTER PANEL'S OWN CONTROL — see its export note. */}
                  <ValueInput field={field} op={rule.op} value={rule.value} onChange={(v) => setAt(rule.id, { value: v })} />

                  <button type="button" aria-label="Remove this rule" onClick={() => removeAt(rule.id)} className={PANEL_REMOVE_CLASS}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            }}
          />

          <div className="mt-2 flex items-center gap-2 border-t border-slate-100 pt-2 dark:border-slate-700">
            <button type="button" onClick={add} disabled={draft.length >= MAX_COLOR_RULES || fields.length === 0} className={panelAddButtonClass()}>
              <Plus className="h-3.5 w-3.5" /> New rule
            </button>
            {draft.length >= MAX_COLOR_RULES && <InfoTooltip content={`${MAX_COLOR_RULES} rules is the limit.`} label="Why can't I add more?" iconClassName="w-3 h-3" />}
            {draft.length > 0 && (
              <button type="button" onClick={() => setDraft([])} className="ml-auto btn-ghost text-xs">
                Clear all
              </button>
            )}
            <button type="button" onClick={apply} className="ml-auto btn-primary">
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The colour swatch, opening a grid of every tone.
 *
 * NOT a `<select>`: the thing being chosen is the colour itself, and a
 * dropdown of the WORD "amber" makes the reader translate a name into a hue
 * that is sitting right there. The names are still the accessible label.
 */
export function SwatchPicker({ tone, onPick }: { tone: Tone; onPick: (tone: Tone) => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useDismiss(box, open, () => setOpen(false));

  return (
    <div ref={box} className="relative shrink-0">
      <button
        type="button"
        aria-label={`Colour: ${tone}`}
        title={tone}
        onClick={() => setOpen((v) => !v)}
        className={cn('h-5 w-5 rounded ring-1 ring-inset ring-black/10 dark:ring-white/10', TONE_DOT[tone] ?? TONE_DOT.slate)}
      />
      {open && (
        <div className="absolute left-0 top-6 z-50 grid w-max grid-cols-6 gap-1 panel panel-solid p-1.5">
          {COLOR_TONES.map((t) => (
            <button
              key={t}
              type="button"
              aria-label={t}
              title={t}
              onClick={() => {
                onPick(t);
                setOpen(false);
              }}
              className={cn(
                'h-5 w-5 rounded ring-1 ring-inset ring-black/10 dark:ring-white/10',
                TONE_DOT[t],
                t === tone && 'outline outline-2 outline-offset-1 outline-indigo-500',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
