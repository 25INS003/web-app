import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Bulk catalogue tools for an admin.
 *
 * A shop owner has exactly one catalogue this could mean; an admin has none by
 * default, so the shop is chosen first. What follows is the owner's own
 * `BulkTools` pointed at that shop rather than a second implementation, which
 * is what these assert — the picker hands over, it does not reimplement.
 */

const push = vi.fn();
let query = "";

const SHOPS = [
  { id: "s1", name: "Harvest Hub", city: "Jammu", email: "hh@example.com", shop_status: "active" },
  { id: "s2", name: "Corner Bakery", city: "Delhi", email: "cb@example.com", shop_status: "inactive" },
];

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/admin/bulk",
  useSearchParams: () => new URLSearchParams(query),
}));
vi.mock("@/store/adminShopStore", () => ({
  useAdminShopStore: () => ({
    shops: SHOPS,
    fetchAllShops: vi.fn(),
    isLoading: false,
  }),
}));
// The owner's screen is exercised by its own tests; here it only has to be
// handed the right shop.
vi.mock("@/features/bulk/BulkTools", () => ({
  BulkTools: ({ shopId, shopName }: { shopId: string; shopName?: string }) => (
    <div data-testid="bulk-tools">
      {shopId}
      {shopName ? ` — ${shopName}` : ""}
    </div>
  ),
}));

const { default: AdminBulkPage } = await import("./page");

beforeEach(() => {
  push.mockReset();
  query = "";
});

describe("choosing which shop to work on", () => {
  it("lists the shops when none is chosen", () => {
    render(<AdminBulkPage />);

    expect(screen.getByText("Harvest Hub")).toBeInTheDocument();
    expect(screen.getByText("Corner Bakery")).toBeInTheDocument();
    // Nothing to upload into until one is picked.
    expect(screen.queryByTestId("bulk-tools")).not.toBeInTheDocument();
  });

  it("puts the choice in the URL, so Back and a shared link both work", () => {
    render(<AdminBulkPage />);

    fireEvent.click(screen.getByText("Harvest Hub"));

    expect(push).toHaveBeenCalledWith("/admin/bulk?shop=s1");
  });

  it("hands the chosen shop to the owner's own tools", () => {
    query = "shop=s1";
    render(<AdminBulkPage />);

    // The same component a shop owner uses — the admin route must not grow a
    // parallel copy that drifts from it.
    expect(screen.getByTestId("bulk-tools")).toHaveTextContent(
      "s1 — Harvest Hub",
    );
  });

  it("filters the list by name, city or email", () => {
    render(<AdminBulkPage />);

    fireEvent.change(screen.getByLabelText(/search shops/i), {
      target: { value: "delhi" },
    });

    expect(screen.getByText("Corner Bakery")).toBeInTheDocument();
    expect(screen.queryByText("Harvest Hub")).not.toBeInTheDocument();
  });

  it("still offers a shop that is not active", () => {
    render(<AdminBulkPage />);

    // An inactive shop is one an admin may particularly need to fix in bulk,
    // so it is listed and labelled rather than hidden.
    expect(screen.getByText("Corner Bakery")).toBeInTheDocument();
    expect(screen.getByText("inactive")).toBeInTheDocument();
  });

  it("says so when nothing matches", () => {
    render(<AdminBulkPage />);

    fireEvent.change(screen.getByLabelText(/search shops/i), {
      target: { value: "zzz" },
    });

    expect(screen.getByText(/no shop matches/i)).toBeInTheDocument();
  });
});
