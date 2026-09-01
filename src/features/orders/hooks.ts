"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cartApi } from "@/features/cart/api";
import { ApiError } from "@/lib/api/types";
import { queryKeys } from "@/lib/query/keys";
import type { Order } from "@/lib/api/schemas/order";
import { ordersApi } from "./api";

export function useOrders() {
  return useQuery({ queryKey: ["orders"], queryFn: ordersApi.getOrders });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ["orders", "detail", orderId],
    queryFn: () => ordersApi.getOrder(orderId),
    enabled: Boolean(orderId),
  });
}

// Reorder: there's no bulk endpoint, so add each item back to the cart and
// tolerate per-item failures (a variant may now be out of stock / unavailable).
/**
 * Cancelling one's own order.
 *
 * Invalidates the whole `orders` subtree rather than patching the one row: a
 * cancellation restores stock, so the catalogue and the product pages are stale
 * too, and the order moves between the lists it appears in.
 */
export function useCancelOrder(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => ordersApi.cancelOrder(orderId, reason),
    onSuccess: () => {
      toast.success("Order cancelled");
      qc.invalidateQueries({ queryKey: queryKeys.orders.all });
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
    },
    // The server's message is the useful one — it says whether the order has
    // already left the shop and who to contact about it.
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Could not cancel the order",
      ),
  });
}

export function useReorder() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: async (order: Order) => {
      const items = order.items.filter((it) => it.variant_id);
      if (items.length === 0) {
        throw new ApiError("This order has no items to reorder", 0);
      }
      const results = await Promise.allSettled(
        items.map((it) =>
          cartApi.addItem(it.variant_id as string, it.quantity),
        ),
      );
      const added = results.filter((r) => r.status === "fulfilled").length;
      return { added, failed: items.length - added };
    },
    onSuccess: ({ added, failed }) => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      if (added === 0) {
        toast.error("None of these items are available right now");
        return;
      }
      toast.success(
        failed > 0
          ? `Added ${added} item${added === 1 ? "" : "s"} · ${failed} unavailable`
          : "Items added to cart",
      );
      router.push("/cart");
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Could not reorder"),
  });
}
