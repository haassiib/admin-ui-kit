/** AI prompts — see `./index.ts` for what a prompt is for. */

export const OVERLAY_PROMPTS: Record<string, string> = {
  'modal': `Build a centred modal dialog component in React + TypeScript + Tailwind CSS.

## Look
- Portalled to <body> (a \`fixed\` element inside an ancestor with a transform or backdrop-filter is positioned against that ancestor, so the dialog would centre inside a card instead of the page).
- Overlay: \`fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm\`, fading in (opacity 0 → 1, 200ms ease-out).
- Dialog: \`relative flex w-full flex-col text-left\` on the opaque floating surface, capped by \`size\`: \`sm\` … \`7xl\` map to \`max-w-sm\` … \`max-w-7xl\` (default \`md\`). It opens with a scale-in: from \`opacity: 0; transform: scale(0.96) translateY(6px)\` to rest, 220ms \`cubic-bezier(0.34, 1.56, 0.64, 1)\` (a slight overshoot).
- Header: wrapper \`shrink-0 px-5 pt-5\` (the whole wrapper, padding included, is the drag handle), inner row \`flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-700 pb-3\`. Title: text-sm font-semibold leading-5 slate-800 / dark slate-100. Close: a 16px X, \`rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200\`.
- Body: \`min-h-0 flex-1 px-5 pb-5 pt-4\`. It becomes \`overflow-y-auto\` only once the user has dragged in a height. Until then it grows with its content, so a dropdown inside is never clipped by the dialog.
- Resize mark: a decorative 10px SVG in the bottom-right corner (\`absolute bottom-1 right-1 h-2.5 w-2.5 text-slate-300 dark:text-slate-600 pointer-events-none\`) with two short diagonal strokes (\`M9 3 3 9M9 6.5 6.5 9\`, stroke 1.2, round caps).

## Behaviour
- Controlled: renders nothing while \`isOpen\` is false.
- Escape and the close button call \`onClose\`. A click outside the dialog closes it ONLY with \`closeOnBackdrop\` (off by default: dialogs hold forms, and one stray click should not throw away what was typed).
- A portalled popover opened from inside the dialog (mark such surfaces with \`data-overlay="popover"\` / \`"picker"\`) is not "outside": a click in one does not close the dialog, and while one is open the dialog ignores Escape. One key closes one thing.
- Drag: pointer-down on the header (skip presses that land on buttons, links or fields) moves the dialog. Header gets \`cursor-move select-none touch-none\`. Apply the move as an offset through the CSS \`translate\` property, not \`transform\`, so it composes with the open animation and flex centring still does the layout. Clamp so no edge leaves the viewport. Double-clicking the header puts it back.
- Resize from any edge or corner: invisible grips inside the border. Edges are 6px strips inset 12px from the corners, corners are 12px squares on top of them, with ns/ew/nwse/nesw cursors and \`touch-none\`. Min 280×160, clamped to the viewport. The box is centred, so it grows both ways: dragging the right edge 40px widens it 40px and moves the offset 20px, which keeps the left edge still. Only the dragged axis gets an explicit size. A resized size is capped at \`calc(100vw - 1rem)\` × \`calc(100vh - 1rem)\`.
- Position and size reset on close, so it always reopens centred.

## API
- \`isOpen: boolean\`, \`onClose(): void\`, \`title: string\`, \`children\`
- \`size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'\` (default \`'md'\`)
- \`closeOnBackdrop?\` = false, \`draggable?\` = true, \`resizable?\` = true

## Accessibility
- \`role="dialog" aria-modal="true" aria-label={title}\`; close button \`aria-label="Close"\`; grips and the mark \`aria-hidden\`.

## Demo
An "Open modal" button opening "Invite a member" (md) with an Email field (placeholder "name@example.com") and a right-aligned ghost Cancel plus a primary "Send invite".`,

  'drawer': `Build a resizable right-hand slide-over drawer (edit panel) component in React + TypeScript + Tailwind CSS.

## Look
- Portalled to <body>. Wrapper \`fixed inset-0 z-[200]\`. With the backdrop it is \`bg-slate-900/40 backdrop-blur-sm\` and fades in (opacity 0 → 1, 200ms ease-out). Without it, it is \`pointer-events-none\`.
- Panel: \`fixed right-0 top-0 h-full flex flex-col bg-white dark:bg-slate-900\`, pixel width from state, \`border-l border-slate-200 dark:border-slate-800 shadow-2xl\`. It slides in from the right: \`translateX(100%)\` → \`0\`, 280ms \`cubic-bezier(0.32, 0.72, 0, 1)\`.
- Below 768px it is full width and has no resize handle.
- Anchored to an element (see \`anchorRef\`): all four edges show, so it gets \`border rounded-2xl overflow-hidden\` and NO shadow. It is part of the card, not floating above it.
- Resize handle: \`absolute left-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-indigo-500/30\`.
- Header: \`h-16 shrink-0 flex items-center justify-between gap-3 px-5 border-b border-slate-200 dark:border-slate-800\`, one fixed height for every drawer so it lines up with a 4rem app top bar. Left (\`min-w-0\`): title text-sm font-bold leading-4 slate-800 / dark slate-100, truncating; optional subtitle 11px slate-500 / dark slate-400, truncating. Right: \`flex items-center gap-3\` with \`headerActions\`, then the close button: a 16px box holding a 14px X, slate-400, hover slate-600 (dark hover slate-200).
- Body: \`flex flex-1 flex-col overflow-y-auto px-5 py-4\`. It is a flex column so a child can use \`flex-1 min-h-0\` to fill what is left.
- Footer (optional): \`shrink-0 px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2\`.

## Behaviour
- Controlled \`open\`; renders nothing while closed.
- \`initialWidth\` is pixels, or a FRACTION of the viewport when ≤ 1 (\`0.5\` = half). Resolve it each time the drawer opens (it needs \`window\`, so not during SSR, and a fraction follows a window resized since the last use).
- Resize: mousedown on the handle sets \`document.body.style.cursor = 'col-resize'\`. While dragging, width = \`innerWidth - clientX\`, accepted only when it is > 360 and < \`innerWidth × maxWidth\`. Mouseup restores the cursor.
- Escape closes. Listen only while open, and skip it while a popover or picker opened inside the drawer (\`[data-overlay="popover"]\` / \`"picker"\`) is present: that one takes the key. The X closes. With the backdrop, a click on it closes; clicks inside the panel stop propagation.
- \`backdrop={false}\` makes the drawer non-modal: \`aria-modal="false"\`, the wrapper lets clicks through (the panel alone is \`pointer-events-auto\`), and click-outside no longer closes, because a click outside is now a click ON something. Escape and the X still work.
- \`anchorRef\`: fit the panel to an element (the CARD, not the button that opens it). Keep it \`fixed\`, since the card clips overflow. Measure the element's rect and mirror \`top\`, \`height\` and \`right = innerWidth - rect.right\`. Re-measure on a ResizeObserver, on window resize, and on window scroll in the CAPTURE phase (a scroll inside the page's own scroller does not bubble).

## API
- \`open\`, \`onClose\`, \`title: string\`, \`subtitle?\`, \`children\`, \`footer?: ReactNode\`
- \`initialWidth?\` = 460, \`maxWidth?\` = 0.9 (fraction of the viewport), \`backdrop?\` = true
- \`anchorRef?: RefObject<HTMLElement | null>\`, \`headerActions?: ReactNode\`

## Accessibility
- Panel \`role="dialog" aria-modal={backdrop} aria-label={title}\`; close \`aria-label="Close"\`.

## Demo
An "Open drawer" button opening "Request REQ-4471" with subtitle "Engineering · submitted 08:02", \`maxWidth={0.6}\`, a small ghost "Refresh" button (RefreshCw icon) in \`headerActions\`, a footer with Cancel / Approve, and a body line "Drag the left edge to resize."`,

  'tooltip': `Build a portalled tooltip component (plus an ⓘ InfoTooltip) in React + TypeScript + Tailwind CSS.

## Look
- Trigger wrapper: an \`inline-flex\` span around \`children\`.
- Bubble: \`fixed z-[200] pointer-events-none w-max rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed shadow-lg text-left font-normal normal-case tracking-normal\`. No arrow, no animation.
- Wrapping is on by default: \`whitespace-normal max-w-[16rem]\` (\`wide\`: \`max-w-[28rem]\`). \`multiline={false}\` uses \`whitespace-nowrap\`.
- \`variant="dark"\` (default): \`bg-slate-900 dark:bg-slate-700 text-white\`. \`variant="light"\`, for use on a dark surface: \`bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100\`.
- \`pointer-events-none\` is deliberate: a hoverable bubble traps the pointer and flickers against its own trigger.

## Positioning
- Portalled to <body>, \`position: fixed\`, from the trigger's viewport rect with an 8px gap. The bubble is never measured: an anchor point plus a transform places it.
  - top: \`left = centreX\`, \`top = rect.top - 8\`, \`translate(-50%, -100%)\`; bottom: \`top = rect.bottom + 8\`, \`translate(-50%, 0)\`.
  - left: \`top = centreY\`, \`left = rect.left - 8\`, \`translate(-100%, -50%)\`; right: \`left = rect.right + 8\`, \`translate(0, -50%)\`.
- Flip: \`top\` becomes \`bottom\` when \`rect.top < 96\`; \`bottom\` becomes \`top\` when fewer than 96px remain below. Left and right never flip.
- For top/bottom, clamp the centre x to \`[8 + 128, vw - 8 - 128]\` (half the 256px max width), so a hint on the last column cannot run off-screen. If the viewport is too narrow for the clamp, centre in the viewport.
- While open, re-place on resize and on scroll (capture phase, so scrolling a table shell counts).

## Behaviour
- Opens on hover AND on focus, tracked as two separate flags: moving the mouse away does not close a bubble the keyboard still holds open.
- Escape on the trigger dismisses it until the next hover or focus.
- Null or empty \`content\` never opens.

## API
- \`content: ReactNode\`, \`children\` (the trigger; must be focusable to be keyboard-reachable)
- \`placement?: 'top' | 'bottom' | 'left' | 'right'\` = \`'top'\`, \`variant?: 'dark' | 'light'\` = \`'dark'\`, \`wide?\` = false, \`multiline?\` = true, \`className?\` (on the wrapper)
- Named export \`InfoTooltip\` (\`content\`, \`label\` = "More information", \`placement\`, \`variant\`, \`wide\`, \`className\`, \`iconClassName\`): a tooltip (wrapper \`align-middle\`) around a button holding a 14px lucide \`Info\` icon, \`rounded text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-400\`. Its click calls \`preventDefault\` and \`stopPropagation\`, because these sit inside <label>s and click-to-edit rows.

## Accessibility
- Bubble \`role="tooltip"\` with a \`useId\` id. Clone the trigger element to add \`aria-describedby={id}\` only while the bubble is open. InfoTooltip's button gets \`aria-label={label}\`.

## Demo
Four "Hover" buttons placed top, bottom, left and right, then a row with: light ("Pale bubble, dark text"), wide ("Margin = (revenue − cost) / revenue × 100, computed per team and then averaged across the selection."), one line ("Never wraps"), and an InfoTooltip ("Shown behind an ⓘ beside a label.").`,

  'confirm-popover': `Build an inline confirm popover component, anchored to its trigger, in React + TypeScript + Tailwind CSS.

## Look
- Trigger: root \`relative inline-flex\` around a span \`inline-flex w-full items-center justify-center cursor-pointer\` holding \`children\`. Use flex, not inline-block, so an icon-button trigger lines up with its flex-centred neighbours instead of sitting on a text baseline.
- Panel: portalled to <body>, \`fixed z-[200]\`, 256px wide (\`w-64\`), \`p-3 text-left\`, on the frosted card surface.
- Content row \`flex items-start gap-2\`: a 16px lucide \`TriangleAlert\` (\`shrink-0 mt-0.5\`; rose-500 when destructive, indigo-500 otherwise); then the title (text-xs font-semibold slate-800 / dark slate-100) and the description (\`mt-0.5\` 11px slate-500 / dark slate-400).
- Buttons \`mt-3 flex justify-end gap-2\`: a ghost Cancel and a primary Confirm. Destructive Confirm is \`bg-rose-600 hover:bg-rose-700\`.

## Behaviour
- A click on the trigger toggles the panel.
- Placement: right-aligned to the trigger (\`left = rect.right - 256\`), clamped to \`[8, vw - 256 - 8]\`. Below the trigger with a 4px gap, unless that would pass \`innerHeight - 8\` (a Delete at the foot of a form); then it opens above (\`rect.top - 4 - height\`, min 8). Estimate the height at 120px on the first placement, then re-place on the next animation frame with the measured height, so the flip decision is real. Re-place on resize and on scroll (capture phase: triggers live inside table scrollers).
- Outside click: the panel is portalled, so both the trigger root AND the panel count as inside. Otherwise the click on Confirm would close the panel before Confirm runs.
- Confirm has \`autoFocus\`; it closes the panel, then calls \`onConfirm\`. Cancel only closes.
- Set \`data-overlay="popover"\` on the panel. A dialog or drawer containing the trigger then treats clicks in it as inside and leaves Escape to it.

## API
- \`onConfirm(): void\`, \`children\` (the trigger)
- \`title?\` = "Are you sure?", \`description?\` = "This cannot be undone.", \`confirmText?\` = "Confirm", \`cancelText?\` = "Cancel"
- \`variant?: 'destructive' | 'default'\` = \`'destructive'\`. \`default\` is for a confirm that is significant rather than irreversible (publish, release); a rose button would miscolour it.

## Accessibility
- Panel \`role="dialog" aria-modal="false" aria-label={title}\`.

## Demo
A small ghost "Remove" trigger in rose text ("Remove this member?" / "They lose access immediately." / Remove). Next to it, a default-variant "Publish" trigger ("Publish these changes?" / "Everyone in the workspace will see them." / Publish / "Not yet"), and a counter reading "confirmed N×".`,

  'anchored-panel': `Build an anchored dialog panel component in React + TypeScript + Tailwind CSS. It opens beside the thing it edits and can open another panel beside itself (a form that opens a form).

## Look
- Portalled to <body>, \`fixed z-[200] flex flex-col overflow-hidden\` on the opaque floating surface with \`shadow-2xl\` and no padding. Fades in (opacity 0 → 1, 200ms ease-out). Width = \`min(width, innerWidth - 16)\`.
- Header: \`min-h-[2.75rem] shrink-0 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 px-3 py-2\`. Title: text-xs font-semibold leading-4 slate-900 / dark slate-100, truncating. Optional subtitle: 11px slate-500 / dark slate-400, truncating. Then an optional \`titleHint\` slot (an ⓘ tooltip), then the close button: \`rounded p-1\`, 14px X, \`text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200\`.
- Body: \`min-h-0 flex-1 overflow-y-auto\`, with no padding (the caller pads). Footer: \`shrink-0 border-t border-slate-200 dark:border-slate-700 px-3 py-2\`. Only the body scrolls, so Save and close stay reachable.
- On a phone (\`max-width: 639px\`, read with matchMedia after mount to avoid a hydration mismatch) it becomes a bottom sheet: \`fixed inset-x-0 bottom-0 w-full max-h-[85vh] rounded-t-xl border-t border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800\`.

## Placement
- \`anchor\` is a viewport rect \`{ top, left, right, bottom }\` the caller measures on click (export \`anchorOf(el)\`). A null anchor centres the panel horizontally with its top at \`vh / 4\`.
- Horizontal candidates, tried in order:
  - \`beside\` (default): \`anchor.right + gap\`, then \`anchor.left - width - gap\`.
  - \`below\`: \`anchor.left\` (left edges aligned), then \`anchor.right - width\` (right edges aligned).
- A candidate fits when it is inside the window with an 8px margin AND horizontally clear of every other open panel or menu (\`[data-overlay="panel"]\`, \`[data-overlay="menu"]\`, excluding itself). Take the first that fits both, else the first inside the window, else \`vw - width - 8\`. A cascade therefore keeps going outward instead of flipping back over the panel the reader started from.
- Vertical: top-aligned to \`anchor.top\` (\`below\`: \`anchor.bottom + gap\`) and pushed up only as far as it must be to fit: \`y = clamp(wanted, 8, vh - height - 8)\`. Set \`maxHeight = vh - y - 8\` so the footer is never off-screen. Don't centre vertically: the panel would jump as its height changes.
- Place in a layout effect, before paint. Until then render at \`top/left: -9999\` (never 0,0, which flashes in the corner). Re-place on resize.
- Export \`closestPanelRect(node)\`: the rect of the nearest \`[data-overlay="panel"]\` ancestor (or the node itself). Anchor a child panel with it. Measuring the button inside the outer panel gives a box inset by that panel's padding, and every \`beside\` candidate would land on top of the outer panel.

## Behaviour
- The root carries \`data-overlay="panel"\`.
- Outside click: a mousedown whose \`composedPath()\` does not include this panel AND whose target is not inside any \`[data-overlay]\` element. A click in a child panel does not close its parent, a click in the parent does not close the child, and a click outside both closes both.
- Escape closes ONLY the topmost panel, which is the last \`[data-overlay="panel"]\` in the document (portals mount in opening order). An open \`[data-overlay="picker"]\` takes Escape first.

## API
- \`open\`, \`anchor: Anchor | null\`, \`onClose\`, \`title: string\`, \`subtitle?\`, \`titleHint?: ReactNode\`, \`footer?: ReactNode\`, \`children\`
- \`width?\` = 340, \`placement?: 'beside' | 'below'\` = \`'beside'\`, \`gap?\` = 8 (8 reads as two surfaces, 3 as a submenu)

## Accessibility
- \`role="dialog" aria-label={title}\`; close \`aria-label="Close"\`.

## Demo
An "Edit field" button opens the "Edit field" panel (subtitle "Status · single select"). It holds a Label input, option pills (To do, In progress, In review, Done), a "Manage options…" button, and a Cancel / Save footer. "Manage options…" opens a 300px "Options" panel ("4 choices") anchored with \`closestPanelRect\`. That panel lists the options with × remove buttons and has a "New option" input with an Add button.`,

  'notification-bell': `Build a header notification bell component (unread badge plus dropdown of notification cards) in React + TypeScript + Tailwind CSS.

## Look
- Root \`relative\`. Trigger: \`relative p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors\` around a 16px Bell. While open it keeps \`bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200\`.
- Badge (only when unread > 0): \`absolute -top-1 -right-1 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none tabular-nums\`, showing "99+" above 99.
- Dropdown: \`absolute right-0 mt-2 w-80 z-50 overflow-hidden p-0\` on the opaque floating surface.
- Header: \`p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between\`. Left: text-sm font-bold slate-800 / dark slate-100, \`flex items-center gap-2\`, with a 16px Bell in indigo-600 / dark indigo-400, "Notifications", and "{n} unread" in 10px font-normal slate-400 / dark slate-500. Right, when unread > 0: a "Mark all read" button with a 12px CheckCheck icon, \`text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-50\`.
- List: \`<ol class="max-h-96 overflow-y-auto p-4 space-y-3">\` of cards. Empty: \`p-6 text-xs text-center text-slate-400 dark:text-slate-500\` "Nothing yet. Releases, submissions and approvals land here."
- Footer, ALWAYS present (the dropdown only holds the latest few, so the way to the rest is a fixed part of it), outside the scroller: \`border-t p-2\` with a full-width link "See all notifications" plus a 12px ArrowRight, \`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800\`. Clicking it closes the dropdown.

## The card (build it in the same file)
- \`block w-full text-left p-3 border rounded-lg text-xs space-y-1 shadow-sm transition-colors\` plus a tint.
- Line 1 (\`flex justify-between gap-2 font-bold slate-800 / dark slate-100\`): a 14px Bell in the tint's icon colour, the event label (truncating), and on the right the relative time (10px font-normal slate-400 / dark slate-500, with \`title\` set to "YYYY-MM-DD HH:MM").
- Line 2 (11px leading-relaxed slate-600 / dark slate-400): the reference in \`font-mono font-semibold text-indigo-600 dark:text-indigo-400\`, then "by {actor}" or "by the system".
- Tints for UNREAD cards, by type: approved → \`bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900\` (icon emerald-600 / dark emerald-400); rejected or failed → the same in rose; needs a human → amber; \`request.*\` → indigo; other workflow events → violet. READ cards, and unknown types, are neutral: \`bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700\`, icon slate-400 / dark slate-500. Colour means "still wants attention".
- The label comes from a type → text map ("request.approved" → "Request approved"), falling back to the raw type. Relative time: "Just now", "12m ago", "3h ago", "2d ago", then the ISO date after 7 days.
- A card with somewhere to go is a link (\`hover:brightness-95 dark:hover:brightness-110\`). One without is a button whose only job is marking itself read, disabled once read or while an update is pending.

## Behaviour
- Toggle on click. Clicking a card closes the dropdown if the card links somewhere, and if the card is unread calls \`onMarkRead([eventId])\`. "Mark all read" calls \`onMarkAllRead()\`.
- Run both inside \`useTransition\`: while pending, the buttons are disabled. If the promise resolves \`{ error }\`, show an error toast, then refresh the data (e.g. \`router.refresh()\`). The \`unread\` count comes from the server; without the callbacks the bell is display-only.

## API
- \`items: HeaderNotification[]\`, where \`HeaderNotification = { eventId: number; type: string; createdAt: string; actor: string | null; ref: string | null; requestId: number | null; read: boolean }\`. The card links to the request list when \`requestId\` is set.
- \`unread: number\`
- \`onMarkRead?(ids: number[]): Promise<{ error?: string } | void>\`, \`onMarkAllRead?(): Promise<{ error?: string } | void>\`

## Accessibility
- Trigger: \`aria-label\` "Notifications, 2 unread" (or just "Notifications"), \`aria-expanded\`, \`title="Notifications"\`.

## Demo
A right-aligned bell with \`unread={2}\` and four items:
- REQ-4471, request.approved, by Grace Hopper, unread
- REQ-4470, request.submitted, by Alan Turing, unread
- REQ-4468, request.rejected, by Ada Lovelace, read
- BATCH-88, batch.released, by the system, read, with no request`,

  'notification-card': `Build a notification card row component in React + TypeScript + Tailwind CSS.

## Look
- Card: \`block w-full text-left p-3 border rounded-lg text-xs space-y-1 shadow-sm transition-colors\` plus a tint (below).
- Line 1: \`flex items-center justify-between gap-2 font-bold text-slate-800 dark:text-slate-100\`.
  - Left (\`flex items-center gap-1.5 min-w-0\`): a 14px lucide Bell in the tint's icon colour, then the event label, truncating.
  - Right: the relative time, \`text-[10px] font-normal text-slate-400 dark:text-slate-500 shrink-0\`, with a \`title\` of the exact "YYYY-MM-DD HH:MM".
- Line 2: \`text-[11px] leading-relaxed text-slate-600 dark:text-slate-400\`. First the reference, if any, in \`font-mono font-semibold text-indigo-600 dark:text-indigo-400\` followed by a space. Then "by {actor}", or "by the system" when the actor is null.
- Tint by event type, for UNREAD cards only:
  - approved → card \`bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900\`, icon \`text-emerald-600 dark:text-emerald-400\`
  - rejected or failed → the same recipe in rose
  - partial or needs a human → amber
  - \`request.*\` → indigo
  - other workflow events → violet
  - unknown → neutral
- A READ card is always neutral: \`bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700\`, icon \`text-slate-400 dark:text-slate-500\`. Colour is what marks a card as still wanting attention; keeping it after the read would make it decorative.

## Behaviour
- Label: a type → text map ("request.created" → "Request created", "request.approved" → "Request approved"). Fall back to the raw type string rather than hiding an unstyled event.
- Relative time from the ISO \`createdAt\`: under a minute "Just now", then "Nm ago", "Nh ago" and "Nd ago" up to 7 days, after that the date (YYYY-MM-DD).
- With \`href\`: a link (\`hover:brightness-95 dark:hover:brightness-110\`) with \`onClick={onActivate}\`. Navigation is never blocked, so \`disabled\` is ignored.
- Without \`href\`: a button whose only job is marking itself read. It is disabled when \`disabled\` is set or the item is already read (\`cursor-default\`, no hover effect): a control that looks pressable but does nothing is worse than a flat card.

## API
- \`item: HeaderNotification\`, where \`HeaderNotification = { eventId: number; type: string; createdAt: string; actor: string | null; ref: string | null; requestId: number | null; read: boolean }\` (exported)
- \`href?: string | null\`, \`onActivate?(): void\`, \`disabled?\` = false

## Demo
Three cards stacked in an opaque card with \`divide-y divide-slate-100 dark:divide-slate-800\`, each linking to "#":
- REQ-4471, request.approved, by Grace Hopper, unread
- REQ-4470, request.submitted, by Alan Turing, unread
- REQ-4468, request.rejected, by Ada Lovelace, read`,

  'multilevel-dialog': `Build a stacked multilevel dialog component in React + TypeScript + Tailwind CSS. It is a dialog that opens dialogs (a form opens a picker, the picker opens a confirm), all as one stack over one backdrop.

## Look
- Portalled to <body>: \`fixed inset-0 z-[200] flex items-center justify-center p-4\` (\`role="presentation"\`).
- ONE backdrop for the whole stack: \`absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm\`, fading in (opacity 0 → 1, 200ms ease-out).
- A stack layer \`pointer-events-none absolute inset-0 flex items-center justify-center p-4\` holds every level. Each level is \`pointer-events-auto absolute flex flex-col w-[calc(100%-2rem)] max-h-[calc(100vh-4rem)] outline-none transition-[transform,opacity,filter] duration-200\` on the opaque floating surface, capped by its size: \`sm\`–\`3xl\` map to \`max-w-sm\`–\`max-w-3xl\`, default \`lg\`.
- Depth: at depth d (0 = top), a level gets \`transform: translateY(-14d px) scale(1 - 0.04d)\` and a z-index in stack order.
  - The top level plays a scale-in: from \`opacity 0, scale(0.96) translateY(6px)\`, 220ms \`cubic-bezier(0.34, 1.56, 0.64, 1)\`.
  - Depth 1 is \`opacity-70 brightness-95\`; deeper levels are \`opacity-0\`.
- Header: \`flex shrink-0 items-start gap-2 border-b border-slate-200 dark:border-slate-700 px-5 py-3\`.
  - On levels after the first, a back button: 16px ArrowLeft, \`mt-0.5 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200\`.
  - Then a \`min-w-0 flex-1\` column: a breadcrumb (\`mb-0.5 flex flex-wrap gap-1 text-[11px] text-slate-400\`; each earlier level's title is a button with \`hover:text-indigo-600 hover:underline dark:hover:text-indigo-300\`, separated by a 12px ChevronRight), the title (text-sm font-semibold slate-800 / dark slate-100, truncating), and an optional subtitle (11px slate-500 / dark slate-400).
  - Last, a close-all X styled like the back button.
- Body: \`min-h-0 flex-1 overflow-y-auto px-5 py-4 text-xs text-slate-700 dark:text-slate-200\`. Footer: \`flex shrink-0 items-center justify-end gap-2 border-t px-5 py-3\`. The top level shows a small diagonal resize mark in its bottom-right corner.

## Stack model
- Export \`useDialogStack(initial = [])\`, returning \`{ stack, push(id, data?), pop(), close(), popTo(id), setStack }\`. An entry is \`{ id, data? }\`. Pushing an id already on the stack moves it to the top. \`popTo\` closes everything above that id.
- \`renderLevel(entry)\` returns \`{ title, subtitle?, size?, content, footer? }\` (or null to skip an unknown id), and is called EVERY render so a level always reads current state. Store entries, not rendered content: stored JSX freezes controlled inputs. \`content\` and \`footer\` may be functions of \`{ push, pop, close, depth }\`, so a level opens the next one from inside itself.
- Levels underneath stay mounted, so a half-filled form keeps its input. They are \`inert\` and \`aria-hidden\`.

## Behaviour
- Escape pops ONE level. It is skipped if the event is already default-prevented or a \`[data-overlay="picker"]\` is open inside. The X closes all levels. A backdrop click does nothing unless \`closeOnBackdrop\` is set, and even then it only pops the top level.
- Focus: whenever the top level changes, focus its first \`[data-autofocus]\` element, else its first focusable, else the level itself (\`tabIndex={-1}\`), with \`preventScroll\`. Tab and Shift+Tab wrap inside the top level. When the stack empties, focus returns to whatever opened the first level. While open, body scroll is locked (\`overflow: hidden\`, restoring the previous value).
- Drag: the top level's header is the handle (\`cursor-move select-none touch-none\`; ignore presses on buttons and fields). It moves the WHOLE stack, as a CSS \`translate\` on the stack layer, so the next level opens over the last one rather than back in the middle. Clamp to the viewport; double-clicking the header recentres.
- Resize: only the top level, from any edge or corner. Grips are 6px edge strips and 12px corner squares, with a min of 280×160. The level is centred, so shift the offset by half the size change to keep the opposite edge still. Each level remembers its own size while others come and go. Position and all sizes are forgotten once the stack empties.

## API
- \`stack: DialogEntry[]\`, \`renderLevel\`, \`onPush\`, \`onPop\`, \`onClose\`, \`onPopTo?(id)\`
- \`closeOnBackdrop?\` = false, \`draggable?\` = true, \`resizable?\` = true
- Also export the types \`DialogEntry\`, \`DialogLevel\`, \`DialogStackApi\` and \`DialogLevelSize\`.

## Accessibility
- Each level: \`role="dialog"\`, \`aria-label={title}\`, \`aria-modal\` only on the top one. Breadcrumb \`<nav aria-label="Dialog levels">\`. Back button \`aria-label="Back to {previous title}"\`; X \`aria-label="Close all"\`.

## Demo
An "Open project settings" button opens three levels:
1. "Project settings" (lg): a Name input ("Website relaunch", \`data-autofocus\`), member chips (Ada Lovelace, Grace Hopper), a "Manage…" button, and a Cancel / Save footer.
2. "Members" (md, subtitle "Who can see and edit this project"): five people, each with Add or Remove, and a Done footer.
3. Opened from Remove: "Remove Ada Lovelace?" (sm), "They lose access to the project straight away. Their past comments stay.", with Keep and a danger Remove.

Show the open path under the button.`,

  'context-menu': `Build a right-click context menu component with nested submenus in React + TypeScript + Tailwind CSS, plus a \`useContextMenu\` hook.

## Look
- Panel: \`fixed z-[200] min-w-44 max-w-72 p-1 text-xs focus:outline-none\` on the opaque floating surface. No open animation.
- Item: \`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors\`.
  - Normal: \`text-slate-700 dark:text-slate-200\`, highlighted by focus: \`focus:bg-slate-100 dark:focus:bg-slate-800\`.
  - \`danger\`: \`text-rose-600 dark:text-rose-400 focus:bg-rose-50 dark:focus:bg-rose-500/10\`.
  - Disabled: \`opacity-40 cursor-not-allowed\`.
  - An item whose submenu is open keeps \`bg-slate-100 dark:bg-slate-800\`.
- Item contents, left to right:
  - A 14px icon column, reserved even when empty so labels align; the icon is at \`opacity-70\`.
  - The label: \`min-w-0 flex-1 truncate\`.
  - The shortcut hint in a \`<kbd>\`: \`ml-4 font-sans text-[10px] text-slate-400 dark:text-slate-500\`.
  - For a parent item, a 14px ChevronRight (\`-mr-1\`, slate-400 / dark slate-500).
- Separator: \`my-1 h-px bg-slate-200 dark:bg-slate-700\`.

## Opening
- \`<ContextMenu items>\` wraps its target:
  - \`contextmenu\` (preventDefault) opens the menu at the pointer.
  - Shift+F10, or the ContextMenu key, on a focused child opens it at the focused element's lower-left (\`left + 8\`, \`bottom\`). A \`contextmenu\` event at (0,0) is that key and counts as keyboard.
  - Ignore a pointer \`contextmenu\` that arrives within 300ms of a keyboard open (some browsers echo one).
  - \`stopPropagation\`, so with nested triggers the innermost wins.
  - Only react when the event target is inside the trigger's DOM: portal events bubble up the React tree, and a right-click inside the open menu would re-open it.
- \`useContextMenu(defaultItems)\` returns \`{ show(eventOrPoint, items?), close, open, getTriggerProps(items?), menu }\`. It is for targets you cannot wrap, like table rows: spread \`getTriggerProps(menuFor(row))\` on each row and render \`menu\` once. Items passed to \`show\` win over the defaults.

## Placement
- Portalled. The first render is \`visibility: hidden\` at 0,0; a layout effect measures it, then places it before paint.
- Root: at the pointer. Flip to the left of it if it would pass \`vw - 8\`, and above it if it would pass \`vh - 8\`, so the pointer stays on a corner of the menu instead of the menu sliding under it. Clamp to an 8px margin last.
- Submenus: DOM children of their parent panel, so one outside-click check covers the cascade, but each is \`fixed\` on its own.
  - Horizontal: open at \`parent.right - 4\` (a 4px overlap means the pointer crosses no gap), or at \`parent.left - width + 4\` when there is no room on the right.
  - Vertical: \`item.top - 4\` lines the first item up with its parent item; shift up at the bottom edge, then clamp.
- The menu closes on outside click, Escape, window resize, window blur, and any scroll outside itself. It does not chase a pointer position that no longer means anything.

## Keyboard & pointer
- Hover and keyboard share one highlight: hovering an item focuses it (\`preventScroll\`, because a scroll would close the menu).
- Hovering a parent item opens its submenu after 120ms, and hovering another item swaps or closes it after the same delay, which forgives a diagonal pointer path. A submenu opened by hover does not take focus.
- Keys:
  - ArrowDown / ArrowUp wrap over enabled items, skipping separators and disabled items; Home / End jump to the ends.
  - ArrowRight, or Enter / Space on a parent, opens its submenu and focuses the submenu's first item.
  - ArrowLeft in a submenu closes it and refocuses its parent item.
  - Tab is swallowed.
  - Only the panel that owns the focused item handles keys.
- Initial focus: opened by pointer, focus goes to the menu panel itself; opened by keyboard, to its first enabled item.
- Activating an action closes the whole cascade, then runs \`onClick\`. Parent items only open their submenu. Right-clicks inside the menu are suppressed.
- Focus returns to the element that had it before opening on Escape and after an action, but NOT on outside click: that click just put focus where the person wanted it.

## API
- \`ContextMenuItem = { label: ReactNode; icon?: ComponentType<{ className?: string }>; shortcut?: string; onClick?(): void; disabled?: boolean; danger?: boolean; items?: ContextMenuItem[] } | { separator: true }\`. \`shortcut\` is display-only; the menu does not bind the key.
- \`ContextMenu\` props: \`items\`, \`className?\` (on the wrapper, which is the right-click target), \`children\`.

## Accessibility
- Panels: \`role="menu" aria-orientation="vertical" tabIndex={-1}\`. Items: \`role="menuitem" tabIndex={-1}\`. Parents: \`aria-haspopup="menu"\`, \`aria-expanded\`, \`aria-controls\` pointing at the submenu's id. A submenu has \`aria-labelledby\` pointing at its parent item. Separators have \`role="separator"\`.

## Demo
Two areas side by side:
- A dashed, focusable box (\`h-40\`): "Right-click anywhere in this box (or focus it and press Shift+F10)".
- A file list (report-q1.pdf, budget.xlsx, notes.md, diagram.png), each row wired through the hook.

Both use the same menu:
- Open (↵), Rename (F2), Copy (⌘C)
- separator
- Move to › Documents, Shared, Archive › 2025 / 2026
- Share › Copy link, Email
- Print (disabled)
- separator
- Delete (⌫, danger)

Show the last action under the list.`,

  'speed-dial': `Build a speed dial component in React + TypeScript + Tailwind CSS: a floating action button that fans out into actions in a line, circle, semi-circle or quarter-circle.

## Look
- Two boxes. Outer: \`z-50 inline-flex\` plus the caller's \`className\`; the component positions nothing itself (e.g. the caller passes \`absolute bottom-4 right-4\`). Inner: \`relative z-50 h-12 w-12\`, the origin of the fan.
- Main button, 48px: \`rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900\`. It holds a 20px Plus that rotates 45° when open (one icon becoming an ×), with a 200ms transition.
- Action buttons, 36px: \`rounded-full shadow-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-indigo-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-indigo-300\`, a 16px icon, \`disabled:opacity-50\`.
- Each action has a one-line tooltip with its label, on the side AWAY from the fan so it never covers a neighbour. With the action's offset (x, y): if |y| ≥ |x| it goes right when x > 1, else left; otherwise top when y < 0, else bottom.
- \`mask\`: a \`fixed inset-0 bg-slate-900/30 dark:bg-black/50\` dim inside the same z-50 layer, beneath the buttons. It fades over 200ms, is \`pointer-events-none\` while closed, and a click on it closes the dial.

## Layout
- Direction angles in screen coordinates (y grows down): up −90°, down 90°, left 180°, right 0°, up-left −135°, up-right −45°, down-left 135°, down-right 45°.
- \`linear\`: action i sits along the angle at distance \`24 + 8 + 18 + i × (36 + 8)\` px.
- \`circle\`: \`angle = centre + (360 / n) × i\`.
- \`semi-circle\` (180°) and \`quarter-circle\` (90°): the actions spread from \`centre − span/2\` to \`centre + span/2\` in steps of \`span / (n − 1)\` (a single action sits at the centre). The distance is \`radius\`.
- Each action is an \`absolute left-1/2 top-1/2\` item.
  - Closed: \`translate(-50%,-50%) scale(0.4)\`, opacity 0.
  - Open: \`translate(-50%,-50%) translate(xpx, ypx) scale(1)\`, opacity 1.
  - Transition transform and opacity over 200ms ease-out. The stagger runs outward on open (\`i × 35ms\`) and inward on close (\`(n − 1 − i) × 25ms\`). \`motion-reduce:transition-none\`.

## Behaviour
- Controlled (\`open\` + \`onOpenChange\`) or uncontrolled.
- Closed actions are \`inert\`: not clickable, and not reachable by Tab.
- Clicking the main button toggles the dial. If it was opened by keyboard (\`event.detail === 0\`), focus moves to the first enabled action on the next frame. ArrowUp or ArrowDown on the main button also opens it and focuses the first action.
- Arrow keys inside the fan (skipping disabled actions, wrapping, Home / End):
  - linear: the arrow pointing along the fan moves outward and the opposite arrow moves back, so for \`up\`, ArrowUp moves forward.
  - Arcs: Right / Down go forward, Left / Up go back.
- Clicking an action closes the dial, refocuses the main button, then runs \`onClick\`. Escape closes and refocuses the main button; an outside click closes.

## API
- \`actions: { label: string; icon: ComponentType<{ className?: string }>; onClick?(): void; disabled?: boolean }[]\`
- \`direction?\` = \`'up'\` (any of the 8 above), \`type?: 'linear' | 'circle' | 'semi-circle' | 'quarter-circle'\` = \`'linear'\`, \`radius?\` = 80, \`mask?\` = false
- \`open?\`, \`onOpenChange?\`, \`'aria-label'?\` = "Actions", \`className?\`

## Accessibility
- Main button: \`aria-haspopup="menu"\`, \`aria-expanded\`, \`aria-controls\` pointing at the list.
- The list is a \`<ul role="menu" aria-label>\` with \`<li role="none">\` items; action buttons are \`role="menuitem" tabIndex={-1} aria-label={label}\`. The tooltip is the sighted equivalent, not the accessible name.

## Demo
Three dashed \`h-64\` boxes:
- Linear, up, at the bottom-right.
- Circle with radius 72, centred.
- Quarter-circle, up-left, radius 96, masked, at the bottom-right.

Actions: Edit (Pencil), Upload, Schedule (Calendar), Settings. Show the last action clicked.`,

  'multilevel-menu': `Build a cascading multilevel filter menu component in React + TypeScript + Tailwind CSS: the "Add filter" menu of a reporting page. Each level opens beside the last, level with the row that opened it, and ends in searchable lists of values to tick.

## Look
- Trigger: \`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium\`. It holds a 14px ListFilter icon, the label ("Add filter"), and a total-picked pill when anything is picked (\`rounded-full bg-indigo-600 px-1.5 text-[10px] font-semibold leading-4 text-white dark:bg-indigo-400 dark:text-slate-900\`).
  - Idle: \`border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700\`.
  - Open, or with picks: \`border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/50 dark:bg-indigo-500/15 dark:text-indigo-200\`.
- Each level: portalled, \`fixed z-[200] flex flex-col py-1 max-h-[min(28rem,calc(100vh-1rem))]\` on the opaque floating surface, with a scale-in (from \`opacity 0, scale(0.96) translateY(6px)\`, 220ms \`cubic-bezier(0.34, 1.56, 0.64, 1)\`). Width 232px by default, \`max(width, 300)\` for option lists, or the node's own \`width\`.
- Level header: \`flex items-center justify-between gap-2 px-3 pb-2 pt-1.5\`.
  - The heading: the \`title\` prop on the first level, the node label below it; text-sm font-semibold slate-800 / dark slate-100.
  - On the right, "Select all | Clear" for a multi-select list, "Clear" alone elsewhere. The links are \`text-[11px] font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 disabled:opacity-40\`, and the "|" is slate-300 / dark slate-600.
  - A \`border-t\` rule follows.
- Search row, when searchable: \`flex items-center gap-2 border-b px-3 py-1.5\`, a 14px Search icon and a borderless, transparent \`type="search"\` input with placeholder "Search {heading in lowercase}".
- Hint row, on option lists: \`flex items-center gap-1.5 border-b px-3 py-2 text-[11px] text-slate-500 dark:text-slate-400\`, a 14px Info icon, and the node's \`hint\` (default for a multi-select list: "You can select multiple items").
- Rows sit in \`min-h-0 flex-1 overflow-y-auto px-1 pt-1\` and share \`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 focus-visible:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/60 dark:focus-visible:bg-slate-700/60 disabled:opacity-40\`.
  - Branch rows: an optional 14px icon (slate-400), the label (truncating), a count pill of the picks beneath it (\`rounded-full bg-indigo-50 px-1.5 text-[10px] font-semibold leading-4 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300\`), and a 14px ChevronRight. The row whose level is open keeps \`bg-slate-100 dark:bg-slate-700/60\`.
  - Option rows: a 14px box, \`rounded\` for multi-select and \`rounded-full\` for single, \`border-slate-300 dark:border-slate-600\`. Picked, it is filled \`border-indigo-600 bg-indigo-600\` with a white 10px Check (strokeWidth 3); in dark mode the fill is indigo-400 and the check slate-900. A picked label is \`font-medium text-indigo-700 dark:text-indigo-300\`.
  - No results: "No matches", 11px, centred, slate-400.

## Data
- A node is \`{ key, label, icon?, children?, options?: { value, label, disabled? }[], multiple? (default true), hint?, searchable?, width?, disabled?, onSelect? }\`. With \`children\` it opens another level; with \`options\` it opens a list to pick from; with neither it is an action, which runs \`onSelect\` and closes the menu.
- \`value: Record<listKey, string[]>\` is controlled through \`onChange\`; a list emptied of picks is deleted from the object.
- Single-select: picking replaces the value, and clicking the picked option unpicks it.
- "Select all" adds every enabled option the search currently shows. "Clear" empties every list at or under that level's node (on the first level: everything).
- A level is searchable when its node says so, or by default when it has more than \`searchFrom\` (6) rows. Each newly opened level starts with an empty query.
- Export \`selectedLists(nodes, value)\`, which returns \`[{ node, path: string[], options }]\` in menu order, the data for a chip row.

## Placement
- First level: under the trigger, left-aligned, with a 6px gap. It flips above when it doesn't fit below and does fit above.
- Each later level: at \`parent.left + parent.width + 6\`, or at \`parent.left − width − 6\` when that would pass the right edge. Its top is the opening row's top − 10, so the level is level with its row.
- Clamp every level to an 8px margin, which slides it up at the bottom of the screen.
- Measure in a layout effect after every render and store only when a position changed, so it settles in one pass. A level is \`visibility: hidden\` on its first frame. Follow window scroll (capture phase) and resize.

## Behaviour
- It is a cascade, not a drill-down: parents stay visible, and hovering another row swaps the level beside it.
- Hover opens a row's level 120ms after the pointer SETTLES:
  - Use \`pointermove\` (mouse only), restarting the timer on each move. Don't use \`pointerenter\`: rows re-rendering under a resting pointer (a search narrowing, an Escape) fire enter and would reopen a level just closed.
  - \`pointerleave\` cancels the timer, and entering a level cancels a hover still pending in the level before it.
  - Hovering an action row closes the deeper levels.
- A click opens a level immediately.
- Keyboard:
  - Opening focuses the first level's search, or its first row.
  - Up / Down move within a level and wrap. Up from the first row goes to the search box; Down from the search box goes to the first row. Home / End jump to the ends.
  - Right or Enter opens the row's level and focuses its search or first row.
  - Left, or Escape, closes the deepest level and refocuses its row. Escape on the first level closes the menu and refocuses the trigger.
  - Inside the search box, Left / Right / Home / End stay with the text.
- An outside click (outside both the trigger root and the portalled layer) closes everything.
- The portalled layer carries \`data-overlay="menu"\`, so other anchored panels avoid it.

## API
- \`nodes\`, \`value\`, \`onChange\`
- \`title?\` = "Filters", \`label?\` = "Add filter", \`icon?\`, \`searchFrom?\` = 6, \`width?\` = 232, \`className?\`

## Accessibility
- Trigger: \`aria-haspopup="menu" aria-expanded\`. Each level: \`role="menu" aria-label={heading}\`. Branch rows: \`role="menuitem"\` with \`aria-haspopup\` and \`aria-expanded\`. Options: \`role="menuitemcheckbox"\` or \`"menuitemradio"\` with \`aria-checked\`. Search: \`aria-label="Search {heading}"\`.

## Demo
A "Reporting filters" menu with two branches.

Filters:
- Offer: six options such as "Spring sale landing page (ID: 15)" and "Annual plan upsell (ID: 17)"
- Smart Link
- Channel: Search, Social, Email, Display, Affiliate, Direct
- Region
- City: ten cities, so it gets a search box
- Country, Country Code
- Adv1–Adv5

Metric Filters:
- Clicks: single-select, hint "Pick one threshold", options "More than 0", "More than 100", "More than 1,000"
- Conversions
- Duplicate clicks

Start from \`{ offer: ['1', '3'], channel: ['2'] }\`. Beside the trigger, render one chip per picked list ("Offer: A, B", or "3 selected" above two picks) with an × to remove it.`,

  'media-library': `Build a searchable media library picker component (grid and list views, drag-and-drop upload) in React + TypeScript + Tailwind CSS.

## Look
- Root \`flex flex-col gap-3\`.
- Toolbar \`flex flex-wrap items-center gap-2\`:
  - Search: \`relative min-w-48 flex-1\`, a 14px Search icon at \`left-2.5\`, and a text input with \`pl-8\` and placeholder "Search media…".
  - View toggle: \`flex items-center gap-0.5 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5\` holding two \`rounded-md p-1.5\` icon buttons (Grid2x2, List; 14px). The active one is \`bg-indigo-600 text-white\`; the other is \`text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800\`.
  - A primary "Upload" button with an Upload icon, only when \`onUpload\` is passed. Make it a \`relative\` <label> around a visually hidden file input; \`relative\` keeps the sr-only input from escaping and stretching the page.
- Drop zone around the items: \`min-h-0 flex-1 rounded-xl border border-dashed p-3 transition-colors\`, \`border-slate-200 dark:border-slate-700\`. While a file is dragged over it: \`border-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/10\`.
- Grid view: \`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3\` of tile buttons, \`relative rounded-lg border p-2 text-left\`.
  - Unselected: \`border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600\`.
  - Selected: \`border-indigo-500 bg-indigo-50/60 dark:bg-indigo-500/10\`, plus a 16px indigo-600 circle at \`right-1.5 top-1.5\` holding a white 10px Check (strokeWidth 3).
  - Contents: a square thumbnail (\`aspect-square w-full rounded-md object-cover bg-slate-100 dark:bg-slate-800\`), then the name (\`mt-1.5 truncate text-[11px] font-medium\`), then the size (10px slate-400).
- List view: \`divide-y divide-slate-100 dark:divide-slate-800\` of row buttons, \`flex w-full items-center gap-3 rounded-md px-2 py-1.5\`.
  - Selected: \`bg-indigo-50/60 dark:bg-indigo-500/10\`. Otherwise: \`hover:bg-slate-50 dark:hover:bg-slate-800/50\`.
  - Contents: a 36px thumbnail, the name (text-xs font-medium, truncating), a meta line (10px slate-400, "image · 471 KB · 2026-08-28"), and a 14px indigo-600 Check when selected.
- Thumbnails use \`thumbnailUrl\`, else \`url\` for images. If there is no source, or the image fails to load, show a slate-100 / dark slate-800 box with a 20px slate-400 icon for the kind (image/other: File, video: Film, audio: Music, document: FileText). Never show a broken-image glyph: dead URLs are common here, and a grid of broken images reads as a broken component.
- Empty: centred \`py-16\` text-sm font-medium, "Nothing matches that search" or "No media yet". When upload is enabled, add an ⓘ tooltip: "Drop files here, or use Upload."

## Behaviour
- Search filters by name, case-insensitive. The view (grid by default) is internal state.
- Selection is CONTROLLED and always a \`string[]\`, even when \`multiple\` is false.
  - Multiple: a click toggles the item.
  - Single: a click gives \`[id]\`, or \`[]\` when that item is clicked again.
  - Without \`onSelectedChange\` the library is read-only.
- Upload: through the file input (\`multiple\` follows the prop; \`accept\` is passed through), or by dropping files on the zone (preventDefault on dragover). Both call \`onUpload(FileList)\`.
- Sizes: base 1024, units B / KB / MB / GB, one decimal under 10 (except bytes), otherwise rounded.

## API
- \`MediaItem = { id: string; name: string; kind: 'image' | 'video' | 'audio' | 'document' | 'other'; size?: number; url?: string; thumbnailUrl?: string; uploadedAt?: string }\` (\`size\` is in bytes)
- \`items\`, \`selected?\` = [], \`onSelectedChange?(ids)\`, \`multiple?\` = true, \`onUpload?(files)\` (omit it to hide upload entirely), \`accept?\`, \`className?\`

## Accessibility
- Tiles and rows: \`aria-pressed\`. View buttons: \`aria-label\` "grid view" / "list view", with \`aria-pressed\`.

## Demo
Eight items: hero-banner.png, onboarding.mp4, terms-v3.pdf, launch-jingle.mp3, avatar-ada.png, export.csv, screenshot-01.png, walkthrough.mov. Use realistic sizes, from 5 KB to 41 MB, and August 2026 upload dates. Pre-select the first. \`onUpload\` prepends the dropped files as new items, with \`URL.createObjectURL\` for their url.`,

  'carousel': `Build a paged carousel/slider component, generic over its items, in React + TypeScript + Tailwind CSS.

## Look
- \`<section class="flex flex-col gap-2">\`.
- Main row: \`flex items-center gap-1.5\` (vertical: \`flex-col\`), holding the prev button, the viewport, and the next button.
- Viewport: \`min-w-0 flex-1 self-stretch overflow-hidden\`. Vertical: \`w-full\`, with its height set by \`verticalViewportHeight\`.
- Nav buttons: \`h-7 w-7 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200\`, with 16px ChevronLeft / ChevronRight (ChevronUp / ChevronDown when vertical). At a non-wrapping end they get \`aria-disabled\`, \`opacity-30\` and no hover. Don't use \`disabled\`: disabling the focused button drops focus to <body>.
- Track: \`relative flex\` (vertical: \`h-full flex-col\`), \`transition-transform duration-500 ease-out motion-reduce:transition-none\`, moved with translateX / translateY.
- Slides: \`shrink-0 min-w-0 min-h-0 px-1\` (vertical: \`py-1\`, plus \`overflow-hidden\` so tall content cannot paint over the next slide). \`flex-basis: (100 / visible)%\`, unless \`autoSize\`.
- Under the row, when there is more than one page: \`flex justify-center gap-2\`, holding an optional pause/play button (a 20px nav button with a 12px Pause / Play icon, present while autoplay is on) and the dots (\`gap-1.5\`). Each dot is \`h-1.5 rounded-full transition-all\`: the active dot is \`w-5 bg-indigo-600 dark:bg-indigo-400\`, the others \`w-1.5 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500\`.

## Paging maths
- Metrics are slide offsets, slide sizes and the viewport size, in one unit.
  - Fixed slides: slide i starts at i with size 1, and the viewport is \`visible\` wide.
  - \`autoSize\`: pixels read from the rendered slides (\`offsetLeft\` / \`offsetWidth\`, or top / height when vertical). A ResizeObserver on each slide catches images loading.
- \`visible = clamp(numVisible, 1, items.length)\`, and may be fractional: 1.5 shows a slide and half of the next. \`scroll\` is rounded, and at least 1.
- Snap points: \`max = end of last slide − viewport\`. For each group starting at s = 0, scroll, 2·scroll…, take \`extent = end of its last slide − offsets[s]\` and \`shift = align === 'center' ? (viewport − extent) / 2 : 0\`, and add a stop at \`clamp(offsets[s] − shift, 0, max)\`. Finally add \`max\` itself. Drop stops within \`viewport × 0.001\` of the previous one.
  - So the last page is flush with the end: 7 items, 3 visible, scroll 3 gives stops at 0, 3 and 4, never a half-empty strip.
  - Both ends sit flush even when centred, and no dot goes nowhere.
- Clamp the page to \`pageCount − 1\` AT RENDER, so a resize or a removed item never shows an empty frame.
- Translate by \`−pos × (100 / visible)%\` for fixed slides (it survives a resize with no re-measure), or by \`−pos px\` with \`autoSize\`.
- \`responsiveOptions\` match the carousel's OWN width (from a ResizeObserver), not the window. The smallest breakpoint that is ≥ the width wins, like \`max-width\` media queries. Before the first measurement, the base props apply.

## Behaviour
- Controlled (\`page\` + \`onPageChange\`) or internal.
- \`goTo\` wraps when \`circular\` or autoplay is on, and clamps otherwise. Wrap by rewinding, not by cloning slides: clones duplicate ids and focusables, and a screen reader would announce slides twice.
- Autoplay (\`autoplayInterval\` ms > 0): off under \`prefers-reduced-motion\` and when there is a single page. It pauses while hovered, while focus is inside, or after its pause button is pressed. Have the interval call the latest step through a ref, so it is not re-armed (clock restarted) on every page change.
- Swipe: for touch or pen (not mouse), a pointer-down to pointer-up delta over 40px along the axis goes to the next or previous page.
- Slides not wholly inside the viewport, like a peek, are \`inert\` and \`aria-hidden\`, so Tab only lands on what is visible. A slide larger than the viewport counts as shown while any of it overlaps.
- Dots are one tab stop (roving tabindex on the active dot). Left / Right (Up / Down when vertical) and Home / End change the page and move focus along the dots.

## API
- \`items: T[]\`, \`itemTemplate(item, index)\`, \`itemKey?(item, index)\`
- \`numVisible?\` = 1, \`numScroll?\` = 1, \`align?: 'start' | 'center'\` = \`'start'\`, \`autoSize?\` = false, \`circular?\` = false, \`autoplayInterval?\` = 0
- \`orientation?: 'horizontal' | 'vertical'\`, \`verticalViewportHeight?\` = '320px'
- \`responsiveOptions?: { breakpoint: number; numVisible: number; numScroll: number }[]\`
- \`showNavigators?\` = true, \`showIndicators?\` = true, \`page?\`, \`onPageChange?\`, \`'aria-label'?\` = "Carousel", \`className?\`

## Accessibility
- Section: \`aria-roledescription="carousel"\` and \`aria-label\`. Slides: \`role="group" aria-roledescription="slide" aria-label="3 of 8"\`.
- The track is \`aria-live="polite"\`, but \`"off"\` while autoplay is running, or a screen reader narrates the slideshow.
- Nav buttons: "Previous page" / "Next page". Dots: "Go to page n" with \`aria-current\`. Pause button: "Stop automatic slide show" / "Start automatic slide show".

## Demo
Eight photo cards (picsum.photos seeds: lake, forest, desert, harbor, meadow, canyon, glacier, valley). Each card is an opaque rounded card with a 16:10 cover image, then "Photo n" and "Random sample image" below it. Show 3 per page, \`circular\`, \`autoplayInterval={4000}\`, with responsive options of 2 per page at ≤640px and 1 at ≤420px. Add a Horizontal / Vertical toggle; vertical shows 2 per page in a 360px viewport inside \`max-w-xs\`.`,

  'gallery': `Build an image gallery component (main stage, thumbnail strip, captions and a fullscreen lightbox) in React + TypeScript + Tailwind CSS.

## Look
- \`<section class="flex gap-2">\`: \`flex-col\` for top/bottom thumbnails, \`flex-row\` for left/right. The strip renders before the stage for \`top\` and \`left\`.
- Stage: \`group relative w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-900\`, with \`aspect-ratio: stageAspect\` (default "16 / 10", so the page does not jump between images of different shapes). It is focusable (\`tabIndex={0}\`, \`focus-visible:ring-2 ring-indigo-400\`), and the image fills it with \`object-contain\`.
- Overlay arrows: \`absolute top-1/2 -translate-y-1/2\` at \`left-2\` / \`right-2\`, \`h-8 w-8 rounded-full bg-slate-900/45 text-white backdrop-blur-sm hover:bg-slate-900/70 dark:bg-slate-950/55 dark:hover:bg-slate-950/80\`, with 16px chevrons. At a non-circular end they get \`aria-disabled\` and \`opacity-30\` (not \`disabled\`, which would drop focus).
- Fullscreen button: \`absolute right-2 top-2\`, 28px \`rounded-md\` with the same translucent dark fill and a 14px Maximize2 icon.
- Caption: \`pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-950/75 to-transparent px-3 pb-2.5 pt-8 text-xs text-white\`.
- Broken image: a centred 24px ImageOff icon over the alt text (11px, slate-400 / dark slate-500). Key the image by \`src\` so the fallback doesn't stick to the next image.
- Optional dots under the stage: \`h-1.5 rounded-full\`, active \`w-5 bg-indigo-600 dark:bg-indigo-400\`, others \`w-1.5 bg-slate-300 dark:bg-slate-600\`.
- Thumbnail strip, hidden with only one image:
  - Horizontal: \`relative flex gap-1.5 overflow-x-auto pb-1\` with a thin scrollbar and \`h-14 w-20\` thumbs.
  - Vertical: a \`relative w-20 shrink-0 self-stretch\` wrapper holding an \`absolute inset-0 flex flex-col gap-1.5 overflow-y-auto pr-0.5\` strip, so it takes the stage's height instead of stretching the row to fit every thumb. Thumbs are \`w-full aspect-[4/3]\`.
  - Each thumb: \`rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800\` with an \`object-cover\` image. Active: \`opacity-100 ring-2 ring-inset ring-indigo-500 dark:ring-indigo-400\`. Others: \`opacity-60 hover:opacity-100\`.
- No images: a dashed box, \`p-6 text-[11px] text-slate-400\`, reading "No images."

## Behaviour
- Controlled (\`activeIndex\` + \`onActiveIndexChange\`) or uncontrolled (\`defaultActiveIndex\`). \`circular\` wraps at both ends; otherwise the index clamps.
- The strip keeps the active thumb centred by smooth-scrolling ITS OWN \`scrollLeft\` / \`scrollTop\`. Never use \`scrollIntoView\`, which scrolls the page too and yanks a gallery below the fold into view.
- Stage keys: Left / Right step, Home / End jump. Enter on the stage itself (not on the buttons inside it) opens the lightbox.
- Lightbox: portalled to <body>, \`fixed inset-0 z-[200] flex flex-col bg-slate-950/90 backdrop-blur-sm outline-none\`, fading in (opacity 0 → 1, 200ms ease-out). It is dark in BOTH themes, so it has no \`dark:\` pairs: a photo is judged against black.
  - Top bar: \`flex justify-between px-4 py-3 text-xs text-slate-300\`, showing "3 / 8" (\`aria-live="polite"\`) and a 32px round close button (\`hover:bg-white/10 hover:text-white\`).
  - Middle: \`relative flex min-h-0 flex-1 items-center justify-center px-16 pb-6\` holding a <figure>. The image is \`max-h-[80vh] max-w-full rounded-md object-contain\` and fades in on each change. The figcaption is \`max-w-2xl text-center text-xs text-slate-300\`.
  - Arrows: 40px round \`bg-white/10 hover:bg-white/20 text-white\` at \`left-3\` / \`right-3\`, with 20px chevrons; at an end, \`aria-disabled\` with \`opacity-25\`.
  - A mousedown on the dark space (outside the figure, the top bar and the arrows) closes it, as does Escape. Arrows and Home / End navigate.
  - On open, focus moves to the close button. Tab wraps among the lightbox's buttons. On close, focus returns to whatever opened it. The dialog is \`tabIndex={-1}\`, so a click on the image keeps the keyboard handling.
- \`fullscreen\` + \`onFullscreenChange\` optionally control the lightbox.

## API
- \`GalleryImage = { src: string; thumbnail?: string; alt: string; caption?: ReactNode }\`
- \`images\`, \`activeIndex?\`, \`defaultActiveIndex?\` = 0, \`onActiveIndexChange?\`
- \`showThumbnails?\` = true, \`thumbnailsPosition?: 'bottom' | 'top' | 'left' | 'right'\` = \`'bottom'\`, \`showIndicators?\` = false, \`showCaption?\` = true
- \`circular?\` = false, \`allowFullscreen?\` = true, \`fullscreen?\`, \`onFullscreenChange?\`
- \`stageAspect?\` = '16 / 10', \`'aria-label'?\` = "Image gallery", \`className?\`

## Accessibility
- Section: \`aria-label\`. Stage: \`role="group" aria-roledescription="image viewer" aria-label="Image 3 of 8: {alt}"\`, plus an \`sr-only aria-live="polite"\` line with the same text.
- Thumbs: \`aria-label="Show image n: {alt}"\` and \`aria-current\`. Lightbox: \`role="dialog" aria-modal="true" aria-label="Image viewer"\`. Buttons: "Previous image", "Next image", "View fullscreen", "Close viewer".

## Demo
Eight picsum.photos images (seeds: lake, forest, desert, harbor, meadow, canyon, glacier, valley) at 1200×750, with 160×112 thumbnails and captions like "**Photo 3** of 8 — random sample image". Make it \`circular\` and \`max-w-2xl\`, with a row of buttons switching the thumbnail position between bottom, top, left and right.`,
};
