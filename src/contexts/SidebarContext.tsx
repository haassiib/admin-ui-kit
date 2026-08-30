'use client';

/**
 * Sidebar state: collapsed (desktop), open (mobile off-canvas), and which
 * groups are expanded.
 *
 * `collapsed` is persisted — it's a workspace preference, not a per-page one.
 * `open` deliberately is NOT: a mobile drawer that reopens itself on the next
 * page load is a bug, not a feature.
 *
 * Group expansion is keyed by menu id rather than name, because two menus at
 * different depths may legitimately share a name.
 */

import { createContext, useContext, useEffect, useState } from 'react';

type SidebarContextValue = {
  collapsed: boolean;
  toggleCollapsed: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  expanded: ReadonlySet<number>;
  toggleExpanded: (menuId: number) => void;
  setExpanded: (ids: number[]) => void;
};

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const [expanded, setExpandedState] = useState<Set<number>>(new Set());

  useEffect(() => {
    setCollapsed(localStorage.getItem('ba.sidebarCollapsed') === 'true');
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      localStorage.setItem('ba.sidebarCollapsed', String(!prev));
      return !prev;
    });
  };

  const toggleExpanded = (menuId: number) =>
    setExpandedState((prev) => {
      const next = new Set(prev);
      if (next.has(menuId)) next.delete(menuId);
      else next.add(menuId);
      return next;
    });

  /** Used once on mount to open whichever group contains the current route. */
  const setExpanded = (ids: number[]) =>
    setExpandedState((prev) => new Set([...prev, ...ids]));

  return (
    <SidebarContext.Provider
      value={{ collapsed, toggleCollapsed, open, setOpen, expanded, toggleExpanded, setExpanded }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used inside a SidebarProvider');
  return ctx;
}
