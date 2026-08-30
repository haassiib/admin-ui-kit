/* Origin: bonus-adjustment (96S2), verbatim. */
/**
 * The player account a row is for, as one table cell: the username, with the
 * back office and brand it resolves to underneath.
 *
 * Extracted from the Approvals list so the Individual drafts list can show the
 * SAME thing rather than an imitation of it. Two copies of this markup drifted
 * apart once already — the drafts list showed a bare cluster code where the
 * approvals list showed the account — and one component is the only way the two
 * tables can be read as the same column.
 *
 * BO first, brand second: the back office is what a release is grouped and
 * chased by, and the brand only narrows within it.
 *
 * No `'use client'`. Both callers need it — Approvals is a server component and
 * DraftList is a client one — and a component with no state or handlers renders
 * in either tree.
 *
 * The padding stays on the caller's `<td>`: the two tables are on different row
 * heights (py-3 against py-2) and that is a property of the table, not of this.
 */
export default function AccountCell({
  username,
  cluster,
  brand,
}: {
  username: string;
  /**
   * Null only where the target is not known yet. On an `AdjustmentItem` both are
   * NOT NULL — a released row always has a resolved brand — but a draft row with
   * an unrecognised `gamePrefix` has neither, and the sub-line then says nothing
   * instead of printing a lone separator.
   */
  cluster?: string | null;
  brand?: string | null;
}) {
  return (
    <>
      <div className="font-mono leading-tight text-slate-800 dark:text-slate-100">{username}</div>
      {(cluster || brand) && (
        <div className="mt-1 text-[10px] leading-tight text-slate-400">
          {cluster && (
            <span className="font-semibold text-slate-600 dark:text-slate-300">{cluster}</span>
          )}
          {cluster && brand && ' · '}
          {brand}
        </div>
      )}
    </>
  );
}
