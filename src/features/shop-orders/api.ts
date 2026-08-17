import { api } from "@/lib/api/client";
import {
  shopOrderPageSchema,
  shopOrderStatsSchema,
} from "@/lib/api/schemas/shopOrder";
import type {
  ShopOrderPage,
  ShopOrderStats,
  ShopOrderStatus,
} from "@/lib/api/schemas/shopOrder";
import { z } from "zod";
import { objectId } from "@/lib/api/schemas/common";

// The owner's shops, for the board's picker. Declared here rather than in a
// shared shops feature because none exists in the typed layer yet — the legacy
// Zustand `shopStore` is the only other reader, and importing that into a
// react-query screen would give the page two sources of truth for the same
// list.
const myShopsSchema = z
  .union([
    z.array(z.unknown()),
    z.object({ shops: z.array(z.unknown()) }),
    z.object({ data: z.array(z.unknown()) }),
  ])
  .transform((d) => (Array.isArray(d) ? d : ("shops" in d ? d.shops : d.data)))
  .transform((rows) =>
    rows.flatMap((row) => {
      const parsed = z
        .object({ id: objectId, name: z.string().nullish() })
        .safeParse(row);
      return parsed.success ? [parsed.data] : [];
    }),
  );
export type OwnerShop = z.infer<typeof myShopsSchema>[number];

/**
 * The shop's order board.
 *
 * Every write here takes `order_number` (ORD-100049), not the uuid: the backend
 * filters on `{ order_number: { in: ids } }`. Passing `id` matches nothing and
 * returns "No matching orders found" — a 404 that reads like the order is gone
 * rather than like the wrong key was sent.
 *
 * All three writes are bulk endpoints taking an array, which is the workflow
 * the shop actually has: accept the morning's orders in one action rather than
 * one at a time. The board sends a single-element array for a row action and
 * the full selection for a bulk one.
 */
export const shopOrdersApi = {
  async list(
    shopId: string,
    { page = 1, limit = 25, status }: { page?: number; limit?: number; status?: string } = {},
  ): Promise<ShopOrderPage> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (status) params.set("status", status);
    return shopOrderPageSchema.parse(
      await api.get<unknown>(`/shops/${shopId}/orders?${params}`),
    );
  },

  async stats(shopId: string): Promise<ShopOrderStats> {
    return shopOrderStatsSchema.parse(
      await api.get<unknown>(`/shops/${shopId}/orders/stats`),
    );
  },

  /**
   * Advance one or more orders.
   *
   * `confirmed` and `ready` have dedicated endpoints — they are not just status
   * writes. Accept stamps `accepted_time`; ready stamps `ready_time`. Routing
   * them through the generic endpoint would set the status and skip the
   * timestamp, which is what the processing-time analytics measure.
   */
  async advance(
    shopId: string,
    orderNumbers: string[],
    status: ShopOrderStatus,
  ): Promise<void> {
    if (status === "confirmed") {
      await api.put(`/shops/${shopId}/orders/accept`, {
        orderIds: orderNumbers,
      });
      return;
    }
    if (status === "ready") {
      await api.put(`/shops/${shopId}/orders/ready`, {
        orderIds: orderNumbers,
      });
      return;
    }
    await api.put(`/shops/${shopId}/orders/status`, {
      orderIds: orderNumbers,
      status,
    });
  },

  /**
   * Cancelling is deliberately not one of the statuses above. It restores stock
   * and marks the payment refunded, so it has its own endpoint and must not be
   * reachable as just another step in the dropdown.
   */
  async cancel(shopId: string, orderNumber: string, reason: string): Promise<void> {
    await api.put(`/shops/${shopId}/orders/cancel`, {
      orderId: orderNumber,
      reason,
    });
  },

  /** The owner's shops, for the board's shop picker. */
  async listMyShops(): Promise<OwnerShop[]> {
    return myShopsSchema.parse(
      await api.get<unknown>("/shopowneruser/shops/my-shops"),
    );
  },
};
