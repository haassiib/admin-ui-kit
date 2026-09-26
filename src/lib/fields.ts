/**
 * FIELD TYPES — what a user-defined column can be, and how each type maps
 * onto the grid's coarser vocabulary.
 *
 * `FilterKind` (`lib/conditions`) is deliberately coarse: a text and a long
 * text offer the same operators, a select and a multi-select the same. The
 * field TYPE is the finer thing a person picks when adding a column, and it
 * decides three more things the kind cannot: how a stored value is coerced
 * when the type changes, how a cell is drawn (a currency has two decimals, a
 * URL is a link), and which editor opens. One table here, read by the field
 * editor, the grid and the demo alike.
 *
 * PURE. Origin: the type list of ticket-management (96S2) `lib/ticket/fields.ts`,
 * with URL and email added and attachments left out.
 */

import { KIND, type FilterFieldOption, type FilterKind } from './conditions';

export type FieldType =
  | 'text'
  | 'longtext'
  | 'number'
  | 'currency'
  | 'date'
  | 'checkbox'
  | 'select'
  | 'multiselect'
  | 'user'
  | 'url'
  | 'email';

/** In the order the type picker offers them. */
export const FIELD_TYPES: readonly { type: FieldType; label: string; hint: string }[] = [
  { type: 'text', label: 'Text', hint: 'A short line' },
  { type: 'longtext', label: 'Long text', hint: 'Paragraphs' },
  { type: 'number', label: 'Number', hint: 'Plain figure' },
  { type: 'currency', label: 'Currency', hint: 'Two decimals' },
  { type: 'date', label: 'Date', hint: 'A calendar day' },
  { type: 'checkbox', label: 'Checkbox', hint: 'Yes or no' },
  { type: 'select', label: 'Single select', hint: 'One choice' },
  { type: 'multiselect', label: 'Multi select', hint: 'Several choices' },
  { type: 'user', label: 'Person', hint: 'One of a list of people' },
  { type: 'url', label: 'URL', hint: 'A link' },
  { type: 'email', label: 'Email', hint: 'An address' },
];

export const FIELD_TYPE_LABELS: Record<FieldType, string> = Object.fromEntries(
  FIELD_TYPES.map((t) => [t.type, t.label]),
) as Record<FieldType, string>;

export function isFieldType(v: unknown): v is FieldType {
  return typeof v === 'string' && FIELD_TYPES.some((t) => t.type === v);
}

/** A column's editable definition — what the field editor reads and writes. */
export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  /** The choices of a select, multi-select or person field. */
  options?: FilterFieldOption[];
};

/** Types whose value is picked from a fixed list. */
export function hasOptions(type: FieldType): boolean {
  return type === 'select' || type === 'multiselect' || type === 'user';
}

export function isMultiType(type: FieldType): boolean {
  return type === 'multiselect';
}

/** The coarse kind a type filters, sorts and groups as. */
export function kindOfFieldType(type: FieldType): FilterKind {
  switch (type) {
    case 'number':
    case 'currency':
      return KIND.NUMBER;
    case 'date':
      return KIND.DATE;
    case 'select':
    case 'multiselect':
      return KIND.SELECT;
    case 'checkbox':
      return KIND.BOOL;
    case 'user':
      return KIND.REF;
    default:
      return KIND.TEXT;
  }
}

/** The type to assume for a column declared with only a kind. */
export function fieldTypeOfKind(kind: FilterKind, multi = false): FieldType {
  switch (kind) {
    case KIND.NUMBER: return 'number';
    case KIND.DATE: return 'date';
    case KIND.SELECT: return multi ? 'multiselect' : 'select';
    case KIND.BOOL: return 'checkbox';
    case KIND.REF: return 'user';
    default: return 'text';
  }
}

const isBlank = (v: unknown) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);

/**
 * A stored value read AS a type. What makes changing a column's type safe:
 * a number column turned into text keeps "42", a select turned into a
 * multi-select keeps its one choice as a one-element list, and anything
 * that cannot be read as the new type reads as empty rather than throwing.
 */
export function coerceValue(type: FieldType, raw: unknown): unknown {
  if (isBlank(raw)) return type === 'multiselect' ? [] : type === 'checkbox' ? false : null;
  switch (type) {
    case 'number':
    case 'currency': {
      const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^0-9.+-]/g, ''));
      return Number.isFinite(n) ? n : null;
    }
    case 'checkbox':
      return raw === true || raw === 'true' || raw === 1 || raw === '1';
    case 'date': {
      if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? null : raw.toISOString().slice(0, 10);
      const s = String(Array.isArray(raw) ? raw[0] : raw);
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      const d = new Date(s);
      return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
    }
    case 'multiselect':
      return Array.isArray(raw) ? raw.map(String) : [String(raw)];
    case 'select':
    case 'user':
      return Array.isArray(raw) ? (raw.length ? String(raw[0]) : null) : String(raw);
    default:
      return Array.isArray(raw) ? raw.map(String).join(', ') : String(raw);
  }
}

/**
 * A stable key from a label — `Story points` → `story_points` — made unique
 * against the keys already taken, so two fields called "Notes" become
 * `notes` and `notes_2` rather than one overwriting the other.
 */
export function slugKey(label: string, taken: readonly string[] = []): string {
  const base = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'field';
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base}_${n}`)) n += 1;
  return `${base}_${n}`;
}
