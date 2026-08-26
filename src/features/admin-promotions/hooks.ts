"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/types";
import { adminPromotionsApi } from "./api";
import type { Promotion, PromotionInput } from "./api";

const KEY = ["admin", "promotions"] as const;

export function usePromotions() {
  return useQuery({
    queryKey: KEY,
    queryFn: adminPromotionsApi.list,
    staleTime: 30_000,
  });
}

/** The server's own message is the useful one — "the code X is already in use". */
const fail = (fallback: string) => (err: unknown) =>
  toast.error(err instanceof ApiError ? err.message : fallback);

export function useCreatePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PromotionInput) => adminPromotionsApi.create(input),
    onSuccess: (p) => {
      toast.success(`${p.code} created`);
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: fail("Could not create that promotion"),
  });
}

export function useUpdatePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PromotionInput> }) =>
      adminPromotionsApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: fail("Could not update that promotion"),
  });
}

export function useRemovePromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Promotion) => adminPromotionsApi.remove(p.id),
    onSuccess: ({ deactivated }) => {
      // Which of the two happened matters: a deactivated code still exists and
      // still explains what past orders cost.
      toast.success(
        deactivated
          ? "That code has been used, so it was deactivated rather than deleted"
          : "Promotion deleted",
      );
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: fail("Could not remove that promotion"),
  });
}
