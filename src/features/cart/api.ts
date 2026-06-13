import { api } from "@/lib/api/client";

export const cartApi = {
  async addItem(productVarId: string, quantity = 1): Promise<void> {
    await api.post("/cart/items", {
      product_var_id: productVarId,
      quantity,
    });
  },
};
