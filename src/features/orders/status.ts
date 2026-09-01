import type { Order, OrderStatus } from "@/lib/api/schemas/order";

export const STATUS_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "picked_up",
  "in_transit",
  "delivered",
];

/**
 * How far a customer may cancel their own order — up to the moment it leaves
 * the shop. Mirrors CUSTOMER_CANCELLABLE in the backend's
 * customer-order.controller, which is the check that actually decides.
 */
// Typed as strings, not OrderStatus: the per-shop rows carry `order_status` as
// a plain optional string in the order schema, and this set is checked against
// both the parent and those.
export const CUSTOMER_CANCELLABLE: ReadonlySet<string> = new Set([
  "pending",
  "confirmed",
  "preparing",
  "ready",
]);

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  picked_up: "Picked up",
  in_transit: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export function statusBadgeVariant(
  s: OrderStatus,
): "default" | "success" | "warning" | "muted" {
  if (s === "delivered") return "success";
  if (s === "cancelled" || s === "refunded") return "muted";
  if (s === "pending") return "warning";
  return "default";
}

export function timelineSteps(o: Order) {
  const ts: Record<string, string | null | undefined> = {
    pending: o.order_time ?? o.created_at,
    confirmed: o.accepted_time,
    preparing: o.preparing_time,
    ready: o.ready_time,
    picked_up: o.picked_up_time,
    in_transit: o.in_transit_time,
    delivered: o.delivered_time,
  };
  const idx = STATUS_FLOW.indexOf(o.order_status);
  return STATUS_FLOW.map((step, i) => ({
    step,
    label: STATUS_LABEL[step],
    done: idx >= 0 && i <= idx,
    current: i === idx,
    at: ts[step],
  }));
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
