'use client';

import { InfoTooltip } from '@/components/overlay/Tooltip';

/**
 * A title's explanatory copy, behind an ⓘ beside it rather than as a
 * paragraph under it — so a page of examples reads as titles and live demos,
 * and the explanation is one hover away for whoever wants it.
 *
 * `backticks` in the copy render as inline code, the way the descriptions in
 * `registry/examples.ts` are written.
 */
export default function Hint({ text, label }: { text?: string | null; label: string }) {
  if (!text) return null;
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <InfoTooltip
      wide
      label={label}
      className="align-middle"
      content={
        <span className="block text-left leading-relaxed">
          {parts.map((p, i) =>
            p.startsWith('`') && p.endsWith('`') ? (
              <code key={i} className="rounded bg-white/15 px-1 font-mono text-[10px]">
                {p.slice(1, -1)}
              </code>
            ) : (
              p
            ),
          )}
        </span>
      }
    />
  );
}
