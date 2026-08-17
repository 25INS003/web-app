"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";
import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * A password field with a show/hide toggle.
 *
 * One component rather than the toggle repeated at each of the four password
 * fields (sign in, register, and both boxes of the reset flow) — otherwise the
 * accessible naming and the focus behaviour drift apart between them, and a
 * password box that behaves differently on two screens reads as a bug.
 *
 * `ref` is an ordinary prop here: React 19 passes it straight through to the
 * inner input, so `{...register("password")}` from react-hook-form — which is
 * a name, handlers AND a ref — spreads onto this exactly as it does onto a
 * bare <Input>.
 */
export function PasswordInput({
  className,
  disabled,
  ...props
}: ComponentProps<typeof Input>) {
  const [visible, setVisible] = useState(false);
  // Ties the button to its own description without colliding when several of
  // these render on one screen (the reset flow has two).
  const hintId = useId();

  return (
    <div className="relative">
      <Input
        {...props}
        disabled={disabled}
        type={visible ? "text" : "password"}
        // Room for the button, so a long password never runs underneath it.
        className={cn("pr-10", className)}
      />

      <button
        type="button"
        // Not tabIndex={-1}. Skipping it in the tab order is the common trick
        // to keep Tab going password -> submit, but it makes the control
        // unreachable for anyone navigating by keyboard, which is precisely
        // the person most likely to need to check what they typed.
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        aria-describedby={hintId}
        className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-lg text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
      </button>

      {/* Screen readers otherwise get no signal that revealing the password
          puts it on screen in plain text. */}
      <span id={hintId} className="sr-only">
        {visible
          ? "Your password is visible on screen"
          : "Your password is hidden"}
      </span>
    </div>
  );
}
