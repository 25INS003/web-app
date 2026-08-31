"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ShopOrder } from "@/lib/api/schemas/shopOrder";

/**
 * Cancelling one of the shop's orders, with the note that goes to the customer.
 *
 * The note is required, and required HERE as well as on the server: the API
 * refuses a cancellation without one, so a dialog that let the button be
 * pressed empty would spend a round trip to say what the form already knew.
 *
 * It is not a private annotation. The customer reads it on their own order and
 * an admin reads it on the platform order list, which is worth stating on the
 * form — a shopkeeper typing "cba today" into a box labelled only "reason"
 * has not been told who sees it.
 */
export function CancelOrderDialog({
  order,
  busy,
  onConfirm,
  onClose,
}: {
  order: ShopOrder;
  busy: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  const trimmed = reason.trim();
  const tooShort = trimmed.length < 3;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Cancel order ${order.order_number}`}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-lg">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-destructive/10">
            <AlertTriangle className="size-4 text-destructive" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold">
              Cancel order {order.order_number}?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The items go back into your stock and the customer is told. This
              cannot be undone.
            </p>
          </div>
        </div>

        <label className="mt-4 block">
          <span className="text-sm font-medium">
            Why are you cancelling?{" "}
            <span className="text-destructive">*</span>
          </span>
          <textarea
            autoFocus
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onBlur={() => setTouched(true)}
            disabled={busy}
            placeholder="e.g. Out of stock — supplier delivery missed"
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            The customer sees this on their order, and so does the platform
            admin.
          </span>
          {touched && tooShort && (
            <span className="mt-1 block text-xs text-destructive">
              Please give a reason — a few words is enough.
            </span>
          )}
        </label>

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
            onClick={() => onConfirm(trimmed)}
          >
            {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Cancel order
          </Button>
        </div>
      </div>
    </div>
  );
}
