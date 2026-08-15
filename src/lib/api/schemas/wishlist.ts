import { z } from "zod";
import { objectId } from "./common";

const wishlistImageSchema = z.object({
  url: z.string(),
  alt_text: z.string().nullish(),
});

// GET /wishlist/ item shape. The product/variant ids come back as `id` (the
// mongo id) and the price is an OBJECT, not a scalar.
export const wishlistItemSchema = z.object({
  id: objectId, // wishlist-item id (for remove / move-to-cart)
  product: z.object({
    id: objectId.optional(),
    product_id: z.string().optional(),
    name: z.string(),
    main_image: z.string().nullish(),
    images: z.array(wishlistImageSchema).optional(),
    is_available: z.boolean().optional(),
    stock_status: z.string().optional(),
  }),
  variant: z
    .object({
      id: objectId.optional(),
      name: z.string().optional(),
    })
    .nullish(),
  shop: z.object({ id: objectId.optional(), name: z.string().optional() }).nullish(),
  price: z
    .object({
      original: z.number().nullish(),
      discounted: z.number().nullish(),
      final: z.number().nullish(),
      currency: z.string().nullish(),
    })
    .nullish(),
  added_at: z.string().nullish(),
});
export type WishlistItem = z.infer<typeof wishlistItemSchema>;

export const wishlistSchema = z.object({
  wishlist_items: z.array(wishlistItemSchema),
});

export function wishlistItemImage(it: WishlistItem): string | undefined {
  return it.product.main_image || it.product.images?.[0]?.url || undefined;
}

// Route id for the product detail page (/catalog/id/:id accepts the mongo id).
export function wishlistProductId(it: WishlistItem): string {
  return it.product.id ?? it.product.id ?? it.product.product_id ?? "";
}

export function wishlistItemPrice(it: WishlistItem): number | undefined {
  return it.price?.final ?? it.price?.original ?? undefined;
}
