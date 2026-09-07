import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The "Pending only" filter, and the way out of it.
 *
 * It seeded a `useState` from `?status=pending` and never wrote back, so the
 * URL and the list disagreed the moment anyone touched the button: Back walked
 * off the page instead of undoing the filter, a refresh silently re-applied a
 * filter that had been turned off, and a copied link carried the wrong view.
 * The comment above it claimed the opposite — that the state lived in the URL
 * precisely so the back button would behave.
 *
 * These assert on the URL rather than on the rendered rows, because the URL is
 * the thing that was wrong; the filtering itself always worked.
 */

const push = vi.fn();
let query = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/admin/shop-owners",
  useSearchParams: () => new URLSearchParams(query),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/store/adminShopownerStore", () => ({
  useShopOwnerStore: () => ({
    shopOwners: [
      {
        id: "o1",
        business_name: "Waiting Traders",
        is_approved: false,
        verification_status: "pending",
        user_id: { first_name: "Ann", last_name: "Ali" },
      },
      {
        id: "o2",
        business_name: "Live Grocers",
        is_approved: true,
        verification_status: "approved",
        user_id: { first_name: "Bo", last_name: "Bel" },
      },
    ],
    isLoading: false,
    fetchAllOwners: vi.fn(),
    approveOwner: vi.fn(),
  }),
}));

const { default: ShopOwnersPage } = await import("./page");

const toggle = () => screen.getByRole("button", { name: /pending/i });

beforeEach(() => {
  push.mockReset();
  query = "";
});

describe("the pending-only filter", () => {
  it("puts the filter in the URL when switched on", () => {
    render(<ShopOwnersPage />);

    fireEvent.click(toggle());

    // In the URL, so Back undoes it and a refresh keeps it.
    expect(push).toHaveBeenCalledWith("/admin/shop-owners?status=pending");
  });

  it("takes it back out again when switched off", () => {
    // Arriving from the dashboard's approval card, which links with the param.
    query = "status=pending";
    render(<ShopOwnersPage />);

    fireEvent.click(toggle());

    // The bug: this used to leave `?status=pending` in the address bar while
    // showing an unfiltered list, so a refresh re-filtered and Back left.
    expect(push).toHaveBeenCalledWith("/admin/shop-owners");
  });

  it("says how to get out once you are in", () => {
    query = "status=pending";
    render(<ShopOwnersPage />);

    // "Pending only" while already filtered names the state, not the way out
    // of it — which is what made a filtered list look like one with no way
    // back.
    expect(toggle()).toHaveTextContent(/show all/i);
  });

  it("offers the filter plainly when it is off", () => {
    render(<ShopOwnersPage />);

    expect(toggle()).toHaveTextContent(/pending only/i);
    expect(toggle()).not.toHaveTextContent(/show all/i);
  });

  it("tells a screen reader whether the list is filtered", () => {
    query = "status=pending";
    render(<ShopOwnersPage />);
    expect(toggle()).toHaveAttribute("aria-pressed", "true");
  });

  it("accounts for the owners it is hiding", () => {
    query = "status=pending";
    render(<ShopOwnersPage />);

    // The complaint this answers: clicking the dashboard's approval card made
    // every approved owner vanish from a page titled "Shop Owners", with
    // nothing saying they still existed.
    expect(screen.getByText(/hidden/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /show all 2/i }),
    ).toBeInTheDocument();
  });

  it("clears the filter from that notice too", () => {
    query = "status=pending";
    render(<ShopOwnersPage />);

    fireEvent.click(screen.getByRole("button", { name: /show all 2/i }));

    expect(push).toHaveBeenCalledWith("/admin/shop-owners");
  });

  it("keeps any other query params it did not put there", () => {
    query = "q=grocers";
    render(<ShopOwnersPage />);

    fireEvent.click(toggle());

    // Dropping a neighbour's param would lose whatever sent the admin here.
    expect(push).toHaveBeenCalledWith(
      "/admin/shop-owners?q=grocers&status=pending",
    );
  });
});
