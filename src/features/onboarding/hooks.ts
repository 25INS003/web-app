"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/types";
import { onboardingApi } from "./api";

/**
 * Send the application.
 *
 * On success the owner goes to /status rather than /dashboard: submitting sets
 * `verification_status: "pending"`, and the shop-owner guard bounces anyone
 * unapproved back out of the dashboard anyway. Sending them somewhere they
 * will immediately be redirected from would look like the submission failed.
 *
 * `router.refresh()` first, because the guard reads the session server-side —
 * without it the client-side navigation carries the stale approval state.
 *
 * The `approvalStatus` cookie is moved on too. It is written at sign-in and
 * was never written again, so an owner who applied in this session still
 * carried `draft` — and the proxy, which can only read that cookie, sent them
 * back to /onboarding on the next URL they typed and showed them the empty
 * form for an application they had already submitted. The page itself now
 * refuses to render that form, so this is no longer what prevents the bug;
 * it is what stops the redirect happening twice on the way.
 */
export function useSubmitOnboarding() {
  const router = useRouter();

  return useMutation({
    mutationFn: onboardingApi.submit,
    onSuccess: () => {
      Cookies.set("approvalStatus", "pending", { expires: 1 });
      toast.success("Application submitted — an admin will review it");
      router.refresh();
      router.push("/status");
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Could not submit your application",
      ),
  });
}

/**
 * The application already on file, for pre-filling a resubmission.
 *
 * Only fetched when it is worth having: a first-time applicant has nothing to
 * pre-fill, and asking anyway would put a request in front of an empty form.
 *
 * `staleTime: Infinity` because the answer cannot change while this screen is
 * open — the only thing that writes it is the submit at the end, after which
 * the owner is redirected away.
 */
export function useExistingApplication(enabled: boolean) {
  return useQuery({
    queryKey: ["onboarding", "current"],
    queryFn: onboardingApi.current,
    enabled,
    staleTime: Infinity,
    retry: false,
  });
}
