/** AI prompts — see `./index.ts` for what a prompt is for. */

export const DATA_A_PROMPTS: Record<string, string> = {
  'kpi-tile': `Build a KPI tile (dashboard stat card) component in React + TypeScript + Tailwind CSS.

## Look
- A card (the house panel) with no padding of its own, \`overflow-hidden h-full flex flex-col\`, so every tile in a row stretches to the same height.
- Header row: \`px-4 py-2.5\`, hairline bottom border (slate-100 / dark slate-800). An icon chip (\`rounded-lg p-1.5\`, holding a 16px icon) then the title in 12px semibold slate-600 / dark slate-300, truncating.
- Icon chip tones — a 10% tint of the 500 step with 600 / dark 400 icon colour: indigo \`bg-indigo-500/10 text-indigo-600 dark:text-indigo-400\`, and the same pattern for amber, violet and emerald.
- Body: \`flex flex-1 min-h-[3.25rem] items-end justify-between gap-2 px-4 py-3\`. The fixed min-height keeps tiles equal whether the corner holds a two-line delta or a one-line subtitle.
- Bottom-left: the value, \`text-2xl font-bold font-mono tabular-nums tracking-tight\`, slate-900 / dark white, truncating.
- Bottom-right, one of:
  - \`subtitle\`: 10px right-aligned slate-400 / dark slate-500 text, at most 45% of the width.
  - otherwise a delta (only when \`delta\` is passed at all): two stacked right-aligned lines — "vs prev 7d" in 10px slate-400, then the change in 12px semibold tabular nums with a 12px arrow icon.

## Behaviour
- The delta is a percentage. Show \`Math.abs(value).toFixed(1)%\` with an up-right arrow for ≥ 0 or a down-right arrow for < 0.
- Colour means good or bad, not up or down: good is emerald-600 / dark emerald-400, bad is rose-600 / dark rose-400. \`positiveIsGood={false}\` flips it (for costs and churn).
- Under 0.05% in either direction counts as flat: a minus icon, slate-400.
- \`null\` or a non-finite delta: the "vs prev 7d" caption over an em dash in slate-400.
- The value arrives as a string that is already formatted. The tile does no number formatting.

## API
\`title: string\`, \`value: string\`, \`icon: ReactNode\`, \`tone?: 'indigo' | 'amber' | 'violet' | 'emerald'\` (default indigo), \`delta?: number | null\`, \`positiveIsGood?: boolean\` (default true), \`subtitle?: string\` (takes the place of the delta). Also export the \`Delta\` piece on its own.

## Demo
A responsive row of four (\`grid gap-3 sm:grid-cols-2 lg:grid-cols-4\`): Members "1,204" (indigo, Users icon, +4.2), Active projects "86" (emerald, Zap, +12), Spend "$551,650" (amber, Coins, −8.1), and Net margin "25.2%" (violet, TrendingUp, subtitle "vs previous period").`,

  'ranked-bars': `Build a ranked horizontal bar chart card in React + TypeScript + Tailwind CSS, using Recharts (\`BarChart\` with \`layout="vertical"\`).

Horizontal bars suit a short ranked list of named categories: the labels stay readable on the y-axis instead of being rotated under vertical bars.

## Look
- A card (house panel) with \`p-5\`. Title "Top Items by Spend" as a section title (10px semibold uppercase wide-tracking slate-500 / dark slate-400), \`mb-3\`.
- The chart height grows with the rows: \`max(220, rows.length * 40 + 24)\` px, inside a ResponsiveContainer. Margins: top 4, right 56 (room for the value labels), left 8, bottom 4.
- Y axis: the category names, 120px wide, 12px ticks in the axis grey, no tick lines and no axis line. The X axis is hidden.
- Bars: \`maxBarSize 26\`, right end rounded 4px (\`radius [0,4,4,0]\`). Each bar is coloured by its ROI: emerald #10b981 when roi ≥ 0, red #ef4444 when negative.
- A value label to the right of each bar, 11px in the axis grey, as compact currency.
- Axis grey: #6b7280 light / #9ca3af dark. Tooltip box: white / #1f2937 background, 1px #e5e7eb / #374151 border, 8px radius, 12px text in #111827 / #f3f4f6. Hover cursor band: \`rgba(0,0,0,0.04)\` light / \`rgba(255,255,255,0.04)\` dark. Read dark mode from the \`.dark\` class on <html>.

## Behaviour
- Rows are drawn in the order given; the caller sorts them.
- Compact currency: \`Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 })\`, so "$184.3K".
- The tooltip reads "Total Spend" with the value \`$184.3K  ·  1204 FTD  ·  ROI 31.4%\`: spend, FTD count, ROI to one decimal.
- No rows: a 320px-tall centred message "No data for the selected period." in 12px slate-400 / dark slate-500.

## API
\`rows: { id: number; name: string; brandName?: string; totalSpend: number; ftd: number; roi: number }[]\`. Plots \`totalSpend\`.

## Demo
Five departments: Engineering $184,320 / 1,204 / 31.4%, Research $152,880 / 986 / 18.2%, Design $98,400 / 610 / −4.7% (red bar), Support $74,150 / 402 / 9.1%, Operations $41,900 / 233 / 22.8%.`,

  'trend-chart': `Build a daily trend chart pair in React + TypeScript + Tailwind CSS, using Recharts and date-fns: two chart cards side by side from one daily series.

## Look
- Wrapper: \`grid grid-cols-1 gap-4 xl:grid-cols-2\`. Each card is a house panel with \`p-5\`, a section title (10px semibold uppercase wide-tracking slate-500 / dark slate-400, \`mb-3\`) and a 300px-tall ResponsiveContainer chart. Chart margins: top 8, right 12, left 4, bottom 0.
- Card 1, "Total Spend": an \`AreaChart\` with a monotone line in amber #f59e0b, 2px wide, over a vertical gradient fill of the same amber (35% opacity at the top, 0% at the bottom).
- Card 2, "Registrations vs First-Time Deposits": a \`ComposedChart\` with Registrations as indigo #6366f1 bars (\`maxBarSize 22\`, top corners rounded 3px) and First-Time Deposits as a 2px monotone blue #3b82f6 line with no dots.
- Both charts: horizontal grid lines only; axis lines and grid in #e5e7eb / dark #374151; 12px ticks in #6b7280 / dark #9ca3af; a legend in 12px text. X ticks are "MMM d" with \`minTickGap 24\` so they thin out on narrow cards. Y axis width 56 on the spend chart and 40 on the counts chart, where \`allowDecimals={false}\`.
- Tooltip box: white / #1f2937 background, 1px #e5e7eb / #374151 border, 8px radius, 12px text in #111827 / #f3f4f6. Read dark mode from the \`.dark\` class on <html>.

## Behaviour
- Dates are plain \`YYYY-MM-DD\` strings. Split them and build a LOCAL \`new Date(y, m - 1, d)\` before formatting: \`new Date('2026-08-01')\` parses as UTC and shows the previous day west of Greenwich. The tooltip label uses the same "MMM d".
- Spend axis and tooltip use compact USD (\`Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 })\` → "$14.2K"). The counts axis uses a compact number ("1.2K").
- No points: each card shows a 300px-tall centred "No data for the selected period." in 12px slate-400 / dark slate-500.

## API
\`trend: { date: string /* YYYY-MM-DD */; spend: number; registrations: number; ftd: number }[]\`.

## Demo
30 days from 2026-08-01 shaped by a gentle sine wave: spend around $14K with a slight upward drift, registrations around 420 and FTD around 96.`,

  'retention-chart': `Build a monthly retention-rate line chart card in React + TypeScript + Tailwind CSS, using Recharts \`LineChart\`.

## Look
- A house panel with \`p-5\`, the title "Deposit Retention Trend" as a section title (10px semibold uppercase wide-tracking slate-500 / dark slate-400, \`mb-3\`), then a 300px-tall ResponsiveContainer. Margins: top 8, right 12, left 4, bottom 0.
- Two monotone lines, 2px wide, with 3px-radius dots: "Converted" in violet #8b5cf6 and "D30" in pink #ec4899.
- Horizontal grid lines only; grid and axis lines in #e5e7eb / dark #374151; 12px ticks in #6b7280 / dark #9ca3af. A legend in 12px text.
- The Y axis always runs 0–100 (a fixed domain, so months compare against the whole scale), 44px wide, ticks as whole percentages ("25%"). X ticks are "Mar 2026" with \`minTickGap 24\`.
- Tooltip box: white / #1f2937 background, 1px #e5e7eb / #374151 border, 8px radius, 12px text in #111827 / #f3f4f6. Read dark mode from the \`.dark\` class on <html>.

## Behaviour
- One point per calendar month. \`month\` is the ISO date of the month's first day at UTC midnight, so format it with \`timeZone: 'UTC'\` (\`toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })\`). Formatting in local time shifts it into the previous month west of UTC.
- Rates may be \`null\` for a month with no measurement. The line connects across it (\`connectNulls\`) rather than dropping to zero, and the missing month gets no dot.
- The tooltip label is the formatted month. Each row reads \`22%  ·  1,886 users\`: the rate as a whole percentage, then the matching count (\`depositCount\` for Converted, \`thirtyDaysCount\` for D30) with thousands separators. A null rate shows "—".
- No points: a 300px-tall centred "No data for the selected period." in 12px slate-400 / dark slate-500.

## API
\`trend: { month: string; depositRate: number | null; thirtyDaysRate: number | null; registerCount: number; depositCount: number; thirtyDaysCount: number }[]\`. \`depositRate\` is "Converted" (% of registrants who deposited) and \`thirtyDaysRate\` is "D30" (% retained at day 30).

## Demo
March–August 2026: Converted 22.4, 24.1, 21.7, 26.3, 25.0, and D30 11.2, 12.8, 10.4, 14.1, 13.5. August is \`null\` for both, so the gap handling is visible.`,

  'activity-feed': `Build a recent-activity feed (audit trail list) component in React + TypeScript + Tailwind CSS.

## Look
- A house panel with \`p-5 space-y-3 h-fit\`. Header: a 14px lucide \`Activity\` icon in slate-400 beside the title "Recent activity" (10px semibold uppercase wide-tracking slate-500 / dark slate-400).
- An ordered list, \`space-y-2.5\`. Each row is \`flex gap-2.5 text-[11px]\`:
  - A 6px round dot (\`mt-1.5 shrink-0\`) coloured by event type.
  - Line 1, slate-700 / dark slate-200: the event's phrase, then the reference (e.g. "REQ-4471") in mono semibold indigo-600 / dark indigo-400, when there is one.
  - Line 2, slate-400 / dark slate-500, truncating: the timestamp as \`YYYY-MM-DD HH:MM\` (the ISO string's first 16 characters with the T replaced by a space, no timezone conversion), then " · <actor>", or " · system" when there is no actor.

## Behaviour
- Event types are dotted strings (\`request.created\`, \`bo.approved\`, \`auth.failed\`). A label map turns each into a phrase: "Request created", "Approved in the BO", "Failed sign-in" and so on. An unmapped type shows its raw string rather than hiding the row.
- Dot tones, first match wins: approved → emerald-500. Rejected or failed (\`bo.rejected\`, \`run.failed\`, \`auth.failed\`) → rose-500. Needs a human (\`bo.partial\`, \`bo.unresolved\`) → amber-500. Any \`request.*\` → indigo-500. Any other \`bo.*\` → violet-500. Everything else → slate-300 / dark slate-600.
- Admin events (types starting \`auth.\`, \`user.\`, \`role.\`, \`menu.\`) are hidden unless \`isSuperUser\` is true.
- Rows are shown in the order given (newest first).
- Empty: a 12px slate-400 paragraph: "Nothing recorded yet. Every release, submission and approval lands here — this feed is the audit trail, not a summary of one."

## API
\`events: { id: number; type: string; createdAt: string; actor: string | null; ref: string | null; payload: Record<string, unknown> | null }[]\`, \`isSuperUser: boolean\`. Export the \`FeedEvent\` type.

## Demo
Three events on 2026-08-31 / 08-30: Grace Hopper approved REQ-4471, Alan Turing submitted REQ-4470, Ada Lovelace's REQ-4468 rejected. Add one \`auth.failed\` row to show the super-user filter.`,

  'status-bar': `Build a status-distribution bar (a single stacked bar with a legend) component in React + TypeScript + Tailwind CSS. Plain divs, no chart library: there is one dimension here, and a stacked bar reads it at a glance.

## Look
- A house panel with \`p-5 space-y-3\`.
- Header row (\`flex items-baseline justify-between\`): the title "Queue by status" (10px semibold uppercase wide-tracking slate-500 / dark slate-400), and on the right the total in 10px slate-400 / dark slate-500: "1 request" or "N requests".
- The bar: \`flex h-2 w-full overflow-hidden rounded-full\` on a slate-100 / dark slate-800 track. One segment per status with a non-zero count, its width \`count / total * 100%\`, filled with the status colour. Zero-count statuses draw no segment.
- The legend below: \`grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5\`. Each item is \`flex items-center gap-1.5 text-[11px]\`: a 6px dot, the label in slate-500 / dark slate-400 (truncating), and the count pushed right (\`ml-auto\`) in semibold tabular slate-700 / dark slate-200.

## Behaviour
- Four statuses in a fixed lifecycle order, whatever order the counts arrive in: Pending (amber-500), Submitted (violet-500), Approved (emerald-500), Rejected (rose-500). A missing key counts as 0, and keys that are not one of the four are ignored.
- Hover titles: a segment shows "Approved: 1204". A legend item shows the status's one-line hint, e.g. Pending: "Raised here and waiting for release. Nothing has been sent yet."
- Total 0: the bar is replaced by a 12px slate-400 paragraph, "Nothing in the queue. Statuses appear here as requests move through the lifecycle." The legend still shows, with all zeros.

## API
\`counts: Record<string, number>\`, keyed by status label ("Pending", "Submitted", "Approved", "Rejected").

## Demo
\`{ Pending: 12, Submitted: 42, Approved: 1204, Rejected: 18 }\`.`,

  'status-steps': `Build a compact lifecycle stepper (inline progress dots) component in React + TypeScript + Tailwind CSS. It sits in a table row beside a status badge: the badge says what the status is now, and this shows how far the item has got.

## Look
- An \`<ol>\`, \`flex items-center gap-1 leading-tight\`. Each step is \`flex items-center gap-1\`: a 6px round dot, then its label in 10px \`whitespace-nowrap\` text.
- Between steps: a 12px × 1px connector line, slate-200 / dark slate-700 when the step after it is upcoming, otherwise slate-300 / dark slate-600.
- Dot and label by step state:
  - done: dot slate-400 / dark slate-500, label slate-500 / dark slate-400.
  - current: dot and label take the step's tone, and the label is semibold. Tones: active = amber-500 dot with amber-700 / dark amber-400 text; good = emerald-500 with emerald-700 / dark emerald-400; bad = rose-500 with rose-700 / dark rose-400; neutral = slate-400 with slate-400 / dark slate-500.
  - upcoming: dot slate-200 / dark slate-700, label slate-300 / dark slate-600.
  - skipped: a hollow dot (transparent with a dashed slate-300 / dark slate-600 border), label slate-300 / dark slate-600 with a line through it.

## Behaviour
Always three steps: raised → sent → settled. Approved and Rejected are two outcomes of the same moment, so they share the last step and never appear as separate steps. Map the status like this:
- Pending, or any unknown status: **Pending** current (active), Submitted upcoming, Approved upcoming.
- Submitted: Pending done, **Submitted** current (active), Approved upcoming.
- Approved: Pending done, Submitted done, **Approved** current (good).
- Rejected or Failed: Pending done, Submitted done, **Rejected** / **Failed** current (bad).
- Duplicate: Pending done, Submitted SKIPPED (it was never sent), **Duplicate** current (bad).

## Accessibility
Colour is never the only signal: the current step is also the only bold label and the only filled coloured dot. Dots and connectors are \`aria-hidden\`, and the list has \`aria-label="Progress: <current step label>"\`.

## API
\`status: string\`.

## Demo
Stack six rows, one per status: Pending, Submitted, Approved, Rejected, Failed, Duplicate.`,

  badge: `Build a status badge (pill) component in React + TypeScript + Tailwind CSS.

## Look
- \`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold leading-none ring-1 ring-inset\`. \`leading-none\` matters: without it the badge inherits a table cell's tall line-height and stretches into an oval.
- Tones (background / text / ring, then dark):
  - neutral: slate-100 / slate-700 / slate-200; dark slate-800 / slate-300 / slate-700.
  - info: indigo-50 / indigo-700 / indigo-200; dark \`indigo-500/10\` / indigo-300 / \`indigo-500/30\`.
  - success, warning, danger: the same recipe in emerald, amber and rose.
- \`dot\`: a 6px circle before the text, filled with \`bg-current\` at 70% opacity and \`aria-hidden\`. Use it when the badge shows a state rather than a count.

## API
\`tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger'\` (default neutral), \`dot?: boolean\` (default false), \`className?\`, \`children\`. Export the \`BadgeTone\` type.

## Demo
Two rows of all five tones, one plain and one with dots, e.g. "Draft", "Syncing", "Active", "Expiring", "Suspended".`,

  progress: `Build a determinate progress bar component in React + TypeScript + Tailwind CSS.

## Look
- Optional header row above the bar (\`mb-1 flex items-center justify-between text-[11px]\`, slate-600 / dark slate-300): the label on the left, and when \`showValue\` is set the percentage on the right in semibold tabular nums.
- Track: \`h-1.5 w-full overflow-hidden rounded-full\`, slate-200 / dark slate-700.
- Fill: full-height, rounded-full, width animated with a 300ms transition. Tones: indigo \`bg-indigo-600\`, emerald \`bg-emerald-500\`, amber \`bg-amber-500\`, rose \`bg-rose-500\`.

## Behaviour
- Percentage = \`value / max * 100\`, clamped to 0–100. Values computed from live counts often go over 100, and an unclamped fill paints outside its track. The shown value is \`Math.round(pct)%\`.

## Accessibility
The track is \`role="progressbar"\` with \`aria-valuenow\` set to the rounded percentage, \`aria-valuemin={0}\` and \`aria-valuemax={100}\`.

## API
\`value: number\`, \`max?: number\` (100), \`tone?: 'indigo' | 'emerald' | 'amber' | 'rose'\` (indigo), \`label?: ReactNode\`, \`showValue?: boolean\` (false), \`className?\`.

## Demo
Stacked at max-w-md: Seats used 72 (indigo), Storage 38 (emerald), API quota 91 (amber), and "Over budget" at 140 (rose), which clamps to 100%.`,

  skeleton: `Build a loading skeleton placeholder component in React + TypeScript + Tailwind CSS.

## Look
- Every shape is \`animate-pulse bg-slate-200 dark:bg-slate-700\`, rendered as block \`<span>\`s so it can sit inside inline contexts.
- \`circle\`: \`rounded-full\`, default size \`h-9 w-9\`.
- \`rect\`: \`rounded-lg\`, default size \`h-24 w-full\`.
- \`text\` (default): \`lines\` bars stacked \`space-y-1.5\`, each \`h-3 rounded w-full\`. With more than one line, the last is \`w-2/3\`: a block of equal-length bars reads as a table, not as text.
- On circle and rect, \`className\` replaces the default size. On text, it is added to every line.

## Accessibility
Every shape is \`aria-hidden\`. The surrounding region is responsible for announcing that it is busy.

## API
\`variant?: 'text' | 'circle' | 'rect'\` (text), \`lines?: number\` (1), \`className?\`.

## Demo
At max-w-md: a circle beside a two-line text block (an avatar row), a rect, then a four-line paragraph.`,

  'option-pill': `Build a select-option pill (tinted tag chip, optionally removable) component in React + TypeScript + Tailwind CSS. It draws one user-defined option (a status, tag or priority) the same way in a grid cell, a filter list and a form.

## Look
- \`inline-flex max-w-full items-center gap-1 rounded-full py-1 text-[11px] font-medium leading-none ring-1 ring-inset align-middle\`, padded \`px-2.5\`, or \`pl-2.5 pr-1\` when removable. The label truncates. \`leading-none\` and \`align-middle\` stop it inheriting a table cell's line-height.
- Seventeen tones, in this palette order: sky, amber, slate, emerald, zinc, rose, violet, indigo, orange, yellow, lime, teal, cyan, blue, purple, fuchsia, pink. Each is \`bg-<hue>-50 text-<hue>-700 ring-<hue>-200\`, with dark \`bg-<hue>-950/40 text-<hue>-300 ring-<hue>-900\`. The exceptions: slate is dark \`bg-slate-800/60\` with a slate-700 ring; zinc is \`bg-zinc-100 text-zinc-600\`, dark \`bg-zinc-800/60 text-zinc-400 ring-zinc-700\`. Write every class string out in full. Tailwind cannot see interpolated names like \`bg-\${hue}-50\`, so they compile to nothing.
- An unknown tone draws slate.
- Removable chip: a 16×16 round × button inside the pill (10px X icon) at 60% opacity, 100% on hover, with a hover background of \`black/10\` / dark \`white/10\`.

## Behaviour
- The × button has \`aria-label="Remove <label>"\` and \`tabIndex={-1}\`. It calls \`preventDefault\` and \`stopPropagation\` on mousedown, so an editor's input keeps focus. Otherwise the click would remove the chip AND blur the field, closing the editor in one gesture. Click stops propagation and calls \`onRemove\`.
- \`title\` defaults to the label, so a truncated pill can be read on hover.
- Also export \`optionTone(option, index)\`: the option's own tone when it has a valid one, else the tone at \`index % 17\` in palette order. Index against the FULL option list, not a filtered one, or removing an option recolours every option after it.
- Also export \`OptionPills({ value, options, wrap? })\`, which renders a stored value (a string or an array) as pills. Each value is looked up in \`options\` for its label and tone. A value no option matches shows the raw value in slate, so a wiring mistake stays visible. Empty or null renders nothing. \`wrap\` is \`flex flex-wrap gap-1\` for forms; otherwise one line, \`overflow-hidden whitespace-nowrap\`, clipped at the right for grid cells.

## API
\`OptionPill\`: \`label: string\`, \`tone?: string\` (slate), \`onRemove?: () => void\`, \`className?\`, \`title?\`. \`OptionPills\`: \`value: unknown\`, \`options: { value: string; label: string; tone?: string }[]\`, \`wrap?: boolean\`, \`className?\`.

## Demo
Statuses with stored tones (To do slate, In progress sky, In review amber, Done emerald). Tags coloured by position (Bug, Feature, Docs, Infra, Customer). Three removable chips, with a Reset button once all are gone.`,

  'chart-theme': `Build a shared chart theming module in React + TypeScript: one place for chart colours and number formats, so every chart in a dashboard uses the same palette and adapts to light and dark mode. Charts use it with Recharts. It is a module of hooks, pure functions and formatters, with no UI of its own.

## Dark mode
Both hooks read the active scheme from your theme state: the \`.dark\` class on <html>, or a theme context that toggles it. Each returns a plain object of hex strings to pass as Recharts props.

## \`chartPalette(dark: boolean)\` and the \`useChartPalette()\` hook
Returns \`{ dark, categorical, ordinal, sequential, diverging, muted, surface, grid, axis, ink, inkSecondary }\`:
- \`categorical\`, eight hues in a FIXED order. Light: #2a78d6, #eb6834, #1baf7a, #eda100, #e87ba4, #008300, #4a3aa7, #e34948. Dark: #3987e5, #d95926, #199e70, #c98500, #d55181, #008300, #9085e9, #e66767.
  - Series take slots in the order they are DECLARED, never by rank, so filtering one out does not repaint the rest.
  - The order is also the colour-blind-safety mechanism: each adjacent pair stays distinguishable under colour-vision-deficiency simulation.
  - Three light hues fall under 3:1 contrast on white, so charts carry a legend and a table view, and identity never rests on colour alone.
  - A scatter, where every pair of series can touch, uses only the first three slots.
  - Past eight series, fold the rest into "Other". Never generate a ninth colour.
- \`ordinal\` (a funnel's stage ramp, one hue). Light: #104281, #1c5cab, #2a78d6, #5598e7, #86b6ef. Dark: #cde2fb, #9ec5f4, #6da7ec, #3987e5, #256abf.
- \`sequential\` (heatmap, near zero → most). Light: #e8f1fd, #cde2fb, #9ec5f4, #6da7ec, #3987e5, #256abf, #184f95, #0d366b. Dark: #26324a, #184f95, #1c5cab, #256abf, #3987e5, #6da7ec, #9ec5f4, #cde2fb.
- \`diverging\`: negative #e34948 / dark #e66767, positive #2a78d6 / dark #3987e5, mid #e2e8f0 / dark #475569 (a grey midpoint that reads as "nothing").
- Chrome, light / dark:
  - \`muted\` #94a3b8 / #64748b: the de-emphasis grey for context series and sparkline history.
  - \`surface\` #ffffff / #1e293b: the card colour, used for 2px gaps between touching marks.
  - \`grid\` #e2e8f0 / #334155.
  - \`axis\` #64748b / #94a3b8.
  - \`ink\` #0f172a / #f1f5f9 and \`inkSecondary\` #475569 / #cbd5e1.
- Export \`type ChartPalette = ReturnType<typeof chartPalette>\`.

## \`useChartTheme()\`, the older named-series theme
Returns \`{ dark, axis, grid, tooltip, series }\`:
- \`axis\` #6b7280 / dark #9ca3af, and \`grid\` #e5e7eb / dark #374151.
- \`tooltip\`: a CSSProperties object for Recharts \`contentStyle\`. Background #ffffff / #1f2937, border \`1px solid\` in the grid colour, radius 0.5rem, text #111827 / #f3f4f6, fontSize 12px.
- \`series\`: spend #f59e0b, deposit #10b981, registrations #6366f1, ftd #3b82f6, positive #10b981, negative #ef4444, retention #8b5cf6, retentionD30 #ec4899.

## Formatters (en-US)
- \`compactCurrency\`: USD, compact notation, max one decimal, e.g. "$184.3K".
- \`fullCurrency\`: USD with no decimals, e.g. "$184,320".
- \`compactNumber\`: compact notation, max one decimal, e.g. "1.2K".
- \`percent\`: \`\${v.toFixed(0)}%\`.

## Companion helpers for cartesian charts
- \`type ChartSeries = { key: string; label: string; slot?: number }\`.
- \`seriesColor(palette, series, index)\` returns \`categorical[series.slot ?? index]\`, capped at the last slot. A chart whose series come and go (a filter, a toggle) should pin \`slot\` so each colour stays with its series.
- \`axisProps(palette)\` returns \`{ tick: { fontSize: 11, fill: axis }, stroke: grid, tickLine: false }\`: solid hairlines and muted ticks, spread onto every XAxis and YAxis.

## Demo
A page of swatch rows for each ramp (categorical, ordinal, sequential, diverging) in the current mode, with a light/dark toggle, and a small Recharts line chart of three series using \`seriesColor\` and \`axisProps\`.`,
};
