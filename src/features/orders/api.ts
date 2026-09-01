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

  // Detail endpoint takes the Mongo id and enriches each item with its parent
  // product_id (the list only carries variant refs).
  async getOrder(orderId: string): Promise<Order> {
    const data = await api.get<unknown>(`/customer/orders/${orderId}`);
    return orderDetailResponseSchema.parse(data).order;
  },

  /**
   * Cancel an order the shop still holds.
   *
   * The server owns the boundary — it refuses once any shop has handed over to
   * a courier, and its message names who to contact instead. The button below
   * is hidden past that point as well, but the two are not the same check: the
   * order can move between the page loading and the button being pressed.
   */
  async cancelOrder(orderId: string, reason: string): Promise<void> {
    await api.put(`/customer/orders/${orderId}/cancel`, { reason });
  },
};
