"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/types";
import { accountApi } from "./api";

const LOYALTY_KEY = ["loyalty"] as const;
const HISTORY_KEY = ["loyalty", "history"] as const;
const REWARDS_KEY = ["loyalty", "rewards"] as const;

export function useLoyalty() {
  return useQuery({
    queryKey: LOYALTY_KEY,
    queryFn: accountApi.getLoyalty,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLoyaltySummary() {
  return useQuery({
    queryKey: [...LOYALTY_KEY, "summary"],
    queryFn: accountApi.getLoyaltySummary,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLoyaltyHistory() {
  return useQuery({
    queryKey: HISTORY_KEY,
    queryFn: () => accountApi.getLoyaltyHistory(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRewards() {
  return useQuery({
    queryKey: REWARDS_KEY,
    queryFn: accountApi.getRewards,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRedeemReward() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rewardId: string) => accountApi.redeemReward(rewardId),
    onSuccess: () => {
      toast.success("Reward redeemed");
      // Balance, ledger and remaining stock all move together. Every loyalty
      // key is prefixed ["loyalty"], so this one call invalidates the summary,
      // the history and the catalogue by prefix match.
      qc.invalidateQueries({ queryKey: LOYALTY_KEY });
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Could not redeem this reward",
      ),
  });
}
