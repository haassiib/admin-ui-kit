import { InfoTooltip } from '@/components/overlay/Tooltip';

/* Origin: bonus-adjustment (96S2), verbatim. The hint sits behind an ⓘ
   rather than under the title, like every other hint in the kit. */
export default function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-1">
      <p className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
        {title}
        {hint && <InfoTooltip content={hint} label="Why is this empty?" />}
      </p>
    </div>
  );
}
