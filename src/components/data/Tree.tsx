'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Check, ChevronRight, Loader2, Minus, Search } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface TreeNode {
  /** Unique across the WHOLE tree, not just among siblings — selection, expansion and focus are all keyed by it. */
  key: string;
  label: string;
  icon?: ReactNode;
  children?: TreeNode[];
  /** Still focusable and expandable (so its subtree stays reachable), but cannot be selected or checked. */
  disabled?: boolean;
  /**
   * With `onLoadChildren`, a node whose `children` is undefined is assumed to
   * have some to fetch. `leaf` says it has none, so it draws no chevron.
   */
  leaf?: boolean;
}

export type TreeSelectionMode = 'single' | 'multiple' | 'checkbox';
export type TreeCheckState = 'checked' | 'unchecked' | 'mixed';

export interface TreeProps {
  nodes: TreeNode[];
  /** Omit for a navigation-only tree, where clicking a branch toggles it. */
  selectionMode?: TreeSelectionMode;
  /**
   * Controlled selection. In `checkbox` mode this is every FULLY checked key,
   * branches included — a half-checked parent is derived, never stored.
   */
  selectedKeys?: string[];
  defaultSelectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  /** Controlled expansion; pair with `onToggle`. */
  expandedKeys?: string[];
  defaultExpandedKeys?: string[];
  /** Receives the whole next expanded set, so a controlled caller just stores it. */
  onToggle?: (expandedKeys: string[]) => void;
  /** Shows a filter box above the tree. */
  filter?: boolean;
  filterPlaceholder?: string;
  /** Lazy children. Called once per node on first expand; a rejection collapses the node so the next expand retries. */
  onLoadChildren?: (node: TreeNode) => Promise<TreeNode[]>;
  /** Vertical lines joining each level to its parent. */
  showGuides?: boolean;
  emptyText?: string;
  'aria-label'?: string;
  className?: string;
}

type Entry = { node: TreeNode; parent: string | null };
type Row = { node: TreeNode; parent: string | null };

// Lazily loaded children live in component state, not in the caller's nodes,
// so they are spliced in here and everything downstream reads ONE tree.
function resolve(nodes: TreeNode[], loaded: Record<string, TreeNode[]>): TreeNode[] {
  return nodes.map((n) => {
    const kids = n.children ?? loaded[n.key];
    return kids ? { ...n, children: resolve(kids, loaded) } : n;
  });
}

function indexTree(nodes: TreeNode[], parent: string | null = null, map = new Map<string, Entry>()) {
  for (const n of nodes) {
    map.set(n.key, { node: n, parent });
    if (n.children) indexTree(n.children, n.key, map);
  }
  return map;
}

function collectKeys(nodes: TreeNode[], out: string[] = []): string[] {
  for (const n of nodes) {
    out.push(n.key);
    if (n.children) collectKeys(n.children, out);
  }
  return out;
}

// A branch's check state is DERIVED from its children, bottom-up. Storing it
// instead is how a parent ends up ticked over an unticked child: every toggle
// would have to walk up and repair every ancestor, and one missed path is a lie.
function checkStates(nodes: TreeNode[], checked: Set<string>, out = new Map<string, TreeCheckState>()) {
  const visit = (n: TreeNode): TreeCheckState => {
    let s: TreeCheckState;
    if (!n.children || n.children.length === 0) {
      s = checked.has(n.key) ? 'checked' : 'unchecked';
    } else {
      const kids = n.children.map(visit);
      s = kids.every((k) => k === 'checked') ? 'checked' : kids.every((k) => k === 'unchecked') ? 'unchecked' : 'mixed';
    }
    out.set(n.key, s);
    return s;
  };
  nodes.forEach(visit);
  return out;
}

// The keys one press on `n` can actually change.
function enabledLeaves(n: TreeNode): string[] {
  if (n.disabled) return [];
  if (!n.children || n.children.length === 0) return [n.key];
  return n.children.flatMap(enabledLeaves);
}

