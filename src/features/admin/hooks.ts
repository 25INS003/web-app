"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/types";
import { queryKeys } from "@/lib/query/keys";
import { adminApi } from "./api";

/**
 * The approval queue.
 *
 * `refetchInterval` because applications arrive while the admin is looking at
 * the screen — the whole complaint this page answers is "somebody registered
 * and nothing showed up". A board that only updates on reload is one somebody
 * has to remember to reload.
 */
export function usePendingOwners() {
  return useQuery({
    queryKey: [...queryKeys.admin.owners, "pending"] as const,
    queryFn: adminApi.pendingOwners,
    refetchInterval: 30_000,
  });
}

export function useAllOwners() {
  return useQuery({
    queryKey: queryKeys.admin.owners,
    queryFn: adminApi.allOwners,
    staleTime: 60_000,
  });
}

export function useAdminShops() {
  return useQuery({
    queryKey: queryKeys.admin.shops,
    queryFn: adminApi.allShops,
    staleTime: 60_000,
  });
}

export function usePendingShops() {
  return useQuery({
    queryKey: [...queryKeys.admin.shops, "pending"] as const,
    queryFn: adminApi.pendingShops,
    staleTime: 60_000,
  });
}

/**
 * Approve or reject an applicant.
 *
 * Invalidates the whole `admin` subtree rather than the one list: a decision
 * moves the applicant out of the queue and changes the counts the tiles show,
 * so patching a single cached list would leave the rest of the screen
 * disagreeing with it.
 */
export function useOwnerDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ownerId,
      decision,
    }: {
      ownerId: string;
      decision: "approve" | "reject";
    }) =>
      decision === "approve"
        ? adminApi.approveOwner(ownerId)
        : adminApi.rejectOwner(ownerId),
    onSuccess: (_data, { decision }) => {
      toast.success(decision === "approve" ? "Owner approved" : "Owner rejected");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Could not update the applicant",
      ),
  });
}
