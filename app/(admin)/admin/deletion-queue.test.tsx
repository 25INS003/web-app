import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The deletion queue: a card on the dashboard, and the list it opens.
 *
 * Owners can no longer delete a shop — they ask, and the ask has to land
 * somewhere an admin looks. Without a card it lives only as a panel on a row
 * somebody happens to scroll past, which is exactly how the shop and owner
 * approval queues used to go unnoticed before they were counted here.
 */

const fetchPendingOwners = vi.fn();
const fetchPendingShops = vi.fn();
const fetchDeletionRequests = vi.fn();

let deletionRequests: Record<string, unknown>[] = [];

vi.mock("@/store/adminShopownerStore", () => ({
  useShopOwnerStore: () => ({ pendingOwners: [], fetchPendingOwners }),
}));
vi.mock("@/store/adminShopStore", () => ({
  useAdminShopStore: () => ({
    pendingShops: [],
    fetchPendingShops,
    deletionRequests,
    fetchDeletionRequests,
  }),
}));

const { default: AdminHome } = await import("./page");

const card = (name: RegExp) => screen.getByRole("link", { name });

beforeEach(() => {
  vi.clearAllMocks();
  deletionRequests = [];
});

describe("the deletion-requests card", () => {
  it("asks the server for the queue when the dashboard opens", () => {
    render(<AdminHome />);

    // The card counts a queue of its own rather than deriving one from the
    // shop list, which the dashboard never loads — deriving it would show
    // zero until somebody visited the shops page.
    expect(fetchDeletionRequests).toHaveBeenCalled();
  });

  it("shows zero as a number, not a dash", () => {
    render(<AdminHome />);

    const link = card(/shop deletion requests/i);
    expect(link).toHaveTextContent("0");
  });

  it("counts the shops whose owners asked", () => {
    deletionRequests = [{ id: "s1" }, { id: "s2" }];
    render(<AdminHome />);

    expect(card(/shop deletion requests/i)).toHaveTextContent("2");
  });

  it("opens the shops list filtered to the queue", () => {
    deletionRequests = [{ id: "s1" }];
    render(<AdminHome />);

    expect(card(/shop deletion requests/i)).toHaveAttribute(
      "href",
      "/admin/shops?deletion=requested",
    );
  });

  it("sits beside the other two queues", () => {
    render(<AdminHome />);

    expect(card(/shop owners awaiting approval/i)).toBeInTheDocument();
    expect(card(/shops awaiting approval/i)).toBeInTheDocument();
    expect(card(/shop deletion requests/i)).toBeInTheDocument();
  });
});
