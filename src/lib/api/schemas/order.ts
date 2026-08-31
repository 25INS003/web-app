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
  shop_details_snapshot: z
    .object({ name: z.string().nullish(), logo: z.string().nullish() })
    .nullish(),
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
        shop: z.object({ name: z.string().optional() }).nullish(),
      }),
    )
    .optional()
    .default([]),
});
export type Order = z.infer<typeof orderSchema>;

export const orderListSchema = z.object({ orders: z.array(orderSchema) });

// GET /customer/orders/:orderId -> { order }
export const orderDetailResponseSchema = z.object({ order: orderSchema });

export function orderShopName(o: Order): string | undefined {
  return o.shop_id && typeof o.shop_id === "object" ? o.shop_id.name : undefined;
}
