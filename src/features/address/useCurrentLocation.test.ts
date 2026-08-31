import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/checkout/api", () => ({
  checkoutApi: { reverseGeocode: vi.fn() },
}));

import { checkoutApi } from "@/features/checkout/api";
import { useCurrentLocation } from "./useCurrentLocation";

const RESOLVED = {
  address_line: "12 MG Road",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
  country: "India",
  lat: 12.9716,
  lng: 77.5946,
};

/** The codes a GeolocationPositionError carries, which is all we branch on. */
const geoError = (code: number) => ({
  code,
  message: "",
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
});

const stubGeolocation = (
  impl: (ok: PositionCallback, fail: PositionErrorCallback) => void,
) => {
  vi.stubGlobal("navigator", {
    geolocation: { getCurrentPosition: impl },
  });
};

beforeEach(() => {
  vi.stubGlobal("isSecureContext", true);
  vi.mocked(checkoutApi.reverseGeocode).mockReset();
});

afterEach(() => vi.unstubAllGlobals());

describe("using the device's location", () => {
  it("resolves a fix into address fields", async () => {
    stubGeolocation((ok) =>
      ok({ coords: { latitude: 12.9716, longitude: 77.5946 } } as never),
    );
    vi.mocked(checkoutApi.reverseGeocode).mockResolvedValue(RESOLVED);

    const { result } = renderHook(() => useCurrentLocation());
    let out;
    await act(async () => {
      out = await result.current.locate();
    });

    expect(out).toEqual(RESOLVED);
    expect(checkoutApi.reverseGeocode).toHaveBeenCalledWith(12.9716, 77.5946);
    expect(result.current.error).toBeNull();
  });

  it("stops before asking the device on an insecure page", async () => {
    // Browsers do not expose geolocation over plain http, so the API is simply
    // absent — and "your browser does not support this" is the wrong thing to
    // tell someone whose browser supports it fine. This is a real case: the app
    // is reachable over http on a LAN address in development.
    vi.stubGlobal("isSecureContext", false);
    const getCurrentPosition = vi.fn();
    stubGeolocation(getCurrentPosition);

    const { result } = renderHook(() => useCurrentLocation());
    await act(async () => {
      await result.current.locate();
    });

    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(result.current.error).toMatch(/https/i);
  });

  it.each([
    [1, /blocked/i, "a refused permission"],
    [2, /fix/i, "a device with no fix"],
    [3, /too long/i, "a timeout"],
  ])(
    "explains code %i distinctly (%s)",
    async (code, pattern) => {
      // Each of these needs a different action from the customer, so one shared
      // "could not get your location" would leave someone changing the wrong
      // setting.
      stubGeolocation((_ok, fail) => fail(geoError(code) as never));

      const { result } = renderHook(() => useCurrentLocation());
      await act(async () => {
        await result.current.locate();
      });

      expect(result.current.error).toMatch(pattern);
    },
  );

  it("always says what to do instead", async () => {
    // Whatever went wrong, the form still works — so no branch is a dead end.
    for (const code of [1, 2, 3]) {
      stubGeolocation((_ok, fail) => fail(geoError(code) as never));
      const { result } = renderHook(() => useCurrentLocation());
      await act(async () => {
        await result.current.locate();
      });
      expect(result.current.error).toMatch(/type the address/i);
    }
  });

  it("returns null on failure rather than a half-filled result", async () => {
    stubGeolocation((_ok, fail) => fail(geoError(1) as never));

    const { result } = renderHook(() => useCurrentLocation());
    let out;
    await act(async () => {
      out = await result.current.locate();
    });

    // The caller opens a prefilled form on a truthy result; anything else here
    // would open one filled with nothing.
    expect(out).toBeNull();
  });

  it("surfaces a lookup failure from our own backend", async () => {
    stubGeolocation((ok) =>
      ok({ coords: { latitude: 1, longitude: 2 } } as never),
    );
    vi.mocked(checkoutApi.reverseGeocode).mockRejectedValue(
      new Error("Could not reach the location service. Enter it by hand."),
    );

    const { result } = renderHook(() => useCurrentLocation());
    await act(async () => {
      await result.current.locate();
    });

    expect(result.current.error).toMatch(/by hand/i);
  });

  it("clears the spinner whether it worked or not", async () => {
    stubGeolocation((_ok, fail) => fail(geoError(2) as never));

    const { result } = renderHook(() => useCurrentLocation());
    await act(async () => {
      await result.current.locate();
    });

    // A button left disabled after a failure cannot be retried.
    expect(result.current.isLocating).toBe(false);
  });
});
