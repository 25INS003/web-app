import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * What an owner sees while a shop waits for approval.
 *
 * Every new shop starts `pending` now, so this is the first thing an owner
 * meets after creating one. It used to render as the bare word "pending" in
 * grey with nothing saying why the shop was not selling — and "Active Shops:
 * 0" beside "Total Shops: 1" with no account of the difference.
 */

let shops: Record<string, unknown>[] = [];

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/store/shopStore", () => ({
  useShopStore: () => ({
    myShops: shops,
    fetchMyShops: vi.fn(),
    deleteShop: vi.fn(),
    hardDeleteShop: vi.fn(),
    activateShop: vi.fn(),
    isLoading: false,
    error: null,
  }),
}));

const { default: MyShopPage } = await import("./page");

const shop = (over = {}) => ({
  id: "s1",
  name: "Corner Store",
  city: "Jammu",
  phone: "9100000000",
  total_products: 0,
  total_orders: 0,
  shop_status: "pending",
  ...over,
});

describe("a shop waiting for approval", () => {
  it("says it is awaiting approval, not just 'pending'", () => {
    shops = [shop()];
    render(<MyShopPage />);

    expect(screen.getByText(/awaiting approval/i)).toBeInTheDocument();
  });

  it("says customers cannot see it yet", () => {
    shops = [shop()];
    render(<MyShopPage />);

    // The part an owner actually needs: not the state's name, its consequence.
    expect(screen.getByText(/cannot see it or order from it yet/i)).toBeInTheDocument();
  });

  it("accounts for the gap between total and active shops", () => {
    shops = [shop()];
    render(<MyShopPage />);

    expect(
      screen.getByText(/1 shop is waiting for admin approval/i),
    ).toBeInTheDocument();
  });

  it("tells them they can still add products", () => {
    shops = [shop()];
    render(<MyShopPage />);

    // Otherwise the sensible reading is "there is nothing to do until someone
    // else acts", and the wait is dead time.
    expect(screen.getAllByText(/add products/i).length).toBeGreaterThan(0);
  });

  it("says nothing of the sort once the shop is live", () => {
    shops = [shop({ shop_status: "active" })];
    render(<MyShopPage />);

    expect(screen.queryByText(/awaiting approval/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/waiting for admin approval/i),
    ).not.toBeInTheDocument();
  });

  it("counts several waiting shops in the plural", () => {
    shops = [shop(), shop({ id: "s2", name: "Second Store" })];
    render(<MyShopPage />);

    expect(
      screen.getByText(/2 shops are waiting for admin approval/i),
    ).toBeInTheDocument();
  });
});
