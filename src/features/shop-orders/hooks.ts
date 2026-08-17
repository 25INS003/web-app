"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/types";
import { queryKeys } from "@/lib/query/keys";
import type { ShopOrderStatus } from "@/lib/api/schemas/shopOrder";
import { shopOrdersApi } from "./api";

/** The owner's shops. Rarely changes; the picker just needs names and ids. */
export function useMyShops() {
  return useQuery({
    queryKey: queryKeys.shops.mine(),
    queryFn: shopOrdersApi.listMyShops,
    staleTime: 5 * 60_000,
  });
}

/**
 * A page of the shop's orders.
 *
 * `refetchInterval` because this is a live queue: orders arrive while the
 * shopkeeper is looking at the screen, and a board that only updates on reload
 * is one somebody has to remember to reload. 30s is frequent enough to notice
 * an order and cheap enough for a page that is open all day.
 *
 * `enabled` guards the first render, before a shop has been chosen — without it
 * react-query fires a request to `/shops/undefined/orders`.
 */
export function useShopOrders(
  shopId: string | undefined,
  params: { page?: number; status?: string } = {},
) {
  return useQuery({
    queryKey: queryKeys.orders.list(shopId ?? "none", params),
    queryFn: () => shopOrdersApi.list(shopId as string, params),
    enabled: Boolean(shopId),
    refetchInterval: 30_000,
    // Keeps the previous page on screen while the next loads, so paging and
    // status-filtering do not blank the table between renders.
    placeholderData: (previous) => previous,
  });
}

export function useShopOrderStats(shopId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.orders.stats(shopId ?? "none"),
    queryFn: () => shopOrdersApi.stats(shopId as string),
    enabled: Boolean(shopId),
    staleTime: 60_000,
  });
}

/**
 * Advance one or more orders to their next status.
 *
 * Invalidates the whole `orders` subtree rather than the one page: a status
 * change moves an order between status filters and changes the counts the
 * stats panel shows, so patching a single cached page would leave the rest of
 * the screen disagreeing with it.
 */
export function useAdvanceOrders(shopId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderNumbers,
      status,
    }: {
      orderNumbers: string[];
      status: ShopOrderStatus;
    }) => shopOrdersApi.advance(shopId as string, orderNumbers, status),
    onSuccess: (_data, { orderNumbers }) => {
      toast.success(
        orderNumbers.length > 1
          ? `${orderNumbers.length} orders updated`
          : "Order updated",
      );
      qc.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Could not update the order",
      ),
  });
}

export function useCancelOrder(shopId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderNumber,
      reason,
    }: {
      orderNumber: string;
      reason: string;
    }) => shopOrdersApi.cancel(shopId as string, orderNumber, reason),
    onSuccess: () => {
      toast.success("Order cancelled");
      qc.invalidateQueries({ queryKey: queryKeys.orders.all });
      // Cancelling restores stock, so the product lists are stale too.
      qc.invalidateQueries({ queryKey: queryKeys.products.all });
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Could not cancel the order",
      ),
  });
}
