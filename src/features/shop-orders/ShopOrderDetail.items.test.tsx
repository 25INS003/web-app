import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * What a shop sees on the order it is about to pack.
 *
 * The line carried a name, a picture and two prices — everything except the
 * two facts a picking list exists for: which variant it is, and where it is
 * shelved. Finding the rack meant opening the catalogue in a second tab.
 *
 * The order line does not snapshot either, deliberately: it keeps the name and
 * the price as they were at checkout, so a past order still reads correctly.
 * The variant is looked up live, because "where is it now" is the question.
 */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/ProgressiveImage", () => ({
  ProgressiveImage: () => <div data-testid="image" />,
}));

const line = (over: Record<string, unknown> = {}) => ({
  product_id: "p1",
  variant_id: "v1",
  product_name: "Spinach",
  image_url: null,
  quantity: 2,
  unit_price: 120,
  total_price: 240,
  variant: {
    id: "v1",
    name: "1kg pack",
    sku: "SPIN-1KG",
    warehouse_location: "Aisle 3, Rack B",
    stock_quantity: 40,
    is_active: true,
    unit: "kg",
    per_unit_qty: 1,
    attributes: [{ name: "Size", value: "1kg" }],
  },
  ...over,
});

const ORDER = {
  id: "so1",
  shop_order_number: "SORD-1",
  order_status: "confirmed",
  payment_status: "paid",
  order_amount: 240,
  delivery_fee: 0,
  tax_amount: 0,
  discount_amount: 0,
  total_amount: 240,
  created_at: "2026-09-08T08:00:00.000Z",
  items: [line()],
  delivery_address_snapshot: {},
  customer: { first_name: "Ann", last_name: "Ali" },
  status_logs: [],
};

let order: Record<string, unknown> = ORDER;

vi.mock("./hooks", () => ({
  useShopOrder: () => ({ data: order, isLoading: false, isError: false }),
  useUpdateShopOrderStatus: () => ({ mutate: vi.fn(), isPending: false }),
  useAcceptShopOrders: () => ({ mutate: vi.fn(), isPending: false }),
  useMarkShopOrdersReady: () => ({ mutate: vi.fn(), isPending: false }),
  useCancelShopOrder: () => ({ mutate: vi.fn(), isPending: false }),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { ShopOrderDetail } = (await import("./ShopOrderDetail")) as any;

const show = () => render(<ShopOrderDetail shopId="s1" orderId="so1" />);

describe("an order line's packing details", () => {
  it("says where the item is shelved", () => {
    order = ORDER;
    show();

    expect(screen.getByText("Aisle 3, Rack B")).toBeInTheDocument();
  });

  it("shows the SKU to scan", () => {
    order = ORDER;
    show();

    expect(screen.getByText("SPIN-1KG")).toBeInTheDocument();
  });

  it("identifies the variant by its attributes", () => {
    order = ORDER;
    show();

    // "Size: 1kg" identifies the thing on the shelf better than a variant name
    // usually does.
    expect(screen.getByText(/Size: 1kg/)).toBeInTheDocument();
  });

  it("falls back to the variant name when it has no attributes", () => {
    order = { ...ORDER, items: [line({ variant: { ...line().variant, attributes: [] } })] };
    show();

    expect(screen.getByText(/1kg pack/)).toBeInTheDocument();
  });

  it("shows the stock left behind it", () => {
    order = ORDER;
    show();

    expect(screen.getByText(/40 in stock/)).toBeInTheDocument();
  });

  it("says so when no location has been set", () => {
    order = {
      ...ORDER,
      items: [line({ variant: { ...line().variant, warehouse_location: null } })],
    };
    show();

    // An empty space reads as "somewhere"; naming it makes it a thing to fix.
    expect(screen.getByText(/no location set/i)).toBeInTheDocument();
  });

  it("still renders a line whose variant is gone", () => {
    order = { ...ORDER, items: [line({ variant: null })] };
    show();

    // `variant_id` is ON DELETE SET NULL, so the line outlives its variant and
    // still has to be packable from what the line itself kept.
    expect(screen.getByText("Spinach")).toBeInTheDocument();
    expect(screen.getByText(/removed from the catalogue/i)).toBeInTheDocument();
    expect(screen.queryByText(/no location set/i)).not.toBeInTheDocument();
  });

  it("says nothing about variants on a line that never had one", () => {
    order = { ...ORDER, items: [line({ variant_id: null, variant: null })] };
    show();

    expect(
      screen.queryByText(/removed from the catalogue/i),
    ).not.toBeInTheDocument();
  });
});
