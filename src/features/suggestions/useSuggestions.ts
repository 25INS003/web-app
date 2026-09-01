"use client";

import { useQuery } from "@tanstack/react-query";
import { useIsAuthed } from "@/features/auth/useAuth";
import { useDeliveryPincode } from "@/features/catalog/hooks";
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
  // The endpoint has always taken a pincode and nothing ever sent one, so this
  // row kept recommending products from shops that do not deliver to the
  // customer — the one place on the storefront still doing it after the
  // catalogue was filtered. In the key as well, or switching address leaves the
  // previous area's recommendations on screen.
  const pincode = useDeliveryPincode();

  return useQuery({
    queryKey: [...queryKeys.suggestions, limit, pincode ?? null],
    queryFn: () => suggestionsApi.get(limit, pincode),
    enabled: isAuthed,
    staleTime: 60_000,
    retry: false,
  });
}
