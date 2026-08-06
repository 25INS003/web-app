import { z } from "zod";

// Schemas for GET /shop-owners/dashboard-stats.
//
// ⚠️ That endpoint returns TWO different shapes. When the owner has no shops it
// short-circuits with a narrow payload — `overview` carries only the six totals,
// `salesTrend`/`topProducts` are empty arrays, and `monthlySalesTrend`,
// `yearlySalesTrend` and `advanced` are absent entirely
// (backend shopowner.controllers.js:486). Everything the full branch adds is
// therefore optional-with-a-default here, so the no-shops case parses cleanly
// into the same type instead of throwing on a brand-new owner's first login.
//
// Money arrives as a float rupee amount (see plan/03 P3c — it will become
// integer paise; this schema is a place that changes when it does).

const numberOr0 = z.number().catch(0);

/** One point on a sales chart. `date` is a pre-formatted label, not a date. */
export const salesPointSchema = z.object({
  // Pre-formatted by the backend with toLocaleDateString: "Mon" for the 7-day
  // trend, "Jan" for monthly, "2026" for yearly. Display-only — do not parse.
  date: z.string(),
  value: numberOr0,
});
export type SalesPoint = z.infer<typeof salesPointSchema>;

export const topProductSchema = z.object({
  name: z.string(),
  sales: numberOr0,
  revenue: numberOr0,
  isBest: z.boolean().catch(false),
  // Pre-formatted percentage string, e.g. "+12%" / "-4%".
  trend: z.string().catch("0%"),
});
export type TopProduct = z.infer<typeof topProductSchema>;

export const ordersByStatusSchema = z.object({
  completed: numberOr0,
  pending: numberOr0,
  cancelled: numberOr0,
  refunded: numberOr0,
});
export type OrdersByStatus = z.infer<typeof ordersByStatusSchema>;

const emptyOrdersByStatus: OrdersByStatus = {
  completed: 0,
  pending: 0,
  cancelled: 0,
  refunded: 0,
};

export const dashboardOverviewSchema = z.object({
  // Present in both branches.
  totalRevenue: numberOr0,
  totalProfit: numberOr0,
  totalOrders: numberOr0,
  totalProducts: numberOr0,
  totalCustomers: numberOr0,
  avgOrderValue: numberOr0,

  // Full branch only — defaulted so the no-shops payload still parses.
  shopIds: z.array(z.string()).default([]),
  ordersByStatus: ordersByStatusSchema.default(emptyOrdersByStatus),
  revenueComparison: z
    .object({ thisMonth: numberOr0, lastMonth: numberOr0 })
    .default({ thisMonth: 0, lastMonth: 0 }),
  revenuePercentChange: numberOr0.default(0),
  avgOrderPercentChange: numberOr0.default(0),
  customerPercentChange: numberOr0.default(0),
  salesPercentChange: numberOr0.default(0),
  newCustomers: numberOr0.default(0),
  returningCustomers: numberOr0.default(0),
});
export type DashboardOverview = z.infer<typeof dashboardOverviewSchema>;

export const dashboardStatsSchema = z.object({
  overview: dashboardOverviewSchema,
  salesTrend: z.array(salesPointSchema).default([]),
  monthlySalesTrend: z.array(salesPointSchema).default([]),
  yearlySalesTrend: z.array(salesPointSchema).default([]),
  topProducts: z.array(topProductSchema).default([]),
  // `advanced` is a large grab-bag (peak hours, inventory health, category
  // performance, payment mix, top customers, refunds, slow movers, geo). P1
  // renders none of it, so it is deliberately left unmodelled rather than
  // half-typed — add fields here as screens actually consume them.
  advanced: z.unknown().optional(),
});
export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
