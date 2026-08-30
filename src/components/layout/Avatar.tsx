/* Origin: bonus-adjustment (96S2), verbatim. */
/**
 * A user's avatar, or their initials when they have no image. The initials
 * helper lives in `lib/initials.ts` so the test suite can import it — Node
 * cannot parse `.tsx`.
 */
import { initialsFor } from '@/lib/initials';

/**
 * `sm` uses an arbitrary `text-[10px]` because there is no Tailwind step between
 * `text-xs` and nothing. That matters: a scale step like `text-xs` ships a
 * line-height with it, an arbitrary size sets `font-size` ALONE — so the line
 * box these glyphs sit in is whatever was inherited. The fallback branch below
 * pins it rather than leaving it to the caller's context.
 */
const SIZES = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-16 h-16 text-lg',
} as const;

export default function Avatar({
  name,
  email,
  avatarUrl,
  size = 'sm',
}: {
  name?: string | null;
  email: string;
  avatarUrl?: string | null;
  size?: keyof typeof SIZES;
}) {
  const dimensions = SIZES[size];

  if (avatarUrl) {
    return (
      // Plain <img>: avatars are served by our own route handler off the local
      // disk, so next/image's optimiser buys nothing and would need the route
      // whitelisted in next.config.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className={`${dimensions} rounded-full object-cover shrink-0 bg-slate-100 dark:bg-slate-800`}
      />
    );
  }

  return (
    // `leading-none` is the load-bearing class here, for the same reason
    // `.data-table thead th` carries `leading-4` in globals.css: a font-size
    // shrinks the GLYPHS, never the line box around them.
    //
    // The density rules (`html[data-density] table td { line-height: 40px }`)
    // inherit straight into this div, and `text-[10px]` — being arbitrary
    // rather than a scale step — brings no line-height of its own to shadow
    // them. A 40px line box does not fit a 28px circle, so the auto row could
    // not stretch, centring degenerated to start, and the initials sat 6.4px
    // BELOW the circle's middle in the users table. `md`/`lg` were never
    // affected: `text-xs`/`text-lg` do ship a line-height, which shadowed the
    // inherited one. Pinning the box makes all three sizes behave the same in
    // any context rather than only outside a table.
    //
    // Flex rather than `grid place-items-center`: an anonymous grid item in an
    // auto row is what silently degraded above, and a flex line centres the
    // real box. No optical nudge on top — measured against glyph ink (canvas
    // actualBoundingBox*, not the em box), all three sizes land within 0.6px of
    // the centre, which is the residual the uncomplained-about `lg` already had.
    <div
      aria-hidden
      className={`${dimensions} rounded-full shrink-0 inline-flex items-center justify-center leading-none font-semibold bg-indigo-600 text-white`}
    >
      {initialsFor(name, email)}
    </div>
  );
}
