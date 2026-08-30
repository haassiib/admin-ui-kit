import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Reads component and demo source off disk for the code view.
 *
 * SERVER ONLY. The preview pages are statically generated, so every read here
 * happens at BUILD time and nothing ships to the browser but the resulting
 * strings — which is why the gallery can show fifty files without shipping a
 * fifty-file bundle.
 */

/** Statically scoped to `src/` — a bare `process.cwd()` join makes the
 *  bundler trace the entire project into the server output. */
const SRC = path.join(process.cwd(), 'src');

export async function readComponentSource(relPath: string): Promise<string | null> {
  try {
    // Paths in the catalog are repo-relative (`src/components/...`).
    return await readFile(path.join(SRC, relPath.replace(/^src\//, '')), 'utf8');
  } catch {
    return null;
  }
}

/**
 * Pulls one `export function <Name>Demo() { … }` out of the demos module.
 *
 * Brace-counted rather than regexed to the closing brace: demo bodies contain
 * object literals, JSX blocks and arrow functions, so "up to the next closing
 * brace at column 0" is the only cheap rule that survives them — and it is
 * exactly the rule that breaks the moment someone indents an export. Counting is
 * a few more lines and cannot be fooled by formatting.
 */
export async function readDemoSource(componentName: string): Promise<string | null> {
  const file = await readComponentSource('src/registry/demos/index.tsx');
  if (!file) return null;

  const marker = `export function ${componentName}Demo(`;
  const start = file.indexOf(marker);
  if (start === -1) return null;

  let depth = 0;
  let seen = false;
  for (let i = start; i < file.length; i++) {
    const ch = file[i];
    if (ch === '{') {
      depth++;
      seen = true;
    } else if (ch === '}') {
      depth--;
      if (seen && depth === 0) return file.slice(start, i + 1);
    }
  }
  return file.slice(start);
}
