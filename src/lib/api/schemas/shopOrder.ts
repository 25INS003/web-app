import { z } from "zod";
import { objectId } from "./common";

/**
 * The shop's own view of an order.
 *
 * Distinct from the customer's `order.ts` schema: the shop sees who ordered and
 * where it goes, and acts on the status; the customer sees which shops their
 * order split across. Same rows, different questions.
 */

// The lifecycle, in order. The shop drives the first four transitions; a
// courier takes it from `picked_up`. Mirrors ORDER_TRANSITIONS in
// backend/src/controllers/order/shop-order.controller.js — a status the client
// does not know about must not blank the row, hence the catch.
export const shopOrderStatusSchema = z
  .enum([
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "picked_up",
    "in_transit",
    "delivered",
    "cancelled",
    "refunded",
  ])
  .catch("pending");
export type ShopOrderStatus = z.infer<typeof shopOrderStatusSchema>;

const addressSnapshotSchema = z
  .object({
    address_line: z.string().nullish(),
    city: z.string().nullish(),
    state: z.string().nullish(),
    pincode: z.string().nullish(),
    contact_name: z.string().nullish(),
    contact_phone: z.string().nullish(),
  })
  .nullish();

export const shopOrderSchema = z.object({
  id: objectId,
  // The human-facing id (ORD-100049). `id` is the uuid the API takes; the
  // status endpoints key off `order_number` instead — see api.ts.
  order_number: z.string(),
  order_status: shopOrderStatusSchema,
  payment_method: z.string().nullish(),
  payment_status: z.string().nullish(),

  // Rupees. The backend converts on the way out; it did not before this page
  // existed, which is how the list came to serve paise unnoticed.
  order_amount: z.number().nullish(),
  delivery_fee: z.number().nullish(),
  discount_amount: z.number().nullish(),
  total_amount: z.number().nullish(),

  order_time: z.string().nullish(),
  accepted_time: z.string().nullish(),
  delivered_time: z.string().nullish(),

  delivery_address_snapshot: addressSnapshotSchema,
  customer: z
    .object({
      id: objectId.optional(),
      first_name: z.string().nullish(),
      last_name: z.string().nullish(),
      email: z.string().nullish(),
      phone: z.string().nullish(),
    })
    .nullish(),
});
export type ShopOrder = z.infer<typeof shopOrderSchema>;

export const shopOrderPageSchema = z.object({
  page: z.number().catch(1),
  limit: z.number().catch(25),
  total: z.number().catch(0),
  // One malformed row must not blank the whole board — the shop still needs to
  // work the rest of the queue.
  orders: z.array(z.unknown()).transform((rows) =>
    rows.flatMap((row) => {
      const parsed = shopOrderSchema.safeParse(row);
      return parsed.success ? [parsed.data] : [];
    }),
  ),
});
export type ShopOrderPage = z.infer<typeof shopOrderPageSchema>;

export const shopOrderStatsSchema = z.object({
  overview: z
    .object({
      today: z.number().catch(0),
      thisWeek: z.number().catch(0),
      thisMonth: z.number().catch(0),
      total_orders: z.number().catch(0),
      total_revenue: z.number().catch(0),
      avg_order_value: z.number().catch(0),
    })
    .partial()
    .catch({}),
  status_breakdown: z
    .array(z.object({ status: z.string(), count: z.number() }))
    .catch([]),
});
export type ShopOrderStats = z.infer<typeof shopOrderStatsSchema>;

/** The customer's display name, or a stand-in — never an empty cell. */
export function customerName(order: ShopOrder): string {
  const name = [order.customer?.first_name, order.customer?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || order.customer?.email || "Customer";
}

/**
 * The single next status the shop may set, or null when it is not the shop's
 * move. Encodes the same chain the backend enforces, so the board never offers
 * a transition the API will reject — after `picked_up` the order belongs to the
 * courier, and cancelling is a separate action with its own consequences.
 */
export function nextStatus(status: ShopOrderStatus): ShopOrderStatus | null {
  switch (status) {
    case "pending":
      return "confirmed";
    case "confirmed":
      return "preparing";
    case "preparing":
      return "ready";
    case "ready":
      return "picked_up";
    default:
      return null;
  }
}

/** The verb for that move, as the shopkeeper would say it. */
export const ACTION_LABEL: Record<string, string> = {
  confirmed: "Accept",
  preparing: "Start preparing",
  ready: "Mark ready",
  picked_up: "Hand to courier",
};

export const STATUS_LABEL: Record<ShopOrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  picked_up: "Picked up",
  in_transit: "In transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};
