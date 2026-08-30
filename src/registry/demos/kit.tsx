'use client';

import { useState } from 'react';

/** Lays demo variants out in a wrapping row with consistent gaps. */
export function Row({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-wrap items-center gap-3 ${className}`}>{children}</div>;
}

/** Labels one variant inside a Row. */
export function Variant({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </span>
      {children}
    </div>
  );
}

/**
 * State plus a readout of the current value.
 *
 * Most of these are controlled components whose whole contract is the value they
 * emit, and that contract is invisible if the demo only renders the widget.
 */
export function useEcho<T>(initial: T): [T, (next: T) => void, React.ReactNode] {
  const [value, setValue] = useState<T>(initial);
  const echo = (
    <pre className="mt-1 overflow-x-auto rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      {JSON.stringify(value)}
    </pre>
  );
  return [value, setValue, echo];
}

/** A stand-in table, for the components that only make sense inside one. */
export function DemoTable({ head, children }: { head: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
      <table className="data-table">
        <thead>
          <tr>{head}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
