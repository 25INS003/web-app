"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/types";
import { queryKeys } from "@/lib/query/keys";
import { notificationsApi } from "./api";

export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: () => notificationsApi.list(20),
    enabled,
    staleTime: 30_000,
  });
}

export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: queryKeys.notifications.count(),
    queryFn: notificationsApi.unreadCount,
    enabled,
    staleTime: 30_000,
  });
}

function useInvalidateNotifications() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.notifications.list() });
    qc.invalidateQueries({ queryKey: queryKeys.notifications.count() });
  };
}

export function useMarkRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsApi.markRead(notificationId),
    onSuccess: invalidate,
  });
}

export function useMarkAllRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      invalidate();
      toast.success("All caught up");
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Could not update notifications",
      ),
  });
}
