"use client";

import { Loader2, LocateFixed } from "lucide-react";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { AddressForm } from "@/features/checkout/AddressForm";
import { checkoutApi } from "@/features/checkout/api";
import type { Address, AddressInput } from "@/lib/api/schemas/address";
import { useCurrentLocation } from "./useCurrentLocation";

// Leaflet touches `window` while it loads, so the map may only exist on the
// client. A plain import would break the server render of every page this
// appears on — which is now the account page as well as the header dialog.
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
 * The map, the locate button and the address fields, wired together.
 *
 * Shared by adding and editing rather than duplicated: an address saved with a
 * pin could not be corrected without one, so the map was reachable exactly once
 * in a saved address's life — at the moment it was created, which is the moment
 * the customer knows least about whether it is right.
 *
 * Editing seeds the pin from the saved coordinates, so the map opens on the
 * door the customer chose rather than on a country-wide view.
 *
 * The sync runs one way only: moving the pin rewrites the address fields, and
 * editing the fields does NOT move the pin. Geocoding forwards from half-typed
 * text would move it on nearly every keystroke. The pin is the authority on
 * where; the text is what the courier reads.
 */
export function AddressEditor({
  address,
  prefill: initialPrefill,
  onDone,
}: {
  /** Present when editing a saved address; absent when adding a new one. */
  address?: Address;
  /** A fix already taken — what "use my current location" resolved to. */
  prefill?: Partial<AddressInput>;
  onDone: () => void;
}) {
  const [prefill, setPrefill] = useState<Partial<AddressInput> | undefined>(
    () =>
      initialPrefill ??
      // A saved pin, so editing opens on it. Only the coordinates — the text
      // fields come from `address` through the form's own defaults, and
      // repeating them here would be two sources for one value.
      (address?.lat != null && address?.lng != null
        ? { lat: address.lat, lng: address.lng }
        : undefined),
  );
  const [resolving, setResolving] = useState(false);
  const [pinNote, setPinNote] = useState<string | null>(null);
  const { locate, isLocating, error: locationError } = useCurrentLocation();

  // Guards against an earlier lookup landing after a later one and overwriting
  // it with a stale answer — easy to hit by dragging the pin twice quickly.
  const requestSeq = useRef(0);

  /** The pin moved: adopt the coordinate, then fill the text from it. */
  const handlePin = async (lat: number, lng: number) => {
    const seq = ++requestSeq.current;

    // Applied immediately. The fix is the thing being chosen, and it should not
    // appear to lag behind the pin while a lookup runs.
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
      setPinNote(
        "Could not name that spot. The pin is set; fill in the address below.",
      );
    } finally {
      if (seq === requestSeq.current) setResolving(false);
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {address
            ? "Drag the pin to correct where this address is."
            : "Drag the pin, or tap the map, to mark your door."}
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
        <AddressForm address={address} prefill={prefill} onDone={onDone} />
      </div>
    </div>
  );
}
