import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { DashboardStats } from "@/lib/api/schemas/dashboard";

// --- mocks (declared before importing the component) ---
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// recharts measures its container, which jsdom reports as 0×0 — ResponsiveContainer
// would then render nothing and the plot assertions would be vacuous. Stub the
// container to a fixed size so the chart actually mounts; everything else is real.
vi.mock("recharts", async () => {
  const actual = await vi.importActual<typeof import("recharts")>("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => (
      <div style={{ width: 640, height: 256 }}>{children}</div>
    ),
  };
});

let stats: { data?: DashboardStats; isPending: boolean; isError: boolean };
vi.mock("./hooks", () => ({
  useDashboardStats: () => ({
    ...stats,
    error: undefined,
    refetch: vi.fn(),
  }),
}));

import { DashboardView } from "./DashboardView";

const fullStats: DashboardStats = {
  overview: {
    shopIds: ["65f0000000000000000000aa"],
    totalRevenue: 125000,
    totalProfit: 125000,
    totalOrders: 42,
    totalProducts: 17,
    totalCustomers: 30,
    avgOrderValue: 2976,
    ordersByStatus: { completed: 30, pending: 8, cancelled: 4, refunded: 0 },
    revenueComparison: { thisMonth: 80000, lastMonth: 45000 },
    revenuePercentChange: 78,
    avgOrderPercentChange: 12,
    customerPercentChange: -3,
    salesPercentChange: 5,
    newCustomers: 9,
    returningCustomers: 21,
  },
  salesTrend: [
    { date: "Mon", value: 4200 },
    { date: "Tue", value: 6100 },
  ],
  monthlySalesTrend: [{ date: "Jan", value: 52000 }],
  yearlySalesTrend: [{ date: "2026", value: 125000 }],
  topProducts: [
    { name: "Avocado", sales: 12, revenue: 2400, isBest: true, trend: "+20%" },
    { name: "Milk", sales: 5, revenue: 250, isBest: false, trend: "0%" },
  ],
};

describe("DashboardView", () => {
  it("renders the KPI row with compacted values", () => {
    stats = { data: fullStats, isPending: false, isError: false };
    render(<DashboardView />);

    expect(screen.getByText("₹1.3L")).toBeInTheDocument(); // revenue
    expect(screen.getByText("42")).toBeInTheDocument(); // orders
    expect(screen.getByText("17")).toBeInTheDocument(); // products
    expect(screen.getByText("30")).toBeInTheDocument(); // customers
  });

  it("shows a delta with a direction, not color alone", () => {
    stats = { data: fullStats, isPending: false, isError: false };
    const { container } = render(<DashboardView />);

    // The negative customer delta is present as text...
    expect(screen.getByText("-3%")).toBeInTheDocument();
    // ...and carries a named comparison period rather than a bare number.
    expect(screen.getAllByText("vs last month").length).toBeGreaterThan(0);
    // ...and an arrow icon accompanies it, so the sign survives grayscale.
    expect(container.querySelectorAll("svg.lucide-arrow-down-right").length)
      .toBeGreaterThan(0);
  });

  it("switches the sales series when a period tab is picked", async () => {
    stats = { data: fullStats, isPending: false, isError: false };
    render(<DashboardView />);

    // Assert on the section's own summary line. The `<details>` table below it
    // repeats these figures and is in the DOM even while collapsed, so an
    // unscoped getByText would match twice.
    const summary = () =>
      screen.getByText(/over the selected period/).textContent ?? "";

    // Week is the default: 4200 + 6100.
    expect(summary()).toContain("₹10,300");

    await userEvent.click(screen.getByRole("tab", { name: "Year" }));
    expect(summary()).toContain("₹1,25,000");
    expect(screen.getByRole("tab", { name: "Year" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("offers a table view of the plotted values", async () => {
    stats = { data: fullStats, isPending: false, isError: false };
    render(<DashboardView />);

    await userEvent.click(screen.getByText("View as table"));
    const table = screen.getByRole("table");
    expect(table).toHaveTextContent("Mon");
    expect(table).toHaveTextContent("₹4,200");
  });

  it("ranks top products and marks the best seller accessibly", () => {
    stats = { data: fullStats, isPending: false, isError: false };
    render(<DashboardView />);

    expect(screen.getByText("Avocado")).toBeInTheDocument();
    expect(screen.getByLabelText("Best seller")).toBeInTheDocument();
  });

  it("prompts a brand-new owner to create a shop instead of showing zeroes", () => {
    stats = {
      data: {
        overview: {
          shopIds: [],
          totalRevenue: 0,
          totalProfit: 0,
          totalOrders: 0,
          totalProducts: 0,
          totalCustomers: 0,
          avgOrderValue: 0,
          ordersByStatus: {
            completed: 0,
            pending: 0,
            cancelled: 0,
            refunded: 0,
          },
          revenueComparison: { thisMonth: 0, lastMonth: 0 },
          revenuePercentChange: 0,
          avgOrderPercentChange: 0,
          customerPercentChange: 0,
          salesPercentChange: 0,
          newCustomers: 0,
          returningCustomers: 0,
        },
        salesTrend: [],
        monthlySalesTrend: [],
        yearlySalesTrend: [],
        topProducts: [],
      },
      isPending: false,
      isError: false,
    };
    render(<DashboardView />);

    expect(screen.getByText("No shops yet")).toBeInTheDocument();
    expect(screen.queryByText("Sales performance")).not.toBeInTheDocument();
  });

  it("surfaces a retry path when the request fails", () => {
    stats = { data: undefined, isPending: false, isError: true };
    render(<DashboardView />);

    expect(screen.getByText("Dashboard unavailable")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
