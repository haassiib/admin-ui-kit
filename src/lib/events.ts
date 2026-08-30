/**
 * How an `events` row is presented. Shared by the dashboard's activity feed and
 * the header's notification bell — the two render the same rows, so the labels,
 * tones and the admin/ordinary split live here rather than in either component.
 *
 * Event types are open-ended by design, so the label map falls back to the raw
 * type instead of hiding an event nobody has styled yet.
 */
export const EVENT_LABELS: Record<string, string> = {
  'request.created': 'Request created',
  /**
   * HISTORICAL. Nothing emits this any more — the force-takeover it recorded
   * was removed, and a draft held by somebody else now simply waits for them.
   *
   * The label stays because ROWS OF THIS TYPE EXIST. `events` is the audit
   * trail and is never pruned, so deleting the mapping would not delete the
   * history — it would just make it render as the raw string `draft.unlocked`
   * in the bell, on /notifications and in the activity feed. Deleting a label
   * is how an audit trail quietly becomes unreadable.
   */
  'draft.unlocked': 'Draft taken over',
  'request.released': 'Released to the BO',
  'bo.submitted': 'Submitted to the BO',
  'bo.approved': 'Approved in the BO',
  'bo.rejected': 'Rejected in the BO',
  // Both written only by the approval poller (lib/bo/poll-approvals.ts).
  // `partial` is a completed job the BO counted errors on: it cannot say WHICH
  // rows, so the items stay Submitted and this event is the only prompt anyone
  // gets to reconcile it. `unresolved` is a job that stopped appearing in the
  // BO's lists — deliberately not called a rejection, which would be a guess.
  // NOT "Approved …": the request stays Submitted until a human reconciles it,
  // and a label that says approved would contradict the status beside it — and
  // would put this row under a search for "approved".
  'bo.partial': 'Completed in the BO with errors',
  'bo.unresolved': 'No longer tracked in the BO',
  'run.failed': 'Run failed',
  'auth.failed': 'Failed sign-in',
  'auth.registered': 'Access requested',
  'auth.register_duplicate': 'Access requested for an existing email',
  'auth.reset_requested': 'Password reset requested',
  'auth.reset_issued': 'Reset link issued',
  'auth.password_reset': 'Password reset',
  'user.created': 'User created',
  'user.updated': 'User updated',
  'user.activated': 'User activated',
  'user.deactivated': 'User deactivated',
  'role.created': 'Role created',
  'role.updated': 'Role updated',
  'role.deleted': 'Role deleted',
  'menu.saved': 'Menu tree saved',
  'menu.deleted': 'Menu deleted',
};

/** Auth and admin noise is only interesting to someone who administers it. */
export const ADMIN_PREFIXES = ['auth.', 'user.', 'role.', 'menu.'] as const;

export const isAdminEvent = (type: string): boolean =>
  ADMIN_PREFIXES.some((p) => type.startsWith(p));

const TONES: Array<[RegExp, string]> = [
  [/^bo\.approved$/, 'bg-emerald-500'],
  [/^(bo\.rejected|run\.failed|auth\.failed)$/, 'bg-rose-500'],
  // Amber in spirit: neither of these is a failure, but both need a human.
  [/^(bo\.partial|bo\.unresolved)$/, 'bg-amber-500'],
  [/^request\./, 'bg-indigo-500'],
  [/^bo\./, 'bg-violet-500'],
  // Amber, with the failures rather than with the neutral rows: somebody lost
  // work here, and a grey dot would file it next to routine noise. Kept for the
  // historical rows — see the label above.
  [/^draft\.unlocked$/, 'bg-amber-500'],
];

export const eventTone = (type: string): string =>
  TONES.find(([pattern]) => pattern.test(type))?.[1] ?? 'bg-slate-300 dark:bg-slate-600';

export const eventLabel = (type: string): string => EVENT_LABELS[type] ?? type;

/**
 * The event types whose LABEL matches a free-text search.
 *
 * The notifications list has no title column to search: what a reader sees as
 * "Approved in the BO" is stored as `bo.approved`, and the mapping is this file,
 * not the database. So a search resolves to a set of types HERE and the query
 * then matches a real, indexed column (`events.type IN (...)`) — rather than the
 * alternative, which would be denormalising a rendered title into the audit
 * trail purely so it could be LIKEd.
 *
 * The raw type is still matched separately by the query, so `bo.` keeps working
 * as a search even though no label contains it.
 */
export function eventTypesMatchingLabel(query: string): string[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return Object.entries(EVENT_LABELS)
    .filter(([, label]) => label.toLowerCase().includes(needle))
    .map(([type]) => type);
}

// ── Notification card presentation ───────────────────────────────────────────
//
// The mockup's drawer (docs/dashboard.html → `renderNotifications()`) renders
// each notification as a TINTED card — `p-3 <tint> border rounded-lg text-xs
// space-y-1 shadow-sm` — rather than a flat list row. It tinted by the viewer's
// role, which was a mockup affordance; the same treatment keyed to the event's
// own tone carries real meaning, so an approval and a failure no longer look
// alike.
//
// The mockup is light-mode only. Every tint carries a dark counterpart here
// because this app is theme-aware and a `-50` background is unreadable in dark.

type CardTint = { card: string; icon: string };

const CARD_TINTS: Array<[RegExp, CardTint]> = [
  [/^bo\.approved$/, {
    card: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900',
    icon: 'text-emerald-600 dark:text-emerald-400',
  }],
  [/^(bo\.rejected|run\.failed|auth\.failed)$/, {
    card: 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900',
    icon: 'text-rose-600 dark:text-rose-400',
  }],
  [/^(bo\.partial|bo\.unresolved)$/, {
    card: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900',
    icon: 'text-amber-600 dark:text-amber-400',
  }],
  [/^draft\.unlocked$/, {
    card: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900',
    icon: 'text-amber-600 dark:text-amber-400',
  }],
  [/^request\./, {
    card: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-900',
    icon: 'text-indigo-600 dark:text-indigo-400',
  }],
  [/^bo\./, {
    card: 'bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-900',
    icon: 'text-violet-600 dark:text-violet-400',
  }],
];

const NEUTRAL_TINT: CardTint = {
  card: 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700',
  icon: 'text-slate-400 dark:text-slate-500',
};

/**
 * A read card drops to neutral regardless of type — colour is what marks a card
 * as still wanting attention, so keeping it after the read would make the tint
 * decorative.
 */
export const eventCardTint = (type: string, read = false): CardTint =>
  read ? NEUTRAL_TINT : (CARD_TINTS.find(([p]) => p.test(type))?.[1] ?? NEUTRAL_TINT);

/**
 * The mockup's `time` field, which was hardcoded ('10m ago', '1h ago'). Real
 * rows carry an ISO timestamp, so it is derived — `now` is injectable to keep
 * this testable rather than clock-dependent.
 */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const minutes = Math.floor(Math.max(0, now - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return iso.slice(0, 10);
}
