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

  async remove(itemId: string): Promise<void> {
    await api.delete(`/wishlist/${itemId}`);
  },

  async moveToCart(itemId: string): Promise<void> {
    await api.post("/wishlist/move-to-cart", { item_ids: [itemId] });
  },
};
