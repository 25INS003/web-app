"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/types";
import { queryKeys } from "@/lib/query/keys";
import type { OrderRequestStatus } from "@/lib/api/schemas/orderRequest";
import {
  listShopsForAddress,
  orderRequestsApi,
  searchShopCatalogue,
} from "./api";

/** The message a failed call should show, rather than "something went wrong". */
const reason = (err: unknown, fallback: string) =>
  err instanceof ApiError ? err.message : fallback;

/* ── the customer's side ──────────────────────────────────────────────────── */

export function useMyOrderRequests() {
  return useQuery({
    queryKey: queryKeys.orderRequests.mine(),
    queryFn: orderRequestsApi.listMine,
    // A shop answers these by hand, so the answer arrives minutes later rather
    // than seconds. Frequent enough that somebody watching the page sees it;
    // not so frequent that an idle tab costs anything.
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

/**
 * The shops that can reach the chosen address.
 *
 * Keyed by address rather than pincode because that is what the endpoint takes
 * — the server owns the ownership check, and the list it returns is exactly the
 * list the upload will accept.
 */
export function useShopsForAddress(addressId: string | undefined) {
  return useQuery({
    queryKey: ["order-requests", "shops-for-address", addressId ?? "none"],
    queryFn: () => listShopsForAddress(addressId as string),
    enabled: Boolean(addressId),
    staleTime: 5 * 60_000,
  });
}

export function useSendOrderRequest(onProgress?: (percent: number) => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      shopId: string;
      addressId: string;
      note?: string;
      files: File[];
    }) => orderRequestsApi.create(input, onProgress),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orderRequests.mine() });
      toast.success("Sent. The shop will set your order up.");
    },
    onError: (err) =>
      toast.error(reason(err, "Could not send that. Try again.")),
  });
}

export function useCancelOrderRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => orderRequestsApi.cancel(requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orderRequests.mine() });
      toast.success("Request withdrawn");
    },
    onError: (err) =>
      toast.error(reason(err, "Could not withdraw that request.")),
  });
}

/* ── the shop's side ──────────────────────────────────────────────────────── */

export function useShopOrderRequests(
  shopId: string | undefined,
  params: { status?: OrderRequestStatus; page?: number } = {},
) {
  return useQuery({
    queryKey: queryKeys.orderRequests.forShop(shopId ?? "none", params),
    queryFn: () => orderRequestsApi.listForShop(shopId as string, params),
    // Guards the first render, before a shop has been chosen — without it
    // react-query fires a request to `/shops/undefined/order-requests`.
    enabled: Boolean(shopId),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    placeholderData: (previous) => previous,
  });
}

export function useFulfilOrderRequest(shopId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      requestId: string;
      items: { variant_id: string; quantity: number }[];
      special_instructions?: string;
    }) =>
      orderRequestsApi.fulfil(shopId as string, input.requestId, {
        items: input.items,
        special_instructions: input.special_instructions,
      }),
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: queryKeys.orderRequests.all });
      // The order board too: one was just placed on it.
      qc.invalidateQueries({ queryKey: queryKeys.orders.all });
      toast.success(`Order ${order.order_number} placed`);
    },
    onError: (err) => toast.error(reason(err, "Could not place that order.")),
  });
}

export function useDeclineOrderRequest(shopId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { requestId: string; note: string }) =>
      orderRequestsApi.decline(shopId as string, input.requestId, input.note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orderRequests.all });
      toast.success("The customer has been told");
    },
    onError: (err) => toast.error(reason(err, "Could not decline that.")),
  });
}

/**
 * The shop's shelves, searched as the shopkeeper types.
 *
 * Runs with an empty term too: opening the box on a blank list and seeing the
 * first twenty things the shop sells is more use than an empty panel that only
 * fills once you guess a word correctly.
 */
export function useShopCatalogue(shopId: string | undefined, q: string) {
  return useQuery({
    queryKey: ["order-requests", "catalogue", shopId ?? "none", q],
    queryFn: () => searchShopCatalogue(shopId as string, q),
    enabled: Boolean(shopId),
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  });
}
