import { z } from "zod";
import { isoDate, objectId } from "./common";

/**
 * A photographed shopping list, and what became of it.
 *
 * One shape for both ends: the customer's screen and the shop's queue read the
 * same rows, and the backend serialises them through one `outbound` helper. The
 * fields each side ignores are the fields the other one needs — a customer does
 * not care who handled it, and a shop does not need the link to the order the
 * customer will open.
 */
export const orderRequestStatusSchema = z.enum([
  "pending",
  "fulfilled",
  "declined",
  "cancelled",
]);
export type OrderRequestStatus = z.infer<typeof orderRequestStatusSchema>;

const imageSchema = z.object({
  url: z.string(),
  alt_text: z.string().nullish(),
});

const addressSnapshotSchema = z
  .object({
    full_name: z.string().nullish(),
    phone_number: z.string().nullish(),
    address_line: z.string().nullish(),
    landmark: z.string().nullish(),
    city: z.string().nullish(),
    state: z.string().nullish(),
    pincode: z.string().nullish(),
  })
  .nullish();

export const orderRequestSchema = z.object({
  id: objectId,
  status: orderRequestStatusSchema,
  images: z.array(imageSchema).default([]),
  note: z.string().nullish(),
  decline_note: z.string().nullish(),
  delivery_address: addressSnapshotSchema,
  shop: z.object({ id: objectId, name: z.string().nullish() }).nullish(),
  customer: z
    .object({
      id: objectId.nullish(),
      name: z.string().nullish(),
      phone: z.string().nullish(),
    })
    .nullish(),
  order: z
    .object({
      id: objectId,
      order_number: z.string().nullish(),
      // Rupees, like every other amount at the edge.
      total_amount: z.number().nullish(),
    })
    .nullish(),
  created_at: isoDate,
  handled_at: isoDate.nullish(),
});
export type OrderRequest = z.infer<typeof orderRequestSchema>;

export const orderRequestListSchema = z.array(orderRequestSchema);

/** The shop's queue: a page, plus the badge count the dashboard shows. */
export const orderRequestPageSchema = z.object({
  data: orderRequestListSchema,
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  pages: z.number(),
  pending: z.number(),
});
export type OrderRequestPage = z.infer<typeof orderRequestPageSchema>;

/** What the shop gets back once it has keyed the list in. */
export const fulfilledOrderSchema = z.object({
  order_id: objectId,
  order_number: z.string(),
  total_amount: z.number(),
  order_amount: z.number(),
  delivery_fee: z.number(),
  platform_fee: z.number().nullish(),
  bulk_discount_amount: z.number().nullish(),
  product_discount_amount: z.number().nullish(),
  items: z.array(
    z.object({
      variant_id: objectId,
      product_name: z.string(),
      quantity: z.number(),
      unit_price: z.number(),
      total_price: z.number(),
    }),
  ),
});
export type FulfilledOrder = z.infer<typeof fulfilledOrderSchema>;
