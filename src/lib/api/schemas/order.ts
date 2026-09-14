import { z } from "zod";
import { objectId } from "./common";

export const orderStatusSchema = z
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
export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const orderItemSchema = z
  .object({
    id: objectId.optional(),
    // Parent product id — only present on the order *detail* response (the list
    // carries no lines at all). Needed to submit a review for a delivered item.
    product_id: objectId.nullish(),

    // The column is `variant_id`. `product_var_id` is the Mongo-era name, and
    // `z.object` strips keys it does not declare — so declaring only the old
    // name meant every line parsed with the variant silently missing, and
    // "Reorder" reported that the order had no items to reorder. The request
    // body the cart endpoint takes is still called `product_var_id`; that is
    // the cart's own contract and separate from what an order line is called.
    variant_id: objectId.nullish(),
    product_var_id: objectId.nullish(),

    product_name: z.string(),
    quantity: z.number(),
    unit_price: z.number(),
    total_price: z.number(),

    // Likewise `image_url`, not `image` — declared but never populated, so a
    // line could never carry its picture.
    image_url: z.string().nullish(),
    image: z.string().nullish(),
  })
  // Normalised once here rather than at each reader, so a consumer never has
  // to know which of the two names the payload happened to use.
  .transform((item) => ({
    ...item,
    variant_id: item.variant_id ?? item.product_var_id ?? null,
    image_url: item.image_url ?? item.image ?? null,
  }));

export const orderAddressSchema = z.object({
  address_line: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
});

/**
 * The shop as the order records it.
 *
 * Two shapes, because an order names its shop in two ways and both reach the
 * client: `shop_details_snapshot` is what was true at placement, and a
 * populated `shop_id` is the row as it stands today. Declared once and shared
 * by the order and its per-shop lines — they carry the same pair.
 */
const shopSnapshotSchema = z
  .object({
    shop_id: objectId.nullish(),
    name: z.string().nullish(),
    logo: z.string().nullish(),
    phone: z.string().nullish(),
    address: z.string().nullish(),
    rating: z.number().nullish(),
  })
  .nullish();

const shopRefSchema = z.object({
  id: objectId.optional(),
  name: z.string().nullish(),
  logo_url: z.string().nullish(),
  phone: z.string().nullish(),
  address_line: z.string().nullish(),
  rating: z.number().nullish(),
});

export const orderSchema = z.object({
  id: objectId,
  // The human-readable reference. DEBT-4a renamed it: `order_id` used to be
  // the String mirror of the row id, and the display code is `order_number`.
  order_number: z.string(),
  order_status: orderStatusSchema,
  items: z.array(orderItemSchema).optional().default([]),

  // The line count for the whole order.
  //
  // The list endpoint does not embed the lines — only the detail does — so a
  // screen that counted `items.length` reported 0 against every order in
  // "Your orders". This is sent with the list; on the detail response it is
  // absent and the real `items` array is there instead, so readers should
  // prefer this and fall back.
  items_count: z.number().nullish(),
  order_amount: z.number().optional(),
  delivery_fee: z.number().optional(),
  platform_fee: z.number().optional(),
  // What a discount code took off, and which code it was. The code lives on
  // the usage row rather than the order, so the backend joins for it — and
  // sends null rather than omitting it, so "no code" and "missing" are not
  // two different things to handle here.
  discount_amount: z.number().optional().default(0),
  promotion_code: z.string().nullish(),
  promotion_name: z.string().nullish(),
  // The shop, as it was when the order was placed. `orderShopName` reads a
  // POPULATED `shop_id`, which the list does not send — it sends a bare uuid
  // and puts the name here — so without this the list has no shop name at all.
  shop_details_snapshot: shopSnapshotSchema,
  is_multi_shop: z.boolean().optional(),

  // A few lines from the order, so a list can say what was IN it. Capped
  // server-side — `items_count` carries the real total. Sent by the list
  // only; the detail has the lines themselves.
  item_preview: z
    .array(
      z.object({
        product_id: objectId.nullish(),
        product_name: z.string(),
        image_url: z.string().nullish(),
        quantity: z.number(),
      }),
    )
    .optional()
    .default([]),
  total_amount: z.number(),
  payment_method: z.string().optional(),
  payment_status: z.string().optional(),
  shop_id: z
    .union([objectId, z.object({ name: z.string().optional() })])
    .nullish(),
  delivery_address: orderAddressSchema.nullish(),
  order_time: z.string().nullish(),
  created_at: z.string().nullish(),
  accepted_time: z.string().nullish(),
  preparing_time: z.string().nullish(),
  ready_time: z.string().nullish(),
  picked_up_time: z.string().nullish(),
  in_transit_time: z.string().nullish(),
  delivered_time: z.string().nullish(),
  // Why the order ended, and who ended it.
  //
  // Cancellation is per SHOP, not per order: on a multi-shop basket one
  // merchant can cancel their half with their own reason while the other is
  // still cooking. So the note lives on `shop_orders` and the parent carries
  // only its own — declared here as well because a customer cancelling their
  // own order writes it there.
  cancellation_reason: z.string().nullish(),
  cancelled_by: z.string().nullish(),
  shop_orders: z
    .array(
      z.object({
        id: objectId.optional(),
        order_status: z.string().optional(),
        cancellation_reason: z.string().nullish(),
        cancelled_by: z.string().nullish(),
        // How the shop reaches the client, in all three shapes the API sends
        // it. The detail populates `shop_id` with the row
        // (`findShopOrdersWithShop`), the list flattens it to `shop_name`, and
        // every shop order also carries the snapshot taken at placement.
        //
        // `shop` was the only one declared, and it is the one nothing sends —
        // so z.object stripped the rest and `so.shop?.name` was undefined on
        // every order. That is why a cancelled order said "Cancelled by the
        // shop" without ever naming which shop. Read it through
        // `shopOrderName`, not by reaching for a key.
        shop: z.object({ name: z.string().optional() }).nullish(),
        shop_id: z.union([objectId, shopRefSchema]).nullish(),
        shop_name: z.string().nullish(),
        shop_details_snapshot: shopSnapshotSchema,
      }),
    )
    .optional()
    .default([]),
});
export type Order = z.infer<typeof orderSchema>;

