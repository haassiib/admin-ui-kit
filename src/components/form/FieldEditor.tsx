'use client';

import { useEffect, useState } from 'react';
import {
  Calendar,
  CircleChevronDown,
  CircleDollarSign,
  GripVertical,
  Hash,
  Link,
  ListChecks,
  Mail,
  Plus,
  SquareCheck,
  TextAlignStart,
  Trash2,
  Type,
  User,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { FilterFieldOption } from '@/lib/conditions';
import { FIELD_TYPES, FIELD_TYPE_LABELS, hasOptions, slugKey, type FieldDef, type FieldType } from '@/lib/fields';
import { PANEL_GRIP_CLASS, PANEL_REMOVE_CLASS } from '@/lib/toolbar';
import { isTone, toneAt, type Tone } from '@/lib/tones';
import AnchoredPanel, { type Anchor } from '@/components/overlay/AnchoredPanel';
import ConfirmPopover from '@/components/overlay/ConfirmPopover';
import OptionPill from '@/components/data/OptionPill';
import SortableList from '@/components/table/SortableList';
import { SwatchPicker } from './ColorRulesPanel';

const ICONS: Record<FieldType, LucideIcon> = {
  text: Type,
  longtext: TextAlignStart,
  number: Hash,
  currency: CircleDollarSign,
  date: Calendar,
  checkbox: SquareCheck,
  select: CircleChevronDown,
  multiselect: ListChecks,
  user: User,
  url: Link,
  email: Mail,
};

/** The icon for a field type, shared with the grid's headers. */
export function FieldTypeIcon({ type, className }: { type: FieldType; className?: string }) {
  const Icon = ICONS[type];
  return <Icon className={cn('h-3.5 w-3.5', className)} aria-hidden />;
}

/**
 * The field editor — the Lark Base "Edit field" form: a name, a type from
 * the full list, and, for a choice type, the options with their colours.
 * Opens as an `AnchoredPanel` beside or below whatever asked for it (a "+"
 * column header, a column menu), so editing a column happens where the
 * column is rather than in a drawer across the screen.
 *
 * ── New or existing ─────────────────────────────────────────────────────────
 *
 * `field` null is a NEW field: the key is derived from the name on Save
 * (`slugKey`, unique against `existingKeys`) and never changes after, so a
 * rename later does not orphan every stored value. An existing field keeps
 * its key; `typeLocked` shows its type without offering a change, for a
 * column the caller defines in code rather than as data.
 *
 * ── Drafts until Save ───────────────────────────────────────────────────────
 *
 * Nothing reaches `onSave` until the button; Cancel, Escape and an outside
 * click discard. Deleting asks first, through `ConfirmPopover`, because a
 * column's values go with it.
 */
export default function FieldEditor({
  open,
  anchor,
  field,
  existingKeys = [],
  typeLocked = false,
  placement = 'below',
  onSave,
  onDelete,
  onClose,
}: {
  open: boolean;
  anchor: Anchor | null;
  /** The field being edited, or null for a new one. */
  field: FieldDef | null;
  /** Keys already in use, so a new field's key is unique. */
  existingKeys?: string[];
  /** Show the type but do not offer a change. */
  typeLocked?: boolean;
  placement?: 'beside' | 'below';
  onSave: (field: FieldDef) => void;
  /** Present, an existing field gets a Delete button. */
  onDelete?: (key: string) => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState(field?.label ?? '');
  const [type, setType] = useState<FieldType>(field?.type ?? 'text');
  const [options, setOptions] = useState<FilterFieldOption[]>(field?.options ?? []);
  const [newOption, setNewOption] = useState('');

  // Re-seed on every open, so a cancelled edit does not leak into the next.
  useEffect(() => {
    if (!open) return;
    setLabel(field?.label ?? '');
    setType(field?.type ?? 'text');
    setOptions(field?.options ?? []);
    setNewOption('');
  }, [open, field]);

  const isNew = field === null;
  const canSave = label.trim() !== '';

  const save = () => {
    if (!canSave) return;
    const def: FieldDef = {
      key: field?.key ?? slugKey(label, existingKeys),
      label: label.trim(),
      type,
      ...(hasOptions(type) ? { options } : {}),
    };
    onSave(def);
  };

  const addOption = () => {
    const text = newOption.trim();
    if (!text) return;
    const value = slugKey(text, options.map((o) => o.value));
    setOptions((prev) => [...prev, { value, label: text, tone: toneAt(prev.length) }]);
    setNewOption('');
  };

  const patchOption = (value: string, patch: Partial<FilterFieldOption>) =>
    setOptions((prev) => prev.map((o) => (o.value === value ? { ...o, ...patch } : o)));

  return (
    <AnchoredPanel
      open={open}
      anchor={anchor}
      onClose={onClose}
      title={isNew ? 'New field' : 'Edit field'}
      subtitle={isNew ? undefined : `${FIELD_TYPE_LABELS[type]} · ${field.key}`}
      placement={placement}
      width={360}
      footer={
        <div className="flex items-center gap-2">
          {!isNew && onDelete && (
            <ConfirmPopover
              title="Delete this field?"
              description="Every value stored in it goes with it."
              confirmText="Delete"
              onConfirm={() => onDelete(field.key)}
            >
              <button type="button" aria-label="Delete field" className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40">
                <Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete
              </button>
            </ConfirmPopover>
          )}
          <button type="button" onClick={onClose} className="ml-auto btn-ghost text-xs">
            Cancel
          </button>
          <button type="button" onClick={save} disabled={!canSave} className="btn-primary disabled:opacity-40">
            {isNew ? 'Add field' : 'Save'}
          </button>
        </div>
      }
    >
      <form
        className="space-y-3 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <label className="block">
          <span className="field-label">Name</span>
          <input autoFocus value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Field name" className="field-input" />
        </label>

        <div>
          <span className="field-label">Type</span>
          {typeLocked ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
              <FieldTypeIcon type={type} className="text-slate-400" />
              {FIELD_TYPE_LABELS[type]}
              <span className="ml-auto text-[11px] text-slate-400">Fixed for this column</span>
            </div>
          ) : (
            <div role="radiogroup" aria-label="Field type" className="grid grid-cols-2 gap-1">
              {FIELD_TYPES.map((t) => {
                const active = t.type === type;
                return (
                  <button
                    key={t.type}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setType(t.type)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition-colors',
                      active
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-200'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800',
                    )}
                  >
                    <FieldTypeIcon type={t.type} className={active ? 'text-indigo-500' : 'text-slate-400'} />
                    <span className="min-w-0">
                      <span className="block font-medium leading-4">{t.label}</span>
                      <span className="block text-[10px] leading-3 text-slate-400">{t.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {hasOptions(type) && (
          <div>
            <span className="field-label">{type === 'user' ? 'People' : 'Options'}</span>
            {options.length === 0 && (
              <p className="mb-1.5 rounded-lg bg-slate-50 px-3 py-3 text-center text-[11px] text-slate-400 dark:bg-slate-900/40">
                No {type === 'user' ? 'people' : 'options'} yet. Add the first below.
              </p>
            )}
            <SortableList
              group="field-editor-options"
              items={options}
              getId={(o) => o.value}
              onReorder={setOptions}
              className="space-y-1"
              renderItem={(o, { isDragging, handleProps }) => (
                <div className={cn('flex items-center gap-1.5 rounded', isDragging && 'bg-slate-100 dark:bg-slate-700')}>
                  <button type="button" aria-label={`Drag to reorder ${o.label}`} {...handleProps} className={PANEL_GRIP_CLASS}>
                    <GripVertical className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <SwatchPicker
                    tone={isTone(o.tone) ? o.tone : toneAt(options.indexOf(o))}
                    onPick={(tone: Tone) => patchOption(o.value, { tone })}
                  />
                  <input
                    value={o.label}
                    onChange={(e) => patchOption(o.value, { label: e.target.value })}
                    aria-label={`Label for ${o.label}`}
                    className="field-input min-w-0 flex-1 py-1.5 text-xs"
                  />
                  <OptionPill label={o.label || '…'} tone={isTone(o.tone) ? o.tone : toneAt(options.indexOf(o))} className="hidden sm:inline-flex" />
                  <button type="button" aria-label={`Remove ${o.label}`} onClick={() => setOptions((prev) => prev.filter((x) => x.value !== o.value))} className={PANEL_REMOVE_CLASS}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            />
            <div className="mt-1.5 flex gap-1.5">
              <input
                value={newOption}
                onChange={(e) => setNewOption(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addOption();
                  }
                }}
                placeholder={type === 'user' ? 'Add a person' : 'Add an option'}
                className="field-input min-w-0 flex-1 py-1.5 text-xs"
              />
              <button type="button" onClick={addOption} disabled={!newOption.trim()} className="btn-ghost inline-flex items-center gap-1 text-xs disabled:opacity-40">
                <Plus className="h-3.5 w-3.5" aria-hidden /> Add
              </button>
            </div>
          </div>
        )}
      </form>
    </AnchoredPanel>
  );
}
