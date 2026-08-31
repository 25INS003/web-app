"use client";

import { Loader2, PackageOpen, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/features/orders/status";
import { CancelOrderDialog } from "./CancelOrderDialog";
import {
  ACTION_LABEL,
  STATUS_LABEL,
  customerName,
  nextStatus,
} from "@/lib/api/schemas/shopOrder";
import type { ShopOrder, ShopOrderStatus } from "@/lib/api/schemas/shopOrder";
import { formatPrice } from "@/lib/utils";
import {
  useAdvanceOrders,
  useCancelOrder,
  useMyShops,
  useShopOrderStats,
  useShopOrders,
} from "./hooks";

// The filters a shopkeeper actually works by. "Open" is the default because
// the reason to open this screen is almost always "what needs doing" — a board
// that opens on every order ever placed buries today's work under history.
const FILTERS = [
  { key: "open", label: "Needs action" },
  { key: "pending", label: "Pending" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "out", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
  { key: "ended", label: "Cancelled" },
] as const;

// Statuses where the shop still owes an action. Applied client-side: the API
// filters by a single status, and "needs action" is several of them.
//
// `picked_up` and `in_transit` are here because a shop that delivers its own
// orders still owes the final step. They used to be in neither this set nor any
// tab, so an order past `ready` was reachable from no view at all — the reason
// self-delivered orders were left stranded there.
export const OPEN = new Set<ShopOrderStatus>([
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "picked_up",
  "in_transit",
]);

/** The two statuses the "Out for delivery" tab covers. */
export const OUT = new Set<ShopOrderStatus>(["picked_up", "in_transit"]);

// Orders that went nowhere. `refunded` and `failed` belonged to no tab and no
// set, so an order in either appeared in NO view at all — the same way
// `picked_up` and `in_transit` used to vanish. Folded in with `cancelled`
// rather than given tabs of their own: they answer the same question, and a
// board with a tab per terminal state is mostly empty tabs.
export const ENDED = new Set<ShopOrderStatus>([
  "cancelled",
  "refunded",
  "failed",
]);

/** Reachable by their own tab rather than through a set. */
export const TERMINAL_ONLY = new Set<ShopOrderStatus>(["delivered"]);

// The API refuses a cancellation past `preparing`, so the control is not
// offered past it either — the same reason the advance button only ever shows
// the one move the backend will accept.
const CANCELLABLE = new Set<ShopOrderStatus>([
  "pending",
  "confirmed",
  "preparing",
]);

const STATUS_VARIANT: Record<
  string,
  "default" | "success" | "warning" | "muted" | "outline"
> = {
  pending: "warning",
  confirmed: "default",
  preparing: "default",
  ready: "success",
  picked_up: "muted",
  in_transit: "muted",
  delivered: "success",
  cancelled: "muted",
  refunded: "muted",
};

export function ShopOrdersView() {
  const shops = useMyShops();
  const [shopId, setShopId] = useState<string | undefined>();
  const [filter, setFilter] = useState<string>("open");
  const [page, setPage] = useState(1);

  // Default to the first shop once they load. Most owners have exactly one, so
  // making them pick before seeing anything would be a click for nothing.
  const activeShopId = shopId ?? shops.data?.[0]?.id;

  // "open" and "out" both span more than one status, and the API filters by a
  // single one — so they fetch unfiltered and narrow below.
  const apiStatus =
    filter === "open" || filter === "out" || filter === "ended"
      ? undefined
      : filter;
  const orders = useShopOrders(activeShopId, { page, status: apiStatus });
  const stats = useShopOrderStats(activeShopId);
  const advance = useAdvanceOrders(activeShopId);
  const cancelOrder = useCancelOrder(activeShopId);

  // How many orders sit in each phase, for the tab badges.
  //
  // From the stats endpoint rather than the fetched page: the page is one
  // page of ONE status, so counting the rows on screen would report "how many
  // are visible" while looking like "how many exist". The breakdown reports
  // every status including the empty ones, so a phase reads 0 rather than
  // disappearing.
  const countByStatus = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of stats.data?.status_breakdown ?? []) {
      m.set(b.status, b.count);
    }
    return m;
  }, [stats.data]);

  const countFor = (key: string) => {
    const sum = (set: Set<ShopOrderStatus>) =>
      [...set].reduce((n, s) => n + (countByStatus.get(s) ?? 0), 0);
    if (key === "open") return sum(OPEN);
    if (key === "out") return sum(OUT);
    if (key === "ended") return sum(ENDED);
    return countByStatus.get(key) ?? 0;
  };
  const [cancelling, setCancelling] = useState<ShopOrder | null>(null);

  const rows = useMemo(() => {
    const all = orders.data?.orders ?? [];
    if (filter === "open") return all.filter((o) => OPEN.has(o.order_status));
    if (filter === "out") return all.filter((o) => OUT.has(o.order_status));
    if (filter === "ended") return all.filter((o) => ENDED.has(o.order_status));
    return all;
  }, [orders.data, filter]);

  // Only orders whose next move is the same one can be advanced together — the
  // bulk endpoints take a single target status.
  const bulk = useMemo(() => {
    const actionable = rows
      .map((o) => nextStatus(o.order_status))
      .filter((s): s is ShopOrderStatus => s !== null);
    if (!actionable.length) return null;
    const target = actionable[0];
    if (!actionable.every((s) => s === target)) return null;
    return {
      target,
      orderNumbers: rows
        .filter((o) => nextStatus(o.order_status) === target)
        .map((o) => o.order_number),
    };
  }, [rows]);

  if (shops.isPending) {
    return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;
  }

  if (!shops.data?.length) {
    return (
      <EmptyState
        title="No shops yet"
        body="Create a shop before you can take orders."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Orders
          </h1>
          <p className="text-sm text-muted-foreground">
            Accept, prepare and hand over the orders coming into your shop.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {shops.data.length > 1 && (
            <select
              aria-label="Shop"
              value={activeShopId}
              onChange={(e) => {
                setShopId(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-border bg-card px-3 text-sm"
            >
              {shops.data.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name ?? "Shop"}
                </option>
              ))}
            </select>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => orders.refetch()}
            disabled={orders.isFetching}
          >
            <RefreshCw
              className={`size-4 ${orders.isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {stats.data?.overview && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Tile label="Today" value={stats.data.overview.today ?? 0} />
          <Tile label="This week" value={stats.data.overview.thisWeek ?? 0} />
          <Tile
            label="Total orders"
            value={stats.data.overview.total_orders ?? 0}
          />
          {/* Revenue counts delivered, settled orders only — an order that
              has been placed is not money taken. The label says which, so
              "3 orders, ₹0" reads as a fact rather than as a bug. */}
          <Tile
            label={`Revenue (${stats.data.overview.revenue_orders ?? 0} delivered)`}
            value={formatPrice(stats.data.overview.total_revenue ?? 0)}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => {
              setFilter(f.key);
              setPage(1);
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              filter === f.key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
            {/* The count sits on the tab rather than in a separate row: the
                question "how much is waiting on me" is asked of the tab, and
                an answer somewhere else is a second thing to look at. */}
            <span
              className={`ml-1.5 tabular-nums ${
                filter === f.key ? "text-primary" : "text-muted-foreground/70"
              }`}
            >
              {countFor(f.key)}
            </span>
          </button>
        ))}
        {bulk && (
          <Button
            size="sm"
            className="ml-auto"
            disabled={advance.isPending}
            onClick={() =>
              advance.mutate({
                orderNumbers: bulk.orderNumbers,
                status: bulk.target,
              })
            }
          >
            {advance.isPending && <Loader2 className="animate-spin" />}
            {ACTION_LABEL[bulk.target] ?? "Advance"} all ({bulk.orderNumbers.length})
          </Button>
        )}
      </div>

      {orders.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : orders.isError ? (
        <EmptyState
          title="Could not load orders"
          body="Something went wrong fetching this shop's orders."
          action={<Button onClick={() => orders.refetch()}>Try again</Button>}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title={filter === "open" ? "Nothing to do" : "No orders here"}
          body={
            filter === "open"
              ? "Every order has been handled. New ones appear here automatically."
              : "No orders match this filter."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[42rem] text-sm">
            <thead className="border-b border-border text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Placed</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((order) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  busy={advance.isPending || cancelOrder.isPending}
                  onCancel={() => setCancelling(order)}
                  onAdvance={(status) =>
                    advance.mutate({
                      orderNumbers: [order.order_number],
                      status,
                    })
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {orders.data && orders.data.total > orders.data.limit && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {orders.data.total} order{orders.data.total === 1 ? "" : "s"}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * orders.data.limit >= orders.data.total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      {cancelling ? (
        <CancelOrderDialog
          order={cancelling}
          busy={cancelOrder.isPending}
          onClose={() => setCancelling(null)}
          onConfirm={(reason) =>
            cancelOrder.mutate(
              { orderNumber: cancelling.order_number, reason },
              { onSuccess: () => setCancelling(null) }
            )
          }
        />
      ) : null}
    </div>
  );
}

function OrderRow({
  order,
  busy,
  onAdvance,
  onCancel,
}: {
  order: ShopOrder;
  busy: boolean;
  onAdvance: (status: ShopOrderStatus) => void;
  onCancel: () => void;
}) {
  const next = nextStatus(order.order_status);
  const address = order.delivery_address_snapshot;

  return (
    <tr className="align-middle">
      <td className="px-4 py-3 font-mono text-xs">{order.order_number}</td>
      <td className="px-4 py-3">
        <p className="font-medium">{customerName(order)}</p>
        {address?.city && (
          <p className="text-xs text-muted-foreground">
            {address.city}
            {address.pincode ? ` · ${address.pincode}` : ""}
          </p>
        )}
      </td>
      {/* What to pack. The board listed orders without ever saying what was in
          them, so the only way to find out was to ask the customer. */}
      <td className="px-4 py-3">
        {order.items.length === 0 ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <ul className="space-y-0.5">
            {order.items.map((item, i) => (
              <li key={i} className="text-sm">
                <span className="tabular-nums text-muted-foreground">
                  {item.quantity}×
                </span>{" "}
                {item.product_name ?? "Item"}
              </li>
            ))}
          </ul>
        )}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {formatDate(order.order_time)}
      </td>
      <td className="px-4 py-3 text-right font-medium tabular-nums">
        {formatPrice(order.total_amount ?? 0)}
      </td>
      <td className="px-4 py-3">
        <Badge variant={STATUS_VARIANT[order.order_status] ?? "muted"}>
          {STATUS_LABEL[order.order_status]}
        </Badge>
      </td>
      <td className="px-4 py-3 text-right">
        {/* Only moves the API will accept are offered, so a shopkeeper never
            learns a transition is impossible from an error toast. Cancelling
            sits beside the forward move rather than in the same control: it is
            not the next step in the chain, it ends the order. */}
        <div className="flex items-center justify-end gap-2">
          {order.cancellation_reason ? (
            <span
              className="max-w-[16rem] truncate text-xs text-muted-foreground"
              title={order.cancellation_reason}
            >
              {order.cancellation_reason}
            </span>
          ) : null}
          {CANCELLABLE.has(order.order_status) ? (
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={onCancel}
              className="text-muted-foreground hover:text-destructive"
            >
              Cancel
            </Button>
          ) : null}
        </div>
        {next ? (
          <Button size="sm" disabled={busy} onClick={() => onAdvance(next)}>
            {ACTION_LABEL[next] ?? "Advance"}
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
    </tr>
  );
}

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <PackageOpen className="size-6" />
      </span>
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {body}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
