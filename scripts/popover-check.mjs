/**
 * Opens each dropdown-bearing demo and checks the popover is actually VISIBLE —
 * not merely present in the DOM.
 *
 * A clipped popover is still in the DOM with a real bounding box; what changes
 * is that its pixels land outside an ancestor's paint area. So this walks up
 * from the popover, intersects every clipping ancestor's rect with its own, and
 * reports the surviving fraction.
 */
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE = 'http://localhost:3020';

// The demo body is inside the Preview TAB PANEL. Scoping to `div.p-4` would
// find the Preview/Usage/Source tab buttons first and click one of those.
const BODY = 'main [role="tabpanel"]';

const CASES = [
  ['multi-select', 'click'],
  ['autocomplete-dropdown', 'click'],
  ['combined-filter-dropdown', 'click'],
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
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const results = [];

for (const [slug, how] of CASES) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  try {
    await page.goto(`${BASE}/preview/${slug}`, { waitUntil: 'networkidle0', timeout: 20000 });
    await page.waitForSelector(BODY, { timeout: 8000 });

    const before = await page.evaluate(() => document.querySelectorAll('*').length);
    const trigger = await page.$(`${BODY} button, ${BODY} input[role="combobox"], ${BODY} input[type="text"], ${BODY} [role="button"]`);
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
      return {
        found: true,
        pct: Math.round(((vw * vh) / Math.max(1, r.width * r.height)) * 100),
        size: `${Math.round(r.width)}x${Math.round(r.height)}`,
        position: getComputedStyle(el).position,
        clippers: clippers.slice(0, 2),
      };
    });

    if (!verdict.found) results.push([slug, after > before ? 'OPENED, no positioned box' : 'DID NOT OPEN', '']);
    else results.push([slug, `${verdict.pct}% visible`, `${verdict.size} ${verdict.position}`]);
  } catch (e) {
    results.push([slug, 'ERROR', String(e.message).slice(0, 70)]);
  }
  await page.close();
}

await browser.close();
let fails = 0;
for (const [slug, v, detail] of results) {
  const m = /^(\d+)% /.exec(v);
  const bad = /ERROR|DID NOT|NO TRIGGER/.test(v) || (m && Number(m[1]) < 95);
  if (bad) fails++;
  console.log(`${bad ? 'FAIL' : ' ok '}  ${slug.padEnd(28)} ${v.padEnd(28)} ${detail}`);
}
console.log(fails ? `\n${fails} failing` : '\nall popovers fully visible');
