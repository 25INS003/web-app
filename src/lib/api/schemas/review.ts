import { z } from "zod";
import { objectId } from "./common";

// A review as returned by GET /reviews/user/my-reviews. `product_id` is
// populated (object) there; `order_id` stays a bare id. We mainly need the
// (order_id, product_id) pair to detect which delivered items are reviewed.
export const myReviewSchema = z.object({
  id: objectId,
  order_id: objectId.nullish(),
  product_id: z
    .union([
      objectId,
      z.object({ id: objectId, name: z.string().optional() }),
    ])
    .nullish(),
  rating: z.number(),
  comment: z.string().nullish(),
  review_images: z.array(z.string()).optional(),
  review_date: z.string().nullish(),
});
export type MyReview = z.infer<typeof myReviewSchema>;

export const myReviewsResponseSchema = z.object({
  reviews: z.array(myReviewSchema),
  pagination: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      pages: z.number(),
    })
    .optional(),
});
export type MyReviewsResponse = z.infer<typeof myReviewsResponseSchema>;

/** Resolve a (possibly populated) product_id ref to its bare id string. */
export function reviewProductId(r: MyReview): string | undefined {
  if (!r.product_id) return undefined;
  return typeof r.product_id === "object" ? r.product_id.id : r.product_id;
}

/** Stable key for "this product was reviewed within this order". */
export function reviewKey(orderId: string, productId: string): string {
  return `${orderId}:${productId}`;
}