// Disabled descendants are skipped along with their subtree: "disabled" means
// this toggle cannot change them, not that they are silently ticked on the way past.
function setSubtree(n: TreeNode, on: boolean, set: Set<string>) {
  if (n.disabled) return;
  if (on) set.add(n.key);
  else set.delete(n.key);
  n.children?.forEach((c) => setSubtree(c, on, set));
}

// Keeps every match plus the ancestors that lead to it, and reports those
// ancestors so they can open. A branch that matches ITSELF keeps all its
// children — searching for a folder should show what is in it — but stays
// closed unless something inside matched too.
function filterNodes(nodes: TreeNode[], q: string, open: Set<string>): TreeNode[] {
  const out: TreeNode[] = [];
  for (const n of nodes) {
    const self = n.label.toLowerCase().includes(q);
    const kids = n.children ? filterNodes(n.children, q, open) : [];
    if (kids.length) {
      open.add(n.key);
      out.push({ ...n, children: self ? n.children : kids });
    } else if (self) {
      out.push(n);
    }
  }
  return out;
}

function Highlight({ text, q }: { text: string; q: string }) {
  const at = q ? text.toLowerCase().indexOf(q) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className="rounded-sm bg-amber-100 text-inherit dark:bg-amber-500/25">{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  );
}

/**
 * A hierarchical list with expand/collapse, three selection modes, a filter and
 * lazy children.
 *
 * Keyboard follows the WAI tree pattern with ONE tab stop (roving tabindex):
 * Tab enters the tree once and leaves it once, and the arrows move within. A
 * tree that put every row in the tab order would make a 200-node tree 200
 * presses to get past.
 *
 * The filter is a VIEW: it never touches the caller's `expandedKeys`. While it
 * is active the tree opens exactly the ancestors of matches, and toggles made
 * then are kept locally and discarded when the query changes — otherwise
 * clearing a search would leave the caller's tree blown wide open. Only
 * already-loaded nodes are searchable; a lazy branch nobody opened has no
 * children to match.
 *
 * Checking a parent in `checkbox` mode checks its WHOLE subtree, including
 * rows the filter is hiding: the box says "this folder", and a folder that is
 * only partly ticked because of what was on screen at the time would read as
 * ticked and behave as not.
 */
