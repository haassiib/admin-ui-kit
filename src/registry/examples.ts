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
  'bar-chart': [
      { id: 'grouped', title: 'Grouped', description: 'Plans side by side in each month: compare the series WITHIN a category. Bars are capped at 24px so the band keeps air between groups.' },
      { id: 'stacked', title: 'Stacked', description: '`stacked` makes one bar per month split by plan — the total is the story and the parts are its make-up. Only the top segment is rounded, and a 2px gap in the card colour separates the segments.' },
      { id: 'horizontal', title: 'Horizontal', description: '`horizontal` lays bars left to right, for long category names a column chart would have to rotate or truncate. The height grows with the row count.' },
  ],
  'line-chart': [
      { id: 'multi', title: 'Several series', description: 'Four regions on one axis. One tooltip lists every region at the hovered week, so the pointer never has to land on a line.' },
      { id: 'emphasis', title: 'Emphasis', description: '`emphasis` draws one series in colour and the rest in grey — when one line is the point, colouring all four buries it.' },
  ],
  'base-grid': [
      { id: 'basic', title: 'Basic, editable', description: 'Every control off, so the view bar is worth trying: Fields to search, show, hide and reorder columns, then Filter, Group, Sort and Colour. Drag a header to move it; dropping it into the frozen block at the left freezes it, and the header menu freezes up to any column. Drag a header\'s right edge to resize it, double-click the edge to reset. Hover a row number to pin that row to the top or open it as a record, a drawer with every field editable. Click a cell to edit it — an input for text, numbers and dates, the list for a select, a toggle for a checkbox — or select it with the arrow keys and type; `editOn="doubleClick"` makes a click only select. Every column here has a `set`, and the example keeps the rows in state through `onRowChange`. The `+` at the end of the header adds a field of any type — text, number, currency, date, checkbox, single or multi select, person, URL, email — and a column menu\'s "Edit field" reopens the same form; both come back through `onFieldAdd` / `onFieldChange`, and `columnFromField` turns the definition into a column. A `select` column sorts and groups by its OPTION ORDER, so bands appear in the order the options were defined rather than alphabetically.' },
      { id: 'preset', title: 'A saved view', description: 'The view is CONTROLLED here — filter, groups, sorts and colour rules arrive as one object and every change comes back through `onViewChange`, which is what a caller persists or keys to a URL. Grouped two deep with the Owner column hidden, a row tint on urgent work and a cell tint on the status column. Editing a cell re-sorts and re-groups the row live.' },
      { id: 'record', title: 'Opening a record', description: '`onRowOpen` hands back the row and the rect of the control that was clicked. The example answers with an `AnchoredPanel` form beside the row, and that form opens a second panel beside itself to manage the status options — a dialog inside a dialog, with placement that avoids the first and an Escape that closes only the topmost.' },
  ],
  'anchored-panel': [
      { id: 'nested', title: 'A form that opens a form', description: 'The first panel hangs off the button; the second is anchored with `closestPanelRect`, so it measures the OUTER panel\'s real edges rather than the inset button and lands beside it instead of on top of it. Click outside both to close both; Escape closes only the topmost; a click in the first while the second is open closes neither.' },
      { id: 'placement', title: 'Beside or below', description: '`beside` sits right of the anchor and top-aligned, falling back to the left — a form hanging off a panel. `below` sits under the anchor like a dropdown with left edges aligned, falling back to right edges — a form opened from a column header, which should read as belonging to that column.' },
  ],
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
      { id: 'variants', title: 'Placement and navigation', description: 'Three placements — a bordered bar under a table, a centred pill, or that pill fixed to the viewport — and two ways to move: numbered links, or a "page N of M" box that is better past a few hundred pages, where links stop being a map. `pageSizes` sets the rows-per-page choices, and `reportTemplate` rewrites the range line from `{first}`, `{last}`, `{total}`, `{page}` and `{totalPages}` — the PrimeReact paginator\'s "current page report".' },
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
  'carousel': [
      { id: 'layout', title: 'Per page, alignment, orientation', description: '`numVisible` may be fractional — `1.5` shows a slide and half the next, a peek that says the strip goes on. `align="center"` puts the current slide in the middle with neighbours peeking either side, and both ends still sit flush, so there is never a gap before the first slide or after the last. `orientation="vertical"` swaps the arrows for up and down. `circular` wraps from the last page to the first, and autoplay (which implies wrapping) pauses on hover, on focus, under reduced motion, and with its own pause button. Partly visible slides are inert, so Tab only lands on what is fully in view.' },
      { id: 'variable', title: 'Variable size, dynamic', description: '`autoSize` lets each slide keep the width its template gives it, and the steps are measured from the rendered slides — here two cards per step, whatever their widths, with the last step flush with the end. Adding or removing cards recalculates the stops; the page is clamped to the last one at render, so removing from the end never shows an empty strip. Pass `itemKey` when items come and go, so each card keeps its own state.' },
      { id: 'gallery', title: 'Synced thumbnails', description: 'Two carousels sharing one controlled `page`: the main strip shows one photo per page, and the thumbnail strip below follows it, keeping the active thumbnail in view. The thumbnails have no arrows of their own, so they never drift from the photo they track; click one, use the main arrows or swipe the photo to move both.' },
  ],
};
