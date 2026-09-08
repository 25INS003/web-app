import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The dashboard's "Shops awaiting approval" card, and where it lands.
 *
 * It links to /admin/shops?status=pending, but the page held its filter in
 * plain state initialised to "all" and never read the URL — so the link was
 * silently ignored. An admin clicked a count of shops waiting for them and got
 * every shop on the platform, with nothing to say the filter had been dropped.
 *
 * The sibling list (shop-owners) had the opposite fault: it read the param and
 * then hid everything else without saying so. Both cards now behave alike.
 */

const push = vi.fn();
let query = "";

const SHOPS = [
  { id: "s1", name: "Waiting Mart", shop_status: "pending", owner_id: "o1" },
  { id: "s2", name: "Live Mart", shop_status: "active", owner_id: "o1" },
  { id: "s3", name: "Closed Mart", shop_status: "inactive", owner_id: "o2" },
];

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/admin/shops",
  useSearchParams: () => new URLSearchParams(query),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/store/adminShopStore", () => ({
  useAdminShopStore: () => ({
    shops: SHOPS,
    fetchAllShops: vi.fn(),
    updateShopStatus: vi.fn(),
    isLoading: false,
  }),
}));

const { default: AdminShopsPage } = await import("./page");

beforeEach(() => {
  push.mockReset();
  query = "";
});

describe("the shops status filter", () => {
  it("honours the status the dashboard card links with", () => {
    query = "status=pending";
    render(<AdminShopsPage />);

    // The bug: this select sat on "all" however the page was reached.
    expect(screen.getByRole("combobox")).toHaveValue("pending");
  });

  it("shows every shop when no status is asked for", () => {
    render(<AdminShopsPage />);
    expect(screen.getByRole("combobox")).toHaveValue("all");
  });

  it("says how many shops the filter is hiding", () => {
    query = "status=pending";
    render(<AdminShopsPage />);

    // Watching the other shops vanish from a page titled "Shops", with
    // nothing accounting for them, is the complaint this answers.
    expect(screen.getByText(/2/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /show all 3/i }),
    ).toBeInTheDocument();
  });

  it("clears the filter through the URL, so Back undoes it", () => {
    query = "status=pending";
    render(<AdminShopsPage />);

    fireEvent.click(screen.getByRole("button", { name: /show all 3/i }));

    expect(push).toHaveBeenCalledWith("/admin/shops");
  });

  it("shows one owner's shops when asked for them", () => {
    // Where "View their shops" on the shop-owners list lands.
    query = "owner=o1";
    render(<AdminShopsPage />);

    expect(screen.getByText("Waiting Mart")).toBeInTheDocument();
    expect(screen.getByText("Live Mart")).toBeInTheDocument();
    expect(screen.queryByText("Closed Mart")).not.toBeInTheDocument();
  });

  it("says it is showing one owner, and offers the way out", () => {
    query = "owner=o1";
    render(<AdminShopsPage />);

    expect(screen.getByText(/shops of one owner/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /show all 3/i }));
    expect(push).toHaveBeenCalledWith("/admin/shops");
  });

  it("keeps the status filter alongside an owner filter", () => {
    query = "owner=o1&status=pending";
    render(<AdminShopsPage />);

    // Both narrow: owner o1 AND pending is only Waiting Mart.
    expect(screen.getByText("Waiting Mart")).toBeInTheDocument();
    expect(screen.queryByText("Live Mart")).not.toBeInTheDocument();
  });

  it("puts a chosen status into the URL", () => {
    render(<AdminShopsPage />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "approved" },
    });

    expect(push).toHaveBeenCalledWith("/admin/shops?status=approved");
  });
});
