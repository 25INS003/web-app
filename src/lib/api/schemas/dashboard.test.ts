import { describe, expect, it } from "vitest";
import { dashboardStatsSchema } from "./dashboard";

// The endpoint has two response shapes. The no-shops branch is the one that
// broke naive schemas, so it is pinned here explicitly.

describe("dashboardStatsSchema", () => {
  it("parses the no-shops payload, defaulting everything the branch omits", () => {
    // Exactly what backend shopowner.controllers.js:486 returns.
    const parsed = dashboardStatsSchema.parse({
      overview: {
        totalRevenue: 0,
        totalProfit: 0,
        totalOrders: 0,
        totalProducts: 0,
        totalCustomers: 0,
        avgOrderValue: 0,
      },
      salesTrend: [],
      topProducts: [],
    });

    expect(parsed.overview.shopIds).toEqual([]);
    expect(parsed.overview.ordersByStatus).toEqual({
      completed: 0,
      pending: 0,
      cancelled: 0,
      refunded: 0,
    });
    expect(parsed.overview.revenuePercentChange).toBe(0);
    expect(parsed.monthlySalesTrend).toEqual([]);
    expect(parsed.yearlySalesTrend).toEqual([]);
  });

  it("parses the full payload", () => {
    const parsed = dashboardStatsSchema.parse({
      overview: {
        shopIds: ["65f0000000000000000000aa"],
        totalRevenue: 125000,
        totalProfit: 125000,
        totalOrders: 42,
        totalProducts: 17,
        totalCustomers: 30,
        avgOrderValue: 2976,
        ordersByStatus: {
          completed: 30,
          pending: 8,
          cancelled: 4,
          refunded: 0,
        },
        revenueComparison: { thisMonth: 80000, lastMonth: 45000 },
        revenuePercentChange: 78,
        avgOrderPercentChange: 12,
        customerPercentChange: -3,
        salesPercentChange: 5,
        newCustomers: 9,
        returningCustomers: 21,
      },
      salesTrend: [{ date: "Mon", value: 4200 }],
      monthlySalesTrend: [{ date: "Jan", value: 52000 }],
      yearlySalesTrend: [{ date: "2026", value: 125000 }],
      topProducts: [
        {
          name: "Avocado",
          sales: 12,
          revenue: 2400,
          isBest: true,
          trend: "+20%",
        },
      ],
      advanced: { peakHours: [] },
    });

    expect(parsed.overview.shopIds).toHaveLength(1);
    expect(parsed.topProducts[0].isBest).toBe(true);
    expect(parsed.salesTrend[0].date).toBe("Mon");
  });

  it("degrades a bad numeric field to 0 rather than throwing the whole screen away", () => {
    const parsed = dashboardStatsSchema.parse({
      overview: {
        totalRevenue: null,
        totalProfit: 0,
        totalOrders: "42",
        totalProducts: 0,
        totalCustomers: 0,
        avgOrderValue: 0,
      },
    });

    expect(parsed.overview.totalRevenue).toBe(0);
    expect(parsed.overview.totalOrders).toBe(0);
  });

  it("keeps the trend string the backend pre-formats", () => {
    const parsed = dashboardStatsSchema.parse({
      overview: {
        totalRevenue: 0,
        totalProfit: 0,
        totalOrders: 0,
        totalProducts: 0,
        totalCustomers: 0,
        avgOrderValue: 0,
      },
      topProducts: [{ name: "Milk", sales: 3, revenue: 90 }],
    });

    // isBest/trend are absent here — defaults keep the row renderable.
    expect(parsed.topProducts[0].trend).toBe("0%");
    expect(parsed.topProducts[0].isBest).toBe(false);
  });
});
