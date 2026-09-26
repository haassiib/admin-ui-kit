'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { FieldDef } from '@/lib/fields';
import BaseGrid, { EMPTY_VIEW, type GridColumn, type GridView, type HistoryEntry } from './BaseGrid';
import ViewTabs, { type ViewMode } from './ViewTabs';

/** A saved view: a name and everything the grid needs to show it. */
export type SavedView = { id: string; name: string; view: GridView };

const newId = () => `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const DEFAULT_VIEWS: SavedView[] = [{ id: 'grid', name: 'Grid', view: EMPTY_VIEW }];

/**
 * THE WHOLE TABLE — saved views over a `BaseGrid`, as one component. This is
 * the unit to lift into another project: pass your columns and rows, answer
 * the edit callbacks, and every Lark Base feature comes with it —
 *
 *   views        tabs of saved views, each a grid or a board; add, rename,
 *                duplicate, delete, drag to reorder
 *   per view     search, fields (show, hide, reorder, add), filter, group,
 *                sort, conditional colour, frozen columns at either edge,
 *                pinned rows, column widths, board lane field
 *   editing      in-place cells, a record panel with Details, History and
 *                Log, drag a card between board lanes
 *   fields       add a column of any of eleven types, edit or delete one
 *
 * ── Where the views live ────────────────────────────────────────────────────
 *
 * Controlled when `views` and `onViewsChange` are passed — the caller saves
 * them on its server, per user or shared. Otherwise they are kept here, and
 * with a `storageKey` also in `localStorage`, so a reader's views survive a
 * reload without any backend. Read after mount, never during render: the
 * server has no `localStorage`, and seeding from it during render would be a
 * hydration mismatch.
 */
export default function BaseTable<T>({
  columns,
  rows,
  getRowId,
  onRowChange,
  editOn,
  onFieldAdd,
  onFieldChange,
  onFieldDelete,
  views: controlledViews,
  onViewsChange,
  defaultViews = DEFAULT_VIEWS,
  storageKey,
  history,
  onHistoryAdd,
  actor,
  noun,
  toolbarEnd,
  maxHeight,
  className,
}: {
  columns: GridColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string | number;
  onRowChange?: (next: T, prev: T) => void;
  /** What opens a cell's editor — see BaseGrid. Default `click`. */
  editOn?: 'click' | 'doubleClick';
  onFieldAdd?: (field: FieldDef) => void;
  onFieldChange?: (key: string, field: FieldDef) => void;
  onFieldDelete?: (key: string) => void;
  /** Controlled views. Pass with `onViewsChange`, or leave both out. */
  views?: SavedView[];
  onViewsChange?: (views: SavedView[]) => void;
  /** The views a first visit starts with, when uncontrolled. */
  defaultViews?: SavedView[];
  /** Keep uncontrolled views in `localStorage` under this key. */
  storageKey?: string;
  history?: HistoryEntry[];
  onHistoryAdd?: (entry: HistoryEntry) => void;
  actor?: string;
  noun?: string;
  toolbarEnd?: ReactNode;
  maxHeight?: number | string;
  className?: string;
}) {
  const [innerViews, setInnerViews] = useState<SavedView[]>(defaultViews);
  const views = controlledViews ?? innerViews;
  const [activeId, setActiveId] = useState(views[0]?.id ?? '');
  const loaded = useRef(false);

  // Load persisted views once, after mount.
  useEffect(() => {
    if (controlledViews || !storageKey || loaded.current) return;
    loaded.current = true;
    try {
      const raw = window.localStorage.getItem(storageKey);
      const saved = raw ? (JSON.parse(raw) as { views?: SavedView[]; active?: string }) : null;
      if (saved?.views?.length) {
        setInnerViews(saved.views);
        setActiveId(saved.views.some((v) => v.id === saved.active) ? saved.active! : saved.views[0].id);
      }
    } catch {
      // Blocked or corrupt storage: the defaults stand.
    }
  }, [controlledViews, storageKey]);

  const setViews = (next: SavedView[], active = activeId) => {
    if (onViewsChange) onViewsChange(next);
    if (!controlledViews) {
      setInnerViews(next);
      if (storageKey) {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify({ views: next, active }));
        } catch {
          // Storage is a convenience here; failing to write it loses nothing live.
        }
      }
    }
  };

  const select = (id: string) => {
    setActiveId(id);
    if (storageKey && !controlledViews) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({ views, active: id }));
      } catch {}
    }
  };

  const active = views.find((v) => v.id === activeId) ?? views[0];
  const uniqueName = (base: string) => {
    let n = 1;
    let name = base;
    while (views.some((v) => v.name === name)) name = `${base} ${++n}`;
    return name;
  };

  return (
    <div className={className}>
      <ViewTabs
        views={views.map((v) => ({ id: v.id, name: v.name, mode: v.view.mode ?? 'grid' }))}
        activeId={active?.id ?? ''}
        onSelect={select}
        onCreate={(mode: ViewMode) => {
          const id = newId();
          const next = [...views, { id, name: uniqueName(mode === 'board' ? 'Board' : 'Grid'), view: { ...EMPTY_VIEW, mode } }];
          setViews(next, id);
          setActiveId(id);
          return id;
        }}
        onRename={(id, name) => setViews(views.map((v) => (v.id === id ? { ...v, name } : v)))}
        onDuplicate={(id) => {
          const src = views.find((v) => v.id === id);
          if (!src) return;
          const copy = { id: newId(), name: uniqueName(`${src.name} copy`), view: structuredClone(src.view) };
          const at = views.indexOf(src) + 1;
          setViews([...views.slice(0, at), copy, ...views.slice(at)], copy.id);
          setActiveId(copy.id);
        }}
        onDelete={(id) => {
          if (views.length <= 1) return;
          const at = views.findIndex((v) => v.id === id);
          const next = views.filter((v) => v.id !== id);
          const nextActive = id === activeId ? next[Math.max(0, at - 1)].id : activeId;
          setViews(next, nextActive);
          setActiveId(nextActive);
        }}
        onReorder={(ids) => setViews(ids.map((id) => views.find((v) => v.id === id)!).filter(Boolean))}
        className="mb-3"
      />

      {active && (
        <BaseGrid
          columns={columns}
          rows={rows}
          getRowId={getRowId}
          view={active.view}
          onViewChange={(view) => setViews(views.map((v) => (v.id === active.id ? { ...v, view } : v)))}
          onRowChange={onRowChange}
          editOn={editOn}
          onFieldAdd={onFieldAdd}
          onFieldChange={onFieldChange}
          onFieldDelete={onFieldDelete}
          history={history}
          onHistoryAdd={onHistoryAdd}
          actor={actor}
          noun={noun}
          toolbarEnd={toolbarEnd}
          maxHeight={maxHeight}
        />
      )}
    </div>
  );
}
