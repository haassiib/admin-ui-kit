'use client';

import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import Avatar from '@/components/layout/Avatar';

// The accent stripe along each card's top edge, in the kit's five semantic tones.
const TONE = {
  neutral: 'border-t-slate-300 dark:border-t-slate-600',
  info: 'border-t-indigo-500 dark:border-t-indigo-400',
  success: 'border-t-emerald-500 dark:border-t-emerald-400',
  warning: 'border-t-amber-500 dark:border-t-amber-400',
  danger: 'border-t-rose-500 dark:border-t-rose-400',
} as const;

export type OrgChartTone = keyof typeof TONE;

export interface OrgChartNode {
  /** Unique across the whole chart. */
  key: string;
  label: string;
  /** Second line under the label — a role or a department. */
  title?: string;
  /** An image URL, or up to two initials drawn in `Avatar`'s circle. */
  avatar?: string;
  tone?: OrgChartTone;
  children?: OrgChartNode[];
}

export interface OrganizationChartProps {
  /** Usually one root; several draw side by side with no connector between them. */
  nodes: OrgChartNode[];
  /** Makes cards pressable. Selection is single; pressing the selected card again clears it. */
  selectable?: boolean;
  value?: string | null;
  onChange?: (key: string | null, node: OrgChartNode | null) => void;
  /** Controlled collapse; pair with `onToggle`. */
  collapsedKeys?: string[];
  defaultCollapsedKeys?: string[];
  onToggle?: (collapsedKeys: string[]) => void;
  /** Replaces the card's contents. The card shell — focus, selection ring, connectors — is kept. */
  nodeTemplate?: (node: OrgChartNode) => ReactNode;
  'aria-label'?: string;
  className?: string;
}

// Anything with a slash or a scheme is a URL; a bare "AK" is initials.
const isUrl = (s: string) => /[/:]/.test(s);

const LINE = 'bg-slate-300 dark:bg-slate-600';

/**
 * A top-down chart of cards joined by connector lines.
 *
 * The connectors are plain flex boxes, not SVG or canvas: each child cell
 * draws the left and right HALVES of the horizontal bar above it (the first
 * child omits its left half, the last its right), plus a short drop to its
 * card. Adjacent cells meet, so the bar is continuous and always spans
 * exactly first-child-centre to last-child-centre, at any width, with nothing
 * to measure or re-lay-out on resize.
 *
 * The markup is nested `<ul>`/`<li>`, so a screen reader hears the reporting
 * lines as list nesting. Arrow keys walk the same structure: Down to the first
 * report, Up to the manager, Left/Right between peers.
 */
