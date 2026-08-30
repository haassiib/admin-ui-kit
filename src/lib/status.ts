/**
 * Request and item lifecycle. FOUR request states, matching the mockup's — but
 * arrived at from the other direction.
 *
 * This file argued for eight until 2026-08-27, on the grounds that the BO tracks
 * submitted and awaiting-approval separately and that a validation refusal
 * ("nothing was sent") is a different fact from a BO rejection ("it was sent and
 * refused"). Both are still true, and both are still recorded — but at the ITEM
 * level, which is where an operator has to look anyway to find out WHICH rows
 * were affected. A request-level status answers one question, "where is this",
 * and eight answers to it turned every list, filter and badge into a lookup
 * table nobody could hold in their head.
 *
 * So the request now says only:
 *
 *   Pending   raised here, nothing sent
 *   Submitted accepted by the BO, awaiting its approver
 *   Approved  approved in the BO
 *   Rejected  any other outcome
 *
 * What that costs, stated plainly: request-level `Rejected` no longer says
 * whether money moved. `RejectedValidation` (nothing was sent) and `Rejected`
 * (sent, then refused) are the same word now, and `ITEM_STATUS` — which keeps
 * all six values and is NOT collapsed — is the only place that answers it.
 *
 * The old `PartiallyFailed` deliberately maps to `Submitted`, never `Rejected`:
 * some chunks were accepted, so money is in flight for those rows, and calling
 * the request Rejected would assert nothing was credited. `Running` and
 * `PendingApproval` fold into `Pending` and `Submitted` respectively.
 *
 * `Pending -> Submitted` is live: `lib/bo/release.ts` rolls a released request
 * up through `rollUpStatus`. `Approved` and `Rejected` still wait on the
 * approval poller (PLAN §6) — the BO decides those, and nothing here polls it
 * yet, so a released request stops at `Submitted` until someone reads the job
 * list.
 */

export const RequestStatus = {
  /** Raised in the dashboard. Nothing has been sent to the Back Office. */
  PENDING: 'Pending',
  /** Accepted by the BO; job IDs returned, awaiting its approver. */
  SUBMITTED: 'Submitted',
  /** BO job complete, approver recorded. Money has moved. */
  APPROVED: 'Approved',
  /** Any other outcome: refused by the BO, or refused here before it went. */
  REJECTED: 'Rejected',
} as const;

export type RequestStatusValue =
  (typeof RequestStatus)[keyof typeof RequestStatus];

/**
 * The transitions, as the events that cause them.
 *
 * A function rather than a map so an unknown event is a compile error at the
 * call site instead of an `undefined` status written to a row. `request.created`
 * and `bo.submitted` both fire today; `bo.approved` / `bo.rejected` wait on the
 * approval poller, and are unit-tested rather than exercised.
 */
export type RequestTransition =
  | 'request.created'
  | 'bo.submitted'
  | 'bo.approved'
  | 'bo.rejected';

export function requestStatusAfter(event: RequestTransition): RequestStatusValue {
  switch (event) {
    case 'request.created':
      return RequestStatus.PENDING;
    case 'bo.submitted':
      return RequestStatus.SUBMITTED;
    case 'bo.approved':
      return RequestStatus.APPROVED;
    case 'bo.rejected':
      return RequestStatus.REJECTED;
  }
}

/**
 * Item statuses keep their full granularity and are NOT collapsed. They are what
 * the request-level roll-up throws away — which row was never sent, which was
 * blocked by the dedup ledger, which the BO refused — and with four request
 * states they are now the only record of it.
 */
export const ITEM_STATUS = {
  PENDING:   'Pending',
  SUBMITTED: 'Submitted',
  APPROVED:  'Approved',
  REJECTED:  'Rejected',
  FAILED:    'Failed',
  /** Blocked by the dedup key — never credited. */
  DUPLICATE: 'Duplicate',
} as const;

export type ItemStatusValue = (typeof ITEM_STATUS)[keyof typeof ITEM_STATUS];

/** Terminal states — the poller stops chasing these. */
export const TERMINAL_REQUEST_STATUSES: readonly string[] = [
  RequestStatus.APPROVED,
  RequestStatus.REJECTED,
];

/**
 * Money is with the Back Office in these states — submitted and awaiting an
 * approver there, or approved and credited.
 *
 * `Rejected` is out because nothing on a rejected request was credited by it;
 * `Pending` is out because nothing has been sent. Note the partial case now
 * reads as `Submitted`, so it is correctly counted here rather than being lost
 * under a rejection.
 */
