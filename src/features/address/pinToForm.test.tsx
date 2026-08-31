import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The map is client-only and irrelevant here: these cover the wiring between a
// pin and the fields, so it is replaced by a button that reports a coordinate.
vi.mock("./LocationPickerMap", () => ({
  LocationPickerMap: ({
    onChange,
  }: {
    onChange: (lat: number, lng: number) => void;
  }) => (
    <button type="button" onClick={() => onChange(12.9716, 77.5946)}>
      move pin
    </button>
  ),
}));
vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<unknown>) => {
    // next/dynamic would defer past the assertions; the mocked module is
    // already synchronous, so it is unwrapped directly.
    void loader;
    return function Stub(props: { onChange: (lat: number, lng: number) => void }) {
      return (
        <button type="button" onClick={() => props.onChange(12.9716, 77.5946)}>
          move pin
        </button>
      );
    };
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/features/checkout/api", () => ({
  checkoutApi: { reverseGeocode: vi.fn(), addAddress: vi.fn() },
}));
vi.mock("./useCurrentLocation", () => ({
  useCurrentLocation: () => ({
    locate: vi.fn(),
    isLocating: false,
    error: null,
    clearError: vi.fn(),
  }),
}));

import { checkoutApi } from "@/features/checkout/api";
import { AddAddressDialog } from "./AddAddressDialog";

const RESOLVED = {
  address_line: "12 MG Road",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
  country: "India",
  lat: 12.9716,
  lng: 77.5946,
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
);

const open = () =>
  render(<AddAddressDialog onClose={() => {}} onSaved={() => {}} />, {
    wrapper,
  });

beforeEach(() => {
  vi.mocked(checkoutApi.reverseGeocode).mockReset();
});

describe("moving the pin", () => {
  it("fills the address fields from where the pin landed", async () => {
    vi.mocked(checkoutApi.reverseGeocode).mockResolvedValue(RESOLVED);
    open();

    fireEvent.click(screen.getByText("move pin"));

    // defaultValues are read once at mount, so a pin moved afterwards only
    // reaches the boxes if the form is told — without that the map and the
    // fields drift apart, which is worse than having no map.
    await waitFor(() => {
      expect(screen.getByLabelText("City")).toHaveValue("Bengaluru");
    });
    expect(screen.getByLabelText("Pincode")).toHaveValue("560001");
    expect(screen.getByLabelText("Address")).toHaveValue("12 MG Road");
  });

  it("keeps a name already typed", async () => {
    vi.mocked(checkoutApi.reverseGeocode).mockResolvedValue(RESOLVED);
    open();

    const name = screen.getByLabelText("Full name") as HTMLInputElement;
    fireEvent.change(name, { target: { value: "Asha" } });

    fireEvent.click(screen.getByText("move pin"));

    await waitFor(() => {
      expect(screen.getByLabelText("City")).toHaveValue("Bengaluru");
    });
    // A geocoder knows nothing about who lives there. `reset()` would have
    // taken this with it.
    expect(name).toHaveValue("Asha");
  });

  it("says so when the spot cannot be named, without losing the pin", async () => {
    vi.mocked(checkoutApi.reverseGeocode).mockRejectedValue(new Error("nope"));
    open();

    fireEvent.click(screen.getByText("move pin"));

    await waitFor(() => {
      expect(screen.getByText(/could not name that spot/i)).toBeInTheDocument();
    });
    // The fields stay editable, so a failed lookup is a note rather than a
    // dead end.
    expect(screen.getByLabelText("City")).toBeEnabled();
  });

  it("ignores a slow lookup that lands after a newer one", async () => {
    // Two drags in quick succession. The first reply arriving last would
    // otherwise overwrite the second with a stale address while the pin sits
    // somewhere else entirely.
    let resolveFirst: (v: typeof RESOLVED) => void = () => {};
    vi.mocked(checkoutApi.reverseGeocode)
      .mockImplementationOnce(
        () => new Promise((res) => (resolveFirst = res)),
      )
      .mockResolvedValueOnce({ ...RESOLVED, city: "Mysuru", pincode: "570001" });

    open();
    fireEvent.click(screen.getByText("move pin")); // slow one
    fireEvent.click(screen.getByText("move pin")); // fast one

    await waitFor(() => {
      expect(screen.getByLabelText("City")).toHaveValue("Mysuru");
    });

    // The stale reply, arriving late.
    await act(async () => {
      resolveFirst(RESOLVED);
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(screen.getByLabelText("City")).toHaveValue("Mysuru");
  });
});
