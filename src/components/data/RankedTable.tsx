'use client';

/* Origin: marketing-stats (96S1), verbatim. */

import type { RankedRow } from './types';
import { fullCurrency } from './chartTheme';

// Ranked table of top rows by Total Spend. Table row height is driven by the
// app-wide density CSS (line-height on td), so real vertical spacing inside a
// stacked cell would need a child <div> — here every cell is single-line, so
// plain td padding classes are enough for horizontal spacing only.
export default function RankedTable({ rows }: { rows: RankedRow[] }) {
  return (
    <div className="panel mb-0">
      <h2>Top Items by Spend</h2>
      {rows.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-sm text-gray-400 dark:text-gray-500">No data for the selected period.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="px-3">#</th>
                <th className="px-3">Item</th>
                <th className="px-3">Brand</th>
                <th className="px-3 text-right">Total Spend</th>
                <th className="px-3 text-right">FTD</th>
                <th className="px-3 text-right">ROI</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a, i) => (
                <tr key={a.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <td className="px-3 text-gray-400 dark:text-gray-500 tabular-nums">{i + 1}</td>
                  <td className="px-3 font-medium text-gray-900 dark:text-white">{a.name}</td>
                  <td className="px-3 text-gray-500 dark:text-gray-400">{a.brandName ?? '—'}</td>
                  <td className="px-3 text-right tabular-nums text-gray-900 dark:text-gray-100">{fullCurrency(a.totalSpend)}</td>
                  <td className="px-3 text-right tabular-nums">{a.ftd.toLocaleString()}</td>
                  <td className={`px-3 text-right tabular-nums font-medium ${a.roi >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {a.roi.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
