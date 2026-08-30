'use client';

/* Origin: bonus-adjustment (96S2), verbatim. */

/**
 * CombinedFilterDropdown
 * ------------------------------------------------------------------
 * Generic, config-driven "combined filter" control: a single trigger button
 * opens one dropdown panel containing any number of multi-select filter
 * categories. Rendered as a two-level flyout (Linear/Notion-style filter
 * menu):
 *
 *   Level 1 — a plain list of category names (with a count badge for any
 *   category that already has a selection) inside the panel's left column.
 *   Level 2 — clicking a category opens its search box + selectable item list in a
 *   side column beside the level-1 list (both stay visible at once; a back
 *   chevron in the level-2 header collapses back to the level-1-only width,
 *   and also mirrors what Escape does one press at a time).
 *
 * Selections render as removable chips beside the trigger, on the same
 * single line (each chip keeps a small label prefix for context — categories
 * are all plain neutral gray now, not color-coded). When the chips would
 * overflow the available width, the row truncates and shows a "+N more" chip
 * instead of wrapping — clicking it opens a small popover listing the rest
 * (each still removable), plus "Clear all". The fit calculation is done with
 * a real `ResizeObserver` + a hidden measuring copy of the chips (see
 * `FilterChipsRow`), not a hardcoded chip count, since chip width depends on
 * label length and the available width depends on where the component is
 * placed.
 *
 * Selection is BATCHED, not applied live: `value`/`onChange` are still the
 * only public surface (fully controlled from the outside, so it composes
 * naturally with a page's own Zustand store, same shape `MultiSelectDropdown`
 * already uses per-filter) — but internally, opening the flyout snapshots
 * `value` into a local `draftValue`, every checkbox/search-select/clear
 * interaction inside the flyout mutates only that draft, and nothing is
 * reported to the parent (`onChange`) until the footer's "Apply" button is
 * clicked. This exists specifically so a page's `useEffect`-driven
 * server-action fetch (wired to `onChange` via a memoized selected-ids array)
 * fires once per Apply instead of once per checkbox click. Closing the panel
 * any other way (outside click, Escape, or the footer's "Cancel") discards
 * the draft. The one exception is the selected-chips row beside the trigger:
 * removing a chip there is a single, already-deliberate action outside the
 * flyout (not the rapid-fire-checkbox problem this batching solves), so it
 * still commits immediately via `onChange`, same as before.
 *
 * Minimal usage example:
 *
 *   const [value, setValue] = useState<FilterValue>({ platform: [], brands: [] });
 *
 *   <CombinedFilterDropdown
 *     groups={[
 *       { key: 'platform', label: 'Platform', options: [{ id: 'fb', label: 'Facebook' }, { id: 'tt', label: 'TikTok' }] },
 *       { key: 'brands', label: 'Brands', options: brands.map(b => ({ id: b.id, label: b.name })) },
 *     ]}
 *     value={value}
 *     onChange={(groupKey, ids) => setValue(prev => ({ ...prev, [groupKey]: ids }))}
 *   />
 *
 * Wiring into a Zustand store later looks the same, just swapping `value`/
 * `onChange` for the store's filter slice and a setter that writes into it.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Filter, Plus, Search, X } from 'lucide-react';

export interface FilterOption {
  id: string | number;
  label: string;
  /**
   * Nests this option under another option in the SAME group, one level deep.
   * A category whose options carry these renders collapsed: only the parents
   * are listed, each with a chevron that reveals its children. Searching
   * overrides the collapse — a term matching a parent reveals its children, and
   * a term matching a child surfaces it under its parent.
   *
   * For a category asked at two grains ("which back office" — the whole cluster,
   * or one brand inside it). Without it, the two grains sit in one flat list and
   * a handful of clusters becomes forty rows to scroll.
   */
  parentId?: string | number;
  /**
   * Label to use where the option appears WITHOUT its parent above it — the
   * Selected column, the chips, the summary line. A child's own `label` can be
   * bare ("TH96") because the parent row directly above supplies the context;
   * nothing supplies it in those other places.
   */
  contextLabel?: string;
}

export interface FilterGroup {
  /** Stable key identifying this category — matches the key used in `value`/`onChange`. */
  key: string;
  /** Section heading shown in the dropdown panel, and the mini-label prefixing its chip group. */
  label: string;
  options: FilterOption[];
  searchPlaceholder?: string;
  emptyText?: string;
  /**
   * Renders this category as a radio list — exactly one option selected, always.
   * Opt-in; every category is multi-select by default.
   *
   * Use it for a category that picks a MODE rather than narrowing a set (e.g. a
   * report's grouping). Multi-select is wrong there twice over: the checkbox-style
   * Available|Selected split affords picking two mutually exclusive options, and
   * "Clear"/an empty selection would leave the consumer with no value at all.
   * A single-select group therefore has no Available|Selected split, no "Select
   * all", no "Clear", and no removable chip — clicking an option replaces the
   * selection instead of toggling it, so it can never be empty or hold two values.
   */
  singleSelect?: boolean;
  /**
   * Keep this category out of the `selectionDisplay="summary"` line. For a category
   * that picks a MODE (a report's grouping) rather than scoping the data — the summary
   * exists to say what the figures on screen are restricted to, and an arrangement
   * isn't a restriction.
   */
  hideFromSummary?: boolean;
}

/** Selected option ids per group key, e.g. `{ platform: ['fb'], brands: [1, 2] }`. */
export type FilterValue = Record<string, Array<string | number>>;

