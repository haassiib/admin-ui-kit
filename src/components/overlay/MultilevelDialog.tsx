'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ResizeMark, sizeToStyle, useDragResize } from '@/lib/use-drag-resize';

const SIZE = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
} as const;

export type DialogLevelSize = keyof typeof SIZE;

/**
 * One entry on the stack: which level, and any data it was opened with (the
 * record a confirm is about). Only this is stored — the level's content is
 * rendered fresh from `renderLevel` every time, so it always sees current
 * state. Storing rendered content instead freezes it at the moment it was
 * pushed, and a controlled input inside it can never change.
 */
export type DialogEntry<D = unknown> = { id: string; data?: D };

/** What a level's content and footer are handed, to open or close levels from inside. */
export type DialogStackApi = {
  push: (id: string, data?: unknown) => void;
  /** Close the top level, back to the one under it. */
  pop: () => void;
  /** Close every level. */
  close: () => void;
  /** How deep this level sits, 0 for the first. */
  depth: number;
};

/** How one level looks, returned by `renderLevel` for its entry. */
export type DialogLevel = {
  title: string;
  subtitle?: string;
  size?: DialogLevelSize;
  content: ReactNode | ((api: DialogStackApi) => ReactNode);
  footer?: ReactNode | ((api: DialogStackApi) => ReactNode);
};

/**
 * The stack behind a multilevel dialog, as a hook: `push` a level, `pop` back
 * to the one under it, `close` them all. Kept apart from the component so the
 * button that opens the first level and the dialog itself can live in
 * different places.
 */
