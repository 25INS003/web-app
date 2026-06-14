import { api } from "@/lib/api/client";
import {
  orderDetailResponseSchema,
  orderListSchema,
} from "@/lib/api/schemas/order";
import type { Order } from "@/lib/api/schemas/order";

export const ordersApi = {
  async getOrders(): Promise<Order[]> {
    const data = await api.get<unknown>("/customer/orders", {
      params: { limit: 50 },
    });
    return orderListSchema.parse(data).orders;
  },

  // Detail endpoint takes the Mongo _id and enriches each item with its parent
  // product_id (the list only carries variant refs).
  async getOrder(orderId: string): Promise<Order> {
    const data = await api.get<unknown>(`/customer/orders/${orderId}`);
    return orderDetailResponseSchema.parse(data).order;
  },
};
