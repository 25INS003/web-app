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

/**
 * The signed-in role, or null when signed out. Same cookie and same SSR-safety
 * as `useIsAuthed` — this only reads its value instead of its presence.
 *
 * Worth having separately because "signed in" and "may use the customer API"
 * are different questions: addresses, the cart and orders are all behind
 * `validateUserType(["customer"])`, so an admin browsing the storefront is
 * authenticated and still gets a 403 from every one of them.
 */
export function useUserRole(): string | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => Cookies.get("userRole") ?? null,
    () => null,
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
    onError: (err, vars) => {
      // A correct password on an unverified account. Sending them to the
      // verification screen is the only way forward — a toast saying "email not
      // verified" would be a dead end with no way to get a new code.
      if (err instanceof ApiError && isUnverified(err)) {
        router.push(`/verify-email?email=${encodeURIComponent(vars.email)}`);
        return;
      }
      toast.error(
        err instanceof ApiError ? err.message : "Could not sign you in",
      );
    },
  });
}

// The backend marks this case with EMAIL_NOT_VERIFIED in the response body's
// `errors` array rather than making the client match on message text, which
// would break the moment the wording changes. ApiError keeps the whole body on
// `payload`, so read it from there.
export function isUnverified(err: unknown): boolean {
  if (!(err instanceof ApiError) || err.status !== 403) return false;
  const errors = (err.payload as { errors?: unknown } | undefined)?.errors;
  return Array.isArray(errors) && errors.includes("EMAIL_NOT_VERIFIED");
}

export function useRegister() {
  const router = useRouter();
  const qc = useQueryClient();
  return useMutation({
    // No auto sign-in any more: registration issues no session, and login now
    // rejects an unverified account. The user goes to the verification screen,
    // which is what turns the emailed code into a session.
    mutationFn: async (input: RegisterInput) => {
      const result = await authApi.register(input);
      return { ...result, email: input.email };
    },
    onSuccess: (result) => {
      if (result.verification_email_sent === false) {
        toast.error(
          "Account created, but we could not send the code. Try resending.",
        );
      }
      router.replace(
        `/verify-email?email=${encodeURIComponent(result.email)}`,
      );
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

// Turns the emailed code into a session. This is the first real sign-in for a
// new account — the backend sets the auth cookies on success — so it lands the
// user wherever their role belongs, exactly as useLogin does.
export function useVerifyEmail() {
  const router = useRouter();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: (session) => {
      qc.setQueryData(queryKeys.session, session);
      router.replace(homeFor(session));
      router.refresh();
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.message : "Could not verify that code",
      );
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: authApi.resendVerification,
    // The backend answers 200 for an unknown or already-verified address too, so
    // this message is deliberately non-committal — confirming which addresses
    // exist would make the endpoint an account-enumeration oracle.
    onSuccess: () => toast.success("If that account needs a code, we sent one"),
    onError: (err) => {
      // 429 carries the cooldown wording ("Please wait 42s"), which is worth
      // showing verbatim so the user waits rather than keeps pressing.
      toast.error(
        err instanceof ApiError ? err.message : "Could not resend the code",
      );
    },
  });
}
