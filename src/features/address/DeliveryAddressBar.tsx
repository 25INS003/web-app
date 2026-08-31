"use client";

import {
  Check,
  ChevronDown,
  Loader2,
  LocateFixed,
  MapPin,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AddAddressDialog } from "./AddAddressDialog";
import { useIsAuthed, useUserRole } from "@/features/auth/useAuth";
import type { AddressInput } from "@/lib/api/schemas/address";
import { useCurrentLocation } from "./useCurrentLocation";
import { cn } from "@/lib/utils";
import { formatAddressLine, useSelectedAddress } from "./useSelectedAddress";

/**
 * Where the order is going, in the header, on every page.
 *
 * The address used to be visible only on checkout, which is the last moment it
 * can still be wrong — a basket filled against the wrong city is discovered
 * after the shopping, not before. Putting it in the header makes it a standing
 * fact about the session instead of a checkout field.
 *
 * Rendered signed-out as well, as a prompt rather than a picker: an empty slot
 * that appears on sign-in moves the rest of the header down, and the answer to
 * "where do you deliver to" should not be blank.
 */
export function DeliveryAddressBar() {
  const authed = useIsAuthed();
  const role = useUserRole();
  const { addresses, selected, select, isPending } = useSelectedAddress();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [prefill, setPrefill] = useState<Partial<AddressInput> | undefined>();
  const { locate, isLocating, error: locationError } = useCurrentLocation();
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on a click anywhere else, and on Escape. Both are how a dropdown is
  // expected to behave; without them the panel follows you to the next page.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Every address endpoint is behind validateUserType(["customer"]), so for an
  // admin or a shop owner browsing the storefront this control can only ever
  // 403 — a picker that cannot pick. Signed-out visitors still get the prompt:
  // they are prospective customers, and the answer to "where do you deliver to"
  // should not be blank.
  if (authed && role && role !== "customer") return null;

  if (!authed) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="size-4 shrink-0 text-primary" />
        <span className="hidden sm:inline">Deliver to</span>
        <Link
          href="/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in to set your address
        </Link>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        data-testid="delivery-address-trigger"
        className="flex max-w-full items-center gap-1.5 rounded-lg px-1.5 py-1 text-sm transition hover:bg-muted"
      >
        <MapPin className="size-4 shrink-0 text-primary" />
        <span className="shrink-0 text-muted-foreground">Deliver to</span>
        <span className="min-w-0 truncate font-medium">
          {isPending
            ? "…"
            : selected
              ? `${selected.tag ?? selected.label ?? "Address"} · ${selected.pincode}`
              : "Add an address"}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Saved delivery addresses"
          className="absolute left-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
        >
          <div className="max-h-72 overflow-y-auto p-1.5">
            {addresses.length === 0 && !isPending && (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                No saved addresses yet.
              </p>
            )}

            {addresses.map((a) => {
              const isSelected = selected?.id === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-testid="delivery-address-option"
                  onClick={() => {
                    select(a.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left transition",
                    isSelected ? "bg-primary/5" : "hover:bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border",
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border",
                    )}
                  >
                    {isSelected && <Check className="size-3" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold capitalize">
                      {a.tag ?? a.label ?? "Address"}
                      {a.is_default && (
                        <span className="ml-1.5 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          Default
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {formatAddressLine(a)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-border p-1.5">
            {/* Offered above "add by hand", and offered whether or not anything
                is saved: it is the shortest route to a correct pincode, and a
                pincode typed from memory is the field people get wrong. */}
            <button
              type="button"
              disabled={isLocating}
              onClick={async () => {
                const resolved = await locate();
                if (!resolved) return; // the hook holds the reason
                setPrefill({
                  address_line: resolved.address_line,
                  city: resolved.city,
                  state: resolved.state,
                  pincode: resolved.pincode,
                  country: resolved.country,
                  lat: resolved.lat,
                  lng: resolved.lng,
                });
                setAdding(true);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-xl p-2.5 text-sm font-medium text-primary transition hover:bg-muted disabled:opacity-60"
            >
              {isLocating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LocateFixed className="size-4" />
              )}
              {isLocating ? "Finding you…" : "Use my current location"}
            </button>

            {locationError && (
              <p className="px-2.5 pb-1.5 text-xs text-destructive">
                {locationError}
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                setPrefill(undefined);
                setAdding(true);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-xl p-2.5 text-sm font-medium text-primary transition hover:bg-muted"
            >
              <Plus className="size-4" /> Add a new address
            </button>
          </div>
        </div>
      )}

      {adding && (
        <AddAddressDialog
          prefill={prefill}
          onClose={() => setAdding(false)}
          onSaved={() => setAdding(false)}
        />
      )}
    </div>
  );
}
