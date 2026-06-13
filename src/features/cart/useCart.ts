"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/types";
import { cartApi } from "./api";

const CART_KEY = ["cart"] as const;
const CART_TOTAL_KEY = ["cart", "total"] as const;

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
      qc.invalidateQueries({ queryKey: CART_KEY });
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
    onSuccess: () => qc.invalidateQueries({ queryKey: CART_KEY }),
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
      qc.invalidateQueries({ queryKey: CART_KEY });
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Could not remove item",
      ),
  });
}
