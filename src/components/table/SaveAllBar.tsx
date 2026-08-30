'use client';

import { useState } from 'react';
import { Save, X } from 'lucide-react';

/**
 * The unsaved-changes bar for inline-edit tables. Renders nothing at zero, so
 * the caller can mount it unconditionally.
 *
 * It tracks its own busy state while awaiting `onSaveAll`, which is what stops a
 * double-click from firing two saves — worth having when a single save is one
 * transaction over the whole menu tree.
 *
 * MERGED from two copies. The external `saving` prop came across from
 * marketing-stats: a caller that already owns a save-in-flight flag (a page
 * saving several tables at once, say) needs the bar to reflect THAT, not just
 * its own await. The two are OR-ed, so passing nothing keeps the built-in
 * behaviour exactly as it was.
 */
export default function SaveAllBar({
  count,
  onSaveAll,
  onDiscardAll,
  saving = false,
}: {
  count: number;
  onSaveAll: () => void | Promise<void>;
  onDiscardAll: () => void;
  /**
   * Externally-owned busy flag, for a caller that already tracks a save in
   * flight. OR-ed with the bar's own — it never needs to be passed for the
   * built-in await to work.
   */
  saving?: boolean;
}) {
  const [internalSaving, setInternalSaving] = useState(false);
  const busy = saving || internalSaving;

  if (count === 0) return null;

  const save = async () => {
    setInternalSaving(true);
    try {
      await onSaveAll();
    } finally {
      setInternalSaving(false);
    }
  };

  return (
    <div className="sticky bottom-4 z-20 mx-auto w-fit flex items-center gap-3 pl-4 pr-2 py-2 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-700 shadow-xl">
      <span className="text-xs text-slate-700 dark:text-slate-200 whitespace-nowrap">
        <span className="font-semibold">{count}</span> unsaved change{count === 1 ? '' : 's'}
      </span>
      <button type="button" onClick={save} disabled={busy} className="btn-primary rounded-full px-4">
        <Save className="w-3.5 h-3.5" />
        {busy ? 'Saving…' : 'Save all'}
      </button>
      <button
        type="button"
        onClick={onDiscardAll}
        disabled={busy}
        className="btn-ghost rounded-full px-3"
      >
        <X className="w-3.5 h-3.5" />
        Discard
      </button>
    </div>
  );
}
