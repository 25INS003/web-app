"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useIsAuthed } from "@/features/auth/useAuth";
import { ApiError } from "@/lib/api/types";
import { queryKeys } from "@/lib/query/keys";
import { wishlistApi } from "./api";

const KEY = ["wishlist"] as const;

/**
 * The wishlist feeds the affinity profile, and adding or removing an item is
 * also recorded as a suggestion signal server-side — so recommendations are
 * stale the moment the wishlist changes.
 */
const invalidateWishlistAndDerived = (
  qc: ReturnType<typeof useQueryClient>,
) => {
  qc.invalidateQueries({ queryKey: KEY });
  qc.invalidateQueries({ queryKey: queryKeys.suggestions });
  qc.invalidateQueries({ queryKey: queryKeys.complements });
};

/**
 * The customer's wishlist.
 *
 * `enabled` for the same reason as the cart: every product card asks whether
 * this product is saved, and for a signed-out visitor the endpoint can only
 * 401. The heart still renders — pressing it is how somebody finds out they
 * need an account.
 */
export function useWishlist() {
  const authed = useIsAuthed();
  return useQuery({
    queryKey: KEY,
    queryFn: wishlistApi.getWishlist,
    enabled: authed,
  });
}

export function useAddToWishlist() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: ({ productId, variantId }: { productId: string; variantId: string }) =>
      wishlistApi.add(productId, variantId),
    onSuccess: () => {
      toast.success("Saved to wishlist");
      invalidateWishlistAndDerived(qc);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 401) {
        toast.error("Please sign in to save items");
        router.push("/login");
        return;
      }
      toast.error(err instanceof ApiError ? err.message : "Could not save item");
    },
  });
}

export function useRemoveFromWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => wishlistApi.remove(itemId),
    onSuccess: () => invalidateWishlistAndDerived(qc),
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Could not remove"),
  });
}

export function useMoveToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => wishlistApi.moveToCart(itemId),
    onSuccess: (result) => {
      // A move can be rejected per-item and still return 200, so report what
      // actually happened — "Moved to cart" on an out-of-stock item sends the
      // user to a cart that does not contain it.
      if (result.added > 0) {
        toast.success("Moved to cart");
      } else {
        toast.error(result.reason ?? "Could not move to cart");
      }
      invalidateWishlistAndDerived(qc);
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Could not move to cart"),
  });
}
