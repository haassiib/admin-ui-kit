'use client';

import { Suspense, useState } from 'react';
import { Check, Code2, Copy, Sparkles } from 'lucide-react';

import CodeBlock from '@/components/gallery/CodeBlock';
import { cn } from '@/lib/cn';
import type { DemoWidth } from '@/registry/groups';

const WIDTH: Record<DemoWidth, string> = {
  auto: 'w-max min-w-0 max-w-full',
  // `min()` so the floor never exceeds a phone-width stage.
  field: 'w-max min-w-[min(100%,24rem)] max-w-full',
  fill: 'w-full min-w-0',
};

const ICON_BTN =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 aria-pressed:bg-slate-100 aria-pressed:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:aria-pressed:bg-slate-800 dark:aria-pressed:text-slate-100';

/**
 * The card every live demo sits in: a white stage inside a soft grey frame,
 * the demo centred on it, a PREVIEW tag and the code controls along the
 * bottom, and the code itself opening INSIDE the same frame — so a demo and its
 * source read as one object, not a demo with a code block after it.
 *
 * ── Centred, or filling ─────────────────────────────────────────────────────
 *
 * By default the demo box is `max-content` wide, capped at the stage: a colour
 * picker or a button row sits in the middle at its own size, and anything
 * wider than the stage is simply the stage's width. What has NO intrinsic
 * width — a chart that sizes itself to its container, a progress bar — would
 * collapse under `max-content`, so those take the full width (`fill`), and a
 * form field, whose input is `w-full` with nothing to be full of, gets a 24rem
 * floor (`field`). The gallery decides which, in `registry/groups.ts`. One
 * floor for everything was tried and is worse both ways: small demos sit
 * off-centre in an oversized box, and wide ones are held to the floor.
 *
 * ── No `overflow-hidden`, deliberately ──────────────────────────────────────
 *
 * Most dropdowns in the kit position themselves ABSOLUTELY inside their
 * trigger, and a clipping ancestor paints exactly those away: the menu opens
 * and is invisible. The rounded corners come from the borders alone.
 */
export default function PreviewCard({
  code,
  prompt,
  width = 'auto',
  label = 'Preview',
  className,
  children,
}: {
  /** The example's source. Adds the code toggle and the copy button. */
  code?: string | null;
  /** The component's AI prompt. Adds a button that copies it, beside the code controls. */
  prompt?: string | null;
  /** How wide the demo sits: centred at its own size, centred with a field's floor, or full width. */
  width?: DemoWidth;
  label?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  // Which of the two copy buttons last succeeded — one flag each would let
  // both show a tick at once after quick successive clicks.
  const [copied, setCopied] = useState<'code' | 'prompt' | null>(null);

  const copy = (what: 'code' | 'prompt') => {
    const text = what === 'code' ? code : prompt;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(what);
      setTimeout(() => setCopied((c) => (c === what ? null : c)), 1400);
    });
  };

  return (
    <div
      className={cn(
        'rounded-[1.25rem] border border-slate-200 bg-slate-50 p-1.5 dark:border-slate-800 dark:bg-slate-900/60',
        className,
      )}
    >
      <div className="flex flex-col rounded-[0.9rem] border border-slate-200 bg-white dark:border-slate-700/80 dark:bg-slate-900">
        {/* `data-demo` is a test hook: popover-check.mjs needs to find the live
            example without matching on styling classes, which move. */}
        <div data-demo className="flex justify-center px-4 pb-2 pt-8 sm:px-8">
          <div className={WIDTH[width]}>
            <Suspense fallback={<p className="note">Loading…</p>}>{children}</Suspense>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5 pt-2">
          <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-slate-400 dark:bg-slate-800 dark:text-slate-500">
            {label}
          </span>
          {(code || prompt) && (
            <div className="flex items-center gap-0.5">
              {code && (
                <>
                  <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    aria-pressed={open}
                    aria-label={open ? 'Hide code' : 'Show code'}
                    title={open ? 'Hide code' : 'Show code'}
                    className={ICON_BTN}
                  >
                    <Code2 className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => copy('code')} aria-label="Copy code" title="Copy code" className={ICON_BTN}>
                    {copied === 'code' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </>
              )}
              {prompt && (
                <button type="button" onClick={() => copy('prompt')} aria-label="Copy AI prompt" title="Copy AI prompt" className={ICON_BTN}>
                  {copied === 'prompt' ? <Check className="h-4 w-4 text-emerald-500" /> : <Sparkles className="h-4 w-4" />}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {open && code && (
        <div className="mt-1.5">
          <CodeBlock code={code} />
        </div>
      )}
    </div>
  );
}
