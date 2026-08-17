"use client";

import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { ApiError } from "@/lib/api/types";
import { authApi } from "./api";

type Step = "email" | "otp" | "reset" | "done";

const msg = (err: unknown, fallback: string) =>
  err instanceof ApiError ? err.message : fallback;

// Hoisted out of the component body. Declared inside, this was a NEW component
// type on every render, so React unmounted and remounted it each time rather
// than updating it — harmless for a <p>, but it resets state, and the rule
// exists because the next person to add state here would not see it coming.
function FieldError({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}

export function PasswordResetFlow() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const send = useMutation({
    mutationFn: (e: string) => authApi.forgotPassword(e),
    onSuccess: () => {
      setError(null);
      setStep("otp");
    },
    onError: (e) => setError(msg(e, "Could not send the code")),
  });

  const verify = useMutation({
    mutationFn: (code: string) => authApi.verifyOtp(email, code),
    onSuccess: (res) => {
      setResetToken(res.resetToken);
      setError(null);
      setStep("reset");
    },
    onError: (e) => setError(msg(e, "Invalid or expired code")),
  });

  const reset = useMutation({
    mutationFn: (pw: string) => authApi.resetPassword(resetToken, pw),
    onSuccess: () => {
      setError(null);
      setStep("done");
    },
    onError: (e) => setError(msg(e, "Could not reset your password")),
  });

  if (step === "done") {
    return (
      <div className="text-center">
        <span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-success/12 text-success">
          <CheckCircle2 className="size-6" />
        </span>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Password updated
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You can now sign in with your new password.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Reset your password
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {step === "email" && "We'll email you a one-time code."}
        {step === "otp" && `Enter the code sent to ${email}.`}
        {step === "reset" && "Choose a new password."}
      </p>

      {step === "email" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send.mutate(email);
          }}
          className="mt-6 space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <FieldError message={error} />
          <Button type="submit" size="lg" className="w-full" disabled={send.isPending}>
            {send.isPending && <Loader2 className="animate-spin" />}
            Send code
          </Button>
        </form>
      )}

      {step === "otp" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            verify.mutate(otp);
          }}
          className="mt-6 space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="otp">Verification code</Label>
            <Input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              className="text-center text-lg tracking-[0.5em]"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>
          <FieldError message={error} />
          <Button type="submit" size="lg" className="w-full" disabled={verify.isPending}>
            {verify.isPending && <Loader2 className="animate-spin" />}
            Verify code
          </Button>
          <button
            type="button"
            onClick={() => send.mutate(email)}
            disabled={send.isPending}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Didn&apos;t get it? Resend
          </button>
        </form>
      )}

      {step === "reset" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (password.length < 6) return setError("At least 6 characters");
            if (password !== confirm) return setError("Passwords don't match");
            reset.mutate(password);
          }}
          className="mt-6 space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="newpw">New password</Label>
            <PasswordInput
              id="newpw"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <PasswordInput
              id="confirm"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <FieldError message={error} />
          <Button type="submit" size="lg" className="w-full" disabled={reset.isPending}>
            {reset.isPending && <Loader2 className="animate-spin" />}
            Update password
          </Button>
        </form>
      )}

      <div className="mt-5 text-center text-sm">
        <Link href="/login" className="text-muted-foreground hover:text-foreground">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
