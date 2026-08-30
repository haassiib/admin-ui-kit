/* Origin: bonus-adjustment (96S2), verbatim. */
import { lifecycleSteps, type LifecycleStep } from '@/lib/status';

/**
 * Pending -> Submitted -> Approved/Rejected, with the current step highlighted.
 *
 * A stepper rather than a lone badge because the badge answers "what is it now"
 * and this answers "how far has it got" — the question an operator chasing a
 * payout is actually asking. The two are complementary, so the row keeps both.
 *
 * Colour is never the only signal: the current step is also the only BOLD one
 * and the only filled dot, so the indicator survives being read in greyscale or
 * by someone who cannot separate the emerald from the rose.
 */

const DOT: Record<LifecycleStep['state'], string> = {
  done: 'bg-slate-400 dark:bg-slate-500',
  current: '',            // tone decides — see TONE_DOT
  upcoming: 'bg-slate-200 dark:bg-slate-700',
  skipped: 'bg-transparent border border-dashed border-slate-300 dark:border-slate-600',
};

const TONE_DOT: Record<LifecycleStep['tone'], string> = {
  neutral: 'bg-slate-400 dark:bg-slate-500',
  active: 'bg-amber-500',
  good: 'bg-emerald-500',
  bad: 'bg-rose-500',
};

const TONE_TEXT: Record<LifecycleStep['tone'], string> = {
  neutral: 'text-slate-400 dark:text-slate-500',
  active: 'text-amber-700 dark:text-amber-400',
  good: 'text-emerald-700 dark:text-emerald-400',
  bad: 'text-rose-700 dark:text-rose-400',
};

export default function StatusSteps({ status }: { status: string }) {
  const steps = lifecycleSteps(status);
  const current = steps.find((s) => s.state === 'current');

  return (
    <ol
      className="flex items-center gap-1 leading-tight"
      aria-label={`Progress: ${current?.label ?? status}`}
    >
      {steps.map((s, i) => (
        <li key={s.key} className="flex items-center gap-1">
          {i > 0 && (
            <span
              aria-hidden
              className={`w-3 h-px shrink-0 ${
                s.state === 'upcoming'
                  ? 'bg-slate-200 dark:bg-slate-700'
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}
            />
          )}
          <span
            aria-hidden
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              s.state === 'current' ? TONE_DOT[s.tone] : DOT[s.state]
            }`}
          />
          <span
            className={`text-[10px] leading-tight whitespace-nowrap ${
              s.state === 'current'
                ? `font-semibold ${TONE_TEXT[s.tone]}`
                : s.state === 'done'
                  ? 'text-slate-500 dark:text-slate-400'
                  : s.state === 'skipped'
                    ? 'text-slate-300 dark:text-slate-600 line-through'
                    : 'text-slate-300 dark:text-slate-600'
            }`}
          >
            {s.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