interface CombinedFilterDropdownProps {
  groups: FilterGroup[];
  value: FilterValue;
  /** Called with the full next-selection array for a single group whenever it changes. */
  onChange: (groupKey: string, selectedIds: Array<string | number>) => void;
  /** Label on the trigger button. Defaults to "Filters". */
  triggerLabel?: string;
  className?: string;
  /** A category only gets its own search box once it has more options than this. Defaults to 8. */
  searchThreshold?: number;
  /**
   * Makes "Clear all" clear the OWNER's whole filter set, not just this
   * component's categories — a search term and a date range live outside it and
   * would otherwise survive a control labelled "clear all".
   *
   * Supplying it also removes the need for a separate Clear button beside the
   * trigger, which is what this replaced.
   */
  onClearEverything?: () => void;
  /**
   * How the current selection is surfaced beside the trigger.
   *
   * 'chips' (default) — one removable chip per selected option, measured to fit on one
   * line with a "+N more" overflow popover.
   *
   * 'summary' — a single compact line ("TC · Facebook · 3 agents") that opens a popover
   * holding the removable chips. Fixed height regardless of how much is selected, so a
   * crowded toolbar never reflows, at the cost of one click to remove something. Prefer
   * it where the filter silently scopes the figures on screen (a report), since the
   * summary keeps that scope readable without opening anything.
   */
  selectionDisplay?: 'chips' | 'summary';
}

function idsEqual(a: string | number, b: string | number) {
  return String(a) === String(b);
}

/** Order-independent equality for a single group's selected-ids array — used to diff draft vs. committed value. */
function sameSelection(a: Array<string | number> = [], b: Array<string | number> = []) {
  if (a.length !== b.length) return false;
  return a.every(id => b.some(other => idsEqual(id, other)));
}

/** No-op used where a required callback prop is never actually invokable (e.g. a hidden, inert measuring element). */
const noop = () => {};

/**
 * Shared dismiss-on-outside-click-or-Escape wiring for a floating panel. Only
 * attaches its `document`-level listeners while `active` is true, so a
 * closed panel costs nothing. Used by both the main flyout panel and the
 * "+N more" popover below — each just supplies its own ref + close behavior.
 */
