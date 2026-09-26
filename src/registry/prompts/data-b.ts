/** AI prompts — see `./index.ts` for what a prompt is for. */

export const DATA_B_PROMPTS: Record<string, string> = {
  'chart-card': `Build a chart card component in React + TypeScript + Tailwind CSS: the frame a chart sits in, with a title, an info hint, a legend and a one-click table view of the same numbers.

## Look
- Card: panel surface, \`p-5\`. Header row (\`flex flex-wrap items-center gap-x-3 gap-y-2 mb-3\`): the title as a section title (10px semibold uppercase, wide tracking, slate-500), followed by a 14px lucide \`Info\` icon button (slate-400, hover slate-600) that shows the hint in a wide tooltip on hover AND focus.
- Legend: shown only for two or more entries, and only in chart view (a single series needs none, the title names it). An inline wrapping list, 11px slate-600 / dark slate-300, \`gap-x-3\`. Each entry is a swatch then the label. Swatch shapes: \`rect\` a 10px \`rounded-sm\` square (default), \`line\` a 14×3px \`rounded-full\` stroke, \`dot\` an 8px circle.
- Right end (\`ml-auto\`): an optional actions slot, then a two-button segmented toggle — lucide \`BarChart3\` and \`Table2\` at 14px, \`p-1.5\`, inside a \`rounded-lg\` bordered group (slate-200 / dark slate-700, overflow hidden). Active: \`bg-slate-100 text-slate-700\` (dark \`bg-slate-700 text-slate-100\`). Inactive: slate-400, hover slate-600 (dark hover slate-200). The toggle is two small icons so the chart stays the first thing seen.
- Table view replaces the plot: a \`max-h-[320px]\` scroll box with a \`rounded-lg\` border. Sticky header row (10px semibold uppercase, \`bg-slate-50/95\` / dark \`bg-slate-900/95\`, bottom border), body text-xs with row dividers slate-100 / dark slate-800, \`px-3\` cells. Right-aligned columns get \`tabular-nums\`; a missing value prints "—".
- Empty: a 240px-tall box with "No data for the selected period." centred, text-xs slate-400 / dark slate-500.

## Companion tooltip
Also export a \`ChartTooltip\` for Recharts' \`<Tooltip content>\`: an opaque floating card, \`min-w-[8rem] px-3 py-2 text-xs shadow-lg\`. An optional label line on top (11px slate-500). Then one row per series: a 14×3px rounded stroke in the series colour (a stroke, not a filled box — at tooltip size a box is ink doing a label's job), the VALUE first in semibold tabular-nums slate-900 / dark slate-50, then the series name in slate-500. Props: \`active\`, \`label\`, \`payload\`, \`format(v: number)\`, \`labelFormat(l)\`. Renders nothing when inactive or the payload is empty.

## Behaviour
- Local state \`'chart' | 'table'\`, starting on chart. The toggle is hidden when no \`table\` is passed.
- The table is not optional polish: it is the view that works for a screen reader, for a colour-blind reader, and for anyone who wants the exact number — so a hover tooltip is never the only way to read a value.

## API
\`title: string\`, \`hint?: string\`, \`legend?: { label: string; color: string; shape?: 'rect' | 'line' | 'dot' }[]\`, \`table?: { columns: { key: string; label: string; align?: 'left' | 'right'; format?: (v: unknown) => string }[]; rows: Record<string, unknown>[] }\`, \`actions?: ReactNode\`, \`empty = false\`, \`className?\`, \`children\` (the plot).

## Accessibility
\`<section aria-label={title}>\` with the title as an \`<h2>\`. The info button is labelled "About {title}". The toggle is \`role="group"\` \`aria-label="Chart or table"\`; its buttons carry \`aria-pressed\` and \`aria-label\` "Show chart" / "Show table". Legend swatches are \`aria-hidden\`.

## Demo
"Seats by plan" with a one-sentence hint, a legend of Used (#2a78d6) and Free (#eb6834), a table of Pro 412 / 88 and Enterprise 1,904 / 96, and a placeholder child "Any chart goes here."`,

  'bar-chart': `Build a bar chart component (grouped, stacked, or horizontal) in React + TypeScript + Tailwind CSS, drawn with Recharts (\`BarChart\`, \`Bar\`, \`ResponsiveContainer\`).

## Look
- Frame: a panel card (\`p-5\`) with a header holding the title as a 10px uppercase section title plus an ⓘ hint tooltip, a legend when there are 2+ series (10px \`rounded-sm\` swatch + 11px label), and at the right a two-icon chart / table toggle (lucide \`BarChart3\` / \`Table2\`). The table view lists the category plus one right-aligned, formatted column per series. No rows → a 240px "No data for the selected period." placeholder.
- Plot: default 280px tall, full width, margin top 4 / right 8 / left 0.
- Grid: solid hairlines only across the value axis (horizontal lines for columns, vertical for horizontal bars), #e2e8f0 / dark #334155. Ticks 11px #64748b / dark #94a3b8, no tick marks, axis line in the grid colour. The value axis has no axis line and is 48px wide; in horizontal mode the category axis is 96px wide.
- Bars are capped at 24px and never fill the band (\`barCategoryGap\` 28%, \`barGap\` 2) — the leftover is air.
- Data ends are rounded 4px and square at the baseline (columns \`[4,4,0,0]\`, horizontal \`[0,4,4,0]\`). Stacked: only the outermost (last) series is rounded, and touching segments are separated by a thin stroke in the card's own colour (#ffffff / dark #1e293b) rather than a drawn border.
- Series colours come from one fixed categorical order — light #2a78d6, #eb6834, #1baf7a, #eda100, #e87ba4, #008300, #4a3aa7, #e34948; dark #3987e5, #d95926, #199e70, #c98500, #d55181, #008300, #9085e9, #e66767 (choose the set from the active mode). A series uses its \`slot\` if given, else its declaration index, clamped to eight: pinning slots means filtering one series out never repaints the survivors. A ninth series is a design error — fold it into "Other".

## Behaviour
- Hover: the band is shaded \`rgba(15,23,42,0.04)\` (dark \`rgba(255,255,255,0.04)\`) and ONE tooltip lists every series in that category — an opaque floating card, category in 11px slate-500 on top, then per series a 14×3px colour stroke, the value in semibold tabular-nums, the series name in slate-500.
- Horizontal mode grows with the data: height = max(height, rows × 36 + 32).
- Animation off.
- Default value format: compact number (\`Intl.NumberFormat\`, \`notation: 'compact'\`, max 1 fraction digit → "42.6K"), used on the value axis, tooltip and table.

## API
\`title\`, \`hint?\`, \`data: Record<string, string | number>[]\`, \`x: string\` (category key; its table header is the key capitalised), \`series: { key: string; label: string; slot?: number }[]\`, \`stacked = false\`, \`horizontal = false\`, \`format?: (v: number) => string\`, \`height = 280\`, \`className?\`.

## Demo
"MRR by plan": twelve months Oct–Sep with Starter (~$18K–29K), Pro (~$42K–70K) and Enterprise (~$61K–115K) on slots 0–2, formatted as compact currency ("$64.2K"). Show it grouped, then stacked, then a horizontal "Open tickets by team" with Open / Overdue: Customer success 184 / 22, Billing 96 / 14, Integrations 71 / 5, Platform 58 / 9, Security 23 / 1.`,

  'line-chart': `Build a multi-series line chart component in React + TypeScript + Tailwind CSS, drawn with Recharts (\`LineChart\`, \`Line\`, \`ResponsiveContainer\`), for change over time on ONE axis.

## Look
- Frame: a panel card (\`p-5\`) with a header holding the title as a 10px uppercase section title plus an ⓘ hint tooltip, a legend when there are 2+ series (a 14×3px rounded line swatch + 11px label), and at the right a two-icon chart / table toggle (lucide \`BarChart3\` / \`Table2\`). The table view lists x plus one right-aligned formatted column per series. No rows → a 240px "No data for the selected period." placeholder.
- Plot: default 280px tall, full width, margin top 8 / right 12 / left 0.
- Grid: horizontal hairlines only, #e2e8f0 / dark #334155. Ticks 11px #64748b / dark #94a3b8, no tick marks; x-axis line in the grid colour with \`minTickGap\` 24 so labels never collide; y-axis 48px wide with no axis line.
- Lines: monotone curve, 2px, round caps and joins, no point dots. The hovered point is an 8px dot in the series colour ringed 2px in the card's colour (#ffffff / dark #1e293b) so it reads where lines cross.
- Series colours from one fixed categorical order — light #2a78d6, #eb6834, #1baf7a, #eda100, #e87ba4, #008300, #4a3aa7, #e34948; dark #3987e5, #d95926, #199e70, #c98500, #d55181, #008300, #9085e9, #e66767. A series uses its \`slot\` if given, else its declaration index (max eight).
- \`emphasis\`: the named series keeps its colour and every other line (and legend swatch) turns muted grey #94a3b8 / dark #64748b — when one line is the point, colouring all of them buries it.

## Behaviour
- The hover crosshair is a 1px vertical line in the tick colour that snaps to the nearest x, and ONE tooltip lists every series there, so the pointer never has to land on a line. Tooltip: an opaque floating card, the x label (through \`xFormat\`) in 11px slate-500, then per series a 14×3px colour stroke, the value in semibold tabular-nums, the series name in slate-500.
- Animation off. Default value format: compact number ("9.4K").
- Design rule: no second y-axis. Two measures of different scale get two charts, or are indexed to a common base — a dual axis invents a correlation from where the scales happen to line up.

## API
\`title\`, \`hint?\`, \`data: Record<string, string | number>[]\`, \`x: string\`, \`series: { key: string; label: string; slot?: number }[]\`, \`emphasis?: string\` (a series key), \`format?: (v: number) => string\`, \`xFormat?: (v: unknown) => string\` (ticks, tooltip and table; default \`String\`), \`height = 280\`, \`className?\`.

## Demo
"Weekly active users", weeks W21–W36, four regions on slots 0–3: Europe (~8.2K–10K), Americas (~11.4K–13K), Asia-Pacific (climbing from 4.1K to 10.4K) and Middle East & Africa (~2.6K–3.1K). A second instance titled "Asia-Pacific is where the growth is" with \`emphasis="apac"\`.`,

  'area-chart': `Build an area chart component (single or stacked) in React + TypeScript + Tailwind CSS, drawn with Recharts (\`AreaChart\`, \`Area\`, \`ResponsiveContainer\`), for a trend where the filled volume matters.

## Look
- Frame: a panel card (\`p-5\`) with a header holding the title as a 10px uppercase section title plus an ⓘ hint tooltip, a legend when there are 2+ series (10px \`rounded-sm\` square swatch + 11px label), and at the right a two-icon chart / table toggle (lucide \`BarChart3\` / \`Table2\`). The table view lists x plus one right-aligned formatted column per series. No rows → a 240px "No data for the selected period." placeholder.
- Plot: default 280px tall, full width, margin top 8 / right 12 / left 0.
- Grid: horizontal hairlines only, #e2e8f0 / dark #334155. Ticks 11px #64748b / dark #94a3b8, no tick marks; x-axis with \`minTickGap\` 24; y-axis 48px wide with no axis line.
- Each area: monotone curve, a 2px line in the series hue on top of a ~12% opacity wash of the same hue — never a saturated block. The hovered point is an 8px dot in the series colour ringed 2px in the card colour (#ffffff / dark #1e293b).
- \`stacked\`: the areas stack into a total, so the top edge is the sum and each band is one series' share.
- Series colours from one fixed categorical order — light #2a78d6, #eb6834, #1baf7a, #eda100, #e87ba4, #008300, #4a3aa7, #e34948; dark #3987e5, #d95926, #199e70, #c98500, #d55181, #008300, #9085e9, #e66767. A series uses its \`slot\` if given, else its declaration index (max eight).

## Behaviour
- Hover: a 1px vertical crosshair in the tick colour snaps to the nearest x; ONE tooltip lists every series there — an opaque floating card, x label (through \`xFormat\`) in 11px slate-500, then per series a 14×3px colour stroke, the value in semibold tabular-nums, the series name in slate-500.
- Animation off. Default value format: compact number.
- One y-axis only; never a second axis for a measure on a different scale.

## API
\`title\`, \`hint?\`, \`data: Record<string, string | number>[]\`, \`x: string\`, \`series: { key: string; label: string; slot?: number }[]\`, \`stacked = false\`, \`format?: (v: number) => string\`, \`xFormat?: (v: unknown) => string\` (default \`String\`), \`height = 280\`, \`className?\`. (It is the line chart's sibling: same props, minus \`emphasis\`, plus \`stacked\` — build both on one shared internal chart if you have the line chart too.)

## Demo
"MRR by plan", stacked, with the hint "The top edge is total MRR, each band a plan's share of it": twelve months Oct–Sep, Starter (~$18K–29K), Pro (~$42K–70K) and Enterprise (~$61K–115K) on slots 0–2, formatted as compact currency.`,

  'donut-chart': `Build a donut chart component in React + TypeScript + Tailwind CSS, drawn with Recharts (\`PieChart\`, \`Pie\`, \`Cell\`), for part-to-whole at a glance with every slice also listed beside the ring.

## Look
- Frame: a panel card (\`p-5\`) with a header holding the title as a 10px uppercase section title plus an ⓘ hint tooltip, and at the right a two-icon chart / table toggle (lucide \`BarChart3\` / \`Table2\`). No legend in the header — the list beside the ring is the legend.
- Body: \`flex flex-col items-center gap-4 sm:flex-row\` — ring, then list.
- Ring: a square \`height\` × \`height\` box (default 220px). Inner radius 64%, outer 100%, starting at 12 o'clock and running clockwise. Slices are separated by a 2px stroke in the card's colour (#ffffff / dark #1e293b), not a border.
- Centre overlay (pointer-events none): the total in \`text-xl\` semibold slate-900 / dark slate-50, and under it \`centerLabel\` in 11px slate-500.
- Slice colours, by rank after sorting: light #2a78d6, #eb6834, #1baf7a, #eda100, #e87ba4, #008300; dark #3987e5, #d95926, #199e70, #c98500, #d55181, #008300. The folded "Other" is grey #94a3b8 / dark #64748b — it is context, not an entity.
- List (\`flex-1 min-w-0 space-y-1.5 text-xs\`): per slice a 10px \`rounded-sm\` swatch, the label (truncating, slate-600 / dark slate-300), the value (medium, tabular-nums, slate-900 / dark slate-100), and the share (\`w-12\` right-aligned, tabular-nums, slate-500), e.g. "40.9%".

## Behaviour
- Slices sort largest first. Past SIX slices the top five stay and the rest fold into one "Other" with their summed value — never a seventh hue. A donut is for "roughly what share", not for ranking close values.
- Share = value / total to one decimal ("—" when the total is 0). Hover tooltip: an opaque floating card with a 14×3px colour stroke, "4.8K · 40.9%" in semibold tabular-nums and the slice name in slate-500.
- Table view columns: Segment, Value (right, formatted), Share (right). Total of 0 → the 240px "No data for the selected period." placeholder.
- Animation off. Default format: compact number.

## API
\`title\`, \`hint?\`, \`data: { label: string; value: number }[]\`, \`format?: (v: number) => string\`, \`centerLabel = 'Total'\`, \`height = 220\`, \`className?\`.

## Demo
"Sign-ups by channel" in a \`max-w-xl\` wrapper, seven channels so two fold into Other: Organic search 4,820, Paid social 2,950, Referral 1,730, Partners 1,120, Events 640, Podcast 310, Other 205.`,

  'scatter-chart': `Build a scatter plot component in React + TypeScript + Tailwind CSS, drawn with Recharts (\`ScatterChart\`, \`Scatter\`, \`ZAxis\`), for two measures per item across up to three groups.

## Look
- Frame: a panel card (\`p-5\`) with a header holding the title as a 10px uppercase section title plus an ⓘ hint tooltip, a legend when there are 2+ groups (8px dot swatch + 11px label), and at the right a two-icon chart / table toggle (lucide \`BarChart3\` / \`Table2\`).
- Plot: default 300px tall, full width, margin top 8 / right 12 / left 0 / bottom 16.
- Full grid (both directions), #e2e8f0 / dark #334155. Ticks 11px #64748b / dark #94a3b8, no tick marks. Both axes numeric. The x-axis title sits inside the bottom edge; the y-axis title is rotated −90° and centred on the left edge; both 11px in the tick colour. y-axis 52px wide, no axis line.
- Markers: one fixed size (8px — area encodes nothing), filled in the group colour and ringed 2px in the card's colour (#ffffff / dark #1e293b) so overlapping points stay distinct.
- Group colours, first three categorical slots only — light #2a78d6, #eb6834, #1baf7a; dark #3987e5, #d95926, #199e70.

## Behaviour
- At most THREE groups. In a scatter every pair of groups can touch, and three is the most that stay distinguishable pairwise under colour-blind simulation. A fourth is dropped, with a development-only \`console.warn\` suggesting small multiples or a grey "Other".
- Hover: a 1px crosshair in the tick colour and a tooltip for the point under the pointer — an opaque floating card (\`px-3 py-2 text-xs\`): the point's label in medium slate-800 / dark slate-100, then two lines, each the formatted value (semibold, tabular-nums) followed by its axis name in slate-500.
- Table view columns: Group, Item (label or "—"), x, y (right-aligned, formatted). All groups empty → the 240px "No data for the selected period." placeholder.
- Animation off. Default formats: compact number.

## API
\`title\`, \`hint?\`, \`groups: { label: string; points: { x: number; y: number; label?: string }[] }[]\`, \`xLabel: string\`, \`yLabel: string\`, \`xFormat?\`, \`yFormat?\` (\`(v: number) => string\`), \`height = 300\`, \`className?\`.

## Demo
"Deal size against sales cycle", x "Days to close", y "Deal size" as compact currency: SMB (14 deals, 8–38 days, $2K–11K), Mid-market (12 deals, 28–68 days, $14K–44K), Enterprise (9 deals, 60–115 days, $48K–138K), each point labelled like "Enterprise deal 3".`,

  'heatmap': `Build a heatmap grid component in React + TypeScript + Tailwind CSS (plain divs, no chart library) for magnitude over two categorical axes, such as activity by weekday and hour.

## Look
- Frame: a panel card (\`p-5\`) with a header holding the title as a 10px uppercase section title plus an ⓘ hint tooltip, and at the right a two-icon chart / table toggle (lucide \`BarChart3\` / \`Table2\`).
- Body: a relative, \`overflow-x-auto\` wrapper around an \`inline-grid\` with \`gap-[2px]\` and columns \`auto repeat(N, cellSize px)\`. The 2px gap IS the grid — no cell borders.
- Labels 10px slate-500 / dark slate-400. A top row of column labels, centred and tabular; with more than 12 columns only every other label is shown so they never collide. Row labels right-aligned with \`pr-2\`, line-height equal to the cell size.
- Cells: \`cellSize\` square (default 22px), \`rounded-[3px]\`.
- Colour: one hue, binned into 8 steps by share of the maximum (\`floor(v / max × 8)\`, clamped to the last step). Light ramp, near-zero → most: #e8f1fd, #cde2fb, #9ec5f4, #6da7ec, #3987e5, #256abf, #184f95, #0d366b. Dark ramp (runs the other way, so "more" is always more contrast against the surface): #26324a, #184f95, #1c5cab, #256abf, #3987e5, #6da7ec, #9ec5f4, #cde2fb.
- Scale legend under the grid (\`mt-3\`, 10px slate-500): "Less", the eight swatches as 16×10px \`rounded-[2px]\` chips, "More", then "peak 1.3K" in tabular-nums.

## Behaviour
- Hovering a cell brightens it (\`brightness-110\`) and rings it 2px slate-900/60 (dark white/70), and shows a tooltip centred above the cell with a 6px gap: an opaque floating card (\`px-2.5 py-1.5 text-xs\`, pointer-events none) with the value in semibold tabular-nums then "Tue · 14" (row · column) in slate-500. Leaving the grid clears it.
- Table view: one row per grid row, the row name first and one right-aligned formatted column per grid column.
- A max of 0 → the 240px "No data for the selected period." placeholder. Missing values count as 0. Default format: compact number.

## API
\`title\`, \`hint?\`, \`rows: string[]\`, \`columns: string[]\`, \`values: number[][]\` (\`values[row][column]\`), \`format?: (v: number) => string\`, \`cellSize = 22\`, \`className?\`.

## Accessibility
The grid is \`role="img"\` with an \`aria-label\` like "Sessions by weekday and hour: 7 by 24 grid, peak 1.3K. The table view lists every value."; the legend swatches are \`aria-hidden\`.

## Demo
"Sessions by weekday and hour": rows Mon–Sun, columns 00–23. Weekday working hours 09–18 run ~1,200, the 07–21 shoulders ~45% of that, nights ~8%, weekends ~35% of weekdays, and a lunch dip to 80% at 13:00.`,

  'funnel-chart': `Build a conversion funnel chart component in React + TypeScript + Tailwind CSS (plain divs, no chart library): ordered stages, each a subset of the one before, and where people drop out.

## Look
- Frame: a panel card (\`p-5\`) with a header holding the title as a 10px uppercase section title plus an ⓘ hint tooltip, and at the right a two-icon chart / table toggle (lucide \`BarChart3\` / \`Table2\`).
- An \`<ol>\` with \`space-y-2\`. Each stage row is a grid \`[7.5rem_minmax(0,1fr)]\` with \`gap-3\`: the stage label right-aligned and truncating (text-xs slate-600 / dark slate-300), then the bar followed by its annotation.
- Bar: 24px tall, square on the left, \`rounded-r-[4px]\`, \`px-2\`. Width = value ÷ FIRST stage × 100%, never under 1.5%, so the shrinking reads as loss.
- Colour: one hue stepped along an ordinal ramp, because the stages are ordered, not unrelated groups. Light, first → last: #104281, #1c5cab, #2a78d6, #5598e7, #86b6ef. Dark: #cde2fb, #9ec5f4, #6da7ec, #3987e5, #256abf. Spread the ramp over however many stages there are (stage i takes step \`round(i / (n − 1) × 4)\`; a single stage takes the middle step).
- Value label: inside the bar when it is wider than ~34% — 11px semibold tabular-nums, white or slate-900 chosen by the fill's relative luminance (> 0.4 → dark ink), since the ramp runs the other way in dark mode. A shorter bar carries its value outside, right after the bar, in semibold slate-800 / dark slate-100 — never clipped.
- After the bar, from the second stage on: "42.6% of previous" in 11px tabular-nums slate-500.
- Summary line under the list (\`mt-3\`, 11px slate-500): "**2.5%** of visited pricing reach paid." — the percentage semibold slate-800 / dark slate-100, the first and last labels lower-cased.

## Behaviour
- Percentages to one decimal ("—" when dividing by 0). Each row's \`title\` is "Paid: 1.2K (2.5% of Visited pricing)".
- Table view columns: Stage, Count, From previous, From top (the first row's "From previous" is "—").
- A first stage of 0 → the 240px "No data for the selected period." placeholder. Default format: compact number.

## API
\`title\`, \`hint?\`, \`stages: { label: string; value: number }[]\`, \`format?: (v: number) => string\`, \`className?\`.

## Demo
"Trial onboarding" in a \`max-w-2xl\` wrapper: Visited pricing 48,200 → Started trial 9,640 → Invited a teammate 4,110 → Connected data 2,380 → Paid 1,190.`,

  'diverging-bars': `Build a diverging bar chart component in React + TypeScript + Tailwind CSS, drawn with Recharts (a vertical-layout \`BarChart\` with \`Cell\`, \`LabelList\` and \`ReferenceLine\`), for values above or below a baseline — change against target, gain against loss.

## Look
- Frame: a panel card (\`p-5\`) with a header holding the title as a 10px uppercase section title plus an ⓘ hint tooltip, a two-entry legend "Above" / "Below" (10px \`rounded-sm\` swatches + 11px labels), and at the right a two-icon chart / table toggle (lucide \`BarChart3\` / \`Table2\`).
- Horizontal bars, one per item, labels on the left (category axis 96px wide, no axis line). Height = max(200, items × 34 + 24)px. Right margin 48px so the value labels fit.
- Grid: vertical hairlines only, #e2e8f0 / dark #334155; ticks 11px #64748b / dark #94a3b8, no tick marks. A zero reference line in the tick colour.
- Two hues that read as opposites: positive (above) blue #2a78d6 / dark #3987e5, negative (below) red #e34948 / dark #e66767. Bars capped at 20px, \`barCategoryGap\` 30%.
- The data end is rounded 4px and the zero end square — so the rounded side flips with the sign.
- Each bar carries its signed value at the tip (11px, #475569 / dark #cbd5e1), so direction never rests on colour alone.

## Behaviour
- Items keep the caller's order; \`sort\` orders them largest first, turning the chart into a ranking.
- Hover: the row band is shaded \`rgba(15,23,42,0.04)\` (dark \`rgba(255,255,255,0.04)\`) and a tooltip shows an opaque floating card with the item name in 11px slate-500, then a 14×3px colour stroke, the value in semibold tabular-nums and \`valueLabel\` in slate-500.
- Table view columns: Item, and \`valueLabel\` (right-aligned, formatted). No items → the 240px "No data for the selected period." placeholder. Animation off.
- Default format: signed locale number — "+6.2", "-3.9", "0".

## API
\`title\`, \`hint?\`, \`data: { label: string; value: number }[]\`, \`sort = false\`, \`format?: (v: number) => string\`, \`valueLabel = 'Change'\`, \`className?\`.

## Demo
"CSAT against target" (points vs each team's target this quarter) in a \`max-w-2xl\` wrapper, \`valueLabel="vs target"\`, one decimal with sign: Integrations +6.2, Billing +3.1, Platform +0.8, Customer success −1.4, Onboarding −3.9, Security −5.5.`,

  'sparkline': `Build a sparkline component in React + TypeScript + Tailwind CSS: a word-sized trend for a stat tile or a table cell, where the question is "which way is it going", not "what was it on the 4th". Plain inline SVG — no chart library; at this size a library's axes, margins and resize observers are all cost and no content.

## Look
- Default 96 × 28px SVG, 4px inner padding, no axes, grid or labels.
- Values are scaled min → max into the padded box (a flat series uses a span of 1, so it draws a straight line). Points are evenly spaced left to right and joined with straight segments.
- The history line is the de-emphasis grey — #94a3b8, dark #64748b — 2px with round caps and joins, no fill.
- Only the CURRENT (last) point is in the accent: an 8px circle in #2a78d6 (dark #3987e5) ringed 2px in the card colour (#ffffff / dark #1e293b), so the eye goes to "now".

## Behaviour
- Fewer than two values → render nothing.
- No hover or tooltip; it is a glyph, not a chart.

## API
\`values: number[]\`, \`width = 96\`, \`height = 28\`, \`label = 'Trend'\` (what is trending, for the accessible name), \`className?\`.

## Accessibility
\`role="img"\` with an accessible name that states the numbers the picture cannot: "MRR: from 42 to 64, up 52.4%" — first value, last value, and the change relative to the first (to one decimal, "up" or "down"; 0% when the first value is 0).

## Demo
Three stat tiles in a \`sm:grid-cols-3\` grid, each a panel with \`p-4\` and the text and sparkline bottom-aligned at opposite ends: an 11px slate-500 caption over a \`text-xl\` semibold value, sparkline on the right. MRR "$64K" [42, 44, 43, 47, 49, 48, 52, 55, 54, 58, 61, 64]; Churn "4.6%" [3.1, 3.0, 3.3, 3.2, 3.6, 3.4, 3.8, 3.7, 4.1, 4.0, 4.4, 4.6]; Seats "987" [820, 836, 851, 849, 872, 890, 903, 911, 934, 948, 961, 987].`,

  'tree': `Build a tree view component in React + TypeScript + Tailwind CSS: a hierarchical list with expand/collapse, three selection modes (single, multiple, tri-state checkbox), a filter that keeps ancestors, lazy-loaded children, and the full WAI-ARIA tree keyboard.

## Look
- Root: \`flex flex-col gap-2\`. Optional filter on top: a search input in the house field style with a 14px lucide \`Search\` icon inset at the left (\`left-2.5\`, slate-400) and \`pl-8\`; placeholder "Filter…".
- Row: \`flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs leading-none select-none\`, slate-700 / dark slate-200, hover \`bg-slate-100\` / dark \`bg-slate-800/60\`. Selected (single/multiple): \`bg-indigo-50 text-indigo-700\`, dark \`bg-indigo-500/10 text-indigo-300\`. Disabled: 50% opacity, not-allowed cursor.
- Row contents, in order: a 16px chevron slot (always reserved so labels align) holding a 14px \`ChevronRight\` in slate-400 that rotates 90° when open, a spinning \`Loader2\` while children load, or nothing for a leaf; in checkbox mode a 14px rounded box (unchecked: slate-300 border on white, dark slate-600 on slate-800; checked or mixed: indigo-600 fill, dark indigo-500, with a white 10px \`Check\` or \`Minus\`, stroke 3); an optional 14px icon in slate-400 / dark slate-500; the label, truncating. While filtering, the first match in a label is wrapped in a \`<mark>\` with \`bg-amber-100\` (dark \`amber-500/25\`), inherited text colour, \`rounded-sm\`.
- Nesting: each child group is indented \`ml-[13px] pl-1.5\` with a left border, which IS the guide line — it lands under the parent's chevron (slate-200 / dark slate-700; transparent when \`showGuides\` is false). No per-depth spacer elements.
- Focus ring (\`ring-2 ring-indigo-400\` on focus-visible) goes on the ROW, not on the list item, which wraps its whole subtree.
- Empty: 11px slate-400 text, "Nothing to show." (or "No matches." while filtering).

## Behaviour
- Without \`selectionMode\` it is a navigation tree: clicking a row toggles it. With a mode, clicking the row selects and clicking the chevron toggles.
- single replaces the selection; multiple toggles the key in or out.
- checkbox: a branch's state is DERIVED bottom-up — checked if every child is, unchecked if none, otherwise mixed — never stored, so a parent can't end up ticked over an unticked child. Pressing a node sets its whole subtree, including rows the filter hides: to checked, unless every enabled leaf in it is already checked, then to unchecked. Disabled nodes and their subtrees are skipped. Then normalise: the selection is exactly the fully-checked keys (branches included), and keys the tree doesn't know yet (unloaded) pass through.
- Disabled nodes stay focusable and expandable but can't be selected or checked.
- Filter: case-insensitive substring match. Keeps matches plus their ancestors and opens those ancestors; a branch that matches itself keeps all its children but stays closed unless something inside matched too. The filter is a VIEW: it never changes the caller's expanded keys — toggles made while filtering are kept locally and dropped when the query changes. ArrowDown in the box moves focus to the first row. Only loaded nodes are searchable.
- Lazy children: with \`onLoadChildren\`, a node whose \`children\` is undefined (and isn't \`leaf\`) shows a chevron and fetches once on first expand. Loading is driven by the expanded set, so controlled \`expandedKeys\` that include a lazy node load too; guard against duplicate in-flight requests. A rejection collapses the node so the next expand retries. A checked lazy node's new children inherit the tick.
- Selection and expansion are each controlled or uncontrolled; \`onToggle\` receives the whole next expanded list.

## Keyboard (one tab stop, roving tabindex)
The tab stop is the last-focused row if still visible, else the first selected row, else the first row. Down/Up: next/previous visible row. Right: open a closed branch, or move to the first child of an open one. Left: close an open branch, or move to the parent. Home/End: first/last row. Enter/Space: activate (select, or toggle in a navigation tree). \`*\`: expand every expandable sibling. Type-ahead: a printable key jumps to the next row starting with it, wrapping; keys typed within 500ms build a prefix.

## Accessibility
\`<ul role="tree">\` with \`aria-label\` and \`aria-multiselectable\` for multiple/checkbox; rows are \`<li role="treeitem">\` with \`aria-level\`, \`aria-setsize\`, \`aria-posinset\`, \`aria-expanded\` (branches only), \`aria-selected\` (single/multiple), \`aria-checked\` true/false/"mixed" (checkbox), \`aria-disabled\`, \`aria-busy\` while loading; nested lists are \`role="group"\`. The chevron is an \`aria-hidden\` span, not a button — a tabbable control inside a treeitem would break the one-tab-stop rule.

## API
\`TreeNode = { key: string (unique across the whole tree); label: string; icon?: ReactNode; children?: TreeNode[]; disabled?: boolean; leaf?: boolean }\`. Props: \`nodes\`, \`selectionMode?: 'single' | 'multiple' | 'checkbox'\`, \`selectedKeys?\` / \`defaultSelectedKeys?\` / \`onSelectionChange?(keys)\`, \`expandedKeys?\` / \`defaultExpandedKeys?\` / \`onToggle?(keys)\`, \`filter = false\`, \`filterPlaceholder = 'Filter…'\`, \`onLoadChildren?(node) => Promise<TreeNode[]>\`, \`showGuides = true\`, \`emptyText = 'Nothing to show.'\`, \`aria-label = 'Tree'\`, \`className?\`.

## Demo
A \`w-72\` checkbox tree with filter: Documents (Work: Quarterly plan.pdf, Budget draft.xlsx, Meeting notes.md; Home: Lease.pdf, Insurance.pdf disabled), Media (Lake.jpg, Forest.jpg), Readme.txt — folder, file and image icons, Documents and Work open, Quarterly plan pre-checked. Beside it a single-select tree of "Archive 2023" and "Archive 2024" whose children (Q1–Q4 report.pdf) load after 700ms, plus an "Empty folder" marked \`leaf\`.`,

  'organization-chart': `Build an organization chart component in React + TypeScript + Tailwind CSS: a top-down tree of person cards joined by connector lines, with collapsible subtrees, optional single selection, and a custom card template.

## Look
- Outer box: its OWN horizontal scroller (\`overflow-x-auto\`, thin scrollbar) — a wide chart scrolls in place instead of scrolling the page sideways. Inside, a \`flex w-max min-w-full justify-center gap-8 p-3\` list of roots: this centres a narrow chart but lets a wide one start at the left edge (centring on the scroller itself would push a wide chart's left half into unreachable negative scroll). Several roots sit side by side with no connector between them.
- Card: the opaque floating-surface style (white / dark slate-800, slate-200 / dark slate-700 border, \`rounded-2xl\`, shadow), \`min-w-36 max-w-52 px-3 py-2.5\`, with a 3px top border as an accent stripe by \`tone\` — neutral slate-300 / dark slate-600 (default), info indigo-500 / 400, success emerald-500 / 400, warning amber-500 / 400, danger rose-500 / 400.
- Default card contents: a 36px round avatar (an image with \`object-cover\`, or initials in white semibold text-xs on an indigo-600 circle — the \`avatar\` string counts as a URL if it contains "/" or ":"), then the name (text-xs semibold slate-800 / dark slate-100) over the title (11px slate-500 / dark slate-400), both truncating.
- Selected: \`ring-2 ring-indigo-500\` with a 2px offset in white (dark: indigo-400, offset slate-900). Focus: \`ring-2 ring-indigo-400\` without offset. Both can show at once and still read as two things.
- Connectors are 1px lines in slate-300 / dark slate-600, made from plain positioned boxes — no SVG or canvas, nothing to measure on resize. Under a card with reports: a 10px vertical stub, the collapse badge, another 10px stub, then a row of child cells. Each child cell (\`relative px-2 pt-4\`, a centred column) draws the LEFT half of the horizontal bar above it (omitted for the first child), the RIGHT half (omitted for the last), and a 16px drop from the bar to its card. Adjacent halves meet, so the bar always spans exactly first-child centre to last-child centre.
- Collapse badge: a 16px-tall pill (\`min-w-4 px-1 rounded-full\`), slate-300 border on white, 10px semibold slate-500 (dark: slate-600 border, slate-800 fill, slate-400 text); hover indigo-400 border and indigo-600 text (dark indigo-300). Expanded: a 10px \`Minus\`. Collapsed: a 10px \`Plus\` and the number of direct reports. When collapsed, the lower stub and the children are not rendered.

## Behaviour
- \`selectable\` makes cards pressable: a click selects, and pressing the selected card again clears it. \`onChange(key | null, node | null)\`. \`value\` is controlled whenever it isn't \`undefined\` (\`null\` means nothing selected).
- Collapse is controlled (\`collapsedKeys\` + \`onToggle\`, which gets the whole next list) or uncontrolled (\`defaultCollapsedKeys\`).
- \`nodeTemplate(node)\` replaces the card's contents; the shell — focus, selection ring, tone stripe, connectors — stays.

## Keyboard
Every card is focusable. Enter/Space toggle selection (when selectable). ArrowDown moves to the first report (if not collapsed), ArrowUp to the manager, ArrowLeft/Right to the previous/next peer. Focus the target with \`preventScroll\`, then \`scrollIntoView({ block: 'nearest', inline: 'nearest' })\` so the chart's own box scrolls sideways to reveal an off-screen peer. Ignore keys whose target is a control inside a template (target ≠ the card).

## Accessibility
Nested \`<ul>\`/\`<li>\` (root list \`aria-label\`, default "Organization chart"), so a screen reader hears the reporting lines as list nesting. Selectable cards are \`role="button"\` with \`aria-pressed\`; with a template, the card's \`aria-label\` is the node label. The badge has \`aria-expanded\` and an \`aria-label\` like "Collapse Jordan Lee (3 reports)" / "Expand Drew Morgan (1 report)". Connector lines are \`aria-hidden\`. A template that adds a dropdown must portal it, since the scroller would clip it.

## API
\`OrgChartNode = { key: string; label: string; title?: string; avatar?: string; tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger'; children?: OrgChartNode[] }\`. Props: \`nodes\`, \`selectable = false\`, \`value?\`, \`onChange?\`, \`collapsedKeys?\`, \`defaultCollapsedKeys?\`, \`onToggle?\`, \`nodeTemplate?\`, \`aria-label?\`, \`className?\`.

## Demo
Avery Stone (Director, info) with three reports: Jordan Lee (Engineering lead, success) over Sam Park (Frontend), Riley Chen (Backend) and Morgan Diaz (Platform); Casey Brooks (Design lead, warning) over Quinn Ellis (Product design) and Taylor Reed (Research); Drew Morgan (Operations) over Jamie Fox (Support), collapsed by default. Initials as avatars, selectable, Jordan Lee pre-selected.`,
};
