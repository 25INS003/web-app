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

export const orderItemSchema = z.object({
  _id: objectId.optional(),
  // Parent product id — only present on the order *detail* response (the list
  // embeds variant refs). Needed to submit a review for a delivered item.
  product_id: objectId.nullish(),
  product_var_id: objectId.nullish(),
  product_name: z.string(),
  quantity: z.number(),
  unit_price: z.number(),
  total_price: z.number(),
  image: z.string().nullish(),
});

export const orderAddressSchema = z.object({
  address_line: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
});

export const orderSchema = z.object({
  _id: objectId,
  order_id: z.string(),
  order_status: orderStatusSchema,
  items: z.array(orderItemSchema).optional().default([]),
  order_amount: z.number().optional(),
  delivery_fee: z.number().optional(),
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
});
export type Order = z.infer<typeof orderSchema>;

export const orderListSchema = z.object({ orders: z.array(orderSchema) });

// GET /customer/orders/:orderId -> { order }
export const orderDetailResponseSchema = z.object({ order: orderSchema });

export function orderShopName(o: Order): string | undefined {
  return o.shop_id && typeof o.shop_id === "object" ? o.shop_id.name : undefined;
}