export default function Tree({
  nodes,
  selectionMode,
  selectedKeys,
  defaultSelectedKeys,
  onSelectionChange,
  expandedKeys,
  defaultExpandedKeys,
  onToggle,
  filter = false,
  filterPlaceholder = 'Filter…',
  onLoadChildren,
  showGuides = true,
  emptyText = 'Nothing to show.',
  'aria-label': ariaLabel = 'Tree',
  className,
}: TreeProps) {
  const [innerSelected, setInnerSelected] = useState<string[]>(defaultSelectedKeys ?? []);
  const [innerExpanded, setInnerExpanded] = useState<string[]>(defaultExpandedKeys ?? []);
  const [loaded, setLoaded] = useState<Record<string, TreeNode[]>>({});
  const [loading, setLoading] = useState<Set<string>>(() => new Set());
  const [query, setQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState<{ q: string; keys: Set<string> } | null>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);

  const itemRefs = useRef(new Map<string, HTMLLIElement>());
  const loadingRef = useRef(new Set<string>());
  const typeahead = useRef({ buf: '', at: 0 });

  const selectedList = selectedKeys ?? innerSelected;
  const expandedList = expandedKeys ?? innerExpanded;

  const tree = useMemo(() => resolve(nodes, loaded), [nodes, loaded]);
  const index = useMemo(() => indexTree(tree), [tree]);
  const selected = useMemo(() => new Set(selectedList), [selectedList]);
  const checks = useMemo(
    () => (selectionMode === 'checkbox' ? checkStates(tree, selected) : null),
    [selectionMode, tree, selected],
  );

  const q = filter ? query.trim().toLowerCase() : '';
  const { visible, autoOpen } = useMemo(() => {
    if (!q) return { visible: tree, autoOpen: null };
    const open = new Set<string>();
    return { visible: filterNodes(tree, q, open), autoOpen: open };
  }, [tree, q]);

  const expanded = useMemo(() => {
    if (autoOpen) return filterOpen?.q === q ? filterOpen.keys : autoOpen;
    return new Set(expandedList);
  }, [autoOpen, filterOpen, q, expandedList]);

  const emitSelection = (next: string[]) => {
    if (selectedKeys === undefined) setInnerSelected(next);
    onSelectionChange?.(next);
  };

  const setExpanded = useCallback(
    (next: Set<string>) => {
      if (q) {
        setFilterOpen({ q, keys: next });
        return;
      }
      const list = [...next];
      if (expandedKeys === undefined) setInnerExpanded(list);
      onToggle?.(list);
    },
    [q, expandedKeys, onToggle],
  );

  const collapseAfterFailure = (key: string) => {
    const next = expandedList.filter((k) => k !== key);
    if (expandedKeys === undefined) setInnerExpanded(next);
    onToggle?.(next);
    setFilterOpen((f) => (f ? { q: f.q, keys: new Set([...f.keys].filter((k) => k !== key)) } : f));
  };

  // Read from the async load callback, which would otherwise close over the
  // props and state of the render that STARTED the fetch rather than the one
  // it resolves into — a selection made while children loaded would be undone.
  const latest = useRef({ selected: selectedList, selectionMode, emitSelection, collapseAfterFailure });
  useEffect(() => {
    latest.current = { selected: selectedList, selectionMode, emitSelection, collapseAfterFailure };
  });

  const canExpand = (n: TreeNode) =>
    (n.children?.length ?? 0) > 0 || (!!onLoadChildren && !n.leaf && n.children === undefined);

  const toggleOpen = (n: TreeNode, open = !expanded.has(n.key)) => {
    if (!canExpand(n) || open === expanded.has(n.key)) return;
    const next = new Set(expanded);
    if (open) next.add(n.key);
    else next.delete(n.key);
    setExpanded(next);
  };

  // Loading is driven by EXPANSION, not by the click: a controlled caller can
  // hand in `expandedKeys` that already include a lazy node, and it must load
  // just the same. The ref guards against the effect re-firing mid-flight.
  useEffect(() => {
    if (!onLoadChildren) return;
    for (const key of expanded) {
      const n = index.get(key)?.node;
      if (!n || n.leaf || n.children !== undefined || loadingRef.current.has(key)) continue;
      loadingRef.current.add(key);
      setLoading((s) => new Set(s).add(key));
      onLoadChildren(n)
        .then((kids) => {
          setLoaded((l) => ({ ...l, [key]: kids }));
          // A checked lazy node was a leaf until now; its new children inherit
          // the tick, or the derived state would flip the parent to unchecked.
          const cur = latest.current;
          if (cur.selectionMode === 'checkbox' && cur.selected.includes(key)) {
            cur.emitSelection([...new Set([...cur.selected, ...collectKeys(kids.filter((k) => !k.disabled))])]);
          }
        })
        .catch(() => latest.current.collapseAfterFailure(key))
        .finally(() => {
          loadingRef.current.delete(key);
          setLoading((s) => {
            const n2 = new Set(s);
            n2.delete(key);
            return n2;
          });
        });
    }
    // Callbacks are read at resolve time through `latest`; re-running on their
    // identity would only re-walk the guarded loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, index, onLoadChildren]);

  const activate = (n: TreeNode) => {
    if (!selectionMode) {
      toggleOpen(n);
      return;
    }
    if (n.disabled) return;
    if (selectionMode === 'single') {
      emitSelection([n.key]);
    } else if (selectionMode === 'multiple') {
      emitSelection(selected.has(n.key) ? selectedList.filter((k) => k !== n.key) : [...selectedList, n.key]);
    } else {
      const full = index.get(n.key)!.node;
      const set = new Set(selectedList);
      // Decide from what this press can change, not from the displayed state:
      // a folder holding one disabled, unticked file never reads "checked",
      // so keying off the display would make it impossible to untick.
      setSubtree(full, !enabledLeaves(full).every((k) => set.has(k)), set);
      // Normalise: re-derive, then store exactly the fully checked keys, so an
      // ancestor that just became complete is added and one that broke is dropped.
      // Keys the tree does not know (yet-unloaded nodes) are passed through.
      const states = checkStates(tree, set);
      const next = [
        ...selectedList.filter((k) => !index.has(k)),
        ...[...states].filter(([, s]) => s === 'checked').map(([k]) => k),
      ];
      emitSelection(next);
    }
  };

  const rows = useMemo(() => {
    const out: Row[] = [];
    const walk = (ns: TreeNode[], parent: string | null) => {
      for (const n of ns) {
        out.push({ node: n, parent });
        if (expanded.has(n.key) && n.children?.length) walk(n.children, n.key);
      }
    };
    walk(visible, null);
    return out;
  }, [visible, expanded]);

  // The single tab stop: the last-focused row if it is still on screen, else
  // the first selected one, else the first row.
  const tabStop =
    (focusKey && rows.some((r) => r.node.key === focusKey) && focusKey) ||
    rows.find((r) => selected.has(r.node.key))?.node.key ||
    rows[0]?.node.key;

  const focusRow = (key: string | undefined) => {
    if (!key) return;
    setFocusKey(key);
    itemRefs.current.get(key)?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const key = (e.target as HTMLElement).dataset?.key;
    const at = rows.findIndex((r) => r.node.key === key);
    if (at < 0) return;
    const row = rows[at];
    const n = row.node;
    const open = expanded.has(n.key);
    let handled = true;

    switch (e.key) {
      case 'ArrowDown':
        focusRow(rows[at + 1]?.node.key);
        break;
      case 'ArrowUp':
        focusRow(rows[at - 1]?.node.key);
        break;
      case 'ArrowRight':
        if (!canExpand(n)) break;
        if (!open) toggleOpen(n, true);
        else if (n.children?.length) focusRow(n.children[0].key);
        break;
      case 'ArrowLeft':
        if (open) toggleOpen(n, false);
        else if (row.parent) focusRow(row.parent);
        break;
      case 'Home':
        focusRow(rows[0]?.node.key);
        break;
      case 'End':
        focusRow(rows[rows.length - 1]?.node.key);
        break;
      case 'Enter':
      case ' ':
        activate(n);
        break;
      case '*': {
        const next = new Set(expanded);
        rows.filter((r) => r.parent === row.parent && canExpand(r.node)).forEach((r) => next.add(r.node.key));
        setExpanded(next);
        break;
      }
      default:
        handled = false;
        // Type-ahead: a printable character jumps to the next row starting
        // with it, wrapping. Keys typed within 500ms accumulate into a prefix.
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const now = Date.now();
          const t = typeahead.current;
          t.buf = now - t.at < 500 ? t.buf + e.key.toLowerCase() : e.key.toLowerCase();
          t.at = now;
          const order = [...rows.slice(at + (t.buf.length === 1 ? 1 : 0)), ...rows.slice(0, at + 1)];
          const hit = order.find((r) => r.node.label.toLowerCase().startsWith(t.buf));
          if (hit) {
            focusRow(hit.node.key);
            handled = true;
          }
        }
    }
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const renderNodes = (ns: TreeNode[], depth: number): ReactNode =>
    ns.map((n, i) => {
      const expandable = canExpand(n);
      const open = expandable && expanded.has(n.key);
      const busy = loading.has(n.key);
      const check = checks?.get(n.key) ?? 'unchecked';
      const isSelected = (selectionMode === 'single' || selectionMode === 'multiple') && selected.has(n.key);

      return (
        <li
          key={n.key}
          ref={(el) => {
            if (el) itemRefs.current.set(n.key, el);
            else itemRefs.current.delete(n.key);
          }}
          role="treeitem"
          data-key={n.key}
          tabIndex={n.key === tabStop ? 0 : -1}
          aria-level={depth + 1}
          aria-setsize={ns.length}
          aria-posinset={i + 1}
          aria-expanded={expandable ? open : undefined}
          aria-selected={selectionMode === 'single' || selectionMode === 'multiple' ? isSelected : undefined}
          aria-checked={selectionMode === 'checkbox' ? (check === 'mixed' ? 'mixed' : check === 'checked') : undefined}
          aria-disabled={n.disabled || undefined}
          aria-busy={busy || undefined}
          // The ring goes on the ROW, not the <li>: the item wraps its whole
          // subtree, so ringing it would box every descendant along with it.
          className="outline-none [&:focus-visible>div]:ring-2 [&:focus-visible>div]:ring-indigo-400"
        >
          <div
            onClick={() => {
              focusRow(n.key);
              activate(n);
            }}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs leading-none select-none transition-colors',
              isSelected
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/60',
              n.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
            )}
          >
            {/* Not a <button>: a tabbable control inside a treeitem breaks the
                one-tab-stop contract. The keyboard path is ArrowRight/Left. */}
            <span
              aria-hidden
              onClick={(e) => {
                e.stopPropagation();
                focusRow(n.key);
                toggleOpen(n);
              }}
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : expandable ? (
                <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-90')} />
              ) : null}
            </span>
            {selectionMode === 'checkbox' && (
              <span
                aria-hidden
                className={cn(
                  'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors',
                  check === 'unchecked'
                    ? 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800'
                    : 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500',
                )}
              >
                {check === 'checked' && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                {check === 'mixed' && <Minus className="h-2.5 w-2.5" strokeWidth={3} />}
              </span>
            )}
            {n.icon && (
              <span aria-hidden className="shrink-0 text-slate-400 dark:text-slate-500 [&>svg]:h-3.5 [&>svg]:w-3.5">
                {n.icon}
              </span>
            )}
            <span className="min-w-0 truncate py-0.5">
              <Highlight text={n.label} q={q} />
            </span>
          </div>
          {open && n.children && n.children.length > 0 && (
            // The indent IS the guide: a left border on the nested group,
            // offset to sit under the parent's chevron. No per-row spacer
            // elements to keep in step with depth.
            <ul
              role="group"
              className={cn(
                'ml-[13px] border-l pl-1.5',
                showGuides ? 'border-slate-200 dark:border-slate-700' : 'border-transparent dark:border-transparent',
              )}
            >
              {renderNodes(n.children, depth + 1)}
            </ul>
          )}
        </li>
      );
    });

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {filter && (
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              // ArrowDown from the box drops into the tree, as in a combobox.
              if (e.key === 'ArrowDown' && rows.length) {
                e.preventDefault();
                focusRow(rows[0].node.key);
              }
            }}
            placeholder={filterPlaceholder}
            aria-label="Filter tree"
            className="field-input pl-8"
          />
        </div>
      )}
      {rows.length === 0 ? (
        <p className="px-2 py-1.5 text-[11px] text-slate-400 dark:text-slate-500">{q ? 'No matches.' : emptyText}</p>
      ) : (
        <ul
          role="tree"
          aria-label={ariaLabel}
          aria-multiselectable={selectionMode === 'multiple' || selectionMode === 'checkbox' || undefined}
          onKeyDown={onKeyDown}
          onFocus={(e) => {
            const k = (e.target as HTMLElement).dataset?.key;
            if (k) setFocusKey(k);
          }}
        >
          {renderNodes(visible, 0)}
        </ul>
      )}
    </div>
  );
}
