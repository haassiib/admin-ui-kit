'use client';

/* Origin: marketing-stats (96S1), verbatim. */

import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { useDismiss } from '@/lib/use-dismiss';

interface AutocompleteDropdownOption {
  value: string;
  label: string;
  /**
   * Optional heading this option sits under. When any option carries one, the list
   * renders as sticky group headings with their options indented beneath, instead of a
   * flat list — useful when the label alone is ambiguous (two agents can share a name
   * across brands) or when the list is long enough that a flat scroll is hard to scan.
   *
   * Purely presentational: `value` is still what's selected, and search still matches on
   * `label` AND `group`, so typing a group name narrows to that group's options.
   */
  group?: string;
}

interface AutocompleteDropdownProps {
  options: AutocompleteDropdownOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  className?: string;
  disabled?: boolean;
}

export function AutocompleteDropdown({ options, value, onChange, placeholder, searchPlaceholder, emptyText, className = '', disabled = false }: AutocompleteDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [position, setPosition] = React.useState<'top' | 'bottom'>('bottom');
  
  const filteredOptions =
    query === ''
      ? options
      // Group is searchable too — otherwise grouping would hide the narrowing the
      // caller previously got from a separate group-level picker.
      : options.filter(option =>
          option.label.toLowerCase().includes(query.toLowerCase())
          || (option.group ?? '').toLowerCase().includes(query.toLowerCase())
        );

  // Grouped rendering kicks in only when options actually carry groups, so every
  // existing caller keeps its flat list untouched. Insertion order is preserved so the
  // caller controls group order by sorting its options.
  const isGrouped = filteredOptions.some(option => option.group);
  const groupedOptions = React.useMemo(() => {
    const map = new Map<string, AutocompleteDropdownOption[]>();
    for (const option of filteredOptions) {
      const key = option.group ?? '';
      const list = map.get(key) ?? [];
      list.push(option);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [filteredOptions]);

  // Flat list in RENDER order (grouped or not) — the sequence arrow keys walk, so
  // keyboard order always matches what the eye sees.
  const flatOptions = React.useMemo(
    () => (isGrouped ? groupedOptions.flatMap(([, groupOptions]) => groupOptions) : filteredOptions),
    [isGrouped, groupedOptions, filteredOptions]
  );

  // Index into flatOptions of the keyboard-highlighted row. Hovering syncs it, so
  // mouse and keyboard can't disagree about what Enter would pick.
  const [activeIndex, setActiveIndex] = React.useState(0);

  const selectedLabel = options.find(option => option.value === value)?.label;

  const containerRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  useDismiss(containerRef, open, () => setOpen(false));

  // Typing re-filters the list, so the highlight goes back to the best (first)
  // match — the usual type-ahead behaviour.
  React.useEffect(() => { setActiveIndex(0); }, [query]);

  // Keep the highlighted row in view when arrowing past the visible window.
  React.useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  // Focusing the field itself opens the dropdown and starts a fresh search —
  // there's no separate nested search input anymore, this one field shows
  // the selected label while closed and doubles as the filter text while open.
  const handleFocus = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // Estimate dropdown height (max-h-60 is 15rem/240px + padding/input)
      setPosition(spaceBelow < 280 ? 'top' : 'bottom');
    }
    setQuery('');
    // Opening with a selection already made starts the highlight on that row
    // rather than the top of the list, so Enter is a no-op instead of silently
    // reassigning the field to whatever happens to sort first.
    const selectedIndex = options.findIndex(option => option.value === value);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const commitSelection = (option: AutocompleteDropdownOption) => {
    onChange(option.value === value ? null : option.value);
    setOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      e.currentTarget.blur();
      return;
    }
    // Tab commits nothing and just lets focus leave — closing here stops an
    // orphaned dropdown hanging over the next field.
    if (e.key === 'Tab') {
      setOpen(false);
      return;
    }
    if (!open) {
      // Arrow/Enter on a closed, focused field reopens it rather than doing nothing.
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault();
        handleFocus();
      }
      return;
    }
    if (flatOptions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(i => (i + 1) % flatOptions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(i => (i - 1 + flatOptions.length) % flatOptions.length);
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(flatOptions.length - 1);
        break;
      case 'Enter': {
        // preventDefault matters beyond the dropdown: these fields sit inside
        // <form> panels (BalanceForm, PaymentForm, …), where a bare Enter would
        // submit the form instead of picking the highlighted option.
        e.preventDefault();
        const option = flatOptions[activeIndex];
        if (option) commitSelection(option);
        break;
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        ref={dropdownRef}
        type="text"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="open menu"
        value={open ? query : (selectedLabel ?? '')}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={open ? searchPlaceholder : placeholder}
        autoComplete="off"
        className={`field-input pr-12 ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        disabled={disabled}
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-2">
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
      </div>

      {open && (
        <div data-overlay="picker" className={`absolute z-50 w-full overflow-auto panel panel-solid p-1 text-xs animate-fade-in custom-scrollbar ${position === 'bottom' ? 'mt-1' : 'bottom-full mb-1'}`}
        style={{ maxHeight: '15rem' }} // Equivalent to max-h-60
        >
          {filteredOptions.length === 0 && query !== '' ? (
            <div className="px-3 py-2 text-[11px] text-slate-400">{emptyText}</div>
          ) : (
            <div ref={listRef} role="listbox" className="space-y-0.5">
              {(isGrouped ? groupedOptions : [['', filteredOptions] as const]).map(([group, groupOptions]) => (
                <div key={group || '__ungrouped'}>
                  {group && (
                    // Sticky so the heading stays visible while scrolling a long group.
                    <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {group}
                    </div>
                  )}
                  {groupOptions.map(option => {
                    const isActive = flatOptions[activeIndex]?.value === option.value;
                    return (
                      <div
                        key={option.value}
                        role="option"
                        aria-selected={value === option.value}
                        data-active={isActive || undefined}
                        // Hover moves the highlight, so the mouse and the keyboard
                        // always agree on what Enter would commit.
                        onMouseEnter={() => setActiveIndex(flatOptions.findIndex(o => o.value === option.value))}
                        onClick={() => commitSelection(option)}
                        className={`relative cursor-pointer select-none py-1.5 pl-7 pr-3 rounded-lg transition-colors ${
                          isActive ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <span className="block truncate">{option.label}</span>
                        {value === option.value && <Check className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5" />}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}