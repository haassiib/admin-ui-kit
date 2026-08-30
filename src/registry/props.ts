/**
 * Extracts a component's prop table from its own source, at build time.
 *
 * SERVER ONLY, and deliberately a parser rather than hand-written metadata: a
 * table maintained by hand beside 55 components goes stale the first time
 * somebody adds a prop, and a stale API table is worse than none. Reading the
 * types means the docs cannot disagree with the code.
 *
 * It handles the three shapes this library actually uses — an inline object type
 * on the destructured parameter, a named `interface XProps`, and an intersection
 * inside a `forwardRef` generic — and gives up cleanly on anything else rather
 * than guessing.
 */

export type PropDoc = {
  name: string;
  type: string;
  required: boolean;
  /** From the destructuring default, e.g. `variant = 'bar'`. */
  defaultValue?: string;
  /** The JSDoc or line comment immediately above the prop. */
  description?: string;
};

/** Grabs the balanced `{ … }` that starts at `open`. */
function block(src: string, open: number): string | null {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(open + 1, i);
    }
  }
  return null;
}

/** Defaults live in the destructuring pattern, not the type. */
function destructuringDefaults(src: string): Record<string, string> {
  const out: Record<string, string> = {};
  const m = /export default function \w+\(\s*\{/.exec(src) ?? /export function \w+\(\s*\{/.exec(src);
  if (!m) return out;
  const body = block(src, src.indexOf('{', m.index));
  if (!body) return out;

  let depth = 0;
  let current = '';
  const parts: string[] = [];
  for (const ch of body) {
    if ('{[('.includes(ch)) depth++;
    if ('}])'.includes(ch)) depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else current += ch;
  }
  parts.push(current);

  for (const part of parts) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim().replace(/:.*$/, '');
    const value = part.slice(eq + 1).trim();
    if (/^\w+$/.test(name) && value) out[name] = value;
  }
  return out;
}

/**
 * Splits an object-type body into members on top-level semicolons.
 *
 * Angle brackets are deliberately NOT counted as nesting. A prop type like
 * `(page: number) => void` contains a `>` with no matching `<`, which drove the
 * depth negative and silently swallowed every member after the first callback —
 * `Pagination` reported four props of seven, `DataTable` three of twelve. A
 * generic argument cannot contain a semicolon, so brace, bracket and paren
 * depth alone is enough to find the real separators.
 */
function members(body: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of body) {
    if ('{[('.includes(ch)) depth++;
    if ('}])'.includes(ch)) depth--;
    if (ch === ';' && depth === 0) {
      out.push(current);
      current = '';
    } else current += ch;
  }
  if (current.trim()) out.push(current);
  return out;
}

/**
 * The native element interface a component spreads onto its root, if any — so
 * the table can say "plus everything <button> takes" instead of pretending
 * those props do not exist.
 */
export function extendsNative(source: string): string | null {
  const m = /React\.(\w+)HTMLAttributes</.exec(source);
  return m ? m[1].toLowerCase() : null;
}

export function parseProps(source: string): PropDoc[] {
  // Prefer the inline object type on the parameter — the dominant shape here.
  let body: string | null = null;
  const inline = /\}\s*:\s*\{/.exec(source);
  if (inline) body = block(source, source.indexOf('{', inline.index + inline[0].length - 1));

  if (!body) {
    const named = /(?:export )?interface \w*Props\s*\{/.exec(source);
    if (named) body = block(source, source.indexOf('{', named.index));
  }

  // `forwardRef<El, React.XHTMLAttributes<El> & { … }>` — the component's OWN
  // props are the intersection member; the native attributes it also accepts
  // are reported separately by `extendsNative` rather than listed one by one.
  if (!body) {
    const intersection = /&\s*\{/.exec(source);
    if (intersection) body = block(source, source.indexOf('{', intersection.index));
  }

  if (!body) return [];

  const defaults = destructuringDefaults(source);

  return members(body)
    .map((raw): PropDoc | null => {
      // The comment block sits above the member; the declaration is the last line.
      const lines = raw.split('\n');
      const declIdx = lines.findIndex((l) => /^\s*\/?\*?\s*\w+\??\s*:/.test(l) && !/^\s*[*/]/.test(l.trim()));
      if (declIdx === -1) return null;

      const decl = lines.slice(declIdx).join('\n').trim();
      const m = /^(\w+)(\?)?\s*:\s*([\s\S]+)$/.exec(decl);
      if (!m) return null;

      const description = lines
        .slice(0, declIdx)
        .join('\n')
        .replace(/\/\*\*?|\*\/|^\s*\*\s?|^\s*\/\/\s?/gm, '')
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .join(' ')
        .trim();

      return {
        name: m[1],
        type: m[3].replace(/\s+/g, ' ').trim(),
        required: !m[2],
        defaultValue: defaults[m[1]],
        description: description || undefined,
      };
    })
    .filter((p): p is PropDoc => p !== null && !p.name.startsWith('_'));
}
