"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiError } from "@/lib/api/types";
import { queryKeys } from "@/lib/query/keys";
import { teamApi, type ShopMember, type ShopRole } from "./api";

/**
 * The shop's team, and the role vocabulary to describe it.
 *
 * A 403 is a normal outcome here rather than a failure: `members:manage` is in
 * no role but the owner's, so a manager opening this page is told so. The
 * client's default retry already leaves 403 alone, so the error arrives once
 * and stays put — see `isForbidden` for the branch that reads it.
 */
export function useTeam(shopId: string) {
  return useQuery({
    queryKey: queryKeys.shops.team(shopId),
    queryFn: () => teamApi.list(shopId),
  });
}

/** Distinguishes "you may not see this" from "it went wrong". */
export function isForbidden(error: unknown) {
  return error instanceof ApiError && error.status === 403;
}

export function useAddMember(shopId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: ShopRole }) =>
      teamApi.add(shopId, email, role),
    onSuccess: () => {
      toast.success("Added to the shop");
      qc.invalidateQueries({ queryKey: queryKeys.shops.team(shopId) });
    },
    // The "no such account" case is the common one and its message is already
    // the instruction, so it is shown as-is.
    onError: err =>
      toast.error(
        err instanceof ApiError ? err.message : "Could not add that person",
      ),
  });
}

export function useSetMemberRole(shopId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: ShopRole }) =>
      teamApi.setRole(shopId, memberId, role),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.shops.team(shopId) }),
    onError: () => toast.error("Could not change that role"),
  });
}

/**
 * Takes the whole member rather than an id so the confirmation can name the
 * person — by the time it lands the row it came from may have re-rendered.
 */
export function useRevokeMember(shopId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (member: ShopMember) => teamApi.revoke(shopId, member.id),
    onSuccess: (_result, member) => {
      toast.success(`${member.user.email} no longer has access`);
      qc.invalidateQueries({ queryKey: queryKeys.shops.team(shopId) });
    },
    onError: () => toast.error("Could not revoke that access"),
  });
}
