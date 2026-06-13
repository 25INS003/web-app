"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/types";
import { cartApi } from "./api";

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
      qc.invalidateQueries({ queryKey: ["cart"] });
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
