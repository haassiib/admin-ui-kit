'use client';

import type { PropDoc } from '@/registry/props';

/**
 * The API table, rendered from types parsed out of the component's own source.
 *
 * Required props sort first: reading an unfamiliar component, "what must I pass"
 * is the question you have before "what can I pass".
 */
export default function PropsTable({
  props,
  nativeElement,
}: {
  props: PropDoc[];
  nativeElement?: string | null;
}) {
  if (props.length === 0) {
    return (
      <p className="note">
        No prop table — this one&apos;s signature is not a plain object type. Read the Source tab.
      </p>
    );
  }

  const sorted = [...props].sort((a, b) => Number(b.required) - Number(a.required));

  return (
    <div className="panel panel-solid overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th className="px-4">Prop</th>
            <th className="px-4">Type</th>
            <th className="px-4">Default</th>
            <th className="px-4">Description</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p.name} className="align-top hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="px-4">
                <code className="font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                  {p.name}
                </code>
                {p.required && (
                  <span className="ml-1 text-[10px] font-semibold text-rose-500" title="Required">
                    *
                  </span>
                )}
              </td>
              <td className="px-4">
                <code className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                  {p.type}
                </code>
              </td>
              <td className="px-4">
                {p.defaultValue ? (
                  <code className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {p.defaultValue}
                  </code>
                ) : (
                  <span className="text-slate-300 dark:text-slate-600">—</span>
                )}
              </td>
              <td className="px-4 py-2 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                {p.description ?? ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {nativeElement && (
        <p className="border-t border-slate-200 px-4 py-2 text-[11px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Also accepts every prop <code>&lt;{nativeElement}&gt;</code> takes — they are spread onto
          the root element.
        </p>
      )}
    </div>
  );
}
