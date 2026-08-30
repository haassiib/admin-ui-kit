/**
 * Example METADATA — id, title and description, per component.
 *
 * Plain data, in its own module, because the preview route is a SERVER component
 * and a `'use client'` module reaches it as an opaque reference rather than as
 * the object: reading this list from `examples.tsx` silently yielded
 * `undefined`, and every example after the first lost its code panel. The demo
 * components live in `examples.tsx`; the two are joined by id.
 *
 * An id is also the anchor for the on-this-page nav and half of the convention
 * that locates an example's source (`Splitter` + `min-max` -> `SplitterMinMax`),
 * so it must be unique within a component and stable across edits.
 */

export type ExampleMeta = { id: string; title: string; description?: string };

export const EXAMPLE_META: Record<string, ExampleMeta[]> = {
  'drawer': [
      { id: 'basic', title: 'Basic', description: 'A full-height panel on the right, over a dimmed backdrop. Drag its left edge to resize; Escape, the backdrop and the close button all dismiss it.' },
      { id: 'anchored', title: 'Anchored to an element', description: '`anchorRef` fits the panel to an element instead of the viewport — the card whose content it belongs to. Point it at the CARD, never at the button that opens it: it mirrors the element\'s top, height and right edge, so a 28px button yields a 28px drawer.' },
      { id: 'options', title: 'Options', description: '`headerActions` puts a panel-level control in the title bar and `maxWidth` caps the drag. Turning the backdrop off makes the panel non-modal: the page behind stays readable and clickable, so click-outside stops closing — a click outside is now a click on something.' },
  ],
  'combined-filter-dropdown': [
      { id: 'chips', title: 'Chips', description: 'The default. One removable chip per selected option, measured to fit on a single line with a "+N more" popover for the overflow. Selections are seeded here — with nothing picked, every display mode looks the same.' },
      { id: 'summary', title: 'Summary', description: 'One fixed-height line stating what the data is scoped to ("Europe · 2 teams"), which opens a popover holding the same removable chips. The height never changes with the selection, so a crowded toolbar cannot reflow.' },
      { id: 'empty', title: 'Nothing selected', description: 'With an empty selection both modes collapse to just the trigger — there is no chip row or summary line to show.' },
  ],
  'layout': [
      { id: 'positions', title: 'Navigation position', description: 'Left and right are a vertical rail that collapses to an off-canvas drawer on small screens, with the border, the drawer and the header controls all flipping together. Top and bottom are a horizontal bar that stays in flow at every width — and `top` absorbs the header, because two stacked bars are two rows of chrome saying the same thing.' },
  ],
  'nav-menu': [
      { id: 'vertical', title: 'Vertical', description: 'The default: text links under uppercase section headings, active item on a filled pill.' },
      { id: 'horizontal', title: 'Horizontal', description: 'For a top or bottom bar. Headings become inline group labels, groups get dividers, and the active item is underlined — a pill in a one-row bar reads as a button rather than as position.' },
      { id: 'filtering', title: 'Filtering', description: 'Either the menu owns the field (`filterable`) or you do (`filter`) — with the second the menu renders no input and takes the query from wherever you put it, which is how the header search in this gallery drives the sidebar. Sections with no matches drop out rather than leaving orphaned headings.' },
  ],
  'splitter': [
      { id: 'basic', title: 'Basic', description: 'Two panes with a draggable divider, horizontal or vertical. Drag it, or focus it and use the arrow keys — hold Shift for a bigger step.' },
      { id: 'sizing', title: 'Sizing', description: '`initial` is the first pane as a percentage of the container, so the split survives a window resize; `min` and `max` clamp the drag so neither pane can be collapsed out of existence. `onResize` fires throughout, for persisting the layout or reflowing a chart.' },
      { id: 'nested', title: 'Nested', description: 'Splitters nest in either direction — the second pane here is a vertical splitter containing another horizontal one.' },
  ],
  'button': [
      { id: 'variants', title: 'Variants', description: 'Four intents. `danger` is for irreversible actions only, so it keeps its signal.' },
      { id: 'sizes', title: 'Sizes', description: 'Three sizes sharing one type scale.' },
      { id: 'loading', title: 'Loading and disabled', description: '`loading` also disables the button — a spinner on a still-clickable control is how you get two submits.' },
  ],
  'badge': [
      { id: 'tones', title: 'Tones', description: 'Five tones, all readable in both colour schemes.' },
      { id: 'dot', title: 'With a state dot', description: '`dot` prefixes a filled circle, for a state rather than a count.' },
  ],
  'alert': [
      { id: 'tones', title: 'Tones', description: 'Four severities. `danger` renders with `role="alert"`; the rest use `role="status"`.' },
      { id: 'dismissible', title: 'Dismissible', description: 'Pass `onDismiss` to add a close control. Without it the alert is permanent.' },
  ],
  'pagination': [
      { id: 'basic', title: 'Basic', description: 'Numbered page links with ellipsis gaps. `siblings` sets how many links show either side of the current page, `edges` pins links at each end, and turning gaps off lists every page — at which point `edges` means nothing. A gap that would hide exactly one page is replaced by that page: "1 … 3" costs the same width as "1 2 3" and tells you less.' },
      { id: 'variants', title: 'Placement and navigation', description: 'Three placements — a bordered bar under a table, a centred pill, or that pill fixed to the viewport — and two ways to move: numbered links, or a "page N of M" box that is better past a few hundred pages, where links stop being a map.' },
      { id: 'composed', title: 'Composed from parts', description: 'For a layout the props cannot express: Pagination.Root holds the state and First, Prev, Pages, Next, Last and Report read it from context, so you can arrange them in any order with your own content between. Both paths share one page-range helper and cannot disagree about where the gaps fall.' },
  ],
  'tooltip': [
      { id: 'placement', title: 'Placement', description: 'Four sides. The bubble flips automatically when the chosen side would overflow the viewport.' },
      { id: 'appearance', title: 'Appearance', description: '`variant="light"` for use on a dark surface, `wide` for longer copy, `multiline={false}` to keep a short label on one line.' },
      { id: 'info', title: 'InfoTooltip', description: 'The ⓘ affordance, for hint copy that would otherwise sit under a field.' },
  ],
  'progress': [
      { id: 'basic', title: 'Basic', description: 'Four tones, with an optional label and value.' },
      { id: 'clamped', title: 'Clamped', description: 'Values are clamped to the track. A percentage computed from live counts goes over 100 more often than expected, and an overflowing bar paints outside its own box.' },
  ],
  'data-table': [
      { id: 'basic', title: 'Basic', description: 'Columns are data. Give one a `sortValue` and its header sorts — ascending, descending, unsorted. Sorting is local until you pass `sort` yourself, at which point the table leaves it to you, which is what a server-sorted table needs.' },
      { id: 'full', title: 'Every feature', description: 'Search, selection with bulk actions, a pinned row, pinned columns both sides, resizable columns, the column-visibility menu, striped rows, header and footer bars, and paging — in one table, because they are meant to be used together and each alone is a screenshot rather than a demonstration. The Source tab shows which prop does what.' },
      { id: 'states', title: 'Loading and empty', description: 'Skeleton rows keep the header and column widths so the table does not jump when data arrives; with no rows at all it renders its empty state instead of a bare header.' },
  ],
};
