"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/types";
import { queryKeys } from "@/lib/query/keys";
import { cartApi } from "./api";

const CART_KEY = ["cart"] as const;
const CART_TOTAL_KEY = ["cart", "total"] as const;

/**
 * Invalidate the cart AND anything derived from it.
 *
 * Recommendations are computed from cart contents server-side, so without this
 * the "Goes well with your cart" row keeps showing what it computed before the
 * change — sitting directly under a cart it no longer matches. The row is on
 * the cart page, where items are added and removed without navigating, so
 * nothing would otherwise remount it until the stale window lapsed.
 */
const invalidateCartAndDerived = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: CART_KEY });
  qc.invalidateQueries({ queryKey: queryKeys.complements });
  qc.invalidateQueries({ queryKey: queryKeys.suggestions });
};

export function useCart() {
  return useQuery({ queryKey: CART_KEY, queryFn: cartApi.getCart });
}

export function useCartTotal() {
  return useQuery({ queryKey: CART_TOTAL_KEY, queryFn: cartApi.getTotal });
}

// Header badge: only fetched when likely-authenticated, to avoid guest 401s.
export function useCartCount(enabled: boolean): number {
  const q = useQuery({
    queryKey: CART_TOTAL_KEY,
    queryFn: cartApi.getTotal,
    enabled,
    staleTime: 10_000,
  });
  return q.data?.items_count ?? 0;
}

export function useAddToCart() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: ({
      productVarId,
      quantity,
    }: {
      productVarId: string;
      quantity?: number;
    }) => cartApi.addItem(productVarId, quantity),
    onSuccess: () => {
      toast.success("Added to cart");
      invalidateCartAndDerived(qc);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 401) {
        toast.error("Please sign in to add items to your cart");
        router.push("/login");
        return;
      }
      toast.error(
        err instanceof ApiError ? err.message : "Could not add to cart",
      );
    },
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      cartApi.updateItem(id, quantity),
    onSuccess: () => invalidateCartAndDerived(qc),
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Could not update item",
      ),
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cartApi.removeItem(id),
    onSuccess: () => {
      toast.success("Removed from cart");
      invalidateCartAndDerived(qc);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Could not remove item",
      ),
  });
}
