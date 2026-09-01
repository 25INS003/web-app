import { api } from "@/lib/api/client";
import { wishlistSchema } from "@/lib/api/schemas/wishlist";
import type { WishlistItem } from "@/lib/api/schemas/wishlist";

export const wishlistApi = {
  async getWishlist(): Promise<WishlistItem[]> {
    return wishlistSchema.parse(await api.get<unknown>("/wishlist/")).wishlist_items;
  },

  async add(productId: string, variantId: string): Promise<void> {
    await api.post("/wishlist/", { product_id: productId, variant_id: variantId });
  },

  /**
   * Empty the whole wishlist.
   *
   * `/clear/all` rather than the bare DELETE, which removes a NAMED set of
   * items and would clear nothing if handed no ids.
   */
  async clear(): Promise<void> {
    await api.delete("/wishlist/clear/all");
  },

  async remove(itemId: string): Promise<void> {
    await api.delete(`/wishlist/${itemId}`);
  },

  // Returns 200 even when the item could not be moved (out of stock, product
  // deactivated) — the outcome is in the body, not the status. Surfacing it lets
  // the caller avoid reporting success for a move that did not happen.
  async moveToCart(
    itemId: string,
  ): Promise<{ added: number; reason?: string }> {
    const data = await api.post<{
      added_count?: number;
      failed_to_add?: { reason?: string }[];
    }>("/wishlist/move-to-cart", { item_ids: [itemId] });
    return {
      added: data?.added_count ?? 0,
      reason: data?.failed_to_add?.[0]?.reason,
    };
  },
};
