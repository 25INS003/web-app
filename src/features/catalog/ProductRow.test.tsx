import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Address } from "@/lib/api/schemas/address";

let selected: Address | undefined;
let rows: Array<Record<string, unknown>> = [];

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
    getProducts: vi.fn(async () => ({
      data: rows,
      total: rows.length,
      page: 1,
      pages: 1,
    })),
  },
}));

// The card's own rendering is covered by ProductCard.test.tsx, and its buttons
// pull in the cart and wishlist mutations. This file is about what the row asks
// for and whether it draws itself at all.
vi.mock("./ProductCard", () => ({
  ProductCard: ({ product }: { product: { name: string } }) => (
    <div data-testid="card">{product.name}</div>
  ),
}));

import { catalogApi } from "./api";
import { ProductRow } from "./ProductRow";

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
  rows = [{ id: "p1", name: "Butter", price: 150 }];
  vi.mocked(catalogApi.getProducts).mockClear();
});

describe("ProductRow", () => {
  it("asks for the row's own filters, and only as many as it shows", async () => {
    render(
      <ProductRow
        title="Best sellers"
        query={{ sort: "total_sold", order: "desc", in_stock: true }}
        limit={8}
      />,
      { wrapper },
    );

    await waitFor(() => expect(catalogApi.getProducts).toHaveBeenCalled());
    // `limit`, not a page of twenty trimmed to eight in the browser.
    expect(lastQuery()).toMatchObject({
      sort: "total_sold",
      order: "desc",
      in_stock: true,
      page: 1,
      limit: 8,
    });
  });

  it("carries the delivery pincode", async () => {
    // Through the shared hook, so a row cannot advertise a shop that does not
    // deliver to the address in the header.
    selected = {
      id: "a1",
      address_line: "12 MG Road",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
    };

    render(<ProductRow title="Under ₹99" query={{ max_price: 99 }} />, {
      wrapper,
    });

    await waitFor(() => expect(catalogApi.getProducts).toHaveBeenCalled());
    expect(lastQuery()).toMatchObject({ max_price: 99, pincode: "560001" });
  });

  it("renders the heading and a card for each product", async () => {
    render(<ProductRow title="Best sellers" query={{}} />, { wrapper });

    expect(await screen.findByText("Best sellers")).toBeInTheDocument();
    expect(await screen.findByTestId("card")).toHaveTextContent("Butter");
  });

  it("renders nothing at all when there is nothing to show", async () => {
    // A heading over an empty band reads as a broken page. Nothing under ₹99
    // being deliverable here is not news the visitor needs — the rows below
    // still have things to sell.
    rows = [];
    const { container } = render(
      <ProductRow title="Under ₹99" query={{ max_price: 99 }} />,
      { wrapper },
    );

    await waitFor(() => expect(catalogApi.getProducts).toHaveBeenCalled());
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it("hides the View all link when it has nowhere to point", async () => {
    render(<ProductRow title="Best sellers" query={{}} />, { wrapper });

    expect(await screen.findByText("Best sellers")).toBeInTheDocument();
    expect(screen.queryByText("View all")).not.toBeInTheDocument();
  });

  it("links View all where it was told to", async () => {
    render(
      <ProductRow title="Best sellers" query={{}} href="/search?sort=x" />,
      { wrapper },
    );

    expect(await screen.findByText("View all")).toHaveAttribute(
      "href",
      "/search?sort=x",
    );
  });
});
