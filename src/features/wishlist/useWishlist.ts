"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/types";
import { wishlistApi } from "./api";

const KEY = ["wishlist"] as const;

export function useWishlist() {
  return useQuery({ queryKey: KEY, queryFn: wishlistApi.getWishlist });
}

export function useAddToWishlist() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: ({ productId, variantId }: { productId: string; variantId: string }) =>
      wishlistApi.add(productId, variantId),
    onSuccess: () => {
      toast.success("Saved to wishlist");
      qc.invalidateQueries({ queryKey: KEY });
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
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Could not remove"),
  });
}

export function useMoveToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => wishlistApi.moveToCart(itemId),
    onSuccess: () => {
      toast.success("Moved to cart");
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Could not move to cart"),
  });
}