export default function OrganizationChart({
  nodes,
  selectable = false,
  value,
  onChange,
  collapsedKeys,
  defaultCollapsedKeys,
  onToggle,
  nodeTemplate,
  'aria-label': ariaLabel = 'Organization chart',
  className,
}: OrganizationChartProps) {
  const [innerCollapsed, setInnerCollapsed] = useState<string[]>(defaultCollapsedKeys ?? []);
  const [innerValue, setInnerValue] = useState<string | null>(null);
  const cardRefs = useRef(new Map<string, HTMLDivElement>());

  const collapsed = useMemo(() => new Set(collapsedKeys ?? innerCollapsed), [collapsedKeys, innerCollapsed]);
  const selected = value !== undefined ? value : innerValue;

  // Parent and siblings per key, for arrow-key moves across the structure.
  const index = useMemo(() => {
    const map = new Map<string, { node: OrgChartNode; parent: string | null; siblings: OrgChartNode[] }>();
    const walk = (ns: OrgChartNode[], parent: string | null) =>
      ns.forEach((n) => {
        map.set(n.key, { node: n, parent, siblings: ns });
        if (n.children) walk(n.children, n.key);
      });
    walk(nodes, null);
    return map;
  }, [nodes]);

  const toggleCollapse = (key: string) => {
    const next = new Set(collapsed);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    const list = [...next];
    if (collapsedKeys === undefined) setInnerCollapsed(list);
    onToggle?.(list);
  };

  const toggleSelect = (n: OrgChartNode) => {
    if (!selectable) return;
    const next = selected === n.key ? null : n.key;
    if (value === undefined) setInnerValue(next);
    onChange?.(next, next ? n : null);
  };

  const onCardKey = (e: KeyboardEvent<HTMLDivElement>, n: OrgChartNode) => {
    // Keys from inside a `nodeTemplate` (a link, a button) bubble up here;
    // they belong to that control, not to card navigation.
    if (e.target !== e.currentTarget) return;
    const entry = index.get(n.key)!;
    const at = entry.siblings.indexOf(n);
    let target: string | undefined;
    switch (e.key) {
      case 'Enter':
      case ' ':
        if (!selectable) return;
        toggleSelect(n);
        break;
      case 'ArrowDown':
        target = !collapsed.has(n.key) ? n.children?.[0]?.key : undefined;
        break;
      case 'ArrowUp':
        target = entry.parent ?? undefined;
        break;
      case 'ArrowLeft':
        target = entry.siblings[at - 1]?.key;
        break;
      case 'ArrowRight':
        target = entry.siblings[at + 1]?.key;
        break;
      default:
        return;
    }
    e.preventDefault();
    if (target) {
      // `inline: 'nearest'` scrolls the chart's own box sideways to reveal a
      // peer that was off-screen, rather than leaving focus somewhere unseen.
      const el = cardRefs.current.get(target);
      el?.focus({ preventScroll: true });
      el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  };

  const renderCard = (n: OrgChartNode) => {
    const isSelected = selectable && selected === n.key;
    return (
      <div
        ref={(el) => {
          if (el) cardRefs.current.set(n.key, el);
          else cardRefs.current.delete(n.key);
        }}
        tabIndex={0}
        role={selectable ? 'button' : undefined}
        aria-pressed={selectable ? isSelected : undefined}
        aria-label={nodeTemplate ? n.label : undefined}
        onClick={() => toggleSelect(n)}
        onKeyDown={(e) => onCardKey(e, n)}
        className={cn(
          'panel panel-solid relative min-w-36 max-w-52 border-t-[3px] px-3 py-2.5 text-left outline-none transition-shadow',
          TONE[n.tone ?? 'neutral'],
          selectable && 'cursor-pointer',
          // Selection is a solid ring with an offset; focus a lighter one
          // without. Both can show at once and still read as two things.
          isSelected
            ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-indigo-400 dark:ring-offset-slate-900'
            : 'focus-visible:ring-2 focus-visible:ring-indigo-400',
        )}
      >
        {nodeTemplate ? (
          nodeTemplate(n)
        ) : (
          <div className="flex items-center gap-2">
            {n.avatar &&
              (isUrl(n.avatar) ? (
                <Avatar name={n.label} email={n.label} avatarUrl={n.avatar} size="md" />
              ) : (
                <Avatar name={n.avatar} email={n.label} size="md" />
              ))}
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{n.label}</p>
              {n.title && <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{n.title}</p>}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSubtree = (n: OrgChartNode): ReactNode => {
    const kids = n.children ?? [];
    const open = kids.length > 0 && !collapsed.has(n.key);
    return (
      <div className="flex flex-col items-center">
        {renderCard(n)}
        {kids.length > 0 && (
          <>
            <span aria-hidden className={cn('h-2.5 w-px', LINE)} />
            <button
              type="button"
              onClick={() => toggleCollapse(n.key)}
              aria-expanded={open}
              aria-label={`${open ? 'Collapse' : 'Expand'} ${n.label} (${kids.length} ${kids.length === 1 ? 'report' : 'reports'})`}
              className="inline-flex h-4 min-w-4 items-center justify-center gap-0.5 rounded-full border border-slate-300 bg-white px-1 text-[10px] font-semibold leading-none text-slate-500 transition-colors hover:border-indigo-400 hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-indigo-400 dark:hover:text-indigo-300"
            >
              {open ? (
                <Minus aria-hidden className="h-2.5 w-2.5" strokeWidth={3} />
              ) : (
                <>
                  <Plus aria-hidden className="h-2.5 w-2.5" strokeWidth={3} />
                  {kids.length}
                </>
              )}
            </button>
          </>
        )}
        {open && (
          <>
            <span aria-hidden className={cn('h-2.5 w-px', LINE)} />
            <ul className="flex">
              {kids.map((c, i) => (
                <li key={c.key} className="relative flex flex-col items-center px-2 pt-4">
                  {i > 0 && <span aria-hidden className={cn('absolute left-0 right-1/2 top-0 h-px', LINE)} />}
                  {i < kids.length - 1 && <span aria-hidden className={cn('absolute left-1/2 right-0 top-0 h-px', LINE)} />}
                  <span aria-hidden className={cn('absolute left-1/2 top-0 h-4 w-px', LINE)} />
                  {renderSubtree(c)}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    );
  };

  return (
    // Its OWN horizontal scroller, which the kit otherwise avoids because an
    // `overflow-x-auto` box clips any popover opened inside it. Nothing in a
    // chart opens one — a card is a card, the badge toggles in place — so the
    // usual cost does not apply, and a wide chart scrolling the whole page
    // sideways would be worse. A `nodeTemplate` that adds a dropdown should
    // portal it.
    //
    // `w-max min-w-full` + `justify-center` centres a narrow chart and lets a
    // wide one start at the left edge. Centring on the scroller itself would
    // push a wide chart's left half to negative scroll, where it cannot be reached.
    <div className={cn('overflow-x-auto scrollbar-thin', className)}>
      <ul aria-label={ariaLabel} className="flex w-max min-w-full justify-center gap-8 p-3">
        {nodes.map((n) => (
          <li key={n.key}>{renderSubtree(n)}</li>
        ))}
      </ul>
    </div>
  );
}
