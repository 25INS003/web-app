"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { RegisterInput } from "@/lib/api/schemas/auth";
import { ApiError } from "@/lib/api/types";
import { queryKeys } from "@/lib/query/keys";
import { authApi } from "./api";
import { homeFor } from "./redirect";

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
