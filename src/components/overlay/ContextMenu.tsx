'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useDismiss } from '@/lib/use-dismiss';

export type ContextMenuAction = {
  label: React.ReactNode;
  /** An icon component (a lucide icon, say), sized by the menu. */
  icon?: React.ComponentType<{ className?: string }>;
  /** Display-only hint ("⌘C"). The menu does not bind the key. */
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  /** Rose text, for the irreversible entry. */
  danger?: boolean;
  /** A nested submenu. An item with children opens it instead of running `onClick`. */
  items?: ContextMenuItem[];
  separator?: false;
};

export type ContextMenuSeparator = { separator: true };

export type ContextMenuItem = ContextMenuAction | ContextMenuSeparator;

/** Anything `show()` can open from: a pointer event, a key event, or a bare point. */
export type ContextMenuTrigger =
  | React.MouseEvent
  | React.KeyboardEvent
  | MouseEvent
  | KeyboardEvent
  | { x: number; y: number };

const EDGE = 8;
/** Submenus overlap their parent by this much, so the pointer crosses no gap. */
const OVERLAP = 4;
/** Hover delay before a submenu opens or swaps — forgiving to a diagonal pointer path. */
const HOVER_MS = 120;

/**
 * The context menu as a hook, for triggers the wrapper cannot wrap — a table
 * row cannot sit inside a `<div>`. Render `menu` anywhere (it portals), and
 * either spread `getTriggerProps(items)` on the target or call
 * `show(event, items)` yourself. Items passed to `show` win over the hook's
 * defaults, which is how every row opens the same menu about itself.
 *
 * Focus returns to whatever held it before the menu opened, on Escape and
 * after an action — but NOT on an outside click, where the click has just put
 * focus somewhere the person chose.
 */
export function useContextMenu(defaultItems: ContextMenuItem[] = []) {
  const [state, setState] = useState<{ x: number; y: number; items: ContextMenuItem[]; keyboard: boolean } | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const keyedAt = useRef(0);

  const show = useCallback(
    (trigger: ContextMenuTrigger, items?: ContextMenuItem[]) => {
      let x: number;
      let y: number;
      let keyboard = false;
      if ('preventDefault' in trigger) {
        trigger.preventDefault();
        // Stop an enclosing ContextMenu from re-opening its own menu on the
        // same event — the innermost trigger wins, as in a desktop app.
        trigger.stopPropagation();
        const target = (trigger.currentTarget ?? trigger.target) as Element | null;
        const isPointer = 'clientX' in trigger && !(trigger.clientX === 0 && trigger.clientY === 0);
        // Some browsers follow a handled ContextMenu-key press with a
        // `contextmenu` event of their own. Without this it would re-open the
        // menu at a synthetic point, taking focus off the first item.
        if (isPointer && trigger.type === 'contextmenu' && Date.now() - keyedAt.current < 300) return;
        if (!isPointer) keyedAt.current = Date.now();
        if (isPointer) {
          x = (trigger as MouseEvent).clientX;
          y = (trigger as MouseEvent).clientY;
        } else {
          // Shift+F10 / the ContextMenu key: no pointer position, so anchor to
          // the focused element's lower-left corner. The ContextMenu key's own
          // `contextmenu` event reports (0, 0), which is why that is treated
          // as keyboard too.
          const focused = document.activeElement instanceof Element ? document.activeElement : target;
          const r = (focused ?? target)?.getBoundingClientRect();
          x = r ? r.left + 8 : EDGE;
          y = r ? r.bottom : EDGE;
          keyboard = true;
        }
      } else {
        ({ x, y } = trigger);
      }
      if (!state) restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setState({ x, y, items: items ?? defaultItems, keyboard });
    },
    [defaultItems, state],
  );

  const close = useCallback((restore = false) => {
    setState(null);
    if (restore) restoreRef.current?.focus({ preventScroll: true });
  }, []);

  const getTriggerProps = useCallback(
    (items?: ContextMenuItem[]) => ({
      // The DOM-containment checks matter because the menu is PORTALLED but
      // rendered inside the trigger in the React tree, and React bubbles
      // portal events up that tree: a right-click or Shift+F10 inside the open
      // menu would otherwise re-open it on its own trigger.
      onContextMenu: (e: React.MouseEvent) => {
        if (e.currentTarget.contains(e.target as Node)) show(e, items);
      },
      onKeyDown: (e: React.KeyboardEvent) => {
        if (!e.currentTarget.contains(e.target as Node)) return;
        if ((e.shiftKey && e.key === 'F10') || e.key === 'ContextMenu') show(e, items);
      },
    }),
    [show],
  );

  const menu = state ? <MenuRoot key={`${state.x},${state.y}`} {...state} onClose={close} /> : null;

  return { show, close: () => close(false), open: state !== null, getTriggerProps, menu };
}

