'use client';

import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export type SidebarPosition = 'left' | 'right' | 'top' | 'bottom';

/**
 * The dashboard frame: a navigation region beside or above the content, a
 * header, and a scrolling content area.
 *
 * Two decisions carry the whole thing.
 *
 * `<main>` is the ONLY scroll container. `h-screen` on the root plus `min-h-0`
 * on the content column is what makes it a definite-height scroll box, so a page
 * that says `flex-1 min-h-0` is genuinely bounded. It also matters for a reason
 * that is easy to miss: most dropdowns and calendars position themselves
 * ABSOLUTELY inside their trigger, and any extra `overflow` ancestor clips them
 * — the menu opens and is painted away. So content fills by GROWING
 * (`flex-1 min-h-full` on the wrapper), never by nesting another scroller.
 *
 * The nav owns its own open/closed state rather than taking it from a context. A
 * shell that requires a provider is a shell you have to wire up before you can
 * see it work.
 */
export default function AppShell({
  sidebar,
  brand,
  actions,
  sidebarPosition = 'left',
  sidebarWidth = 'w-64',
  children,
}: {
  /** Navigation content. Scrolls independently of the page. */
  sidebar: React.ReactNode;
  /** Logo or product name. */
  brand?: React.ReactNode;
  /** Top-right: search, theme toggle, account menu. */
  actions?: React.ReactNode;
  /**
   * Where the navigation sits.
   *
   * `left` and `right` are a vertical rail, and collapse to an off-canvas drawer
   * on small screens. `top` and `bottom` are a horizontal bar and stay in flow
   * at every width, scrolling sideways instead — a bar that is already one row
   * tall has nothing to gain from being hidden behind a button. Pass a
   * horizontal `NavMenu` for those.
   */
  sidebarPosition?: SidebarPosition;
  /** Applies to `left` and `right` only; a horizontal bar sizes to its content. */
  sidebarWidth?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isVertical = sidebarPosition === 'left' || sidebarPosition === 'right';

  // Close the drawer on Escape. Without it the only way out is the backdrop,
  // which is not reachable from a keyboard.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  /* ---------------------------------------------------- horizontal bar --- */

  if (!isVertical) {
    // With the nav on top it absorbs the header — brand, nav and actions in one
    // row. Two stacked bars would be two rows of chrome saying the same thing.
    // With it on the bottom the header stays where a header belongs.
    const bar = (
      <div
        className={cn(
          'flex shrink-0 items-center gap-4 border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-950',
          sidebarPosition === 'top' ? 'h-14 border-b' : 'h-14 border-t',
        )}
      >
        {sidebarPosition === 'top' && brand}
        <div className="custom-scrollbar min-w-0 flex-1 overflow-x-auto">{sidebar}</div>
        {sidebarPosition === 'top' && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    );

    return (
      <div className="flex h-screen flex-col overflow-hidden bg-white dark:bg-slate-950">
        {sidebarPosition === 'top' && bar}

        {sidebarPosition === 'bottom' && (
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
            {brand}
            <div className="ml-auto flex items-center gap-2">{actions}</div>
          </header>
        )}

        <main className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-auto">
          <div className="mx-auto flex min-h-full w-full min-w-0 max-w-6xl flex-1 flex-col px-6 py-8">
            {children}
          </div>
        </main>

        {sidebarPosition === 'bottom' && bar}
      </div>
    );
  }

  /* ------------------------------------------------------ vertical rail --- */

  const onLeft = sidebarPosition === 'left';

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-950">
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 z-50 flex shrink-0 flex-col bg-white',
          'dark:bg-slate-950',
          'transition-transform duration-200 lg:static lg:translate-x-0',
          // The drawer slides in from the edge it belongs to, and the border
          // faces the content — a right-hand rail with a right-hand border
          // draws a line against the window frame.
          onLeft ? 'left-0 border-r border-slate-200 dark:border-slate-800' : 'right-0 order-last border-l border-slate-200 dark:border-slate-800',
          open ? 'translate-x-0' : onLeft ? '-translate-x-full' : 'translate-x-full',
          sidebarWidth,
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-4 dark:border-slate-800">
          {brand}
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-4">{sidebar}</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className={cn('rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800', !onLeft && 'order-last')}
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className={cn('flex items-center gap-2', onLeft ? 'ml-auto' : 'mr-auto')}>{actions}</div>
        </header>

        <main className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-auto">
          {/* `flex-1` fills when the page is short; `min-h-full` keeps it filled
              once main is scrolling, where `flex-1` alone collapses back to
              content height. `min-w-0` lets a wide table shrink instead of
              forcing the column past the viewport. */}
          <div className="mx-auto flex min-h-full w-full min-w-0 max-w-6xl flex-1 flex-col px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
