"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import type { RegisterInput } from "@/lib/api/schemas/auth";
import { ApiError } from "@/lib/api/types";
import { queryKeys } from "@/lib/query/keys";
import { authApi } from "./api";
import { homeFor } from "./redirect";

// SSR-safe "is there an auth cookie" check. Renders false on the server and on
// the first client paint, then the real value after hydration — no hydration
// mismatch and no setState-in-effect. The cookie only changes across a full
// navigation (login/logout refresh the router), so no live subscription needed.
const noopSubscribe = () => () => {};
export function useIsAuthed(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => !!Cookies.get("userRole"),
    () => false,
  );
}

// Client-side current session (GET /auth/me). Pass `enabled` to skip the call
// for visitors who have no auth cookie. Returns null-ish until resolved.
export function useSession(enabled = true) {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: authApi.me,
    enabled,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useLogin() {
  const router = useRouter();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (session) => {
      qc.setQueryData(queryKeys.session, session);
      router.replace(homeFor(session));
      router.refresh(); // re-run server components with the new cookies
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.message : "Could not sign you in",
      );
    },
  });
}

export function useRegister() {
  const router = useRouter();
  const qc = useQueryClient();
  return useMutation({
    // Register, then auto sign-in so the user lands authenticated.
    mutationFn: async (input: RegisterInput) => {
      await authApi.register(input);
      return authApi.login({ email: input.email, password: input.password });
    },
    onSuccess: (session) => {
      qc.setQueryData(queryKeys.session, session);
      router.replace(homeFor(session));
      router.refresh();
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.message : "Could not create your account",
      );
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      qc.clear();
      router.replace("/login");
      router.refresh();
    },
  });
}
