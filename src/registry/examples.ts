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
  'combined-filter-dropdown': [
      { id: 'chips', title: 'Chips', description: 'The default. One removable chip per selected option, measured to fit on a single line with a "+N more" popover for the overflow. Selections are seeded here — with nothing picked, every display mode looks the same.' },
      { id: 'summary', title: 'Summary', description: 'One fixed-height line stating what the data is scoped to ("Europe · 2 teams"), which opens a popover holding the same removable chips. The height never changes with the selection, so a crowded toolbar cannot reflow.' },
      { id: 'empty', title: 'Nothing selected', description: 'With an empty selection both modes collapse to just the trigger — there is no chip row or summary line to show.' },
  ],
  'app-shell': [
      { id: 'left', title: 'Left', description: 'The default. A vertical rail beside the content, collapsing to an off-canvas drawer below the lg breakpoint.' },
      { id: 'right', title: 'Right', description: 'The same rail on the other edge — the border and the drawer both flip, and the header controls swap sides with them.' },
      { id: 'top', title: 'Top', description: 'A horizontal bar that absorbs the header: brand, navigation and actions share one row rather than stacking two rows of chrome.' },
      { id: 'bottom', title: 'Bottom', description: 'Navigation pinned to the foot of the window, with the header left where a header belongs. Common on touch layouts.' },
  ],
  'nav-menu': [
      { id: 'vertical', title: 'Vertical', description: 'The default: text links under uppercase section headings, active item on a filled pill.' },
      { id: 'horizontal', title: 'Horizontal', description: 'For a top or bottom bar. Headings become inline group labels, groups get dividers, and the active item is underlined — a pill in a one-row bar reads as a button rather than as position.' },
      { id: 'filterable', title: 'Filterable', description: 'Adds a filter above the sections and drops any section left with no matches. Worth it past roughly twenty items.' },
  ],
  'splitter': [
      { id: 'basic', title: 'Basic', description: 'Two panes with a draggable divider. Drag it, or focus it and use the arrow keys — hold Shift for a bigger step.' },
      { id: 'vertical', title: 'Vertical', description: 'Set `direction="vertical"` to split top and bottom instead of left and right.' },
      { id: 'size', title: 'Size', description: '`initial` is the first pane\'s size as a percentage of the container, so the split survives a window resize instead of drifting.' },
      { id: 'min-max', title: 'Min and max size', description: '`min` and `max` clamp the drag so neither pane can be collapsed out of existence.' },
      { id: 'nested', title: 'Nested', description: 'Splitters nest in either direction — the second pane here is itself a vertical splitter containing another horizontal one.' },
      { id: 'resize-events', title: 'Resize events', description: '`onResize` fires with the new percentage throughout the drag, for persisting the layout or reflowing a chart.' },
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
      { id: 'bar', title: 'Bar', description: 'The default — a full-width strip with a top border, for sitting under a table.' },
      { id: 'pill', title: 'Pill', description: 'A centred rounded pill, in flow below the table.' },
      { id: 'floating', title: 'Floating', description: 'The same pill, fixed to the bottom of the viewport. Look at the foot of the window.' },
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
      { id: 'basic', title: 'Basic', description: 'Columns are data. Give a column a `sortValue` to make it sortable; omit it to leave the column static.' },
      { id: 'selection', title: 'Selection', description: '`selectable` adds the checkbox column. Select-all applies to the current page only.' },
      { id: 'empty', title: 'Empty', description: 'With no rows the table renders its empty state instead of a bare header.' },
  ],
};
