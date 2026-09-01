"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { AddressInput } from "@/lib/api/schemas/address";
import { AddressEditor } from "./AddressEditor";

/**
 * Adding an address from the header, over the page.
 *
 * Chrome only — the map, the locate button and the fields live in
 * `AddressEditor`, which the account page's edit view uses too. They were the
 * same thing written once here, and an address could then be given a pin but
 * never have it corrected.
 *
 * Portalled to <body>: the header carries `backdrop-blur-md`, and an ancestor
 * with a backdrop-filter becomes the containing block for `position: fixed`
 * descendants — rendered in place, this is clipped to the height of the header
 * bar.
 */
export function AddAddressDialog({
  prefill,
  onClose,
  onSaved,
}: {
  prefill?: Partial<AddressInput>;
  onClose: () => void;
  onSaved: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // No mounted-guard around the portal: this renders only once someone has
  // clicked "Add a new address", so it never runs during SSR and document.body
  // is always there by the time it does.
  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Add a delivery address"
    >
      <div className="my-auto w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">
            {prefill?.lat !== undefined
              ? "Confirm your address"
              : "Add a delivery address"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <AddressEditor prefill={prefill} onDone={onSaved} />
      </div>
    </div>,
    document.body,
  );
}
