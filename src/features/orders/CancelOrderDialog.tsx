"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const REASONS = [
  "Ordered by mistake",
  "Changed my mind",
  "Found it cheaper elsewhere",
  "Taking too long",
  "Something else",
];

/**
 * Cancelling your own order.
 *
 * The reason is offered as a list rather than a required essay: the shop reads
 * it to decide whether to restock or follow up, and a compulsory free-text box
 * on a customer's own cancellation gets "asdf" typed into it. Picking from a
 * short list is one tap and produces something the shop can actually act on.
 *
 * "Something else" opens the box, for the case the list does not cover.
 */
export function CancelOrderDialog({
  orderNumber,
  busy,
  onConfirm,
  onClose,
}: {
  orderNumber: string;
  busy: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [choice, setChoice] = useState(REASONS[0]);
  const [other, setOther] = useState("");

  const isOther = choice === "Something else";
  const reason = isOther ? other.trim() : choice;
  const tooShort = isOther && reason.length < 3;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Cancel order ${orderNumber}`}
    >
      <div className="my-auto w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-lg">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-destructive/10">
            <AlertTriangle className="size-4 text-destructive" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold">
              Cancel order {orderNumber}?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The shop is told and the items go back on sale. This cannot be
              undone — you would need to order again.
            </p>
          </div>
        </div>

        <fieldset className="mt-4">
          <legend className="text-sm font-medium">Why are you cancelling?</legend>
          <div className="mt-2 space-y-1.5">
            {REASONS.map((r) => (
              <label
                key={r}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition hover:bg-muted"
              >
                <input
                  type="radio"
                  name="cancel-reason"
                  value={r}
                  checked={choice === r}
                  onChange={() => setChoice(r)}
                  disabled={busy}
                  className="size-4 accent-primary"
                />
                {r}
              </label>
            ))}
          </div>

          {isOther && (
            <input
              autoFocus
              value={other}
              onChange={(e) => setOther(e.target.value)}
              disabled={busy}
              placeholder="Tell the shop why"
              aria-label="Reason for cancelling"
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          )}
        </fieldset>

        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            disabled={busy}
            onClick={onClose}
          >
            Keep order
          </Button>
          <Button
            variant="destructive"
            className="rounded-xl"
            disabled={busy || tooShort}
            onClick={() => onConfirm(reason)}
          >
            {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Cancel order
          </Button>
        </div>
      </div>
    </div>
  );
}