function useDismissOnOutsideOrEscape<T extends HTMLElement>(
  ref: RefObject<T | null>,
  active: boolean,
  onOutsideClick: () => void,
  onEscape: () => void
) {
  useEffect(() => {
    if (!active) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOutsideClick();
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onEscape();
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [active, ref, onOutsideClick, onEscape]);
}

export function CombinedFilterDropdown({
  groups,
  value,
  onChange,
  triggerLabel = 'Filters',
  className = '',
  searchThreshold = 8,
  selectionDisplay = 'chips',
  onClearEverything,
}: CombinedFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Which category's level-2 flyout (search + toggleable item list) is currently open,
  // if any. Reset to null whenever the whole panel closes, so reopening the
  // trigger always starts back at the level-1 category list.
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(null);
  const [searchByGroup, setSearchByGroup] = useState<Record<string, string>>({});

  // In-progress selection, local to the flyout — every checkbox/select-many/
  // clear interaction while the panel is open mutates this, not `value`.
  // Nothing reaches the parent's `onChange` until "Apply" is clicked. Synced
  // from `value` only on the closed->open transition below (never on every
  // `value` change) so a mid-session external update to `value` doesn't blow
  // away an in-progress draft while the panel happens to be open.
  /**
   * Whether "Clear all" has anything to do, when the owner supplies
   * `onClearEverything`: this component cannot see the search box or the dates,
   * so it asks rather than inferring from its own selection.
   */
  const anythingToClear = onClearEverything !== undefined;

  const [draftValue, setDraftValue] = useState<FilterValue>(value);
  useEffect(() => {
    if (isOpen) setDraftValue(value);
    // Intentionally only re-syncing on the isOpen transition, not on every
    // `value` change — see comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Which edge the flyout panel is anchored to. Computed from the trigger's
  // real position + the panel's own rendered width (not a guessed constant —
  // level 2 only exists once a category is active, so the panel's true width
  // varies), so it self-corrects at any screen width or trigger position
  // instead of assuming there's always room to grow rightward.
  const [panelAlign, setPanelAlign] = useState<'left' | 'right'>('left');

  useLayoutEffect(() => {
    if (!isOpen) return;
    const recomputeAlign = () => {
      const container = containerRef.current;
      const panel = panelRef.current;
      if (!container || !panel) return;
      const containerLeft = container.getBoundingClientRect().left;
      const overflowsRight = containerLeft + panel.offsetWidth > window.innerWidth - 8;
      setPanelAlign(overflowsRight ? 'right' : 'left');
    };
    recomputeAlign();
    window.addEventListener('resize', recomputeAlign);
    return () => window.removeEventListener('resize', recomputeAlign);
  }, [isOpen, activeGroupKey]);

  // Closes the panel WITHOUT applying — discards the draft immediately (also
  // happens naturally on next open per the effect above, but resetting here
  // too means no stale draft lingers in state in the meantime).
  const closePanel = useCallback(() => {
    setIsOpen(false);
    setActiveGroupKey(null);
    setDraftValue(value);
  }, [value]);

  // First Escape steps back from level 2 to level 1, mirroring the back
  // chevron; a second Escape (or one from level 1) closes the panel — via
  // `closePanel`, so it discards the draft same as any other close-without-Apply.
  const handleEscape = useCallback(() => {
    if (activeGroupKey !== null) {
      setActiveGroupKey(null);
    } else {
      closePanel();
    }
  }, [activeGroupKey, closePanel]);

  useDismissOnOutsideOrEscape(containerRef, isOpen, closePanel, handleEscape);

  // Trigger button's badge count and the chips row both reflect the
  // committed `value`, never the in-progress `draftValue` — per the
  // "no partial state leaks while closed/mid-draft" rule, they only change
  // once Apply commits.
  // Single-select categories are excluded: they always hold exactly one value, so
  // counting them would leave the trigger permanently badged even when nothing is
  // actually being filtered down.
  const totalSelected = useMemo(
    () => groups.reduce((sum, group) => sum + (group.singleSelect ? 0 : value[group.key]?.length ?? 0), 0),
    [groups, value]
  );

  // Counts/checkbox-state *inside* the open flyout read from `draftValue`
  // instead, so the user sees their in-progress picks live.
  const draftTotalSelected = useMemo(
    () => groups.reduce((sum, group) => sum + (draftValue[group.key]?.length ?? 0), 0),
    [groups, draftValue]
  );

  const hasDraftChanges = useMemo(
    () => groups.some(group => !sameSelection(draftValue[group.key] ?? [], value[group.key] ?? [])),
    [groups, draftValue, value]
  );

  // --- Draft-mutating handlers (used inside the flyout; buffered until Apply) ---

  const handleToggleOption = (groupKey: string, optionId: string | number) => {
    // A single-select category REPLACES its selection rather than toggling — so it
    // can never end up empty or holding two mutually exclusive values, whichever
    // option is clicked (including the already-selected one).
    if (groups.find(group => group.key === groupKey)?.singleSelect) {
      setDraftValue(prev => ({ ...prev, [groupKey]: [optionId] }));
      return;
    }
    setDraftValue(prev => {
      const current = prev[groupKey] ?? [];
      const isSelected = current.some(id => idsEqual(id, optionId));
      const next = isSelected ? current.filter(id => !idsEqual(id, optionId)) : [...current, optionId];
      return { ...prev, [groupKey]: next };
    });
  };

  const handleSelectMany = (groupKey: string, optionIds: Array<string | number>) => {
    setDraftValue(prev => ({ ...prev, [groupKey]: [...(prev[groupKey] ?? []), ...optionIds] }));
  };

  const handleClearGroupDraft = (groupKey: string) => setDraftValue(prev => ({ ...prev, [groupKey]: [] }));

  const handleClearAllDraft = () => {
    setDraftValue(prev => {
      const next = { ...prev };
      groups.forEach(group => {
        if (!group.singleSelect) next[group.key] = [];
      });
      return next;
    });
  };

  // Diffs `draftValue` against the committed `value` and only fires
  // `onChange` for groups that actually changed (matching existing precedent
  // of consumers doing extra work only when a relevant group's onChange
  // fires), then closes the panel.
  const handleApply = () => {
    groups.forEach(group => {
      const draftIds = draftValue[group.key] ?? [];
      if (!sameSelection(draftIds, value[group.key] ?? [])) {
        onChange(group.key, draftIds);
      }
    });
    setIsOpen(false);
    setActiveGroupKey(null);
  };

  // --- Immediate-commit handlers (chip row, outside the flyout) ---
  // Removing/clearing a chip is a single, already-deliberate action taken
  // outside the flyout — not the rapid-fire-checkbox-then-fetch-storm this
  // batching exists to fix — so it still commits straight to `onChange`, same
  // as before this change. The draft is kept in sync too, so it doesn't
  // clobber the removal if the flyout happens to already be open and Apply
  // is clicked afterward.

  const handleRemoveOption = (groupKey: string, optionId: string | number) => {
    const current = value[groupKey] ?? [];
    const next = current.filter(id => !idsEqual(id, optionId));
    onChange(groupKey, next);
    setDraftValue(prev => ({ ...prev, [groupKey]: next }));
  };

  // Clear-all skips single-select categories — emptying a mode picker would leave the
  // consumer with no value at all.
  const handleClearAll = () => {
    groups.forEach(group => {
      if (!group.singleSelect && (value[group.key] ?? []).length > 0) onChange(group.key, []);
    });
    setDraftValue(prev => {
      const next = { ...prev };
      groups.forEach(group => {
        if (!group.singleSelect) next[group.key] = [];
      });
      return next;
    });
  };

  const activeGroup = groups.find(group => group.key === activeGroupKey) ?? null;

  return (
    <div className={`flex items-center gap-2 min-w-0 ${className}`}>
      <div className="relative shrink-0" ref={containerRef}>
        <button
          type="button"
          onClick={() => (isOpen ? closePanel() : setIsOpen(true))}
          className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
            isOpen
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800'
              : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
        >
          <Filter size={16} />
          <span>{triggerLabel}</span>
          {totalSelected > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
              {totalSelected}
            </span>
          )}
          <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div
            ref={panelRef}
            className={`absolute z-20 mt-1 flex flex-col bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200/70 dark:border-slate-700/70 rounded-xl shadow-lg animate-fade-in ${
              panelAlign === 'right' ? 'right-0' : 'left-0'
            }`}
          >
            <div className="flex items-start">
              {/* Level 1: plain list of category names, always visible while
                  the panel is open. Selecting a category opens level 2 as a
                  sibling column to the right rather than replacing this list,
                  so switching categories or going back needs no extra state
                  beyond `activeGroupKey`. Counts/selection here read from the
                  in-progress `draftValue`, not the committed `value` —
                  nothing below is reported to the parent until Apply. */}
              <div className="w-56 shrink-0 p-1.5">
                <div className="flex items-center justify-between px-2.5 py-1.5">
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Filter by</span>
                  {/*
                    With `onClearEverything` this clears the OWNER's filters too —
                    a search term and a date range this component never sees —
                    and applies at once rather than waiting for Apply.

                    That is deliberate and is the only control here that skips
                    the draft. "Clear all" is unambiguous in a way a selection is
                    not: there is no half of it to review before committing, and
                    leaving the search box filled after pressing it would be the
                    surprise.
                  */}
                  {(onClearEverything ? anythingToClear : draftTotalSelected > 0) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onClearEverything) {
                          onClearEverything();
                          setIsOpen(false);
                        } else {
                          handleClearAllDraft();
                        }
                      }}
                      className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <ul className="max-h-[28rem] overflow-y-auto custom-scrollbar space-y-0.5">
                  {groups.map(group => {
                    const count = (draftValue[group.key] ?? []).length;
                    const isActive = group.key === activeGroupKey;
                    // A single-select category always has exactly one value, so a "1"
                    // badge says nothing — show WHICH option is picked instead.
                    const singleLabel = group.singleSelect
                      ? group.options.find(option => (draftValue[group.key] ?? []).some(id => idsEqual(id, option.id)))?.label
                      : undefined;
                    return (
                      <li key={group.key}>
                        <button
                          type="button"
                          onClick={() => setActiveGroupKey(current => (current === group.key ? null : group.key))}
                          className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-sm text-left transition-colors ${
                            isActive
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <span className="truncate">{group.label}</span>
                          <span className="flex items-center gap-1.5 flex-shrink-0">
                            {group.singleSelect ? (
                              singleLabel && (
                                <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[9rem]">{singleLabel}</span>
                              )
                            ) : count > 0 && (
                              <span className="inline-flex items-center justify-center min-w-[1.125rem] h-[1.125rem] px-1 text-[0.65rem] font-semibold rounded-full bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
                                {count}
                              </span>
                            )}
                            <ChevronRight size={14} className={isActive ? 'text-indigo-400' : 'text-slate-400'} />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Level 2: the active category's search box + toggleable item list,
                  reusing the same section logic as before. Appears beside
                  level 1 (Linear/Notion-style), with its own border to read
                  as a distinct column, plus a back chevron for anyone who'd
                  rather step back than click a different row directly. */}
              {activeGroup && (
                // Multi-select: wide enough for the Available | Selected two-column
                // split inside (each column ~12rem, matching MultiSelectDropdown's
                // min-w-[320px] two-column panel).
                // Single-select: one narrow radio list, so that width would leave
                // most of the panel empty — sized to the list instead.
                <div className={`${activeGroup.singleSelect ? 'w-56' : 'w-[26rem]'} shrink-0 border-l border-slate-200/70 dark:border-slate-700/70 p-3`}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <button
                      type="button"
                      onClick={() => setActiveGroupKey(null)}
                      aria-label="Back to categories"
                      className="p-0.5 -ml-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="flex-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide truncate">
                      {activeGroup.label}
                    </span>
                    {!activeGroup.singleSelect && (draftValue[activeGroup.key] ?? []).length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleClearGroupDraft(activeGroup.key)}
                        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <FilterOptionsList
                    group={activeGroup}
                    colorIndex={groups.findIndex(g => g.key === activeGroup.key)}
                    selectedIds={draftValue[activeGroup.key] ?? []}
                    searchQuery={searchByGroup[activeGroup.key] ?? ''}
                    showSearch={activeGroup.options.length > searchThreshold}
                    onSearchChange={query => setSearchByGroup(prev => ({ ...prev, [activeGroup.key]: query }))}
                    onToggleOption={optionId => handleToggleOption(activeGroup.key, optionId)}
                    onSelectMany={optionIds => handleSelectMany(activeGroup.key, optionIds)}
                  />
                </div>
              )}
            </div>

            {/* Persistent footer — reachable from either level 1 or level 2
                without an extra click, since it's outside the level1/level2
                row rather than nested inside either column. Cancel discards
                the draft (also happens on outside-click/Escape); Apply diffs
                the draft against the committed value and only fires
                `onChange` for groups that actually changed, then closes the
                panel. */}
            <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-slate-200/70 dark:border-slate-700/70">
              <button
                type="button"
                onClick={closePanel}
                className="px-3 py-1.5 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={!hasDraftChanges}
                className="px-4 py-1.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {totalSelected > 0 && (
        selectionDisplay === 'summary' ? (
          <FilterSelectionSummary groups={groups} value={value} onRemoveOption={handleRemoveOption} onClearAll={handleClearAll} />
        ) : (
          <FilterChipsRow groups={groups} value={value} onRemoveOption={handleRemoveOption} onClearAll={handleClearAll} />
        )
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// A single category's search box + scrollable toggleable item list — the level-2
// flyout content. No heading/clear button of its own; the parent panel
// renders those as part of the flyout's back-chevron header instead.
// ---------------------------------------------------------------------------
interface FilterOptionsListProps {
  group: FilterGroup;
  /** Index of `group` within the parent's `groups` array — picks this category's
   *  hover-tint slot in `CATEGORY_HOVER_COLORS` for the unselected-row hover preview. */
  colorIndex: number;
  selectedIds: Array<string | number>;
  searchQuery: string;
  showSearch: boolean;
  onSearchChange: (query: string) => void;
  onToggleOption: (optionId: string | number) => void;
  // Adds every given id to the selection in one change — used by the
  // Available column's "Select all" (all currently-filtered matches).
  onSelectMany: (optionIds: Array<string | number>) => void;
}

function FilterOptionsList({
  group,
  colorIndex,
  selectedIds,
  searchQuery,
  showSearch,
  onSearchChange,
  onToggleOption,
  onSelectMany,
}: FilterOptionsListProps) {
  const hoverClass =
    CATEGORY_HOVER_COLORS[((colorIndex % CATEGORY_HOVER_COLORS.length) + CATEGORY_HOVER_COLORS.length) % CATEGORY_HOVER_COLORS.length];

  // Two-column Available | Selected split, same layout as
  // MultiSelectDropdown: the search box narrows the Available column only,
  // while Selected always shows the full current selection so it stays
  // reviewable/removable regardless of the active search.
  //
  // The search accepts MULTIPLE terms (comma/space/newline separated — e.g.
  // a whole column pasted from a spreadsheet): an option matches if its
  // label contains ANY of the terms, so paste-then-"Select all" filters a
  // whole list in two actions.
  const isChecked = (option: FilterOption) => selectedIds.some(id => idsEqual(id, option.id));
  const searchTerms = searchQuery.split(/[\s,;]+/).map(term => term.trim().toLowerCase()).filter(Boolean);
  const matchesSearch = (label: string) =>
    searchTerms.length === 0 || searchTerms.some(term => label.toLowerCase().includes(term));
  const selectedOptions = group.options.filter(isChecked);

  // --- Nesting (see FilterOption.parentId) --------------------------------
  // A group is nested if any option declares a parent. Flat groups take the
  // same path they always did: `parents` is every option, `childrenOf` is
  // empty, and nothing below has an effect.
  const childrenOf = new Map<string, FilterOption[]>();
  for (const option of group.options) {
    if (option.parentId === undefined || option.parentId === null) continue;
    const key = String(option.parentId);
    childrenOf.set(key, [...(childrenOf.get(key) ?? []), option]);
  }
  const isNested = childrenOf.size > 0;
  const parents = group.options.filter(o => o.parentId === undefined || o.parentId === null);

  // Which parents are open. Collapsed is the default and the point: a category
  // asked at two grains is unreadable if both are listed at once.
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(new Set());
  const toggleExpanded = (id: string | number) =>
    setExpandedIds(current => {
      const next = new Set(current);
      const key = String(id);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  // Searching overrides the collapse in BOTH directions, because either half of
  // the pair can be what the user typed: a term matching a parent reveals every
  // child under it (type a cluster, get its brands), and a term matching a child
  // surfaces that child under its parent even though the parent itself does not
  // match (type a brand, still see which back office it belongs to).
  const searching = searchTerms.length > 0;
  const visibleChildrenOf = (parent: FilterOption): FilterOption[] => {
    const all = (childrenOf.get(String(parent.id)) ?? []).filter(child => !isChecked(child));
    if (!searching) return expandedIds.has(String(parent.id)) ? all : [];
    return matchesSearch(parent.label) ? all : all.filter(child => matchesSearch(child.label));
  };

  // The Available column, in render order: a parent immediately followed by
  // whichever of its children are showing. Flattened here rather than nested in
  // markup so "Select all" and the empty-state check see exactly what is on
  // screen — a "Select all" that picks rows you cannot see is a trap.
  const availableOptions: FilterOption[] = isNested
    ? parents.flatMap(parent => {
        const children = visibleChildrenOf(parent);
        const parentShows =
          !isChecked(parent) && (!searching || matchesSearch(parent.label) || children.length > 0);
        return [...(parentShows ? [parent] : []), ...children];
      })
    : group.options.filter(option => !isChecked(option) && matchesSearch(option.label));

  // Single-select: one flat radio list. No Available|Selected split (an option
  // doesn't move columns when picked), no "Select all", no search — a mode picker
  // has a handful of options, and the split/search chrome would imply this behaves
  // like the multi-select categories when it doesn't.
  if (group.singleSelect) {
    return (
      <ul className="max-h-[22rem] overflow-y-auto custom-scrollbar space-y-0.5" role="radiogroup" aria-label={group.label}>
        {group.options.map(option => {
          const checked = isChecked(option);
          return (
            <li key={option.id}>
              <button
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => onToggleOption(option.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left transition-colors ${
                  checked
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                    : `text-slate-700 dark:text-slate-200 ${hoverClass}`
                }`}
              >
                <span
                  aria-hidden
                  className={`flex-shrink-0 grid place-items-center w-3.5 h-3.5 rounded-full border ${
                    checked ? 'border-indigo-500' : 'border-slate-300 dark:border-slate-500'
                  }`}
                >
                  {checked && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                </span>
                <span className="truncate">{option.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  /**
   * `standalone` = rendered away from its parent row (the Selected column), so
   * a nested option shows its `contextLabel` and no indent. The chevron only
   * appears on a parent that actually has children, and is a SIBLING button
   * rather than a nested one — a button inside a button is invalid markup and
   * the inner click never fires reliably.
   */
  const renderOption = (option: FilterOption, checked: boolean, standalone = false) => {
    const children = childrenOf.get(String(option.id)) ?? [];
    const isChild = !standalone && option.parentId !== undefined && option.parentId !== null;
    const canExpand = !standalone && children.length > 0;
    const open = expandedIds.has(String(option.id));
    const text = standalone ? option.contextLabel ?? option.label : option.label;

    return (
      <li key={option.id}>
        <div className="flex items-center gap-0.5">
          {/* A parent with nothing under it still reserves the chevron's width,
              so one childless cluster does not knock the whole column out of
              alignment. */}
          {isNested && !isChild && !canExpand && <span aria-hidden className="flex-shrink-0 w-[21px]" />}
          {canExpand && (
            <button
              type="button"
              onClick={() => toggleExpanded(option.id)}
              aria-expanded={open}
              aria-label={`${open ? 'Hide' : 'Show'} ${option.label} brands`}
              className="flex-shrink-0 p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <ChevronRight size={13} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onToggleOption(option.id)}
            aria-pressed={checked}
            className={`min-w-0 flex-1 flex items-center justify-between gap-2 py-1.5 rounded-lg text-sm text-left transition-colors ${
              isChild ? 'pl-7 pr-2' : canExpand ? 'px-2' : 'px-2'
            } ${
              checked
                ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                : `text-slate-700 dark:text-slate-200 ${hoverClass}`
            }`}
          >
            <span className="truncate">{text}</span>
            {checked ? (
              <X size={13} className="flex-shrink-0" />
            ) : (
              <Plus size={13} className="flex-shrink-0 text-slate-400" />
            )}
          </button>
        </div>
      </li>
    );
  };

  return (
    <div>
      {showSearch && (
        <div className="mb-1.5">
          <div className="relative">
            <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              onPaste={e => {
                // Multi-line/tabbed clipboard content (a spreadsheet column)
                // would otherwise be mangled by the single-line input —
                // normalize every separator to a plain space on the way in.
                const text = e.clipboardData.getData('text/plain');
                if (!/[\r\n\t]/.test(text)) return;
                e.preventDefault();
                const el = e.currentTarget;
                const normalized = text.replace(/[\r\n\t]+/g, ' ').trim();
                const next = `${el.value.slice(0, el.selectionStart ?? el.value.length)}${normalized}${el.value.slice(el.selectionEnd ?? el.value.length)}`;
                onSearchChange(next);
              }}
              placeholder={group.searchPlaceholder ?? `Search ${group.label.toLowerCase()}...`}
              autoComplete="off"
              className="w-full pl-7 pr-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {searchTerms.length > 1 && (
            <p className="mt-1 px-1 text-[11px] text-slate-400 dark:text-slate-500">
              Matching any of {searchTerms.length} terms — “Select all” picks every match.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 divide-x divide-slate-200/70 dark:divide-slate-700/70">
        <div className="pr-2 min-w-0">
          <div className="flex items-center justify-between gap-2 px-1 pb-1">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 truncate">Available</span>
            {availableOptions.length > 0 && (
              <button
                type="button"
                onClick={() => onSelectMany(availableOptions.map(option => option.id))}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex-shrink-0"
              >
                Select all
              </button>
            )}
          </div>
          <ul className="max-h-[22rem] overflow-y-auto custom-scrollbar space-y-0.5">
            {availableOptions.length > 0 ? (
              availableOptions.map(option => renderOption(option, false))
            ) : (
              <li className="px-2 py-1.5 text-sm text-slate-500 dark:text-slate-400">{group.emptyText ?? 'No options found.'}</li>
            )}
          </ul>
        </div>
        <div className="pl-2 min-w-0">
          <div className="px-1 pb-1 text-xs font-semibold text-slate-400 dark:text-slate-500 truncate">Selected ({selectedOptions.length})</div>
          <ul className="max-h-[22rem] overflow-y-auto custom-scrollbar space-y-0.5">
            {selectedOptions.length > 0 ? (
              selectedOptions.map(option => renderOption(option, true, true))
            ) : (
              <li className="px-2 py-1.5 text-sm text-slate-500 dark:text-slate-400">None selected</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Selected-chips row: renders beside the trigger, on one line. Each selected
// option across all groups is flattened into a single list of chips (each
// keeping a small label prefix for context, so category grouping is still
// legible without stacking under per-category headers). When the flattened
// list would overflow the row's available width, it's truncated and a
// "+N more" chip appears instead of wrapping; clicking it opens a popover
// with the remaining chips (grouped by category, still individually
// removable) plus "Clear all". Renders nothing when nothing is selected
// (guarded by the caller).
//
// Fit is computed from real measurements, not a hardcoded chip count: a
// hidden copy of every chip (plus the "+N more" and "Clear all" affordances)
// is rendered off-screen so its true rendered width can be read via refs,
// and a `ResizeObserver` tracks the row's own available width. Both are
// recomputed whenever the selection or the container's width changes.
// ---------------------------------------------------------------------------
interface FlatChip {
  groupKey: string;
  groupLabel: string;
  id: string | number;
  label: string;
}

/**
 * Per-category hover tint (Apple's iOS System Colors, light/dark tuned) used
 * only for the level-2 flyout's unselected-row hover preview, cycled by the
 * category's index in `groups`. Every other per-category color use (chips,
 * "+N more" popover, count badges, level-2 selected-row highlight) was
 * simplified to plain neutral gray — this is the one surviving spot where
 * category color-coding still shows through, in this fixed order: systemBlue,
 * systemGreen, systemIndigo, systemOrange, systemPink, systemPurple, systemRed,
 * systemTeal, systemYellow.
 */
const CATEGORY_HOVER_COLORS = [
  'hover:bg-[#007AFF]/10 dark:hover:bg-[#0A84FF]/15', // systemBlue
  'hover:bg-[#34C759]/10 dark:hover:bg-[#30D158]/15', // systemGreen
  'hover:bg-[#5856D6]/10 dark:hover:bg-[#5E5CE6]/15', // systemIndigo
  'hover:bg-[#FF9500]/10 dark:hover:bg-[#FF9F0A]/15', // systemOrange
  'hover:bg-[#FF2D55]/10 dark:hover:bg-[#FF375F]/15', // systemPink
  'hover:bg-[#AF52DE]/10 dark:hover:bg-[#BF5AF2]/15', // systemPurple
  'hover:bg-[#FF3B30]/10 dark:hover:bg-[#FF453A]/15', // systemRed
  'hover:bg-[#5AC8FA]/10 dark:hover:bg-[#64D2FF]/15', // systemTeal
  'hover:bg-[#FFCC00]/10 dark:hover:bg-[#FFD60A]/15', // systemYellow
];

/** Matches the row's `gap-1.5` so measured widths line up with the accumulation math. */
const CHIP_GAP_PX = 6;

function Chip({
  item,
  onRemove,
  showGroupLabel = true,
}: {
  item: FlatChip;
  onRemove: () => void;
  /** Hide the "Category: " prefix — used in the "+N more" popover, where a cluster
   *  heading already states the category, so repeating it on every chip is redundant. */
  showGroupLabel?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 text-xs font-medium rounded-full whitespace-nowrap bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
      <span className="truncate max-w-[11rem]">
        {showGroupLabel && <span className="opacity-70">{item.groupLabel}:</span>} {item.label}
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="p-0.5 rounded-full flex-shrink-0 hover:bg-slate-200 dark:hover:bg-slate-700"
        aria-label={`Remove ${item.label}`}
      >
        <X size={11} />
      </button>
    </span>
  );
}

interface FilterChipsRowProps {
  groups: FilterGroup[];
  value: FilterValue;
  onRemoveOption: (groupKey: string, optionId: string | number) => void;
  onClearAll: () => void;
}

// ---------------------------------------------------------------------------
// Compact selection summary + popover — the `selectionDisplay="summary"` variant.
//
// Renders one fixed-height line stating what the data on screen is restricted to
// ("TC · Facebook · 3 agents"); clicking it opens a popover with the removable chips.
// Chosen over the chips row for report toolbars: the row is already crowded (trigger +
// date picker + view toggle + refresh), and a chips row's width swings with the
// selection, reflowing its neighbours. This never changes height or width class, and
// needs none of FilterChipsRow's ResizeObserver fit measurement.
//
// A single-select category contributes its option's label (that IS the scope); a
// multi-select contributes the label when one thing is picked, or a count when several
// are ("3 agents") — naming twenty agents would defeat the point. Categories flagged
// `hideFromSummary` are skipped.
// ---------------------------------------------------------------------------

function pluralise(label: string, n: number) {
  const lower = label.toLowerCase();
  if (n === 1 || lower.endsWith('s')) return lower;
  return `${lower}s`;
}

function FilterSelectionSummary({ groups, value, onRemoveOption, onClearAll }: FilterChipsRowProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismissOnOutsideOrEscape(rootRef, open, close, close);

  const segments = useMemo(() => {
    const out: string[] = [];
    for (const group of groups) {
      if (group.hideFromSummary) continue;
      const ids = value[group.key] ?? [];
      if (ids.length === 0) continue;
      if (ids.length === 1) {
        const option = group.options.find(o => idsEqual(o.id, ids[0]));
        out.push(option?.label ?? String(ids[0]));
      } else {
        out.push(`${ids.length} ${pluralise(group.label, ids.length)}`);
      }
    }
    return out;
  }, [groups, value]);

  // Only categories whose selection can actually be removed appear in the popover: a
  // single-select radio has no empty state, so offering an X on it would be a dead end.
  const removable: FlatChip[] = useMemo(() => {
    const flat: FlatChip[] = [];
    groups.forEach(group => {
      if (group.singleSelect) return;
      (value[group.key] ?? []).forEach(id => {
        const option = group.options.find(o => idsEqual(o.id, id));
        flat.push({ groupKey: group.key, groupLabel: group.label, id, label: option?.contextLabel ?? option?.label ?? String(id) });
      });
    });
    return flat;
  }, [groups, value]);

  if (segments.length === 0) return null;

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        title={segments.join(' · ')}
        className="inline-flex max-w-full items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <span className="truncate">{segments.join(' · ')}</span>
        <ChevronDown size={12} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-1 w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 shadow-lg">
          {removable.length > 0 ? (
            <>
              <div className="max-h-64 space-y-2 overflow-y-auto custom-scrollbar">
                {groups.filter(g => !g.singleSelect && (value[g.key] ?? []).length > 0).map(group => (
                  <div key={group.key}>
                    <div className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      {group.label}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {removable.filter(chip => chip.groupKey === group.key).map(chip => (
                        <Chip
                          key={`${chip.groupKey}-${chip.id}`}
                          item={chip}
                          showGroupLabel={false}
                          onRemove={() => onRemoveOption(chip.groupKey, chip.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => { onClearAll(); setOpen(false); }}
                className="mt-2 w-full rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                Clear all
              </button>
            </>
          ) : (
            // Every active category is a radio, so there is nothing to remove — the
            // summary is purely informational here.
            <p className="px-1 py-1 text-xs text-slate-500 dark:text-slate-400">
              Change these from the Filter menu.
            </p>
          )}
        </div>
      )}
    </div>
  );
}



function FilterChipsRow({ groups, value, onRemoveOption, onClearAll }: FilterChipsRowProps) {
  const items: FlatChip[] = useMemo(() => {
    const flat: FlatChip[] = [];
    groups.forEach(group => {
      // Single-select categories get no chip: every chip here is removable, and
      // removing the only value of a mode picker would leave the consumer with
      // nothing selected. Its current value is shown on the level-1 row inside the
      // panel instead.
      if (group.singleSelect) return;
      (value[group.key] ?? []).forEach(id => {
        const option = group.options.find(o => idsEqual(o.id, id));
        flat.push({ groupKey: group.key, groupLabel: group.label, id, label: option?.contextLabel ?? option?.label ?? String(id) });
      });
    });
    return flat;
  }, [groups, value]);

  const outerRef = useRef<HTMLDivElement>(null);
  const measureRefs = useRef<Map<string, HTMLElement>>(new Map());
  const moreChipMeasureRef = useRef<HTMLDivElement>(null);
  const clearAllMeasureRef = useRef<HTMLButtonElement>(null);

  const [containerWidth, setContainerWidth] = useState(0);
  const [itemWidths, setItemWidths] = useState<number[]>([]);
  const [moreChipWidth, setMoreChipWidth] = useState(0);
  const [clearAllWidth, setClearAllWidth] = useState(0);

  const [morePopoverOpen, setMorePopoverOpen] = useState(false);
  const morePopoverRef = useRef<HTMLDivElement>(null);
  const closeMorePopover = useCallback(() => setMorePopoverOpen(false), []);

  // Track the row's own available width (it's a flex-1 sibling of the
  // trigger, so this already reflects space left after the trigger).
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    setContainerWidth(el.clientWidth);
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) setContainerWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Read real rendered widths from the hidden measuring row whenever the
  // selection changes (label text, chip count, or "+N more" digit count can
  // all change how much space things take).
  useEffect(() => {
    const widths = items.map(item => measureRefs.current.get(`${item.groupKey}:${item.id}`)?.offsetWidth ?? 0);
    setItemWidths(widths);
    setMoreChipWidth(moreChipMeasureRef.current?.offsetWidth ?? 0);
    setClearAllWidth(clearAllMeasureRef.current?.offsetWidth ?? 0);
  }, [items]);

  useDismissOnOutsideOrEscape(morePopoverRef, morePopoverOpen, closeMorePopover, closeMorePopover);

  // One-pass width accumulation: try fitting every chip + "Clear all"; if
  // that overflows, reserve room for "+N more" + "Clear all" instead and fit
  // as many chips as possible ahead of them.
  const { visibleCount, showMore } = useMemo(() => {
    // Not measured yet — render nothing rather than the full list, so there's
    // no single-frame flash of an unclipped, unbounded-width row before the
    // real fit is known.
    if (containerWidth === 0 || itemWidths.length !== items.length) {
      return { visibleCount: 0, showMore: items.length > 0 };
    }
    const gap = CHIP_GAP_PX;
    const totalItemsWidth = itemWidths.reduce((sum, w, i) => sum + w + (i > 0 ? gap : 0), 0);
    const withClearAll = totalItemsWidth + (items.length > 0 ? gap : 0) + clearAllWidth;
    if (withClearAll <= containerWidth) {
      return { visibleCount: items.length, showMore: false };
    }

    const reserved = moreChipWidth + gap + clearAllWidth + gap;
    let used = 0;
    let count = 0;
    for (let i = 0; i < itemWidths.length; i++) {
      const w = itemWidths[i] + (i > 0 ? gap : 0);
      if (used + w > containerWidth - reserved) break;
      used += w;
      count++;
    }
    return { visibleCount: count, showMore: true };
  }, [containerWidth, itemWidths, items.length, moreChipWidth, clearAllWidth]);

  const visibleItems = items.slice(0, visibleCount);
  const hiddenItems = items.slice(visibleCount);

  // Cluster the overflowed chips by category for the popover. `hiddenItems`
  // is already a suffix of `items`, which is itself built by iterating
  // `groups` in order, so a straight left-to-right accumulation naturally
  // produces contiguous, correctly-ordered per-category runs — no separate
  // sort needed.
  const hiddenGroups = useMemo(() => {
    const clusters: { groupKey: string; groupLabel: string; items: FlatChip[] }[] = [];
    const indexByKey = new Map<string, number>();
    hiddenItems.forEach(item => {
      const existingIndex = indexByKey.get(item.groupKey);
      if (existingIndex !== undefined) {
        clusters[existingIndex].items.push(item);
      } else {
        indexByKey.set(item.groupKey, clusters.length);
        clusters.push({ groupKey: item.groupKey, groupLabel: item.groupLabel, items: [item] });
      }
    });
    return clusters;
  }, [hiddenItems]);

  return (
    <div ref={outerRef} className="relative flex-1 min-w-0">
      {/* No `overflow-hidden` here: we already render exactly the chips that
          fit (via `visibleItems`), so clipping isn't needed for the normal
          case — and it would also clip the "+N more" popover below, since
          `overflow: hidden` clips absolutely-positioned descendants too, not
          just overflowing inline content. */}
      <div className="flex items-center gap-1.5">
        {visibleItems.map(item => (
          <Chip key={`${item.groupKey}:${item.id}`} item={item} onRemove={() => onRemoveOption(item.groupKey, item.id)} />
        ))}

        {showMore && hiddenItems.length > 0 && (
          <div className="relative shrink-0" ref={morePopoverRef}>
            <button
              type="button"
              onClick={() => setMorePopoverOpen(open => !open)}
              className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap bg-slate-100 dark:bg-slate-600/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              +{hiddenItems.length} more
            </button>

            {morePopoverOpen && (
              <div className="absolute z-20 right-0 mt-1 w-64 max-h-80 overflow-y-auto custom-scrollbar bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200/70 dark:border-slate-700/70 rounded-xl shadow-lg p-2 animate-fade-in">
                <div className="space-y-2.5">
                  {hiddenGroups.map(group => (
                    <div key={group.groupKey}>
                      <div className="flex items-center gap-1.5 px-0.5 pb-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 bg-slate-400 dark:bg-slate-500" />
                        <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {group.groupLabel}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {group.items.map(item => (
                          <Chip
                            key={`${item.groupKey}:${item.id}`}
                            item={item}
                            onRemove={() => onRemoveOption(item.groupKey, item.id)}
                            showGroupLabel={false}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClearAll();
                    setMorePopoverOpen(false);
                  }}
                  className="mt-2.5 w-full text-left text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline underline-offset-2"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}

        {!showMore && (
          <button
            type="button"
            onClick={onClearAll}
            className="shrink-0 whitespace-nowrap text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline underline-offset-2"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Hidden measuring row: mirrors every possible chip plus the "+N more"
          and "Clear all" affordances so their real rendered widths (which
          depend on label length / font, not a guess) can be read via refs —
          independent of which ones actually end up visible above. Positioned
          out of flow (absolute + invisible) so it never affects layout or
          the container-width measurement. */}
      <div aria-hidden className="absolute left-0 top-0 flex items-center gap-1.5 invisible pointer-events-none">
        {items.map(item => (
          <span
            key={`${item.groupKey}:${item.id}`}
            ref={el => {
              if (el) measureRefs.current.set(`${item.groupKey}:${item.id}`, el);
              else measureRefs.current.delete(`${item.groupKey}:${item.id}`);
            }}
          >
            <Chip item={item} onRemove={noop} />
          </span>
        ))}
        <div ref={moreChipMeasureRef} className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap">
          +{items.length} more
        </div>
        <button ref={clearAllMeasureRef} type="button" className="whitespace-nowrap text-xs font-medium underline underline-offset-2">
          Clear all
        </button>
      </div>
    </div>
  );
}
