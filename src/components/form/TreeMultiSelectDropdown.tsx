'use client';

/* Origin: marketing-stats (96S1), verbatim. */

/**
 * TreeMultiSelectDropdown
 * ------------------------------------------------------------------
 * A single combined multi-select over a nested tree (e.g. Platform -> Brand
 * -> Agent), replacing what would otherwise be one flat `MultiSelectDropdown`
 * per level. Selection is always tracked as a flat array of LEAF ids only
 * (`value`/`onChange`, same shape `MultiSelectDropdown` uses) — checking a
 * non-leaf node (a "branch", e.g. a Platform or Brand) is just sugar for
 * selecting/deselecting every leaf underneath it, so callers that only care
 * about leaf ids (e.g. an `agentIds` filter) need no extra flattening logic
 * beyond passing `value` straight through.
 *
 * The left tree is an "available" list, mirroring `MultiSelectDropdown`'s own
 * Available/Selected split rather than a checkbox tree: a leaf already in
 * `value` is pruned out of it entirely, and a branch node is pruned once
 * every leaf underneath it has been selected (a branch with some-but-not-all
 * leaves selected just shows fewer children, no indeterminate state to
 * track). Clicking a row (or its trailing `+`) adds it — a branch adds every
 * remaining leaf beneath it — and clicking a row in the Selected panel on
 * the right removes it, which makes it reappear here since the tree is
 * re-derived from `value` on every render. Each branch is independently
 * collapsible; the trigger's own text box doubles as a type-to-filter search
 * box once focused (same convention as `MultiSelectDropdown`'s
 * `searchPlaceholder`) — a node matches if its own label matches or any
 * descendant's does, and a self-matching branch keeps its whole subtree
 * rather than pruning to just the matching descendants (mirrors the
 * brand/agent text-search behavior this component replaces on the Agent
 * Score report). Matching branches auto-expand while a search is active.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, ChevronsUpDown, Plus, X } from 'lucide-react';

export interface TreeOption {
  /** Must be unique across the ENTIRE tree, not just among siblings — a
   *  Platform, Brand and Agent all share one id namespace here, so callers
   *  should prefix non-leaf ids (e.g. `platform:1`, `brand:1`) to avoid
   *  colliding with leaf ids (typically raw numeric-string entity ids). */
  id: string;
  label: string;
  /** Omit or leave empty for a leaf node. */
  children?: TreeOption[];
}

/** Singular labels used to build the trigger's selection summary, e.g.
 *  `{ leaf: 'agent', mid: 'brand' }` -> "3 brands, 12 agents selected".
 *  `mid` is optional — omit it to only ever show the leaf count. */
interface CountLabels {
  leaf: string;
  mid?: string;
}

interface TreeMultiSelectDropdownProps {
  options: TreeOption[];
  /** Selected LEAF ids only. */
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  countLabels?: CountLabels;
}

function collectLeafIds(node: TreeOption): string[] {
  if (!node.children || node.children.length === 0) return [node.id];
  return node.children.flatMap(collectLeafIds);
}

// Every leaf's label plus its immediate parent's label (undefined for a
// top-level leaf) — powers the Selected panel's disambiguation below, same
// "name repeats across parents" concern the tree already accounts for via
// `filterTree`'s whole-subtree matching.
interface LeafInfo {
  id: string;
  label: string;
  parentLabel?: string;
}

function collectLeavesWithParent(nodes: TreeOption[], parentLabel?: string): LeafInfo[] {
  const out: LeafInfo[] = [];
  for (const node of nodes) {
    if (!node.children || node.children.length === 0) {
      out.push({ id: node.id, label: node.label, parentLabel });
    } else {
      out.push(...collectLeavesWithParent(node.children, node.label));
    }
  }
  return out;
}

// Drops every already-selected leaf from the tree, and any branch left with
// no children as a result — the tree only ever shows what's still pickable.
function pruneSelected(nodes: TreeOption[], valueSet: Set<string>): TreeOption[] {
  const out: TreeOption[] = [];
  for (const node of nodes) {
    if (!node.children || node.children.length === 0) {
      if (!valueSet.has(node.id)) out.push(node);
      continue;
    }
    const prunedChildren = pruneSelected(node.children, valueSet);
    if (prunedChildren.length > 0) out.push({ ...node, children: prunedChildren });
  }
  return out;
}

// A branch keeps its whole subtree once its own label matches, rather than
// pruning down to only the descendants that individually match — same
// "brand matches -> show every agent underneath" convention as the search
// this component replaces.
function filterTree(nodes: TreeOption[], query: string): TreeOption[] {
  if (!query) return nodes;
  const q = query.toLowerCase();
  const result: TreeOption[] = [];
  for (const node of nodes) {
    if (node.label.toLowerCase().includes(q)) {
      result.push(node);
      continue;
    }
    if (node.children && node.children.length > 0) {
      const filteredChildren = filterTree(node.children, query);
      if (filteredChildren.length > 0) {
        result.push({ ...node, children: filteredChildren });
      }
    }
  }
  return result;
}

