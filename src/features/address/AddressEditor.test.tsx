import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Address } from "@/lib/api/schemas/address";

// The map is client-only and its internals are not what these cover. Replaced
// by a stub that reports the coordinates it was handed, so the seeding is
// observable.
const mapProps: { lat?: number; lng?: number }[] = [];

vi.mock("next/dynamic", () => ({
  default: () =>
    function MapStub(props: {
      lat?: number;
      lng?: number;
      onChange: (lat: number, lng: number) => void;
    }) {
      mapProps.push({ lat: props.lat, lng: props.lng });
      return (
        <button type="button" onClick={() => props.onChange(19.076, 72.8777)}>
          move pin
        </button>
      );
    },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/features/checkout/api", () => ({
  checkoutApi: { reverseGeocode: vi.fn(), updateAddress: vi.fn() },
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
import { AddressEditor } from "./AddressEditor";

const saved = (over: Partial<Address> = {}): Address => ({
  id: "a1",
  address_line: "12 MG Road",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
  contact_name: "Asha",
  contact_phone: "9876543210",
  tag: "home",
  ...over,
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
);

const lastMap = () => mapProps.at(-1) ?? {};

beforeEach(() => {
  mapProps.length = 0;
  vi.mocked(checkoutApi.reverseGeocode).mockReset();
});

describe("editing a saved address", () => {
  it("opens the map on the pin that was saved", () => {
    // Otherwise the map opens on the country-wide fallback and the customer has
    // to find their own door again to make a small correction.
    render(
      <AddressEditor address={saved({ lat: 12.9716, lng: 77.5946 })} onDone={() => {}} />,
      { wrapper },
    );

    expect(lastMap()).toEqual({ lat: 12.9716, lng: 77.5946 });
  });

  it("keeps the saved address text", () => {
    render(<AddressEditor address={saved()} onDone={() => {}} />, { wrapper });

    expect(screen.getByLabelText("City")).toHaveValue("Bengaluru");
    expect(screen.getByLabelText("Pincode")).toHaveValue("560001");
  });

  it("has no pin to seed when the address never had one", () => {
    // Most addresses were typed by hand and predate the map. The editor still
    // opens; the map simply starts unset so a pin can be dropped.
    render(<AddressEditor address={saved()} onDone={() => {}} />, { wrapper });

    expect(lastMap()).toEqual({ lat: undefined, lng: undefined });
  });

  it("does not treat a zero coordinate as no pin", () => {
    // 0° is the equator, and `lat != null` rather than a truthiness check is
    // what keeps it. The same falsy-zero shape the backend had.
    render(<AddressEditor address={saved({ lat: 0, lng: 0 })} onDone={() => {}} />, {
      wrapper,
    });

    expect(lastMap()).toEqual({ lat: 0, lng: 0 });
  });

  it("moves the pin and rewrites the address text", async () => {
    vi.mocked(checkoutApi.reverseGeocode).mockResolvedValue({
      address_line: "4 Marine Drive",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      country: "India",
      lat: 19.076,
      lng: 72.8777,
    });

    render(
      <AddressEditor address={saved({ lat: 12.9716, lng: 77.5946 })} onDone={() => {}} />,
      { wrapper },
    );

    fireEvent.click(screen.getByText("move pin"));

    await waitFor(() => {
      expect(screen.getByLabelText("City")).toHaveValue("Mumbai");
    });
    expect(screen.getByLabelText("Pincode")).toHaveValue("400001");
  });

  it("says the pin is being corrected, not placed", async () => {
    render(<AddressEditor address={saved()} onDone={() => {}} />, { wrapper });
    expect(screen.getByText(/correct where this address is/i)).toBeInTheDocument();
  });
});

describe("adding a new address", () => {
  it("starts with no pin", () => {
    render(<AddressEditor onDone={() => {}} />, { wrapper });
    expect(lastMap()).toEqual({ lat: undefined, lng: undefined });
  });

  it("starts from a fix already taken", () => {
    // "Use my current location" resolves before the dialog opens.
    render(
      <AddressEditor prefill={{ lat: 13.0827, lng: 80.2707 }} onDone={() => {}} />,
      { wrapper },
    );

    expect(lastMap()).toEqual({ lat: 13.0827, lng: 80.2707 });
  });
});
