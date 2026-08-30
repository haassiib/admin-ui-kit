'use client';

/* Origin: bonus-adjustment (96S2), verbatim. */

export default function ToggleSwitch({
  id,
  checked,
  onChange,
  label,
  disabled = false,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={`relative inline-flex items-center gap-2 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <input
        id={id}
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="w-9 h-5 rounded-full bg-slate-200 dark:bg-slate-700 peer-checked:bg-indigo-600 transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-4" />
      {label && (
        <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{label}</span>
      )}
    </label>
  );
}