export interface ContextMenuProps {
  items: ContextMenuItem[];
  /** Applied to the wrapping element, which is the right-click target. */
  className?: string;
  children: React.ReactNode;
}

/**
 * Right-click (or Shift+F10, or the ContextMenu key on a focused child) opens
 * a menu at the pointer, replacing the browser's own.
 *
 * PORTALLED to `<body>` and `position: fixed` at z-[200], the portalled-overlay
 * band. A context menu opens wherever the pointer is — the last row of a table
 * inside an `overflow-x-auto` shell, most often — so an in-flow menu would be
 * clipped more often than not. Being fixed, it is placed in viewport
 * coordinates and then corrected against its own measured size: it flips to
 * the other side of the pointer when it would run off an edge, and a submenu
 * opens to the left when there is no room on the right. Scrolling or resizing
 * closes it rather than chasing a pointer position that no longer means
 * anything.
 *
 * Submenus are DOM children of their parent panel, each `fixed` in its own
 * right — so one ref covers the whole cascade for `useDismiss`, and a click in
 * a submenu is not a click outside the menu.
 */
export default function ContextMenu({ items, className, children }: ContextMenuProps) {
  const { getTriggerProps, menu } = useContextMenu(items);
  return (
    <div className={className} {...getTriggerProps()}>
      {children}
      {menu}
    </div>
  );
}

