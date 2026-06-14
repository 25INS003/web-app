"use client";

import { ChevronRight, PackageOpen } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { orderShopName } from "@/lib/api/schemas/order";
import { formatPrice } from "@/lib/utils";
import { useOrders } from "./hooks";
import { STATUS_LABEL, formatDate, statusBadgeVariant } from "./status";

export function OrdersList() {
  const q = useOrders();

  if (q.isPending) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const orders = q.data ?? [];

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <PackageOpen className="size-7" />
        </span>
        <h1 className="font-display text-2xl font-bold">No orders yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your orders will appear here once you check out.
        </p>
        <Button asChild className="mt-6">
          <Link href="/search">Start shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Your orders
      </h1>
      <div className="mt-6 space-y-3">
        {orders.map((o) => (
          <Link
            key={o._id}
            href={`/orders/${o._id}`}
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs transition hover:border-primary/40 hover:shadow-md"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-semibold">
                  #{o.order_id}
                </span>
                <Badge variant={statusBadgeVariant(o.order_status)}>
                  {STATUS_LABEL[o.order_status]}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(o.order_time ?? o.created_at)} ·{" "}
                {orderShopName(o) ?? "Shop"} · {o.items.length} item
                {o.items.length === 1 ? "" : "s"}
              </p>
            </div>
            <span className="font-mono text-sm font-bold tabular-nums">
              {formatPrice(o.total_amount)}
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
