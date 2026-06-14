"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/types";
import { queryKeys } from "@/lib/query/keys";
import { reviewsApi } from "./api";
import type { CreateReviewInput, UpdateReviewInput } from "./api";

const MY_REVIEWS_KEY = ["reviews", "mine"] as const;

// Only fetched when likely-authenticated, to avoid guest 401s.
export function useMyReviews(enabled = true) {
  return useQuery({
    queryKey: MY_REVIEWS_KEY,
    queryFn: reviewsApi.getMyReviews,
    enabled,
    staleTime: 30_000,
  });
}

function invalidateProduct(qc: ReturnType<typeof useQueryClient>, id?: string) {
  qc.invalidateQueries({ queryKey: MY_REVIEWS_KEY });
  if (id) {
    // Prefix-invalidates the product detail *and* its reviews sub-query.
    qc.invalidateQueries({ queryKey: queryKeys.products.detail("catalog", id) });
  }
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReviewInput) => reviewsApi.create(input),
    onSuccess: (_data, input) => {
      toast.success("Review submitted");
      invalidateProduct(qc, input.productId);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Could not submit review",
      ),
  });
}

export function useUpdateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateReviewInput) => reviewsApi.update(input),
    onSuccess: (_data, input) => {
      toast.success("Review updated");
      invalidateProduct(qc, input.productId);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Could not update review",
      ),
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reviewId }: { reviewId: string; productId?: string }) =>
      reviewsApi.remove(reviewId),
    onSuccess: (_data, vars) => {
      toast.success("Review removed");
      invalidateProduct(qc, vars.productId);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Could not remove review",
      ),
  });
}