function MenuRoot({
  x,
  y,
  items,
  keyboard,
  onClose,
}: {
  x: number;
  y: number;
  items: ContextMenuItem[];
  keyboard: boolean;
  onClose: (restore?: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dismiss = useCallback(() => onClose(false), [onClose]);
  const escape = useCallback(() => onClose(true), [onClose]);
  useDismiss(ref, true, dismiss, escape);

  useEffect(() => {
    const onScroll = (e: Event) => {
      // A scroll inside the menu itself (a long submenu) is not a reason to close.
      if (e.target instanceof Node && ref.current?.contains(e.target)) return;
      dismiss();
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', dismiss);
    window.addEventListener('blur', dismiss);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', dismiss);
      window.removeEventListener('blur', dismiss);
    };
  }, [dismiss]);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div ref={ref} data-overlay="popover">
      <MenuPanel
        items={items}
        anchor={{ kind: 'point', x, y }}
        autoFocus={keyboard ? 'first' : 'panel'}
        onSelect={() => onClose(true)}
      />
    </div>,
    document.body,
  );
}

type Anchor = { kind: 'point'; x: number; y: number } | { kind: 'item'; rect: DOMRect; parent: DOMRect };

function place(anchor: Anchor, w: number, h: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left: number;
  let top: number;
  if (anchor.kind === 'point') {
    // Flip to the other side of the pointer, as a desktop menu does, rather
    // than sliding under it — the pointer should stay on a corner of the menu.
    left = anchor.x + w <= vw - EDGE ? anchor.x : anchor.x - w;
    top = anchor.y + h <= vh - EDGE ? anchor.y : anchor.y - h;
  } else {
    const right = anchor.parent.right - OVERLAP;
    left = right + w <= vw - EDGE ? right : anchor.parent.left - w + OVERLAP;
    // Line the first item up with the parent item (minus the panel's padding).
    top = anchor.rect.top - 4;
    if (top + h > vh - EDGE) top = vh - EDGE - h;
  }
  // Clamp last: a menu taller or wider than the room on either side still
  // keeps its top-left corner on screen.
  return {
    left: Math.max(EDGE, Math.min(left, vw - EDGE - w)),
    top: Math.max(EDGE, Math.min(top, vh - EDGE - h)),
  };
}

function MenuPanel({
  items,
  anchor,
  autoFocus,
  onSelect,
  onBack,
  labelledBy,
  id,
}: {
  items: ContextMenuItem[];
  anchor: Anchor;
  /**
   * 'first' focuses the first item (opened by keyboard); 'panel' focuses the
   * menu itself (the root, opened by pointer); 'none' leaves focus on the
   * parent item (a submenu opened by hover, which must not pull the keyboard
   * into it).
   */
  autoFocus: 'first' | 'panel' | 'none';
  /** An action ran — close the whole cascade. */
  onSelect: () => void;
  /** Present on a submenu: ArrowLeft closes it and returns to the parent item. */
  onBack?: () => void;
  labelledBy?: string;
  id?: string;
}) {
  const base = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [sub, setSub] = useState<{ index: number; focus: 'first' | 'none' } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Measured before paint: the first render is invisible at (0, 0), this
  // places it against its real size, and the person never sees the jump.
  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    setPos(place(anchor, el.offsetWidth, el.offsetHeight));
    // The anchor is fixed for this panel's lifetime (a new point remounts the
    // root), so measuring once is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!pos) return;
    if (autoFocus === 'first') focusAt(enabled()[0]);
    else if (autoFocus === 'panel') panelRef.current?.focus({ preventScroll: true });
    // Re-runs when `autoFocus` changes too: ArrowRight on an item whose
    // submenu is already open from hover has to move focus into it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos === null, autoFocus]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const enabled = () =>
    items.map((it, i) => (!it.separator && !it.disabled ? i : -1)).filter((i) => i !== -1);
  const focusAt = (i: number | undefined) => {
    // `preventScroll`: the menu closes on any scroll, so a focus call that
    // nudged the page would close the menu it was focusing.
    if (i !== undefined) itemRefs.current[i]?.focus({ preventScroll: true });
  };

  const openSub = (i: number, focus: 'first' | 'none') => {
    if (timer.current) clearTimeout(timer.current);
    setSub({ index: i, focus });
  };

  const onHover = (i: number) => {
    const it = items[i];
    if (it.separator || it.disabled) return;
    // Hover and keyboard share ONE highlight — the focused item — so moving
    // the mouse and then pressing an arrow continues from where the pointer is.
    itemRefs.current[i]?.focus({ preventScroll: true });
    if (timer.current) clearTimeout(timer.current);
    if (sub?.index === i) return;
    timer.current = setTimeout(() => setSub(it.items?.length ? { index: i, focus: 'none' } : null), HOVER_MS);
  };

  const onKey = (e: React.KeyboardEvent) => {
    // Keys pressed inside an open submenu are that submenu's business.
    if (!panelRef.current?.contains(e.target as Node) || (e.target as Element).closest('[role="menu"]') !== panelRef.current) return;
    const list = enabled();
    const current = itemRefs.current.findIndex((el) => el === document.activeElement);
    const pos = list.indexOf(current);
    const it = current >= 0 ? items[current] : undefined;
    let next: number | undefined;
    switch (e.key) {
      case 'ArrowDown':
        next = list[pos === -1 ? 0 : (pos + 1) % list.length];
        break;
      case 'ArrowUp':
        next = list[pos === -1 ? list.length - 1 : (pos - 1 + list.length) % list.length];
        break;
      case 'Home':
        next = list[0];
        break;
      case 'End':
        next = list[list.length - 1];
        break;
      case 'ArrowRight':
        if (it && !it.separator && it.items?.length) {
          e.preventDefault();
          openSub(current, 'first');
        }
        return;
      case 'ArrowLeft':
        if (onBack) {
          e.preventDefault();
          onBack();
        }
        return;
      case 'Tab':
        // A menu is not a Tab stop sequence; Tab would walk out into the page
        // behind a menu that is still open.
        e.preventDefault();
        return;
      default:
        return;
    }
    e.preventDefault();
    focusAt(next);
  };

  const activate = (i: number, fromKeyboard: boolean) => {
    const it = items[i];
    if (it.separator || it.disabled) return;
    if (it.items?.length) {
      openSub(i, fromKeyboard ? 'first' : 'none');
      return;
    }
    onSelect();
    it.onClick?.();
  };

  const subItem = sub ? items[sub.index] : undefined;

  return (
    <div
      ref={panelRef}
      id={id}
      role="menu"
      aria-orientation="vertical"
      aria-labelledby={labelledBy}
      tabIndex={-1}
      onKeyDown={onKey}
      onContextMenu={(e) => e.preventDefault()}
      style={pos ? { left: pos.left, top: pos.top } : { left: 0, top: 0, visibility: 'hidden' }}
      className="panel panel-solid fixed z-[200] min-w-44 max-w-72 p-1 text-xs focus:outline-none"
    >
      {items.map((it, i) => {
        if (it.separator) {
          return <div key={i} role="separator" className="my-1 h-px bg-slate-200 dark:bg-slate-700" />;
        }
        const hasSub = !!it.items?.length;
        const Icon = it.icon;
        const expanded = sub?.index === i;
        return (
          <button
            key={i}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            id={`${base}-${i}`}
            type="button"
            role="menuitem"
            tabIndex={-1}
            disabled={it.disabled}
            aria-haspopup={hasSub ? 'menu' : undefined}
            aria-expanded={hasSub ? expanded : undefined}
            aria-controls={expanded ? `${base}-sub` : undefined}
            onMouseEnter={() => onHover(i)}
            onClick={(e) => activate(i, e.detail === 0)}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors',
              'focus:outline-none disabled:cursor-not-allowed disabled:opacity-40',
              it.danger
                ? 'text-rose-600 focus:bg-rose-50 dark:text-rose-400 dark:focus:bg-rose-500/10'
                : 'text-slate-700 focus:bg-slate-100 dark:text-slate-200 dark:focus:bg-slate-800',
              expanded && 'bg-slate-100 dark:bg-slate-800',
            )}
          >
            <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
              {Icon && <Icon className="h-3.5 w-3.5 opacity-70" aria-hidden />}
            </span>
            <span className="min-w-0 flex-1 truncate">{it.label}</span>
            {it.shortcut && (
              <kbd className="ml-4 shrink-0 font-sans text-[10px] text-slate-400 dark:text-slate-500">{it.shortcut}</kbd>
            )}
            {hasSub && <ChevronRight className="-mr-1 h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden />}
          </button>
        );
      })}

      {sub && subItem && !subItem.separator && subItem.items && pos && (
        <MenuPanel
          key={sub.index}
          id={`${base}-sub`}
          labelledBy={`${base}-${sub.index}`}
          items={subItem.items}
          anchor={{
            kind: 'item',
            rect: itemRefs.current[sub.index]!.getBoundingClientRect(),
            parent: panelRef.current!.getBoundingClientRect(),
          }}
          autoFocus={sub.focus}
          onSelect={onSelect}
          onBack={() => {
            const i = sub.index;
            setSub(null);
            focusAt(i);
          }}
        />
      )}
    </div>
  );
}
