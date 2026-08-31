"use client";

import { Loader2, LocateFixed, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AddressForm } from "@/features/checkout/AddressForm";
import { checkoutApi } from "@/features/checkout/api";
import type { AddressInput } from "@/lib/api/schemas/address";
import { useCurrentLocation } from "./useCurrentLocation";

// Leaflet touches `window` while it loads, so the map may only exist on the
// client. Imported this way rather than guarded inside the component: a plain
// import would break the server render of every page carrying the header.
const LocationPickerMap = dynamic(
  () => import("./LocationPickerMap").then((m) => m.LocationPickerMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-56 w-full place-items-center rounded-xl bg-muted">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    ),
  },
);

/**
 * Adding an address: a map to place the pin, and the fields it resolves to.
 *
 * The two halves stay in step in one direction only — moving the pin rewrites
 * the address fields, and editing the fields does NOT move the pin. Geocoding
 * forwards from half-typed text would send the pin somewhere new on nearly
 * every keystroke, and a pin that jumps while you type is worse than one that
 * waits. The pin is the authority on where; the text is what the courier reads.
 *
 * Portalled to <body>: the header carries `backdrop-blur-md`, and an ancestor
 * with a backdrop-filter becomes the containing block for `position: fixed`
 * descendants — rendered in place, this is clipped to the height of the header
 * bar.
 */
export function AddAddressDialog({
  prefill: initialPrefill,
  onClose,
  onSaved,
}: {
  prefill?: Partial<AddressInput>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [prefill, setPrefill] = useState(initialPrefill);
  const [resolving, setResolving] = useState(false);
  const [pinNote, setPinNote] = useState<string | null>(null);
  const { locate, isLocating, error: locationError } = useCurrentLocation();

  // Guards against an earlier lookup landing after a later one and overwriting
  // it with a stale answer — easy to hit by dragging the pin twice quickly.
  const requestSeq = useRef(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  /** The pin moved: adopt the coordinate, then fill the text from it. */
  const handlePin = async (lat: number, lng: number) => {
    const seq = ++requestSeq.current;

    // The coordinate is applied immediately. The fix is the thing being chosen,
    // and it should not appear to lag behind the pin while a lookup runs.
    setPrefill((p) => ({ ...p, lat, lng }));
    setResolving(true);
    setPinNote(null);

    try {
      const resolved = await checkoutApi.reverseGeocode(lat, lng);
      if (seq !== requestSeq.current) return;
      setPrefill((p) => ({
        ...p,
        ...resolved,
        // The pin the customer placed, not the centre of whatever the geocoder
        // matched — those differ, and theirs is the one they meant.
        lat,
        lng,
      }));
    } catch {
      if (seq !== requestSeq.current) return;
      // The pin still counts. Only the text could not be filled in, and the
      // fields are editable — so this is a note, not a failure.
      setPinNote("Could not name that spot. The pin is set; fill in the address below.");
    } finally {
      if (seq === requestSeq.current) setResolving(false);
    }
  };

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

        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Drag the pin, or tap the map, to mark your door.
          </p>
          <button
            type="button"
            disabled={isLocating}
            onClick={async () => {
              const resolved = await locate();
              if (!resolved) return;
              setPinNote(null);
              setPrefill((p) => ({ ...p, ...resolved }));
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-primary transition hover:bg-muted disabled:opacity-60"
          >
            {isLocating ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <LocateFixed className="size-3.5" />
            )}
            {isLocating ? "Finding you…" : "Use my location"}
          </button>
        </div>

        <div className="relative">
          <LocationPickerMap
            lat={prefill?.lat}
            lng={prefill?.lng}
            onChange={handlePin}
          />
          {resolving && (
            <span className="pointer-events-none absolute right-2 top-2 z-[1] inline-flex items-center gap-1.5 rounded-lg bg-card/90 px-2 py-1 text-xs text-muted-foreground shadow">
              <Loader2 className="size-3.5 animate-spin" /> Looking up…
            </span>
          )}
        </div>

        {(locationError || pinNote) && (
          <p className="mt-2 text-xs text-destructive">
            {locationError ?? pinNote}
          </p>
        )}

        <div className="mt-3">
          <AddressForm prefill={prefill} onDone={onSaved} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
