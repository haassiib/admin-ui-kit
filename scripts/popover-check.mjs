/**
 * Opens each dropdown-bearing demo and checks the popover is actually usable.
 *
 * TWO failures, and they are independent — a popover can pass either one while
 * failing the other, and both have shipped here:
 *
 *   CLIPPED   an `overflow` ancestor cuts the popover's box away. It is still in
 *             the DOM with a real rect; the pixels just land outside an
 *             ancestor's paint area. Measured by intersecting every clipping
 *             ancestor's rect with the popover's.
 *
 *   COVERED   the popover paints UNDER later content. Its box is whole and
 *             on-screen, but something else is drawn on top — usually because an
 *             ancestor made a stacking context (a `backdrop-filter` is enough)
 *             and trapped the popover's z-index inside it. Measured by hit
 *             testing five points against `elementFromPoint`.
 *
 * Neither is visible to `tsc` or to `next build`; both stay green throughout.
 */
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = 'http://localhost:3020';

// The first live example on the docs page. `data-demo` is a stable hook on
// DocSection — scoping by styling class breaks whenever the frame is restyled,
// and scoping to the whole page finds the Show-code buttons first.
const BODY = 'main [data-demo]';

// [slug, how, trigger selector within the demo]. The selector defaults to the
// first control; DataTable needs it, because its first button sorts a column.
const CASES = [
  ['data-table', 'click', 'button[aria-label="Columns"]'],
  ['multi-select', 'click'],
  ['autocomplete-dropdown', 'click'],
  ['combined-select', 'click'],
  ['date-range-picker', 'click'],
  ['date-picker', 'click'],
  ['month-picker', 'click'],
  ['month-range-picker', 'click'],
  ['tree-multi-select-dropdown', 'click'],
  ['user-dropdown', 'click'],
  ['notification-bell', 'click'],
  ['theme-settings', 'click'],
  ['confirm-popover', 'click'],
  ['tooltip', 'hover'],
  ['modal', 'click'],
  ['drawer', 'click'],
  ['filter-panel', 'click'],
  ['group-panel', 'click'],
  ['sort-panel', 'click'],
  ['fields-panel', 'click'],
  ['color-rules-panel', 'click'],
  ['anchored-panel', 'click'],
  ['field-editor', 'click'],
  ['view-tabs', 'click', 'button[aria-label="Add view"]'],
  ['input-color', 'click'],
  ['cascade-select', 'click'],
  ['multilevel-dialog', 'click'],
  ['split-button', 'click', 'button[aria-haspopup]'],
  ['speed-dial', 'click', 'button[aria-expanded]'],
  ['pivot-table', 'click', 'button[aria-expanded]'],
  ['base-grid', 'click', 'button[aria-label="Filter"]'],
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const results = [];

for (const [slug, how, selector] of CASES) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  try {
    await page.goto(`${BASE}/preview/${slug}`, { waitUntil: 'networkidle0', timeout: 20000 });
    await page.waitForSelector(BODY, { timeout: 8000 });

    const before = await page.evaluate(() => document.querySelectorAll('*').length);
    const trigger = await page.$(
      selector
        ? `${BODY} ${selector}`
        : `${BODY} button, ${BODY} input[role="combobox"], ${BODY} input[type="text"], ${BODY} [role="button"]`,
    );
    if (!trigger) { results.push([slug, 'NO TRIGGER', '']); await page.close(); continue; }
    if (how === 'hover') await trigger.hover(); else await trigger.click();
    await new Promise((r) => setTimeout(r, 500));
    const after = await page.evaluate(() => document.querySelectorAll('*').length);

    const verdict = await page.evaluate(() => {
      const cands = [...document.querySelectorAll('body *')].filter((el) => {
        const cs = getComputedStyle(el);
        if (!['absolute', 'fixed'].includes(cs.position)) return false;
        if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') return false;
        const r = el.getBoundingClientRect();
        return r.width > 40 && r.height > 20;
      });
      if (!cands.length) return { found: false };

      const area = (e) => { const r = e.getBoundingClientRect(); return r.width * r.height; };
      const el = cands.sort((a, b) => area(b) - area(a))[0];
      const r = el.getBoundingClientRect();
      const isFixed = getComputedStyle(el).position === 'fixed';

      let node = el.parentElement;
      let clip = { top: 0, left: 0, right: innerWidth, bottom: innerHeight };
      const clippers = [];
      while (node && node !== document.documentElement) {
        const cs = getComputedStyle(node);
        const clips = ['hidden', 'auto', 'scroll', 'clip'].includes(cs.overflowX) ||
                      ['hidden', 'auto', 'scroll', 'clip'].includes(cs.overflowY);
        // A fixed element escapes ancestor clipping unless an ancestor makes a
        // containing block (transform / filter / backdrop-filter / will-change).
        const makesCB = cs.transform !== 'none' || cs.filter !== 'none' ||
                        cs.backdropFilter !== 'none' || cs.willChange === 'transform';
        if (clips && (!isFixed || makesCB)) {
          const nr = node.getBoundingClientRect();
          clip = {
            top: Math.max(clip.top, nr.top), left: Math.max(clip.left, nr.left),
            right: Math.min(clip.right, nr.right), bottom: Math.min(clip.bottom, nr.bottom),
          };
          clippers.push(node.tagName.toLowerCase() + '.' + String(node.className || '').split(' ').slice(0, 2).join('.'));
        }
        node = node.parentElement;
      }
      const vw = Math.max(0, Math.min(r.right, clip.right) - Math.max(r.left, clip.left));
      const vh = Math.max(0, Math.min(r.bottom, clip.bottom) - Math.max(r.top, clip.top));

      // Is anything painted over it? Centre plus the four inner corners.
      //
      // Skipped for a `pointer-events: none` element. Tooltip's bubble sets it
      // deliberately — a tooltip you can hover traps the pointer and flickers
      // against its own trigger — so it is never what `elementFromPoint`
      // returns, and hit testing can say nothing about whether it is on top.
      const hitTestable = getComputedStyle(el).pointerEvents !== 'none';
      const pts = [
        [r.left + r.width / 2, r.top + r.height / 2],
        [r.left + 6, r.top + 6],
        [r.right - 6, r.top + 6],
        [r.left + 6, r.bottom - 6],
        [r.right - 6, r.bottom - 6],
      ];
      let covered = 0;
      let coveredBy = null;
      for (const [x, y] of hitTestable ? pts : []) {
        const hit = document.elementFromPoint(x, y);
        if (!hit || (!el.contains(hit) && hit !== el)) {
          covered++;
          if (!coveredBy) coveredBy = `${hit?.tagName.toLowerCase()}.${String(hit?.className || '').split(' ').slice(0, 2).join('.')}`;
        }
      }

      return {
        found: true,
        pct: Math.round(((vw * vh) / Math.max(1, r.width * r.height)) * 100),
        covered,
        points: pts.length,
        hitTestable,
        coveredBy,
        size: `${Math.round(r.width)}x${Math.round(r.height)}`,
        position: getComputedStyle(el).position,
        clippers: clippers.slice(0, 2),
      };
    });

    if (!verdict.found) {
      results.push([slug, after > before ? 'OPENED, no positioned box' : 'DID NOT OPEN', '']);
    } else if (verdict.covered > 0) {
      results.push([slug, `COVERED ${verdict.covered}/${verdict.points}`, `painted under ${verdict.coveredBy}`]);
    } else {
      const top = verdict.hitTestable ? 'on top' : 'on top (not hit-testable)';
      results.push([slug, `${verdict.pct}% visible, ${top}`, `${verdict.size} ${verdict.position}`]);
    }
  } catch (e) {
    results.push([slug, 'ERROR', String(e.message).slice(0, 70)]);
  }
  await page.close();
}

await browser.close();
let fails = 0;
for (const [slug, v, detail] of results) {
  const m = /^(\d+)% /.exec(v);
  const bad = /ERROR|DID NOT|NO TRIGGER|COVERED/.test(v) || (m && Number(m[1]) < 95);
  if (bad) fails++;
  console.log(`${bad ? 'FAIL' : ' ok '}  ${slug.padEnd(28)} ${v.padEnd(28)} ${detail}`);
}
console.log(fails ? `\n${fails} failing` : '\nall popovers visible and on top');
