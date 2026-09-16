// What the shop's till sends, and what it refuses to send.
//
// The interesting claim is a negative one: the screen sends variants and
// quantities and nothing else. No price, no total, no discount — those are the
// server's, and a till that could post its own numbers would be a way for a
// shop to sell at a price the platform never agreed to.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fulfil = vi.fn(
  async (_input: {
    requestId: string;
    items: { variant_id: string; quantity: number }[];
  }) => ({
    order_id: "o1",
    order_number: "ORD1",
    total_amount: 210,
    order_amount: 200,
    delivery_fee: 10,
    items: [],
  }),
);
const decline = vi.fn(
  async (_input: { requestId: string; note: string }) => undefined,
);

vi.mock("@/features/shop-orders/hooks", () => ({
  useMyShops: () => ({
    data: [{ id: "s1", name: "Crust & Co" }],
    isPending: false,
  }),
}));

vi.mock("./hooks", async () => {
  const actual = await vi.importActual<typeof import("./hooks")>("./hooks");
  return {
    ...actual,
    useShopOrderRequests: () => ({
      data: {
        data: [
          {
            id: "r1",
            status: "pending",
            images: [{ url: "http://img/list.png", alt_text: "list" }],
            note: "ripe bananas please",
            decline_note: null,
            delivery_address: {
              address_line: "3 Elm St",
              city: "Town",
              pincode: "123456",
            },
            shop: { id: "s1", name: "Crust & Co" },
            customer: { id: "c1", name: "Asha R", phone: "9990001111" },
            order: null,
            created_at: new Date().toISOString(),
            handled_at: null,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        pages: 1,
        pending: 1,
      },
      isPending: false,
      isFetching: false,
      refetch: vi.fn(),
    }),
    useShopCatalogue: () => ({
      data: [
        {
          id: "v1",
          product_id: "p1",
          name: "500 g",
          product_name: "Atta",
          sku: "A1",
          unit: "kg",
          price: 100,
          stock_quantity: 4,
          is_available: true,
        },
        {
          id: "v2",
          product_id: "p2",
          name: "1 L",
          product_name: "Milk",
          sku: "M1",
          unit: "litre",
          price: 60,
          stock_quantity: 0,
          is_available: true,
        },
      ],
      isPending: false,
    }),
    useFulfilOrderRequest: () => ({ mutateAsync: fulfil, isPending: false }),
    useDeclineOrderRequest: () => ({ mutateAsync: decline, isPending: false }),
  };
});

import { ShopOrderRequestsView } from "./ShopOrderRequestsView";

const wrap = (ui: ReactNode) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

const openTill = async () => {
  fireEvent.click(screen.getByRole("button", { name: /set up the order/i }));
  await screen.findByPlaceholderText(/atta, milk, dal/i);
};

beforeEach(() => {
  fulfil.mockClear();
  decline.mockClear();
});

describe("the shop's photo-order queue", () => {
  it("shows who sent it, where it goes and what they said", () => {
    wrap(<ShopOrderRequestsView />);

    expect(screen.getByText("Asha R")).toBeInTheDocument();
    expect(screen.getByText(/3 Elm St, Town, 123456/)).toBeInTheDocument();
    expect(screen.getByText(/ripe bananas please/)).toBeInTheDocument();
    // The photo is a link, because reading handwriting at thumbnail size is
    // the one thing this screen must not force.
    expect(screen.getByRole("link", { name: "list" })).toHaveAttribute(
      "href",
      "http://img/list.png",
    );
  });

  it("sends variants and quantities, and nothing else", async () => {
    wrap(<ShopOrderRequestsView />);
    await openTill();

    fireEvent.click(screen.getByRole("button", { name: /Atta/ }));
    fireEvent.click(screen.getByRole("button", { name: "One more" }));
    fireEvent.click(screen.getByRole("button", { name: /place this order/i }));

    await waitFor(() => expect(fulfil).toHaveBeenCalled());
    expect(fulfil.mock.calls[0][0]).toEqual({
      requestId: "r1",
      items: [{ variant_id: "v1", quantity: 2 }],
    });
  });

  it("will not let the shop add something it has run out of", async () => {
    wrap(<ShopOrderRequestsView />);
    await openTill();

    expect(screen.getByRole("button", { name: /Milk/ })).toBeDisabled();
  });

  it("stops the quantity at what is on the shelf", async () => {
    wrap(<ShopOrderRequestsView />);
    await openTill();

    fireEvent.click(screen.getByRole("button", { name: /Atta/ }));
    const more = screen.getByRole("button", { name: "One more" });
    for (let i = 0; i < 3; i += 1) fireEvent.click(more);

    // Four in stock, so four is as far as it goes.
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(more).toBeDisabled();
  });

  it("calls the goods figure an estimate, because the total is the server's", async () => {
    wrap(<ShopOrderRequestsView />);
    await openTill();
    fireEvent.click(screen.getByRole("button", { name: /Atta/ }));

    expect(
      screen.getByText(/before discounts and delivery/i),
    ).toBeInTheDocument();
  });

  it("tells the shopkeeper what to collect at the door", async () => {
    wrap(<ShopOrderRequestsView />);
    await openTill();
    fireEvent.click(screen.getByRole("button", { name: /Atta/ }));

    expect(screen.getByText(/cash on delivery/i)).toBeInTheDocument();
  });

  it("insists on a reason before declining", async () => {
    wrap(<ShopOrderRequestsView />);
    await openTill();

    fireEvent.click(screen.getByRole("button", { name: /cannot fill this/i }));
    const send = screen.getByRole("button", { name: /send that/i });
    expect(send).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/tell them why/i), {
      target: { value: "Out of most of this today." },
    });
    fireEvent.click(screen.getByRole("button", { name: /send that/i }));

    await waitFor(() => expect(decline).toHaveBeenCalled());
    expect(decline.mock.calls[0][0]).toEqual({
      requestId: "r1",
      note: "Out of most of this today.",
    });
  });
});
