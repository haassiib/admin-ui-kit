/**
 * The dashboard payload types, lifted out of marketing-stats'
 * `app/(main)/actions.ts`.
 *
 * Only the TYPES travel: every component that imported from that module did so
 * with `import type`, because the queries behind them are server-only. Copying
 * the shapes rather than the actions keeps the dashboard components compiling
 * against exactly the contract they were written for, with no database.
 */

export type Metrics = {
  totalSpend: number;
  spend: number;
  registrations: number;
  ftd: number;
  ltvSum: number;
  ftdCost: number;
  regCost: number;
  roi: number;
};

export type TrendPoint = {
  /** YYYY-MM-DD */
  date: string;
  /** Total Spend that day */
  spend: number;
  registrations: number;
  ftd: number;
};

export type RetentionTrendPoint = {
  /** ISO date string, first day of the month (UTC) */
  month: string;
  /** "Converted" — % of registrants who made a deposit */
  depositRate: number | null;
  /** "D30" — % retained at day 30 */
  thirtyDaysRate: number | null;
  registerCount: number;
  depositCount: number;
  thirtyDaysCount: number;
};

export type RankedRow = {
  id: number;
  name: string;
  brandName?: string;
  totalSpend: number;
  ftd: number;
  roi: number;
};

export type DashboardData = {
  isSuperUser: boolean;
  agentIds: number[];
  brands: { id: number; name: string; platformId: number }[];
  agents: { id: number; name: string; brandId: number }[];
  platforms: { id: number; name: string }[];
  summary: {
    current: Metrics;
    previous: Metrics;
    activeBrands: number;
    activeAgents: number;
  };
  trend: TrendPoint[];
  retentionTrend: RetentionTrendPoint[];
  topBrands: RankedRow[];
  topAgents: RankedRow[];
  rangeDays: number;
};
