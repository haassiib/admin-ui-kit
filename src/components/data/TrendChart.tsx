'use client';

/* Origin: marketing-stats (96S1), verbatim. */

import {
  Area, AreaChart, Bar, CartesianGrid, ComposedChart, Legend, Line,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { format } from 'date-fns';
import type { TrendPoint } from './types';
import { compactCurrency, compactNumber, useChartTheme } from './chartTheme';

const fmtDay = (iso: string) => {
  // iso is a plain YYYY-MM-DD; parse as local to avoid a TZ off-by-one.
  const [y, m, d] = iso.split('-').map(Number);
  return format(new Date(y, m - 1, d), 'MMM d');
};

function EmptyOrChart({ hasData, children }: { hasData: boolean; children: React.ReactNode }) {
  if (!hasData) {
    return <div className="flex h-[300px] items-center justify-center text-xs text-slate-400 dark:text-slate-500">No data for the selected period.</div>;
  }
  return <>{children}</>;
}

export default function TrendChart({ trend }: { trend: TrendPoint[] }) {
  const t = useChartTheme();
  const hasData = trend.length > 0;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {/* Total Spend over time */}
      <div className="panel p-5">
        <h2 className="panel-title mb-3">Total Spend</h2>
        <EmptyOrChart hasData={hasData}>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={t.series.spend} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={t.series.spend} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={t.grid} />
                <XAxis dataKey="date" tickFormatter={fmtDay} tick={{ fontSize: 12, fill: t.axis }} stroke={t.grid} minTickGap={24} />
                <YAxis tickFormatter={compactCurrency} tick={{ fontSize: 12, fill: t.axis }} stroke={t.grid} width={56} />
                <Tooltip
                  contentStyle={t.tooltip}
                  labelFormatter={(l) => fmtDay(String(l))}
                  formatter={(v, name) => [compactCurrency(Number(v)), name]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="spend" name="Total Spend" stroke={t.series.spend} strokeWidth={2} fill="url(#gradSpend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </EmptyOrChart>
      </div>

      {/* Registrations vs FTD (acquisition over time) */}
      <div className="panel p-5">
        <h2 className="panel-title mb-3">Registrations vs First-Time Deposits</h2>
        <EmptyOrChart hasData={hasData}>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trend} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={t.grid} />
                <XAxis dataKey="date" tickFormatter={fmtDay} tick={{ fontSize: 12, fill: t.axis }} stroke={t.grid} minTickGap={24} />
                <YAxis tickFormatter={compactNumber} tick={{ fontSize: 12, fill: t.axis }} stroke={t.grid} width={40} allowDecimals={false} />
                <Tooltip contentStyle={t.tooltip} labelFormatter={(l) => fmtDay(String(l))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="registrations" name="Registrations" fill={t.series.registrations} radius={[3, 3, 0, 0]} maxBarSize={22} />
                <Line type="monotone" dataKey="ftd" name="First-Time Deposits" stroke={t.series.ftd} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </EmptyOrChart>
      </div>
    </div>
  );
}
