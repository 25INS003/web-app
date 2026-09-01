"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useIsAuthed } from "@/features/auth/useAuth";
import { ApiError } from "@/lib/api/types";
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
/**
 * What a cart write makes stale.
 *
 * The cart itself, and nothing else. The suggestion and complement rows are
 * DERIVED from the cart, so invalidating them here re-ranks them the instant
 * something is added — and now that Add lives on the card, that happens under
 * the customer's cursor: the row reshuffles, the product they just added moves
 * or drops out, and the stepper they were about to use is gone. They add it
 * again, or give up.
 *
 * It was invisible while the only way to add from a suggestion was to click
 * through to the product page, because by then the row was off screen.
 *
 * The rows are not left stale for long: both carry a 60s staleTime and refetch
 * on the next mount, so they re-rank on the next navigation instead of mid-tap.
 * A recommendation being one interaction out of date is a much smaller cost
 * than a list that moves while it is being used.
 */
const invalidateCartAndDerived = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: CART_KEY });
};

/**
 * The customer's cart.
 *
 * `enabled` on the auth cookie: this is read from every product card now, so
 * for a signed-out visitor it was a guaranteed 401 on every storefront page.
 * React Query dedupes it to one request per page rather than one per card, but
 * one guaranteed failure is still one too many.
 */
export function useCart() {
  const authed = useIsAuthed();
  return useQuery({
    queryKey: CART_KEY,
    queryFn: cartApi.getCart,
    enabled: authed,
  });
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

export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => cartApi.clear(),
    onSuccess: () => {
      toast.success("Cart cleared");
      invalidateCartAndDerived(qc);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Could not clear cart",
      ),
  });
}
