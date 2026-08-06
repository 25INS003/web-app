"use client";

import { IndianRupee, Package, ShoppingCart, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useDashboardStats } from "./hooks";
import { compactCurrency, compactNumber, toDelta } from "./format";
import { SalesTrendChart } from "./SalesTrendChart";
import { StatTile } from "./StatTile";
import { TopProducts } from "./TopProducts";

export function DashboardView() {
  const { data, isPending, isError, error, refetch } = useDashboardStats();
  const overview = data?.overview;

  if (isError) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <h1 className="font-display text-xl font-bold tracking-tight">
          Dashboard unavailable
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {error instanceof Error
            ? error.message
            : "Could not load your shop stats."}
        </p>
        <Button className="mt-4" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  // A brand-new owner with no shops gets the narrow payload (all zeroes) — show
  // them the next step instead of an empty grid of noughts.
  const hasNoShops = !isPending && overview?.shopIds.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">Your shop at a glance.</p>
      </div>

      {hasNoShops ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <h2 className="font-display text-lg font-bold">No shops yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Create your first shop to start listing products and taking orders.
            Your stats will appear here once orders come in.
          </p>
          <Button asChild className="mt-4">
            <Link href="/myshop">Create a shop</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile
              label="Revenue"
              value={compactCurrency(overview?.totalRevenue ?? 0)}
              delta={
                overview ? toDelta(overview.revenuePercentChange) : undefined
              }
              icon={IndianRupee}
              loading={isPending}
            />
            <StatTile
              label="Orders"
              value={compactNumber(overview?.totalOrders ?? 0)}
              delta={overview ? toDelta(overview.salesPercentChange) : undefined}
              deltaPeriod="vs last week"
              icon={ShoppingCart}
              loading={isPending}
            />
            <StatTile
              label="Products"
              value={compactNumber(overview?.totalProducts ?? 0)}
              icon={Package}
              loading={isPending}
            />
            <StatTile
              label="Customers"
              value={compactNumber(overview?.totalCustomers ?? 0)}
              delta={
                overview ? toDelta(overview.customerPercentChange) : undefined
              }
              icon={Users}
              loading={isPending}
            />
          </div>

          <SalesTrendChart
            week={data?.salesTrend ?? []}
            month={data?.monthlySalesTrend ?? []}
            year={data?.yearlySalesTrend ?? []}
            loading={isPending}
          />

          <TopProducts products={data?.topProducts ?? []} loading={isPending} />
        </>
      )}
    </div>
  );
}
