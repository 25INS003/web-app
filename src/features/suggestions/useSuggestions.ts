"use client";

import { useQuery } from "@tanstack/react-query";
import { useIsAuthed } from "@/features/auth/useAuth";
import { queryKeys } from "@/lib/query/keys";
import { suggestionsApi } from "./api";

/**
 * Suggestions for the signed-in customer.
 *
 * `enabled` on the auth cookie: the endpoint is customer-only, so calling it for
 * an anonymous visitor is a guaranteed 401 on every storefront page load.
 *
 * Kept fresh for a minute — the underlying signals change as the customer adds
 * to their cart, and a stale row would keep recommending what they just bought.
 */
export function useSuggestions(limit = 8) {
  const isAuthed = useIsAuthed();
  return useQuery({
    queryKey: [...queryKeys.suggestions, limit],
    queryFn: () => suggestionsApi.get(limit),
    enabled: isAuthed,
    staleTime: 60_000,
    retry: false,
  });
}
