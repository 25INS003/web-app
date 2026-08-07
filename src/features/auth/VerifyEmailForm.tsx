"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyEmailInputSchema } from "@/lib/api/schemas/auth";
import type { VerifyEmailInput } from "@/lib/api/schemas/auth";
import { useResendVerification, useVerifyEmail } from "./useAuth";

/**
 * Confirms the code emailed at registration.
 *
 * This is the first sign-in for a new account, not a secondary step:
 * registration issues no session, so nothing works until the code is confirmed
 * here. On success the backend sets the auth cookies and the hook redirects to
 * whichever home the role belongs to.
 */
export function VerifyEmailForm({ email }: { email: string }) {
  const verify = useVerifyEmail();
  const resend = useResendVerification();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyEmailInput>({
    resolver: zodResolver(verifyEmailInputSchema),
    defaultValues: { email, otp: "" },
  });

  return (
    <form
      onSubmit={handleSubmit((v) => verify.mutate(v))}
      className="space-y-4"
      noValidate
    >
      {/* The address is fixed by the link that got the user here. Registered as
          a hidden field so it travels with the form rather than being closed
          over, which keeps the zod resolver validating the whole payload. */}
      <input type="hidden" {...register("email")} />

      <div className="space-y-1.5">
        <Label htmlFor="otp">6-digit code</Label>
        <Input
          id="otp"
          // inputMode brings up the numeric keypad on mobile; type stays text so
          // a leading zero is preserved and the spinner buttons stay away.
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          autoFocus
          className="text-center text-lg tracking-[0.4em]"
          {...register("otp")}
        />
        {errors.otp && (
          <p className="text-xs text-destructive">{errors.otp.message}</p>
        )}
        {errors.email && (
          <p className="text-xs text-destructive">
            That link is missing a valid email address — try signing in again.
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={verify.isPending}>
        {verify.isPending && <Loader2 className="animate-spin" />}
        Verify and continue
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        Didn&apos;t get it? Check spam, then{" "}
        <button
          type="button"
          onClick={() => resend.mutate(email)}
          disabled={resend.isPending}
          className="font-medium text-primary hover:underline disabled:opacity-50"
        >
          resend the code
        </button>
        .
        {/* The backend enforces a 60s cooldown and a resend ceiling and returns
            429 with the remaining wait, which the hook surfaces verbatim. */}
      </div>
    </form>
  );
}
