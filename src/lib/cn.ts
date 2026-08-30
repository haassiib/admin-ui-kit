/**
 * Class-name join. Falsy entries drop out, so a conditional can be written
 * inline: cn('base', active && 'ring-2', disabled ? 'opacity-50' : null).
 *
 * Deliberately NOT clsx/tailwind-merge — no conflict resolution, no dependency.
 * Where two classes would collide, the call site picks one.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
