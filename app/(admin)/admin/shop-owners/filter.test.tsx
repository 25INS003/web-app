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
      // Decided, not waiting. `!is_approved` is true of this owner, which is
      // exactly why counting on that boolean was wrong.
      {
        id: "o3",
        business_name: "Turned Down Ltd",
        is_approved: false,
        verification_status: "rejected",
        user_id: { first_name: "Cy", last_name: "Cor" },
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
      screen.getByRole("button", { name: /show all 3/i }),
    ).toBeInTheDocument();
  });

  it("clears the filter from that notice too", () => {
    query = "status=pending";
    render(<ShopOwnersPage />);

    fireEvent.click(screen.getByRole("button", { name: /show all 3/i }));

    expect(push).toHaveBeenCalledWith("/admin/shop-owners");
  });

  it("does not count a rejected owner as awaiting a decision", () => {
    render(<ShopOwnersPage />);

    // The reported symptom: the dashboard said 0 awaiting approval while this
    // badge said 1, because the dashboard asks the server — which selects on
    // verification_status IN ('draft','pending') — and this page was counting
    // `!is_approved`, which is also true of everyone already turned down.
    expect(toggle()).toHaveTextContent(/pending only\s*1$/i);
  });

  it("keeps a rejected owner out of the pending list", () => {
    query = "status=pending";
    render(<ShopOwnersPage />);

    expect(screen.getByText(/Waiting Traders/)).toBeInTheDocument();
    expect(screen.queryByText(/Turned Down Ltd/)).not.toBeInTheDocument();
  });

  it("offers 'view their shops' for an APPROVED owner", () => {
    // The one this got wrong first time: the link landed inside the block that
    // only renders for unapproved owners, so it appeared for exactly the
    // owners least likely to have a shop.
    render(<ShopOwnersPage />);

    const links = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(links).toContain("/admin/shops?owner=o2"); // Live Grocers, approved
  });

  it("offers it for an unapproved owner too", () => {
    render(<ShopOwnersPage />);

    const links = screen
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(links).toContain("/admin/shops?owner=o1"); // Waiting Traders
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
