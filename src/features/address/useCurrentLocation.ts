"use client";

import { useState } from "react";
import { checkoutApi } from "@/features/checkout/api";
import type { ResolvedLocation } from "@/lib/api/schemas/address";

/**
 * Ask the device where it is, then ask the backend what is there.
 *
 * Every branch here ends in a sentence a customer can act on. Geolocation fails
 * in several ways that are not the customer's fault and not each other — a
 * refused permission, a device with no fix, a page served over plain http — and
 * "Could not get your location" for all of them leaves someone toggling the
 * wrong setting.
 */

const GEO_OPTIONS: PositionOptions = {
  // Worth the extra second and the battery: a coarse fix from a wifi lookup can
  // land a suburb away, which is a wrong pincode and so a wrong delivery fee.
  enableHighAccuracy: true,
  timeout: 15_000,
  // A fix from the last minute is fine and instant. Older than that and the
  // customer may have moved since.
  maximumAge: 60_000,
};

function messageFor(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "Location is blocked for this site. Allow it in your browser's address bar, or type the address instead.";
    case err.POSITION_UNAVAILABLE:
      return "Your device could not get a location fix. Try again near a window, or type the address instead.";
    case err.TIMEOUT:
      return "Locating took too long. Try again, or type the address instead.";
    default:
      return "Could not get your location. Type the address instead.";
  }
}

/** Promise wrapper: the callback API cannot be awaited, and this reads better. */
function currentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, GEO_OPTIONS);
  });
}

export function useCurrentLocation() {
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locate = async (): Promise<ResolvedLocation | null> => {
    setError(null);

    // Browsers only expose geolocation over https (localhost excepted). Checked
    // up front because otherwise the API is simply absent, and "your browser
    // does not support this" is the wrong thing to tell someone whose browser
    // supports it fine.
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setError(
        "Location needs a secure (https) connection. Type the address instead.",
      );
      return null;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("This browser cannot share a location. Type the address instead.");
      return null;
    }

    setIsLocating(true);
    try {
      const pos = await currentPosition();
      return await checkoutApi.reverseGeocode(
        pos.coords.latitude,
        pos.coords.longitude,
      );
    } catch (err) {
      // A GeolocationPositionError is not an Error and fails instanceof, so it
      // is identified by its own shape.
      if (err && typeof err === "object" && "code" in err && "PERMISSION_DENIED" in err) {
        setError(messageFor(err as GeolocationPositionError));
      } else {
        // The lookup itself failed. The API's message already says what to do.
        setError(
          err instanceof Error && err.message
            ? err.message
            : "Could not look up your location. Type the address instead.",
        );
      }
      return null;
    } finally {
      setIsLocating(false);
    }
  };

  return { locate, isLocating, error, clearError: () => setError(null) };
}
