/* Origin: bonus-adjustment (96S2), verbatim. */
/**
 * Applies the stored theme and density BEFORE first paint.
 *
 * Without this the page renders light, then ThemeProvider's effect flips it to
 * dark a frame later — a white flash on every navigation for dark-mode users.
 * It has to be inline and synchronous in <head>, which is why it's a raw script
 * tag rather than anything React-driven, and it is wrapped in try/catch because
 * localStorage throws outright in a locked-down browser.
 */
const SCRIPT = `
try {
  var t = localStorage.getItem('ba.theme');
  if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  if (t === 'dark') document.documentElement.classList.add('dark');
  var d = localStorage.getItem('ba.density') || 'standard';
  document.documentElement.setAttribute('data-density', d);
  document.documentElement.style.fontSize =
    d === 'compact' ? '13px' : d === 'comfortable' ? '16px' : '14px';
} catch (e) {}
`.trim();

export default function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
