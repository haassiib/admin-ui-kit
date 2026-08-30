/* Origin: bonus-adjustment (96S2), verbatim. */
export default function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-1">
      <p className="text-slate-700 font-medium text-sm">{title}</p>
      {hint && <p className="text-slate-400 text-xs max-w-md">{hint}</p>}
    </div>
  );
}
