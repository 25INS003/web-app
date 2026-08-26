"use client";

import { useMutation } from "@tanstack/react-query";
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
 */
export function useSubmitOnboarding() {
  const router = useRouter();

  return useMutation({
    mutationFn: onboardingApi.submit,
    onSuccess: () => {
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
