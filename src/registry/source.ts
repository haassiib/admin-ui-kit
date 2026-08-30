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
  return extractFunction('src/registry/demos/index.tsx', `${componentName}Demo`);
}

/**
 * Source for one named example, which may live in either module: the multi-
 * example components declare theirs in `example-demos.tsx`, and everything else falls
 * back to its single demo in `demos/index.tsx`.
 */
export async function readExampleSource(
  fnName: string,
  componentName: string,
): Promise<string | null> {
  return (
    (await extractFunction('src/registry/example-demos.tsx', fnName)) ??
    (await extractFunction('src/registry/demos/index.tsx', `${componentName}Demo`))
  );
}

async function extractFunction(file: string, name: string): Promise<string | null> {
  const src = await readComponentSource(file);
  if (!src) return null;

  const marker = `function ${name}(`;
  const start = src.indexOf(marker);
  if (start === -1) return null;

  let depth = 0;
  let seen = false;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') {
      depth++;
      seen = true;
    } else if (ch === '}') {
      depth--;
      if (seen && depth === 0) return src.slice(start, i + 1);
    }
  }
  return src.slice(start);
}