export const MONEY_MOVED_STATUSES: readonly string[] = [
  RequestStatus.SUBMITTED,
  RequestStatus.APPROVED,
];

type Display = {
  label: string;
  /** Tailwind classes — matches the mockup's badge treatment. */
  tone: string;
  /**
   * Text colour on its own, for the places that show the status WITHOUT a
   * filled badge. Spelled out rather than derived from `dot`: Tailwind only
   * emits classes it can see as literals, so `text-${hue}-600` would compile to
   * nothing at all.
   */
  text: string;
  dot: string;
  pulse?: boolean;
  hint: string;
};

export const STATUS_DISPLAY: Record<string, Display> = {
  [RequestStatus.PENDING]: {
    label: 'Pending',
    tone: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
    pulse: true,
    hint: 'Raised here and waiting for a Payment Ops release. Nothing has been sent to the Back Office.',
  },
  [RequestStatus.SUBMITTED]: {
    label: 'Submitted',
    tone: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900',
    text: 'text-violet-600 dark:text-violet-400',
    dot: 'bg-violet-500',
    pulse: true,
    hint: 'Accepted by the Back Office and waiting on an approver there. Some rows may already be settled — check the items.',
  },
  [RequestStatus.APPROVED]: {
    label: 'Approved',
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    hint: 'Approved in the Back Office. Player wallets updated.',
  },
  [RequestStatus.REJECTED]: {
    label: 'Rejected',
    tone: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900',
    text: 'text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
    // Deliberately does not claim nothing was credited: this one word now covers
    // both "refused before it went" and "refused after it went".
    hint: 'Not approved. Open the items to see which rows were credited, if any, and why the rest were not.',
  },
};

export function displayFor(status: string): Display {
  return (
    STATUS_DISPLAY[status] ?? {
      label: status,
      tone: 'bg-slate-50 text-slate-700 border-slate-200',
      text: 'text-slate-500 dark:text-slate-400',
      dot: 'bg-slate-400',
      hint: 'Unrecognised status.',
    }
  );
}

/**
 * Roll per-item outcomes up to one of the four request states, after a run.
 *
 * `submittedAnything` is passed separately rather than inferred, and still earns
 * it: a chunk can leave this process and then error, marking its items `Failed`
 * with nothing left saying the BO ever saw them. Without the flag that case
 * reads as "never sent" and the request would claim money definitely did not
 * move, which is the one thing it must not get wrong.
 *
 * The order of the checks IS the model:
 *   1. Nothing left the process   -> Pending if untouched, otherwise Rejected.
 *   2. Anything unresolved        -> Submitted.
 *   3. The BO refused a row       -> Rejected.
 *   4. A chunk errored after some -> Submitted (the old PartiallyFailed; those
 *      accepted chunks are real money, and Rejected would deny them).
 *   5. Everything else approved   -> Approved. A Duplicate alongside is fine —
 *      that row WAS credited, on the earlier request that claimed its key.
 *   6. Nothing approved at all    -> Rejected.
 *
 * Called by `lib/bo/release.ts` after every run, against the request's items as
 * the DATABASE has them rather than the ones that run touched — a request
 * released in two passes has items the second pass never saw.
 */
export function rollUpStatus(
  items: readonly { status: string }[],
  submittedAnything: boolean,
): RequestStatusValue {
  const has = (s: string) => items.some((i) => i.status === s);
  const all = (s: string) => items.length > 0 && items.every((i) => i.status === s);

  if (!submittedAnything) {
    // A request whose items are all still Pending has not been run at all —
    // that is the initial state, not a refusal.
    return items.length === 0 || all(ITEM_STATUS.PENDING)
      ? RequestStatus.PENDING
      : RequestStatus.REJECTED;
  }

  if (has(ITEM_STATUS.PENDING) || has(ITEM_STATUS.SUBMITTED)) return RequestStatus.SUBMITTED;
  if (has(ITEM_STATUS.REJECTED)) return RequestStatus.REJECTED;
  if (has(ITEM_STATUS.FAILED)) return RequestStatus.SUBMITTED;
  return has(ITEM_STATUS.APPROVED) ? RequestStatus.APPROVED : RequestStatus.REJECTED;
}


/**
 * Per-ITEM display, for the entry-level list.
 *
 * The list answers one question — "where is this adjustment in the Back
 * Office?" — so these labels say that, rather than naming the internal state.
 * `Pending` in particular means NOT SENT: the commonest misread of that column
 * would be to assume the money is already in flight.
 */
