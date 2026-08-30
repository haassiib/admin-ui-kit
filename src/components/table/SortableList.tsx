'use client';

/* Origin: bonus-adjustment (96S2), verbatim. */

import { useCallback, useRef, useState, type ReactNode } from 'react';

/**
 * Drag-to-reorder list on the browser's own HTML5 drag events — no drag library.
 *
 * Rows reorder LIVE as you drag over them, so what you see mid-drag is what gets
 * committed. `onReorder` therefore fires repeatedly during a drag: keep it to a
 * setState and persist from a separate Save step.
 *
 * Several lists can be on screen at once (one per group in the menu tree). A row
 * only drops into the list sharing its `group` key — dragging across groups is
 * ignored rather than silently reparenting the row.
 */

/**
 * Which row is in flight. Module scope is right: a document can only have one
 * drag at a time, and it lets a list reject a foreign row during `dragover`,
 * where the DataTransfer payload is deliberately unreadable in most browsers.
 */
let activeDrag: { group: string; id: string } | null = null;

export default function SortableList<T>({
  items,
  getId,
  onReorder,
  renderItem,
  group,
  disabled = false,
  className,
}: {
  items: T[];
  getId: (item: T) => string | number;
  onReorder: (next: T[]) => void;
  /**
   * `handleProps` must be spread onto whatever should start a drag. Rows here
   * contain inputs, so making the whole row draggable would swallow text
   * selection — the grip handle opts in explicitly.
   */
  renderItem: (
    item: T,
    state: {
      isDragging: boolean;
      handleProps: { onPointerDown: () => void; onPointerUp: () => void };
    },
  ) => ReactNode;
  group: string;
  disabled?: boolean;
  className?: string;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  // A row is `draggable` only once the pointer goes down on its handle.
  const [armedId, setArmedId] = useState<string | null>(null);

  // The order when the drag began, so a cancelled drag (Escape, or a release
  // outside any row) can be restored — otherwise the live reordering leaves the
  // row wherever it happened to be hovering.
  const orderBefore = useRef<T[] | null>(null);
  const didDrop = useRef(false);

  const onDragStart = useCallback(
    (id: string) => {
      activeDrag = { group, id };
      orderBefore.current = items;
      didDrop.current = false;
      setDraggingId(id);
    },
    [group, items],
  );

  const onDragEnter = useCallback(
    (overId: string) => {
      if (!activeDrag || activeDrag.group !== group) return;
      if (activeDrag.id === overId) return;

      const from = items.findIndex((i) => String(getId(i)) === activeDrag!.id);
      const to = items.findIndex((i) => String(getId(i)) === overId);
      if (from === -1 || to === -1) return;

      const next = [...items];
      const [row] = next.splice(from, 1);
      next.splice(to, 0, row);
      onReorder(next);
    },
    [group, items, getId, onReorder],
  );

  const onDragEnd = useCallback(() => {
    // `dragend` always fires, drop or not — so this is where a cancelled drag
    // gets undone.
    if (!didDrop.current && orderBefore.current) onReorder(orderBefore.current);
    activeDrag = null;
    orderBefore.current = null;
    setDraggingId(null);
    setArmedId(null);
  }, [onReorder]);

  return (
    <ul className={className} role="list">
      {items.map((item) => {
        const id = String(getId(item));
        const isDragging = draggingId === id;
        return (
          <li
            key={id}
            draggable={!disabled && armedId === id}
            onDragStart={(e) => {
              // Firefox refuses to start a drag unless something is set here.
              e.dataTransfer.setData('text/plain', id);
              e.dataTransfer.effectAllowed = 'move';
              onDragStart(id);
            }}
            onDragEnter={() => onDragEnter(id)}
            onDragOver={(e) => {
              // Without preventDefault the browser treats this as a non-drop
              // target and shows the "no entry" cursor.
              if (activeDrag?.group === group) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }
            }}
            onDrop={(e) => {
              if (activeDrag?.group !== group) return;
              e.preventDefault();
              // The list is already in its final order — flag it so dragend
              // doesn't revert.
              didDrop.current = true;
            }}
            onDragEnd={onDragEnd}
            className={isDragging ? 'opacity-40' : undefined}
          >
            {renderItem(item, {
              isDragging,
              handleProps: {
                onPointerDown: () => {
                  if (!disabled) setArmedId(id);
                },
                onPointerUp: () => setArmedId(null),
              },
            })}
          </li>
        );
      })}
    </ul>
  );
}
