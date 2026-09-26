'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Copy, Pencil, Plus, SquareKanban, Table2, Trash2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useDismiss } from '@/lib/use-dismiss';

export type ViewMode = 'grid' | 'board';

/** A saved view as the tab bar needs it. The state it carries is the caller's. */
export type ViewTab = { id: string; name: string; mode: ViewMode };

const MODE_ICON: Record<ViewMode, LucideIcon> = { grid: Table2, board: SquareKanban };
const MODE_LABEL: Record<ViewMode, string> = { grid: 'Grid view', board: 'Board view' };

/**
 * The view tabs above a Lark Base table — one tab per saved view, each with
 * its mode's icon, a caret menu (rename, duplicate, delete), double-click to
 * rename in place, drag to reorder, and "+" to add a grid or a board.
 *
 * Stateless about the views themselves: every change comes back through a
 * callback and the caller holds the list — `BaseTable` does, and so can an
 * app that saves views on its server. The one state kept here is which tab
 * is being renamed, because that is the tab bar's business alone.
 *
 * The menus are PORTALLED and fixed: the tab strip scrolls sideways when
 * there are many views, and an in-flow menu would be clipped by it.
 */
export default function ViewTabs({
  views,
  activeId,
  onSelect,
  onCreate,
  onRename,
  onDuplicate,
  onDelete,
  onReorder,
  modes = ['grid', 'board'],
  className,
}: {
  views: ViewTab[];
  activeId: string;
  onSelect: (id: string) => void;
  /** Returns the new view's id, so the tab can open straight into renaming. */
  onCreate?: (mode: ViewMode) => string | void;
  onRename?: (id: string, name: string) => void;
  onDuplicate?: (id: string) => void;
  /** Never offered on the last view — a table always has one. */
  onDelete?: (id: string) => void;
  onReorder?: (ids: string[]) => void;
  /** Which kinds of view "+" offers. */
  modes?: ViewMode[];
  className?: string;
}) {
  const [renaming, setRenaming] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ id: string | null; top: number; left: number } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropAt, setDropAt] = useState<{ id: string; side: 'before' | 'after' } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useDismiss(menuRef, menu !== null, () => setMenu(null));

  const openMenu = (id: string | null, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    setMenu({ id, top: r.bottom + 4, left: Math.max(8, Math.min(r.left, window.innerWidth - 200)) });
  };

  const create = (mode: ViewMode) => {
    setMenu(null);
    const id = onCreate?.(mode);
    if (id) setRenaming(id);
  };

  const drop = () => {
    if (!dragId || !dropAt || dragId === dropAt.id || !onReorder) return;
    const ids = views.map((v) => v.id).filter((id) => id !== dragId);
    const at = ids.indexOf(dropAt.id) + (dropAt.side === 'after' ? 1 : 0);
    ids.splice(at, 0, dragId);
    onReorder(ids);
  };

  const item = 'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent dark:text-slate-200 dark:hover:bg-slate-700';
  const menuView = menu?.id ? views.find((v) => v.id === menu.id) : null;

  return (
    <div className={cn('flex min-w-0 items-end gap-1 border-b border-slate-200 dark:border-slate-700', className)}>
      {/* Scrolls SIDEWAYS only. `overflow-x: auto` alone makes the other axis
          `auto` too, and the underline reaching the strip's border was one
          pixel of vertical overflow — a scrollbar on a one-row strip. The
          strip overlaps the border by that pixel (`-mb-px`) so the underline
          sits ON the line inside the box, and the vertical axis is clipped. */}
      <div
        role="tablist"
        aria-label="Views"
        className="-mb-px flex min-w-0 items-end gap-0.5 overflow-x-auto overflow-y-hidden [scrollbar-width:thin]"
      >
        {views.map((v) => {
          const Icon = MODE_ICON[v.mode];
          const active = v.id === activeId;
          return (
            <div
              key={v.id}
              draggable={Boolean(onReorder) && renaming !== v.id}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', v.id);
                setDragId(v.id);
              }}
              onDragOver={(e) => {
                if (!dragId) return;
                e.preventDefault();
                const r = e.currentTarget.getBoundingClientRect();
                const side = e.clientX < r.left + r.width / 2 ? 'before' : 'after';
                if (dropAt?.id !== v.id || dropAt.side !== side) setDropAt({ id: v.id, side });
              }}
              onDrop={(e) => { e.preventDefault(); drop(); }}
              onDragEnd={() => { setDragId(null); setDropAt(null); }}
              className={cn(
                'group/tab relative flex shrink-0 items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs transition-colors',
                active
                  ? 'bg-white font-medium text-indigo-600 dark:bg-slate-900 dark:text-indigo-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                dragId === v.id && 'opacity-40',
                dropAt?.id === v.id && dropAt.side === 'before' && 'shadow-[inset_2px_0_0_0_#6366f1]',
                dropAt?.id === v.id && dropAt.side === 'after' && 'shadow-[inset_-2px_0_0_0_#6366f1]',
              )}
            >
              <Icon className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-indigo-500' : 'text-slate-400')} aria-hidden />
              {renaming === v.id ? (
                <RenameInput
                  initial={v.name}
                  onDone={(name) => {
                    setRenaming(null);
                    if (name && name !== v.name) onRename?.(v.id, name);
                  }}
                />
              ) : (
                <button
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onSelect(v.id)}
                  onDoubleClick={() => onRename && setRenaming(v.id)}
                  className="max-w-[12rem] truncate outline-none"
                  title={onRename ? `${v.name} — double-click to rename` : v.name}
                >
                  {v.name}
                </button>
              )}
              {(onRename || onDuplicate || onDelete) && renaming !== v.id && (
                <button
                  type="button"
                  aria-label={`${v.name} view options`}
                  onClick={(e) => openMenu(v.id, e.currentTarget)}
                  className={cn(
                    'rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700',
                    active ? 'opacity-100' : 'opacity-0 group-hover/tab:opacity-100 focus-visible:opacity-100',
                  )}
                >
                  <ChevronDown className="h-3 w-3" aria-hidden />
                </button>
              )}
              {/* The active tab's underline, drawn over the strip's own border. */}
              {active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-indigo-500" aria-hidden />}
            </div>
          );
        })}
      </div>

      {onCreate && (
        <button
          type="button"
          aria-label="Add view"
          title="Add view"
          onClick={(e) => (modes.length === 1 ? create(modes[0]) : openMenu(null, e.currentTarget))}
          className="mb-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-300"
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
      )}

      {menu && typeof document !== 'undefined'
        ? createPortal(
            <div ref={menuRef} role="menu" data-overlay="menu" style={{ top: menu.top, left: menu.left }} className="fixed z-[200] w-48 panel panel-solid p-1">
              {menu.id === null ? (
                <>
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">New view</p>
                  {modes.map((m) => {
                    const Icon = MODE_ICON[m];
                    return (
                      <button key={m} type="button" role="menuitem" className={item} onClick={() => create(m)}>
                        <Icon className="h-3.5 w-3.5 text-slate-400" /> {MODE_LABEL[m]}
                      </button>
                    );
                  })}
                </>
              ) : (
                menuView && (
                  <>
                    {onRename && (
                      <button type="button" role="menuitem" className={item} onClick={() => { setMenu(null); setRenaming(menuView.id); }}>
                        <Pencil className="h-3.5 w-3.5 text-slate-400" /> Rename
                      </button>
                    )}
                    {onDuplicate && (
                      <button type="button" role="menuitem" className={item} onClick={() => { setMenu(null); onDuplicate(menuView.id); }}>
                        <Copy className="h-3.5 w-3.5 text-slate-400" /> Duplicate
                      </button>
                    )}
                    {onDelete && (
                      <>
                        <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                        <button
                          type="button"
                          role="menuitem"
                          disabled={views.length <= 1}
                          title={views.length <= 1 ? 'A table always keeps one view' : undefined}
                          className={cn(item, 'text-rose-600 dark:text-rose-400')}
                          onClick={() => { setMenu(null); onDelete(menuView.id); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete view
                        </button>
                      </>
                    )}
                  </>
                )
              )}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

/** The in-place rename box. Enter and blur keep, Escape abandons. */
function RenameInput({ initial, onDone }: { initial: string; onDone: (name: string | null) => void }) {
  const [text, setText] = useState(initial);
  const done = useRef(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.select(), []);
  const finish = (name: string | null) => {
    if (done.current) return;
    done.current = true;
    onDone(name?.trim() || null);
  };
  return (
    <input
      ref={ref}
      autoFocus
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => finish(text)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') finish(text);
        else if (e.key === 'Escape') finish(null);
      }}
      aria-label="View name"
      className="w-28 rounded border border-indigo-300 bg-white px-1 py-0.5 text-xs text-slate-800 outline-none dark:border-indigo-500/50 dark:bg-slate-900 dark:text-slate-100"
    />
  );
}
