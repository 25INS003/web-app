"use client";

import { Check, Circle } from "lucide-react";
import { useId } from "react";
import { cn } from "@/lib/utils";
import {
  MIN_ACCEPTED_SCORE,
  scorePassword,
  type Identity,
} from "./password-strength";

/**
 * How strong the password being typed is, and what would improve it.
 *
 * Four segments rather than a percentage bar, because the score IS four
 * discrete steps and a smooth bar invites people to read precision into it
 * that the rule does not have.
 *
 * Colour is never the only signal. The label reads "Fair", "Good", "Strong" in
 * text beside the bar, and the advice underneath says what to change — so this
 * works for the roughly one in twelve men who cannot separate the red segment
 * from the green one, and for anyone using a screen reader.
 *
 * Renders nothing on an empty field: a red "Too weak" against a box nobody has
 * typed in yet is an accusation, not feedback.
 */

const TONE = [
  "bg-destructive",
  "bg-destructive",
  "bg-amber-500",
  "bg-lime-500",
  "bg-emerald-500",
];

const TEXT_TONE = [
  "text-destructive",
  "text-destructive",
  "text-amber-600 dark:text-amber-500",
  "text-lime-600 dark:text-lime-500",
  "text-emerald-600 dark:text-emerald-500",
];

export function PasswordStrengthMeter({
  password,
  identity,
  className,
}: {
  password: string;
  /** Name and email, so the rule can refuse a password containing them. */
  identity?: Identity;
  className?: string;
}) {
  const liveId = useId();
  if (!password) return null;

  const { score, label, reasons, acceptable, checks } = scorePassword(
    password,
    identity,
  );

  // Every requirement, always visible — not just the one currently failing.
  // The rules are mandatory now, so showing them one at a time turns choosing
  // a password into three rounds of guessing what else is wanted.
  const REQUIREMENTS: [keyof typeof checks, string][] = [
    ["length", "8+ characters"],
    ["uppercase", "Uppercase"],
    ["number", "Number"],
    ["symbol", "Symbol"],
  ];

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-2">
        {/* aria-hidden: the bar is a picture of the label next to it, and a
            screen reader announcing four anonymous divs adds nothing. */}
        <div className="flex flex-1 gap-1" aria-hidden="true">
          {[0, 1, 2, 3].map((segment) => (
            <span
              key={segment}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                // Zero still lights one segment. An entirely empty bar reads
                // as "not measured yet" rather than "measured, and bad".
                segment < Math.max(score, 1) ? TONE[score] : "bg-muted",
              )}
            />
          ))}
        </div>
        <span className={cn("text-xs font-medium", TEXT_TONE[score])}>
          {label}
        </span>
      </div>

      <ul className="flex flex-wrap gap-x-3 gap-y-1">
        {REQUIREMENTS.map(([id, label_]) => (
          <li
            key={id}
            className={cn(
              "flex items-center gap-1 text-[11px]",
              checks[id]
                ? "text-emerald-600 dark:text-emerald-500"
                : "text-muted-foreground",
            )}
          >
            {checks[id] ? (
              <Check className="size-3" aria-hidden="true" />
            ) : (
              <Circle className="size-3" aria-hidden="true" />
            )}
            {/* The tick is decorative; the state has to reach a screen reader
                as words, not as an icon it will not describe. */}
            <span className="sr-only">{checks[id] ? "met:" : "not met:"}</span>
            {label_}
          </li>
        ))}
      </ul>

      {/* polite, not assertive: this updates on every keystroke and an
          assertive region would interrupt the person mid-word. */}
      <p
        id={liveId}
        aria-live="polite"
        className={cn(
          "text-xs",
          acceptable ? "text-muted-foreground" : "text-destructive",
        )}
      >
        {reasons[0] ??
          (score === 4
            ? "Strong password."
            : "Good enough — longer is still better.")}
      </p>
    </div>
  );
}

export { MIN_ACCEPTED_SCORE };
