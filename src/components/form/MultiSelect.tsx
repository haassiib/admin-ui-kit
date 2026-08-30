'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import Checkbox from './Checkbox';

/**
 * MERGED from two copies. This is bonus-adjustment's `MultiSelect`, which keys
 * on numbers; marketing-stats' `MultiSelectDropdown` keyed on strings, and each
 * was unusable for the other's data. The value type is now `OptionValue`, so a
 * numeric id and a string slug both work and neither call site had to change
 * shape to migrate.
 */
export type OptionValue = string | number;

export type Option = {
  value: OptionValue;
  label: string;
  hint?: string;
  /** Rendered but not selectable — used for roles above the actor's rank. */
  disabled?: boolean;
};

/**
 * Checkbox dropdown for assigning a set of things (roles to a user, permissions
 * to a role). Selected values show as removable chips on the closed control, so
 * the current selection is readable without opening it.
 *
 * A disabled option stays VISIBLE rather than being filtered out — a role the
 * actor may not grant should be legible as "exists, not yours to give", which is
 * the same rank rule the server enforces.
 */
export default function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select…',
  searchable = true,
  emptyLabel = 'No options',
}: {
  options: Option[];
  selected: OptionValue[];
  onChange: (next: OptionValue[]) => void;
  placeholder?: string;
  searchable?: boolean;
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const byValue = useMemo(() => new Map(options.map((o) => [o.value, o])), [options]);

  const toggle = (value: OptionValue) => {
    const option = byValue.get(value);
    if (option?.disabled) return;
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="field-input flex items-center gap-2 text-left min-h-[34px]"
      >
        <span className="flex-1 flex flex-wrap gap-1 min-w-0">
          {selected.length === 0 && <span className="text-slate-400">{placeholder}</span>}
          {selected.map((value) => {
            const option = byValue.get(value);
            if (!option) return null;
            return (
              <span
                key={value}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold"
              >
                {option.label}
                {!option.disabled && (
                  <X
                    className="w-2.5 h-2.5 hover:text-indigo-900 dark:hover:text-indigo-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(value);
                    }}
                  />
                )}
              </span>
            );
          })}
        </span>
        <ChevronDown
          className={cn('w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full panel p-2 max-h-72 overflow-y-auto custom-scrollbar">
          {searchable && options.length > 6 && (
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter…"
                className="field-input pl-7 py-1.5"
              />
            </div>
          )}

          {filtered.length === 0 && (
            <p className="px-1 py-2 text-[11px] text-slate-400">{emptyLabel}</p>
          )}

          <div className="space-y-1.5">
            {filtered.map((option) => (
              <Checkbox
                key={option.value}
                id={`ms-${option.value}`}
                checked={selected.includes(option.value)}
                disabled={option.disabled}
                onChange={() => toggle(option.value)}
                label={option.label}
                hint={option.hint}
                className="px-1"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
