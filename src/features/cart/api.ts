import { api } from "@/lib/api/client";
import { cartSchema, cartTotalSchema } from "@/lib/api/schemas/cart";
import type { Cart, CartTotal } from "@/lib/api/schemas/cart";

export const cartApi = {
  async getCart(): Promise<Cart> {
    return cartSchema.parse(await api.get<unknown>("/cart/get"));
  },

  async getTotal(): Promise<CartTotal> {
    return cartTotalSchema.parse(await api.get<unknown>("/cart/total"));
  },

  async addItem(productVarId: string, quantity = 1): Promise<void> {
    await api.post("/cart/items", { product_var_id: productVarId, quantity });
  },

  async updateItem(cartItemId: string, quantity: number): Promise<void> {
    await api.put(`/cart/items/${cartItemId}`, { quantity });
  },

  async removeItem(cartItemId: string): Promise<void> {
    await api.delete(`/cart/items/${cartItemId}`);
  },
};
