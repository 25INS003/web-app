import { api } from "@/lib/api/client";
import { orderListSchema } from "@/lib/api/schemas/order";
import type { Order } from "@/lib/api/schemas/order";

export const ordersApi = {
  async getOrders(): Promise<Order[]> {
    const data = await api.get<unknown>("/customer/orders", {
      params: { limit: 50 },
    });
    return orderListSchema.parse(data).orders;
  },
};
