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
 *
 * It is ANCHORED on the exported component's own declaration. Several files here
 * define private sub-components above the one they export — `Chip` above
 * `CombinedFilterDropdown`, `Row` above `Sidebar`, `Delta` above `KpiTile` — and
 * simply taking the first object type in the file documented the wrong
 * component, convincingly and silently.
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

/**
 * Where the exported component's own declaration starts.
 *
 * Everything the parser looks for is searched from here, never from the top of
 * the file. Returns 0 when the name is unknown or unmatched, which restores the
 * old whole-file behaviour rather than returning nothing.
 */
function declarationIndex(src: string, name?: string): number {
  if (!name) return 0;
  const patterns = [
    new RegExp(`export default function ${name}\\b`),
    new RegExp(`export function ${name}\\b`),
    new RegExp(`const ${name}\\s*=\\s*forwardRef`),
    new RegExp(`const ${name}\\s*=`),
    new RegExp(`function ${name}\\b`),
  ];
  for (const re of patterns) {
    const m = re.exec(src);
    if (m) return m.index;
  }
  return 0;
}

/** Defaults live in the destructuring pattern, not the type. */
function destructuringDefaults(src: string, from: number): Record<string, string> {
  const out: Record<string, string> = {};
  const tail = src.slice(from);
  const m = /function \w*\(\s*\{/.exec(tail);
  if (!m) return out;
  const body = block(tail, tail.indexOf('{', m.index));
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
  // Inside a comment, brackets and semicolons are prose, not structure: a
  // JSDoc like "Spinner on the primary half; the menu stays usable." must not
  // end the member at its semicolon, or the description is cut in two.
  let comment: 'line' | 'block' | null = null;
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    const next = body[i + 1];
    if (comment === 'line' && ch === '\n') comment = null;
    else if (comment === 'block' && ch === '*' && next === '/') {
      current += '*/';
      i += 1;
      comment = null;
      continue;
    } else if (!comment && ch === '/' && next === '/') comment = 'line';
    else if (!comment && ch === '/' && next === '*') comment = 'block';

    if (!comment) {
      if ('{[('.includes(ch)) depth++;
      if ('}])'.includes(ch)) depth--;
      if (ch === ';' && depth === 0) {
        out.push(current);
        current = '';
        continue;
      }
    }
    current += ch;
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

export function parseProps(source: string, componentName?: string): PropDoc[] {
  const from = declarationIndex(source, componentName);
  const tail = source.slice(from);

  let body: string | null = null;

  // 1. A named `interface <Name>Props` is the most reliable signal there is, and
  //    it is tried FIRST because it may be declared either side of the component
  //    — several here sit above it. `[^{]*` absorbs a generic parameter list, so
  //    `interface PasteableGridProps<K extends string>` still matches.
  if (componentName) {
    const own = new RegExp(`interface ${componentName}Props[^{]*\\{`).exec(source);
    if (own) body = block(source, source.indexOf('{', own.index));
  }

  // 2. An inline object type on the parameter — the dominant shape here. Scanned
  //    from the component's own declaration, never from the top of the file.
  if (!body) {
    const inline = /\}\s*:\s*\{/.exec(tail);
    if (inline) body = block(tail, tail.indexOf('{', inline.index + inline[0].length - 1));
  }

  // 3. Any `*Props` interface, for a component whose props type is not named
  //    after it.
  if (!body) {
    const named = /(?:export )?interface \w*Props[^{]*\{/.exec(source);
    if (named) body = block(source, source.indexOf('{', named.index));
  }

  // 4. `forwardRef<El, React.XHTMLAttributes<El> & { … }>` — the component's OWN
  //    props are the intersection member; the native attributes it also accepts
  //    are reported by `extendsNative` rather than listed one by one.
  if (!body) {
    const intersection = /&\s*\{/.exec(tail);
    if (intersection) body = block(tail, tail.indexOf('{', intersection.index));
  }

  if (!body) return [];

  const defaults = destructuringDefaults(source, from);

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
        // The closer first: on a line of its own, `*/` would otherwise lose its
        // star to the leading-asterisk rule and leave a stray "/".
        .replace(/\*\//g, '')
        .replace(/\/\*\*?|^\s*\*\s?|^\s*\/\/\s?/gm, '')
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