export const orderListSchema = z.object({ orders: z.array(orderSchema) });

// GET /customer/orders/:orderId -> { order }
export const orderDetailResponseSchema = z.object({ order: orderSchema });

/**
 * Who sold it.
 *
 * The snapshot first. `shop_id` only carries a name where the endpoint
 * populated it, and the customer-facing order endpoints send a bare uuid — so
 * reading it alone returned undefined for every order, and both screens
 * rendered their `?? "Shop"` fallback as if that were a shop's name. The name
 * was in the payload the whole time, in the snapshot taken at placement.
 *
 * The snapshot is also the more honest source: it is the shop AS IT WAS when
 * the order was placed, and an order is a record of something that already
 * happened. A shop that has since been renamed should appear on an old order
 * under the name the customer bought from.
 */
export function orderShopName(o: Order): string | undefined {
  const snapshot = o.shop_details_snapshot?.name;
  if (snapshot) return snapshot;

  if (o.shop_id && typeof o.shop_id === "object" && o.shop_id.name) {
    return o.shop_id.name;
  }

  // Last, the order's own shop-order line. An order with exactly one of them
  // has exactly one shop, and that row names it — through `shop_name` on the
  // list, or a populated `shop_id` on the detail.
  //
  // This is what an order written before the snapshot existed looks like: no
  // name on the parent at all. Rather than print a placeholder for it, take
  // the name from the line, which is the same shop by construction.
  const lines = o.shop_orders ?? [];
  return lines.length === 1 ? shopOrderName(lines[0]) : undefined;
}

/**
 * What to print where an order names its shop.
 *
 * A multi-shop basket has no single shop to name — the parent's snapshot is
 * whichever shop happened to be first in the cart (see `firstShop` in the
 * placement controller), so printing it would attribute the whole order to one
 * of the merchants in it. Count them instead.
 */
export function orderShopLabel(o: Order): string | undefined {
  if (o.is_multi_shop) {
    const shops = o.shop_orders?.length ?? 0;
    return shops > 1 ? `${shops} shops` : "Several shops";
  }
  return orderShopName(o);
}

/** The shop on one line of a multi-shop order, in whichever shape it arrived. */
export function shopOrderName(
  so: Order["shop_orders"][number],
): string | undefined {
  return (
    so.shop_details_snapshot?.name ??
    so.shop_name ??
    (so.shop_id && typeof so.shop_id === "object"
      ? so.shop_id.name
      : undefined) ??
    so.shop?.name ??
    undefined
  );
}
