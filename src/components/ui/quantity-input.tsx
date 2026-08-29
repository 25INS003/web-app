"use client";

import { Loader2, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Stepper with a typable middle. The number is a real <input>, so a customer
 * going from 1 to 12 types "12" instead of clicking + eleven times.
 *
 * Editing is drafted in a string rather than written straight through to
 * `value`: clearing the field to retype has to be a legal intermediate state,
 * and a controlled number would snap an empty field back to 1 on the first
 * keystroke. The draft commits on blur and on Enter, reverts on Escape, and is
 * clamped to [min, max] at commit time — never mid-keystroke, which would fight
 * the person typing "10" by rewriting the "1" to the max.
 *
 * `value` winning over a live draft in the sync effect is deliberate: the server
 * clamps quantities (stock, MAX_LINE_QUANTITY), and its correction has to be
 * able to overwrite what was typed.
 */
export function QuantityInput({
  value,
  onCommit,
  min = 1,
  max,
  disabled,
  busy,
  className,
  ariaLabel = "Quantity",
}: {
  value: number;
  onCommit: (next: number) => void;
  min?: number;
  max: number;
  disabled?: boolean;
  busy?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const [draft, setDraft] = useState(String(value));

  // Resync the draft when `value` changes underneath us — adjusted during
  // render rather than in an effect, so there is no flash of the stale number
  // and no cascading re-render. This is the case where the server clamped what
  // we sent (stock ran out, MAX_LINE_QUANTITY) and the corrected figure has to
  // win over whatever is in the box.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(String(value));
  }

  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  const commit = (raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    // Unparseable or below the floor reverts rather than silently becoming
    // min — a stray letter shouldn't quietly change the order.
    if (!Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    const next = clamp(parsed);
    setDraft(String(next));
    if (next !== value) onCommit(next);
  };

  const step = (delta: number) => {
    const next = clamp(value + delta);
    if (next !== value) onCommit(next);
  };

  return (
    <div
      className={cn(
        "flex items-center rounded-lg border border-border",
        disabled && "opacity-60",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={disabled || value <= min}
        className="grid size-8 shrink-0 place-items-center text-muted-foreground transition hover:text-foreground disabled:opacity-40"
        aria-label="Decrease quantity"
      >
        <Minus className="size-3.5" />
      </button>

      {busy ? (
        <span className="grid w-10 place-items-center">
          <Loader2 className="size-3.5 animate-spin" />
        </span>
      ) : (
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={draft}
          disabled={disabled}
          aria-label={ariaLabel}
          onChange={(e) => {
            // Digits only, so the draft can never hold something commit has to
            // reject. Empty stays legal — that is mid-retype.
            const next = e.target.value.replace(/[^0-9]/g, "");
            if (next.length <= 3) setDraft(next);
          }}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={(e) => commit(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.blur();
            } else if (e.key === "Escape") {
              setDraft(String(value));
              e.currentTarget.blur();
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              step(1);
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              step(-1);
            }
          }}
          className="w-10 bg-transparent text-center text-sm font-medium tabular-nums outline-none focus:ring-0 disabled:cursor-not-allowed"
        />
      )}

      <button
        type="button"
        onClick={() => step(1)}
        disabled={disabled || value >= max}
        className="grid size-8 shrink-0 place-items-center text-muted-foreground transition hover:text-foreground disabled:opacity-40"
        aria-label="Increase quantity"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
