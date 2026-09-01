import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
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
  catalogApi: { getServiceability: vi.fn() },
}));

import { catalogApi } from "./api";
import { DeliverableSections } from "./DeliverableSections";

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

const show = () =>
  render(
    <DeliverableSections>
      <p>PRODUCTS</p>
    </DeliverableSections>,
    { wrapper },
  );

beforeEach(() => {
  selected = undefined;
  vi.mocked(catalogApi.getServiceability).mockReset();
});

describe("a pincode nobody delivers to", () => {
  it("shows the notice and no products", async () => {
    selected = addr("999888");
    vi.mocked(catalogApi.getServiceability).mockResolvedValue({
      pincode: "999888",
      serviceable: false,
      shop_count: 0,
    });

    show();

    await waitFor(() => {
      expect(screen.getByText(/don't deliver to 999888/i)).toBeInTheDocument();
    });
    // The whole point: not one product on the page.
    expect(screen.queryByText("PRODUCTS")).not.toBeInTheDocument();
  });

  it("names the pincode, since several addresses may be saved", async () => {
    selected = addr("999888");
    vi.mocked(catalogApi.getServiceability).mockResolvedValue({
      pincode: "999888",
      serviceable: false,
      shop_count: 0,
    });

    show();

    await waitFor(() =>
      expect(screen.getByText(/999888/)).toBeInTheDocument(),
    );
  });
});

describe("a pincode we do deliver to", () => {
  it("shows the products", async () => {
    selected = addr("560001");
    vi.mocked(catalogApi.getServiceability).mockResolvedValue({
      pincode: "560001",
      serviceable: true,
      shop_count: 3,
    });

    show();

    await waitFor(() =>
      expect(screen.getByText("PRODUCTS")).toBeInTheDocument(),
    );
  });
});

describe("before the answer arrives", () => {
  it("shows neither the products nor the notice", async () => {
    // A flash of products on a pincode we do not serve is a row of things the
    // customer cannot buy; a flash of "we do not deliver here" on one we do
    // serve is worse still. Neither, until the API has said.
    selected = addr("560001");
    vi.mocked(catalogApi.getServiceability).mockImplementation(
      () => new Promise(() => {}),
    );

    show();

    expect(screen.queryByText("PRODUCTS")).not.toBeInTheDocument();
    expect(screen.queryByText(/don't deliver/i)).not.toBeInTheDocument();
  });
});

describe("when the check itself fails", () => {
  it("shows the products rather than blacking out the shop", async () => {
    // `notDeliverable` is not the opposite of `serviceable` — it is only true
    // when the API actually said no. A failed check must not close the store;
    // the pincode filter still applies to the products underneath.
    selected = addr("560001");
    vi.mocked(catalogApi.getServiceability).mockRejectedValue(
      new Error("network"),
    );

    show();

    await waitFor(() =>
      expect(screen.getByText("PRODUCTS")).toBeInTheDocument(),
    );
  });
});

describe("with no address selected", () => {
  it("shows the products", async () => {
    // A signed-out visitor browses everything; there is no pincode to check.
    show();

    await waitFor(() =>
      expect(screen.getByText("PRODUCTS")).toBeInTheDocument(),
    );
    expect(catalogApi.getServiceability).not.toHaveBeenCalled();
  });
});
