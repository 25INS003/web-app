import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Address } from "@/lib/api/schemas/address";

let selected: Address | undefined;

vi.mock("@/features/address/useSelectedAddress", () => ({
  useSelectedAddress: () => ({
    addresses: selected ? [selected] : [],
    selected,
    orderAddressId: selected?.id ?? null,
    select: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("./api", () => ({
  catalogApi: {
    getProducts: vi.fn(async () => ({ data: [], total: 0, page: 1, pages: 1 })),
  },
}));

import { catalogApi } from "./api";
import { useProducts } from "./hooks";

const addr = (pincode: string): Address => ({
  id: `a-${pincode}`,
  address_line: "12 MG Road",
  city: "Bengaluru",
  state: "Karnataka",
  pincode,
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
);

const lastQuery = () =>
  vi.mocked(catalogApi.getProducts).mock.calls.at(-1)?.[0] ?? {};

beforeEach(() => {
  selected = undefined;
  vi.mocked(catalogApi.getProducts).mockClear();
});

describe("the catalogue is filtered to where you are", () => {
  it("sends the selected address's pincode", async () => {
    // Added by the hook rather than by each caller: it is not a filter chosen
    // from a panel, it is a fact about where the customer is, and a call site
    // that forgets it offers products that cannot be delivered.
    selected = addr("560001");
    renderHook(() => useProducts({}), { wrapper });

    await waitFor(() => expect(catalogApi.getProducts).toHaveBeenCalled());
    expect(lastQuery()).toMatchObject({ pincode: "560001" });
  });

  it("sends no pincode when no address is selected", async () => {
    // A signed-out visitor gets the whole catalogue. Sending `undefined` would
    // be harmless, but an absent key is what "unfiltered" means to the API.
    renderHook(() => useProducts({}), { wrapper });

    await waitFor(() => expect(catalogApi.getProducts).toHaveBeenCalled());
    expect(lastQuery()).not.toHaveProperty("pincode");
  });

  it("keeps the caller's own filters alongside it", async () => {
    selected = addr("560001");
    renderHook(() => useProducts({ search: "milk", category: "c1" }), {
      wrapper,
    });

    await waitFor(() => expect(catalogApi.getProducts).toHaveBeenCalled());
    expect(lastQuery()).toMatchObject({
      search: "milk",
      category: "c1",
      pincode: "560001",
    });
  });

  it("refetches when the address changes", async () => {
    // The pincode is part of the query key. Without that, switching address in
    // the header leaves the previous area's products on screen — which reads as
    // the filter not working at all.
    selected = addr("560001");
    const { rerender } = renderHook(() => useProducts({}), { wrapper });
    await waitFor(() => expect(catalogApi.getProducts).toHaveBeenCalled());

    selected = addr("110001");
    rerender();

    await waitFor(() => {
      expect(lastQuery()).toMatchObject({ pincode: "110001" });
    });
    expect(vi.mocked(catalogApi.getProducts).mock.calls.length).toBeGreaterThan(
      1,
    );
  });
});
