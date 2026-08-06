"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { shopDashboardApi } from "./api";

/**
 * Owner-wide dashboard stats. The payload is a dozen aggregations over every
 * shop order, so it is deliberately not refetched on window focus — a 60s stale
 * window is plenty for a stats screen and keeps the DB off the floor.
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: shopDashboardApi.getStats,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
