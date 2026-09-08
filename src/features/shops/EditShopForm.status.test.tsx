import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * The status shown on the edit-shop screen.
 *
 * Both places read `selectedShop.status`. The column is `shop_status` and has
 * never been called `status`, so both were `undefined` — and because each fell
 * back to "Active", a shop waiting for approval told its owner it was live.
 *
 * The same field drift as `main_image` / `main_image_url`, with the same
 * signature: no error anywhere, just a confident wrong answer. These read the
 * rendered badge because that is where the lie appeared.
 */

// One router object for the whole file. The form's seeding effect lists
// `router` in its dependencies, so a mock that built a fresh object per render
// would re-fire it forever — the hook returns a stable reference in the app.
const router = { push: vi.fn(), back: vi.fn(), replace: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// The component is untyped JSX, so the dynamic import gives TS nothing useful
// to check props against. Cast once here rather than annotating a file that
// has no types to begin with.
const { EditShopForm } = (await import("./EditShopForm")) as any;

const shopWith = (shop_status: string) => ({
  id: "s1",
  name: "Corner Store",
  shop_status,
  phone: "9100000000",
  email: "s@example.com",
  city: "Jammu",
  state: "JK",
  address_line: "1 St",
  pincode: "180001",
  opening_time: "09:00",
  closing_time: "21:00",
  total_products: 0,
  total_orders: 0,
});

// Hoisted, not inline. The form's seeding effect depends on `shops`, so a
// fresh array literal on every render re-fires it forever — in the app the
// reference comes from the store and is stable.
const renderFor = (shop_status: string) => {
  const shops = [shopWith(shop_status)];
  return render(
    <EditShopForm
      shopId="s1"
      shops={shops}
      isLoading={false}
      fetchShops={vi.fn()}
      saveShop={vi.fn()}
      backHref="/myshop"
    />,
  );
};

describe("the status on the edit-shop screen", () => {
  it("does not call a pending shop active", () => {
    renderFor("pending");

    // The reported bug, exactly: opening a shop awaiting approval and being
    // told it was live.
    expect(screen.queryByText("ACTIVE")).not.toBeInTheDocument();
    // Both places that read the field: the header badge and the stats tile.
    // Both said "Active" before, and both are asserted so a fix to one does
    // not leave the other lying.
    expect(screen.getByText("AWAITING APPROVAL")).toBeInTheDocument();
    expect(screen.getByText("Awaiting approval")).toBeInTheDocument();
  });

  it("still says active for a shop that is", () => {
    renderFor("active");

    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
  });

  it("reports an inactive shop as inactive", () => {
    renderFor("inactive");

    expect(screen.getByText("INACTIVE")).toBeInTheDocument();
    expect(screen.queryByText("ACTIVE")).not.toBeInTheDocument();
  });
});
