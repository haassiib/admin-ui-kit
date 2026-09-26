'use client';

import { useMemo, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Minimal TS/TSX highlighting, done here rather than with a syntax library.
 *
 * A highlighter is 200KB+ of bundle for a gallery, and this library's whole
 * selling point is that dropping a component in does not drag a toolchain with
 * it. So: one pass that pulls out comments and strings first, escapes what is
 * left, then marks up keywords and numbers. Order matters — a keyword inside a
 * string must stay a string, which is why those are stashed before anything
 * else runs.
 *
 * Every stashed token is escaped BEFORE its markup is built, so source that
 * contains angle brackets renders as text rather than as elements.
 */
const KEYWORDS = new RegExp(
  '\\b(' +
    [
      'import', 'from', 'export', 'default', 'const', 'let', 'var', 'function', 'return',
      'if', 'else', 'for', 'while', 'of', 'in', 'new', 'class', 'extends', 'type', 'interface',
      'async', 'await', 'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof', 'as',
      'true', 'false', 'null', 'undefined', 'void', 'this', 'super', 'break', 'continue',
    ].join('|') +
    ')\\b',
  'g',
);

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Placeholder for a stashed comment or string.
 *
 * LETTERS, not digits, and that is the whole point. The first version used the
 * slot index directly; the number pass below then matched those digits and
 * wrapped them in a span, so the final restore could no longer find the
 * placeholder — and every string literal in the rendered code was replaced by
 * its slot number. An import line displayed as `import Splitter from 0`.
 *
 * Digits map to A-J instead. The keyword list is entirely lowercase and the
 * number pass cannot match letters, so nothing downstream can touch one.
 */
const DIGITS = 'ABCDEFGHIJ';
const slotToken = (i: number) => ' ' + String(i).replace(/\d/g, (d) => DIGITS[Number(d)]) + ' ';
const slotIndex = (token: string) => Number(token.replace(/[A-J]/g, (c) => String(DIGITS.indexOf(c))));

function highlight(code: string): string {
  const slots: string[] = [];
  const stash = (cls: string, text: string) => {
    slots.push('<span class="' + cls + '">' + escapeHtml(text) + '</span>');
    return slotToken(slots.length - 1);
  };

  let out = code;
  out = out.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (m) => stash('tok-comment', m));
  out = out.replace(/(['"`])(?:\\.|(?!\1)[^\\])*\1/g, (m) => stash('tok-string', m));

  out = escapeHtml(out);
  out = out.replace(KEYWORDS, '<span class="tok-keyword">$1</span>');
  out = out.replace(/\b(\d[\d_.]*)\b/g, '<span class="tok-number">$1</span>');

  return out.replace(/ ([A-J]+) /g, (whole, token: string) => {
    const i = slotIndex(token);
    // A real A-J word in the source (a hex-ish token, a single letter) is not a
    // placeholder; leave it alone rather than splicing in the wrong slot.
    return i < slots.length ? slots[i] : whole;
  });
}

export default function CodeBlock({ code, language = 'tsx' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  // Prose — an AI prompt — is shown as written: the TS pass would read every
  // apostrophe as the start of a string. It also wraps, since a paragraph on
  // one scrolling line is unreadable.
  const plain = language === 'text';
  const html = useMemo(() => {
    if (plain) return escapeHtml(code);
    try {
      return highlight(code);
    } catch {
      // Highlighting is decoration; unreadable code is not an acceptable failure.
      return escapeHtml(code);
    }
  }, [code, plain]);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-1.5 dark:border-slate-700">
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">{language}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(code).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            });
          }}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className={cn('custom-scrollbar max-h-[32rem] overflow-auto p-3 text-[11px] leading-relaxed', plain && 'whitespace-pre-wrap')}>
        <code
          className="font-mono text-slate-700 dark:text-slate-200"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </pre>
    </div>
  );
}