function pluralize(count: number, word: string): string {
  return count === 1 ? word : `${word}s`;
}

interface TreeRowProps {
  node: TreeOption;
  depth: number;
  isExpanded: (id: string) => boolean;
  onToggleExpand: (id: string) => void;
  onAddNode: (node: TreeOption) => void;
}

function TreeRow({ node, depth, isExpanded, onToggleExpand, onAddNode }: TreeRowProps) {
  const hasChildren = !!node.children && node.children.length > 0;
  const expanded = hasChildren && isExpanded(node.id);

  return (
    <li>
      <div
        className="flex items-center gap-1.5 py-1.5 pr-2 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer transition-colors"
        style={{ paddingLeft: depth * 18 + 4 }}
        onClick={() => onAddNode(node)}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleExpand(node.id); }}
            className="p-0.5 flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label={expanded ? `Collapse ${node.label}` : `Expand ${node.label}`}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-[18px] flex-shrink-0" />
        )}
        <span className="truncate flex-1 min-w-0">{node.label}</span>
        <Plus size={14} className="flex-shrink-0 text-gray-400" />
      </div>
      {hasChildren && expanded && (
        <ul>
          {node.children!.map(child => (
            <TreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              isExpanded={isExpanded}
              onToggleExpand={onToggleExpand}
              onAddNode={onAddNode}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function TreeMultiSelectDropdown({
  options,
  value,
  onChange,
  placeholder = 'All',
  searchPlaceholder = 'Search...',
  emptyText = 'No options found.',
  className = '',
  disabled = false,
  countLabels,
}: TreeMultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
      setSearchQuery('');
    }
  }, [disabled]);

  const valueSet = useMemo(() => new Set(value), [value]);
  const trimmedQuery = searchQuery.trim();
  const isSearching = trimmedQuery.length > 0;
  // Prune already-selected leaves out first, then apply the search filter on
  // top of what's left — so a fully-selected branch (and its leaves)
  // disappears from the tree, and search never re-surfaces a selected leaf.
  const availableTree = useMemo(() => pruneSelected(options, valueSet), [options, valueSet]);
  const visibleTree = useMemo(() => filterTree(availableTree, trimmedQuery), [availableTree, trimmedQuery]);

  // Flat leaf lookup off the FULL tree (not `visibleTree`) — the Selected
  // panel lists every currently selected leaf regardless of whatever search
  // filter is active on the tree side.
  const leafInfoById = useMemo(() => {
    const map = new Map<string, LeafInfo>();
    for (const leaf of collectLeavesWithParent(options)) map.set(leaf.id, leaf);
    return map;
  }, [options]);

  const selectedLeaves = useMemo(
    () => value.map(id => leafInfoById.get(id) ?? { id, label: id }),
    [value, leafInfoById]
  );

  // Grouped by immediate parent (e.g. Platform) — same grouped-list
  // convention AutocompleteDropdown uses for its agent-by-brand groups, and
  // it makes the parent qualifier from the flat version redundant (the group
  // heading already says which platform a repeated brand name belongs to).
  // A top-level leaf (no parent) falls into the '' bucket, rendered with no
  // heading. Groups sort alphabetically; leaves keep selection order within
  // their group.
  const groupedSelectedLeaves = useMemo(() => {
    const groups = new Map<string, LeafInfo[]>();
    for (const leaf of selectedLeaves) {
      const key = leaf.parentLabel ?? '';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(leaf);
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [selectedLeaves]);

  const handleDeselectLeaf = (id: string) => onChange(value.filter(v => v !== id));

  // Removes every leaf in one Selected-panel group at once — the symmetric
  // counterpart to a tree branch's "add all remaining leaves" click.
  const handleDeselectGroup = (leaves: LeafInfo[]) => {
    const removeIds = new Set(leaves.map(l => l.id));
    onChange(value.filter(id => !removeIds.has(id)));
  };

  const isExpanded = (id: string) => (isSearching ? true : !!expandedIds[id]);
  const toggleExpand = (id: string) => setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));

  // The tree is add-only (removal happens via the Selected panel) — a leaf
  // adds itself, a branch adds every leaf still beneath it (already-selected
  // ones were pruned out of `node`, so this can't re-add anything).
  const handleAddNode = (node: TreeOption) => {
    const leaves = collectLeafIds(node);
    const merged = new Set(value);
    leaves.forEach(id => merged.add(id));
    onChange([...merged]);
  };

  const handleClearAll = () => onChange([]);

  // Selection summary shown on the trigger while closed — "All" when
  // nothing's selected, otherwise a leaf count (and, if `countLabels.mid` is
  // supplied, how many second-level branches — e.g. brands — have at least
  // one selected leaf underneath them).
  const summary = useMemo(() => {
    if (value.length === 0) return '';
    let midCount = 0;
    if (countLabels?.mid) {
      for (const top of options) {
        for (const mid of top.children ?? []) {
          const leaves = collectLeafIds(mid);
          if (leaves.some(id => valueSet.has(id))) midCount++;
        }
      }
    }
    const leafPart = `${value.length} ${pluralize(value.length, countLabels?.leaf ?? 'item')}`;
    if (countLabels?.mid && midCount > 0) {
      return `${midCount} ${pluralize(midCount, countLabels.mid)}, ${leafPart} selected`;
    }
    return `${leafPart} selected`;
  }, [value, options, valueSet, countLabels]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div
        className={`flex items-center gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-lg ${disabled ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-800 opacity-60' : 'cursor-text bg-white dark:bg-gray-700'}`}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchQuery : (value.length > 0 ? summary : '')}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => !disabled && setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
              setSearchQuery('');
              e.currentTarget.blur();
            }
          }}
          placeholder={isOpen ? searchPlaceholder : placeholder}
          autoComplete="off"
          disabled={disabled}
          className="flex-1 min-w-0 bg-transparent outline-none border-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 disabled:cursor-not-allowed"
        />
        {!disabled && value.length > 0 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleClearAll(); }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
            aria-label="Clear all selected"
          >
            <X size={14} />
          </button>
        )}
        <ChevronsUpDown size={16} className="text-gray-400 flex-shrink-0" />
      </div>

      {isOpen && (
        // z-50: the one band every in-flow popover in this library uses. See the
        // Z-INDEX SCALE note in globals.css — table chrome tops out at 20, so a
        // menu opened over a table clears its sticky header and frozen column.
        // Two columns (tree left, Selected right) — same split MultiSelectDropdown
        // uses for its flat Available/Selected panes, so a selection stays visible
        // and individually removable without hunting through the tree for its checkbox.
        <div className="absolute z-50 w-full min-w-[440px] mt-1 bg-white/95 dark:bg-gray-700/95 backdrop-blur-xl border border-gray-200/70 dark:border-gray-600/70 rounded-xl shadow-lg animate-fade-in grid grid-cols-2 divide-x divide-gray-200/70 dark:divide-gray-600/70">
          <div className="p-2 min-w-0">
            <ul className="max-h-80 overflow-y-auto space-y-0.5 scrollbar-thin">
              {visibleTree.length > 0 ? (
                visibleTree.map(node => (
                  <TreeRow
                    key={node.id}
                    node={node}
                    depth={0}
                    isExpanded={isExpanded}
                    onToggleExpand={toggleExpand}
                    onAddNode={handleAddNode}
                  />
                ))
              ) : (
                <li className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">{emptyText}</li>
              )}
            </ul>
          </div>
          <div className="p-2 min-w-0">
            <div className="flex items-center justify-between gap-2 px-1 pb-1">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 truncate">Selected ({selectedLeaves.length})</span>
              {selectedLeaves.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="pr-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex-shrink-0"
                >
                  Clear all
                </button>
              )}
            </div>
            <ul className="max-h-80 overflow-y-auto space-y-2 scrollbar-thin">
              {groupedSelectedLeaves.length > 0 ? (
                groupedSelectedLeaves.map(([group, leaves]) => (
                  <li key={group || '__ungrouped'}>
                    {group && (
                      <div
                        onClick={() => handleDeselectGroup(leaves)}
                        title={`Remove all in ${group}`}
                        className="group/header flex items-center justify-between gap-1 px-2 pb-1 cursor-pointer"
                      >
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 truncate">{group}</span>
                        <X size={13} className="flex-shrink-0 text-gray-400 opacity-0 group-hover/header:opacity-100 hover:text-red-500 transition-opacity" />
                      </div>
                    )}
                    <ul className="space-y-0.5 pl-2">
                      {leaves.map(leaf => (
                        <li
                          key={leaf.id}
                          onClick={() => handleDeselectLeaf(leaf.id)}
                          className="flex items-center justify-between gap-1 px-2 py-1.5 text-sm rounded-lg text-indigo-800 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 cursor-pointer transition-colors"
                        >
                          <span className="truncate">{leaf.label}</span>
                          <X size={13} className="flex-shrink-0" />
                        </li>
                      ))}
                    </ul>
                  </li>
                ))
              ) : (
                <li className="px-2 py-1.5 text-sm text-gray-500 dark:text-gray-400">None selected</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
