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
 *
 * The poll is the floor, not the mechanism: `useShopOrdersRealtime` pushes a
 * newly-placed order onto the board within the round trip. This keeps the board
 * honest when the socket is unavailable, and catches the changes nothing emits
 * for — a status moved from the shop's other device, or by a courier.
 *
 * `refetchOnWindowFocus` is on here for the same reason as on the stats: the
 * client-wide default is false and a background tab's poll is paused, so a
 * board switched back to would otherwise show its pre-blur state until the
 * timer next fired.
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
    refetchOnWindowFocus: true,
    // Keeps the previous page on screen while the next loads, so paging and
    // status-filtering do not blank the table between renders.
    placeholderData: (previous) => previous,
  });
}

/**
 * One order, in full — the screen someone packs and delivers from.
 *
 * Polled on the same beat as the board: an order's status can move under the
 * shopkeeper while they have it open, either from another device or from the
 * courier picking it up.
 */
export function useShopOrder(
  shopId: string | undefined,
  orderId: string | undefined,
) {
  return useQuery({
    queryKey: queryKeys.orders.detail(shopId ?? "none", orderId ?? "none"),
    queryFn: () => shopOrdersApi.detail(shopId as string, orderId as string),
    enabled: Boolean(shopId && orderId),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

/**
 * The shop's totals, and the per-status counts the tabs are numbered from.
 *
 * Polled on the same 30s beat as the list. It previously had only a staleTime,
 * so nothing refetched it on its own: an order placed by a customer invalidates
 * nothing on the shopkeeper's client, and the counts sat still while the table
 * underneath them moved. A tab reading "Needs action 3" over four rows is worse
 * than no count, because it looks authoritative.
 *
 * `refetchOnWindowFocus` overrides the client-wide default (false) for this
 * screen only. The board is left open and switched away from, and a poll is
 * paused while the tab is in the background — so coming back to it is exactly
 * the moment the numbers are most likely to be wrong.
 */
export function useShopOrderStats(shopId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.orders.stats(shopId ?? "none"),
    queryFn: () => shopOrdersApi.stats(shopId as string),
    enabled: Boolean(shopId),
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
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
