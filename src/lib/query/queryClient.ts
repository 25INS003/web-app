import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/types";

// Fresh client per request on the server, singleton in the browser (wired in
// QueryProvider). Defaults tuned for a dashboard: short stale window, no retry
// on auth/not-found errors (the client already handles 401 refresh).
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          const status = error instanceof ApiError ? error.status : undefined;
          if (status && [400, 401, 403, 404].includes(status)) return false;
          return failureCount < 2;
        },
      },
      mutations: { retry: false },
    },
  });
}