export function useDialogStack(initial: DialogEntry[] = []) {
  const [stack, setStack] = useState<DialogEntry[]>(initial);
  // Pushing a level already open moves it to the top rather than opening it twice.
  const push = useCallback((id: string, data?: unknown) => setStack((s) => [...s.filter((l) => l.id !== id), { id, data }]), []);
  const pop = useCallback(() => setStack((s) => s.slice(0, -1)), []);
  const close = useCallback(() => setStack([]), []);
  /** Back to a level, closing everything above it — what a breadcrumb does. */
  const popTo = useCallback((id: string) => setStack((s) => s.slice(0, s.findIndex((l) => l.id === id) + 1)), []);
  return { stack, push, pop, close, popTo, setStack };
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A dialog that opens DIALOGS — a record form that opens an option manager
 * that opens a confirm — as one stack over one backdrop.
 *
 * ── Why not three Modals ────────────────────────────────────────────────────
 *
 * Three independent modals means three backdrops darkening each other, three
 * Escape listeners that all fire on one keypress, and no way to see how deep
 * you are. Here the levels share a backdrop, the ones underneath recede
 * (scaled back, dimmed, inert) so the top one is unmistakably the one that
 * takes input, the header carries a breadcrumb of every level with a back
 * arrow, and one Escape closes one level — the top one.
 *
 * ── The stack is the caller's ───────────────────────────────────────────────
 *
 * `useDialogStack` holds the entries — an id and the data each level was
 * opened with — and `renderLevel` turns an entry into a title, content and
 * footer on EVERY render, so a level always reads current state. Content and
 * footer may be functions handed `push` / `pop` / `close`, so a level opens
 * the next one from inside itself. Levels underneath stay mounted, so a
 * half-filled form keeps what was typed into it while others come and go.
 *
 * Focus moves into the top level on every push and pop, is trapped inside it
 * (Tab wraps), and returns to whatever opened the first level when the stack
 * empties. The page behind does not scroll while it is open.
 *
 * ── Moving and resizing ─────────────────────────────────────────────────────
 *
 * Drag the top level's header to move the STACK — the levels underneath come
 * along, so a level pushed next opens over the one it came from rather than
 * back in the middle of the screen. Each level is resized on its own from any
 * edge or corner and keeps that size while levels above it come and go.
 * A click on the backdrop does nothing unless `closeOnBackdrop` is set: levels
 * hold forms, and a stray click should not throw one away.
 */
export default function MultilevelDialog({
  stack,
  renderLevel,
  onPush,
  onPop,
  onClose,
  onPopTo,
  closeOnBackdrop = false,
  draggable = true,
  resizable = true,
}: {
  stack: DialogEntry[];
  /** An entry's title, content and footer. Called every render. Null skips an unknown id. */
  renderLevel: (entry: DialogEntry) => DialogLevel | null;
  onPush: (id: string, data?: unknown) => void;
  onPop: () => void;
  onClose: () => void;
  /** A breadcrumb was clicked: close every level above this one. */
  onPopTo?: (id: string) => void;
  /** A click on the backdrop closes the TOP level (never the whole stack). Default off. */
  closeOnBackdrop?: boolean;
  /** Drag the stack by the top level's header; double-click it to recentre. Default on. */
  draggable?: boolean;
  /** Resize a level from any edge or corner. Default on. */
  resizable?: boolean;
}) {
  const levels = stack.flatMap((entry) => {
    const level = renderLevel(entry);
    return level ? [{ ...level, id: entry.id }] : [];
  });
  const open = levels.length > 0;
  const top = levels[levels.length - 1];
  const panels = useRef(new Map<string, HTMLDivElement>());
  const opener = useRef<HTMLElement | null>(null);
  const drag = useDragResize({ draggable, resizable });
  const { reset, setSize } = drag;
  // The hook holds ONE size, the top level's; the others wait here.
  const sizes = useRef(new Map<string, { w?: number; h?: number }>());
  const shownTop = useRef<string | undefined>(undefined);
  const currentSize = useRef(drag.size);
  currentSize.current = drag.size;

  // A new top level: park the old one's size, take up the new one's.
  useEffect(() => {
    const prev = shownTop.current;
    if (prev === top?.id) return;
    if (prev) sizes.current.set(prev, currentSize.current);
    shownTop.current = top?.id;
    setSize(top ? sizes.current.get(top.id) ?? {} : {});
  }, [top?.id, setSize]); // eslint-disable-line react-hooks/exhaustive-deps

  // Closed: forget position and sizes, so it opens centred next time.
  useEffect(() => {
    if (open) return;
    sizes.current.clear();
    reset();
  }, [open, reset]);

  // Remember what opened the first level; give focus back to it at the end.
  useEffect(() => {
    if (open) {
      if (!opener.current) opener.current = document.activeElement as HTMLElement | null;
    } else if (opener.current) {
      opener.current.focus?.();
      opener.current = null;
    }
  }, [open]);

  // Focus into the top level whenever it changes.
  useEffect(() => {
    if (!top) return;
    const el = panels.current.get(top.id);
    const first = el?.querySelector<HTMLElement>('[data-autofocus]') ?? el?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? el)?.focus({ preventScroll: true });
  }, [top?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Escape pops one level; Tab is trapped in the top level; the page does not scroll.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // A popover inside the level (a select's list, a date picker) takes Escape first.
        if (e.defaultPrevented || document.querySelector('[data-overlay="picker"]')) return;
        e.preventDefault();
        onPop();
        return;
      }
      if (e.key !== 'Tab' || !top) return;
      const el = panels.current.get(top.id);
      const items = el ? [...el.querySelectorAll<HTMLElement>(FOCUSABLE)] : [];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, top, onPop]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="presentation">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in dark:bg-black/60"
        onMouseDown={() => closeOnBackdrop && onPop()}
        aria-hidden
      />
      {/* The stack moves as one; the group itself takes no clicks, so the backdrop still gets them. */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4" style={drag.offsetStyle}>
      {levels.map((level, i) => {
        const depth = levels.length - 1 - i; // 0 = top
        const isTop = depth === 0;
        const api: DialogStackApi = { push: onPush, pop: onPop, close: onClose, depth: i };
        const content = typeof level.content === 'function' ? level.content(api) : level.content;
        const footer = typeof level.footer === 'function' ? level.footer(api) : level.footer;
        return (
          <div
            key={level.id}
            ref={(el) => {
              if (el) panels.current.set(level.id, el);
              else panels.current.delete(level.id);
              if (isTop && el) drag.ref.current = el;
            }}
            role="dialog"
            aria-modal={isTop}
            aria-label={level.title}
            aria-hidden={!isTop}
            // Levels underneath stay mounted, so their state survives, but take no input.
            inert={!isTop}
            tabIndex={-1}
            style={{
              // Each level underneath steps back and up a little, so the stack's depth is visible.
              transform: `translateY(${-depth * 14}px) scale(${1 - depth * 0.04})`,
              zIndex: i + 1,
              ...(isTop ? drag.sizeStyle : sizeToStyle(sizes.current.get(level.id) ?? {})),
            }}
            className={cn(
              'pointer-events-auto absolute flex max-h-[calc(100vh-4rem)] w-[calc(100%-2rem)] flex-col panel panel-solid outline-none transition-[transform,opacity,filter] duration-200',
              SIZE[level.size ?? 'lg'],
              isTop ? 'animate-scale-in' : depth === 1 ? 'opacity-70 brightness-95' : 'opacity-0',
            )}
          >
            {isTop && drag.grips}
            <header
              {...(isTop ? drag.handleProps : {})}
              className={cn(
                'flex shrink-0 items-start gap-2 border-b border-slate-200 px-5 py-3 dark:border-slate-700',
                isTop && drag.handleProps.className,
              )}
            >
              {i > 0 && (
                <button
                  type="button"
                  onClick={onPop}
                  aria-label={`Back to ${levels[i - 1].title}`}
                  title={`Back to ${levels[i - 1].title}`}
                  className="mt-0.5 shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                </button>
              )}
              <div className="min-w-0 flex-1">
                {i > 0 && (
                  <nav aria-label="Dialog levels" className="mb-0.5 flex flex-wrap items-center gap-1 text-[11px] text-slate-400">
                    {levels.slice(0, i).map((l) => (
                      <span key={l.id} className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => (onPopTo ? onPopTo(l.id) : onPop())}
                          className="truncate hover:text-indigo-600 hover:underline dark:hover:text-indigo-300"
                        >
                          {l.title}
                        </button>
                        <ChevronRight className="h-3 w-3" aria-hidden />
                      </span>
                    ))}
                  </nav>
                )}
                <h2 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{level.title}</h2>
                {level.subtitle && <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{level.subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close all"
                title="Close"
                className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-xs text-slate-700 dark:text-slate-200">{content}</div>
            {footer && <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 px-5 py-3 dark:border-slate-700">{footer}</footer>}
            {isTop && resizable && <ResizeMark />}
          </div>
        );
      })}
      </div>
    </div>,
    document.body,
  );
}
