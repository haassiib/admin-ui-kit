/**
 * Fallback initials for a user with no avatar.
 *
 * Lives in `lib` rather than beside the Avatar component so the test suite can
 * import it: Node strips types from `.ts` natively but cannot parse `.tsx`, and
 * every test here runs in bare Node with no build step.
 *
 * A user created by an admin may have no name at all, so the email is the last
 * resort — an empty circle reads as a broken avatar rather than a missing name.
 */
export function initialsFor(name: string | null | undefined, email: string): string {
  const source = (name ?? '').trim();
  if (!source) return email.slice(0, 1).toUpperCase();

  const parts = source.split(/\s+/);
  const letters = parts.length > 1 ? `${parts[0][0]}${parts.at(-1)![0]}` : parts[0].slice(0, 2);
  return letters.toUpperCase();
}
