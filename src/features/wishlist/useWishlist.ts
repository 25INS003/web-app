"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useIsAuthed } from "@/features/auth/useAuth";
import { ApiError } from "@/lib/api/types";
import { wishlistApi } from "./api";

const KEY = ["wishlist"] as const;

/**
 * The wishlist feeds the affinity profile, and adding or removing an item is
 * also recorded as a suggestion signal server-side — so recommendations are
 * stale the moment the wishlist changes.
 */
/**
 * What a wishlist write makes stale — the wishlist, and nothing else.
 *
 * Same reasoning as the cart: the suggestion rows are derived from saved items,
 * and re-ranking them the moment a heart is pressed moves the card out from
 * under the customer. They refresh on their own cadence instead.
 */
const invalidateWishlistAndDerived = (
  qc: ReturnType<typeof useQueryClient>,
) => {
  qc.invalidateQueries({ queryKey: KEY });
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

/**
 * Empty the wishlist in one go.
 *
 * Reports how many went, because the confirm above it said a number and the
 * result should agree with what was promised.
 */
export function useClearWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => wishlistApi.clear(),
    onSuccess: () => {
      toast.success("Wishlist cleared");
      invalidateWishlistAndDerived(qc);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Could not clear the wishlist",
      ),
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

/**
 * Whether a product is on the wishlist, and one way to change that.
 *
 * The card and the product page each had their own answer: the card looked the
 * product up and the detail page did not look at all — its heart only ever
 * ADDED, so it never went red and pressing it twice saved the same thing twice.
 * One hook means the same product shows the same state wherever it appears.
 *
 * Both ids are compared explicitly against undefined. `w.variant?.id === variantId`
 * matches when BOTH are undefined, which would mark every product saved as soon
 * as one wishlist row had no variant.
 */
export function useWishlistToggle(
  productId: string | undefined,
  variantId: string | null | undefined,
) {
  const wishlist = useWishlist();
  const add = useAddToWishlist();
  const remove = useRemoveFromWishlist();

  const saved = wishlist.data?.find(
    (w) =>
      (productId !== undefined && w.product?.id === productId) ||
      (variantId != null && w.variant?.id === variantId),
  );

  return {
    saved: Boolean(saved),
    // Whether the wishlist itself has been read yet, as distinct from a
    // save/remove being in flight. Before it loads nothing is known to be
    // saved, and a caller that cannot tell the two apart will read "not saved"
    // from an unanswered question.
    isLoaded: !wishlist.isPending,
    isPending: add.isPending || remove.isPending,
    toggle: () => {
      if (saved) {
        remove.mutate(saved.id);
        return;
      }
      // Both ids are required to save: the wishlist row is keyed by variant, so
      // a product without one cannot be added.
      if (productId && variantId) add.mutate({ productId, variantId });
    },
  };
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
