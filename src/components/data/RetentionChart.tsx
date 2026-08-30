'use client';

/* Origin: marketing-stats (96S1), verbatim. */

import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { RetentionTrendPoint } from './types';
import { percent, useChartTheme } from './chartTheme';

const fmtMonth = (iso: string) =>
  // iso is a month's 1st day, always stored/queried at UTC midnight (see
  // getDashboardData) — format in UTC to avoid a TZ off-by-one shifting it
  // into the previous month.
  new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });

// Deposit Retention trend — reuses reports/brands-roi's own BrandDepositRetention
// definitions (depositRate = "Converted" %, thirtyDaysRate = "D30" %) rather
// than deriving a new retention ratio, over the same month-range/filter scope
// (platform/brand/agent + RBAC) as the rest of the dashboard. One point per
// calendar month, matching BrandDepositRetention's own monthly grain (unlike
// DashboardTrends' daily AgentStat-derived points).
export default function RetentionChart({ trend }: { trend: RetentionTrendPoint[] }) {
  const t = useChartTheme();
  const hasData = trend.length > 0;

  return (
    <div className="panel mb-4">
      <h2>Deposit Retention Trend</h2>
      {!hasData ? (
        <div className="flex h-[300px] items-center justify-center text-sm text-gray-400 dark:text-gray-500">No data for the selected period.</div>
      ) : (
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={t.grid} />
              <XAxis dataKey="month" tickFormatter={fmtMonth} tick={{ fontSize: 12, fill: t.axis }} stroke={t.grid} minTickGap={24} />
              <YAxis tickFormatter={percent} tick={{ fontSize: 12, fill: t.axis }} stroke={t.grid} width={44} domain={[0, 100]} />
              <Tooltip
                contentStyle={t.tooltip}
                labelFormatter={(l) => fmtMonth(String(l))}
                formatter={(v, name, item) => {
                  const row = item?.payload as RetentionTrendPoint;
                  const count = name === 'Converted' ? row.depositCount : row.thirtyDaysCount;
                  return [typeof v !== 'number' ? '—' : `${percent(v)}  ·  ${count.toLocaleString()} users`, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="depositRate" name="Converted" stroke={t.series.retention} strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="thirtyDaysRate" name="D30" stroke={t.series.retentionD30} strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