export const ITEM_STATUS_DISPLAY: Record<string, Display> = {
  [ITEM_STATUS.PENDING]: {
    label: 'Not sent to BO',
    tone: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
    pulse: true,
    hint: 'Raised here, waiting for a Payment Ops release. Nothing has been sent.',
  },
  [ITEM_STATUS.SUBMITTED]: {
    label: 'In BO queue',
    tone: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-400 dark:border-violet-900',
    text: 'text-violet-600 dark:text-violet-400',
    dot: 'bg-violet-500',
    pulse: true,
    hint: 'Accepted by the Back Office and waiting on an approver there.',
  },
  [ITEM_STATUS.APPROVED]: {
    label: 'Approved in BO',
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    hint: 'Approved in the Back Office. The player wallet was updated.',
  },
  [ITEM_STATUS.REJECTED]: {
    label: 'Rejected by BO',
    tone: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900',
    text: 'text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
    hint: 'The Back Office approver turned this row down after submission.',
  },
  [ITEM_STATUS.FAILED]: {
    label: 'Failed',
    tone: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900',
    text: 'text-orange-600 dark:text-orange-400',
    dot: 'bg-orange-500',
    hint: 'This row errored. Nothing was credited for it — see the error.',
  },
  [ITEM_STATUS.DUPLICATE]: {
    label: 'Duplicate',
    tone: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
    text: 'text-slate-500 dark:text-slate-400',
    dot: 'bg-slate-400',
    hint: 'Blocked by the dedup ledger — it was never credited.',
  },
};

/**
 * The lifecycle as THREE steps: raised here -> accepted by the BO -> settled
 * there. Reads the same names at request and item level, because they are the
 * same names.
 *
 * Three, not four, because Approved and Rejected are the same MOMENT with two
 * outcomes — drawing them as separate steps would imply a request passes
 * through one on the way to the other.
 *
 * `skipped` exists for Duplicate: the dedup ledger blocks a row before anything
 * is sent, so it never reaches the BO. Marking that step "done" would say a
 * submission happened; marking it "upcoming" would say one still might.
 */
export type StepState = 'done' | 'current' | 'upcoming' | 'skipped';
export type StepTone = 'neutral' | 'active' | 'good' | 'bad';
export type LifecycleStep = { key: string; label: string; state: StepState; tone: StepTone };

const step = (key: string, label: string, state: StepState, tone: StepTone): LifecycleStep => ({
  key,
  label,
  state,
  tone,
});

export function lifecycleSteps(status: string): LifecycleStep[] {
  const raised = (state: StepState) =>
    step('raised', 'Pending', state, state === 'current' ? 'active' : 'neutral');
  const sent = (state: StepState) =>
    step('sent', 'Submitted', state, state === 'current' ? 'active' : 'neutral');

  switch (status) {
    case ITEM_STATUS.SUBMITTED: // === RequestStatus.SUBMITTED
      return [raised('done'), sent('current'), step('settled', 'Approved', 'upcoming', 'neutral')];

    case ITEM_STATUS.APPROVED:
      return [raised('done'), sent('done'), step('settled', 'Approved', 'current', 'good')];

    case ITEM_STATUS.REJECTED:
      return [raised('done'), sent('done'), step('settled', 'Rejected', 'current', 'bad')];

    case ITEM_STATUS.FAILED:
      // It was sent and errored, so the send DID happen — unlike a duplicate.
      return [raised('done'), sent('done'), step('settled', 'Failed', 'current', 'bad')];

    case ITEM_STATUS.DUPLICATE:
      return [raised('done'), sent('skipped'), step('settled', 'Duplicate', 'current', 'bad')];

    case ITEM_STATUS.PENDING: // === RequestStatus.PENDING
    default:
      // An unrecognised status sits at the start rather than inventing progress
      // for it — the badge beside this still names it verbatim.
      return [
        raised('current'),
        sent('upcoming'),
        step('settled', 'Approved', 'upcoming', 'neutral'),
      ];
  }
}

export function itemDisplayFor(status: string): Display {
  return (
    ITEM_STATUS_DISPLAY[status] ?? {
      label: status,
      tone: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      text: 'text-slate-500 dark:text-slate-400',
      dot: 'bg-slate-400',
      hint: 'Unrecognised status.',
    }
  );
}
