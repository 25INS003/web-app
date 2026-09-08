import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Deactivating a shop, as a button rather than a menu.
 *
 * These actions lived behind a three-dot icon in the card header, so the one
 * thing an owner comes to this page to do — take a shop off the storefront —
 * was two clicks behind a control that names nothing. They are buttons on the
 * card now, and which button appears is the shop's state.
 *
 * The state each action is offered for is the point, not decoration: the
 * server pins deactivate to `active` and activate to `inactive`, because a
 * `pending` shop deactivated and then activated would be a shop that went live
 * without an admin ever approving it. A button offered for a state the server
 * refuses is an error message where a disabled control should be.
 */

let shops: Record<string, unknown>[] = [];
const deactivateExistingShop = vi.fn(async () => ({ success: true, message: "ok" }));
const activateExistingShop = vi.fn(async () => ({ success: true, message: "ok" }));
const requestShopDeletion = vi.fn(async () => ({ success: true, message: "ok" }));
const withdrawShopDeletionRequest = vi.fn(async () => ({ success: true, message: "ok" }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/store/shopStore", () => ({
  useShopStore: () => ({
    myShops: shops,
    fetchMyShops: vi.fn(),
    deactivateExistingShop,
    activateExistingShop,
    requestShopDeletion,
    withdrawShopDeletionRequest,
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
  shop_status: "active",
  ...over,
});

const btn = (name: RegExp) => screen.queryByRole("button", { name });

beforeEach(() => {
  vi.clearAllMocks();
  // Every one of these actions confirms first. Answering yes here keeps these
  // tests about which control exists and what it calls.
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

describe("the shop card's actions", () => {
  it("offers Deactivate on a live shop, on the card itself", () => {
    shops = [shop()];
    render(<MyShopPage />);

    expect(btn(/deactivate/i)).toBeInTheDocument();
  });

  it("deactivates the shop it belongs to", () => {
    shops = [shop()];
    render(<MyShopPage />);

    fireEvent.click(btn(/deactivate/i)!);

    expect(deactivateExistingShop).toHaveBeenCalledWith("s1");
  });

  it("leaves no unnamed icon button behind", () => {
    shops = [shop()];
    render(<MyShopPage />);

    // The three-dot trigger was a bare button wrapping an icon: no text, no
    // label, nothing for a screen reader to read and nothing for a first-time
    // owner to guess at. Asserting on its absence by role would pass either
    // way, since a closed menu renders nothing — so this asserts the property
    // that made it bad. The delete button survives it by carrying an
    // aria-label.
    const unnamed = screen
      .getAllByRole("button")
      .filter((b) => !(b.getAttribute("aria-label") || b.textContent || "").trim());
    expect(unnamed).toHaveLength(0);
  });

  it("offers Activate, not Deactivate, once the shop is down", () => {
    shops = [shop({ shop_status: "inactive" })];
    render(<MyShopPage />);

    expect(btn(/^activate/i)).toBeInTheDocument();
    expect(btn(/deactivate/i)).not.toBeInTheDocument();
  });

  it("activates the shop it belongs to", () => {
    shops = [shop({ shop_status: "inactive" })];
    render(<MyShopPage />);

    fireEvent.click(btn(/^activate/i)!);

    expect(activateExistingShop).toHaveBeenCalledWith("s1");
  });

  it("asks an admin rather than deleting the shop itself", async () => {
    // This card used to carry a permanent delete that removed the shop's
    // products AND its order history. The decision is an admin's now; the
    // owner's part is to ask, with a reason the admin can act on.
    shops = [shop({ shop_status: "inactive" })];
    render(<MyShopPage />);

    fireEvent.click(btn(/ask an admin to delete/i)!);
    fireEvent.change(await screen.findByLabelText(/why should it be deleted/i), {
      target: { value: "Closing the branch." },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /send request/i }));
    });

    expect(requestShopDeletion).toHaveBeenCalledWith("s1", "Closing the branch.");
  });

  it("names the shop it is about", async () => {
    shops = [shop({ shop_status: "inactive" })];
    render(<MyShopPage />);

    fireEvent.click(btn(/ask an admin to delete/i)!);

    // One dialog for a page that can list many shops, so it has to say which.
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Corner Store");
  });

  it("says the reason goes to the admin", async () => {
    shops = [shop()];
    render(<MyShopPage />);

    fireEvent.click(btn(/ask an admin to delete/i)!);

    expect(
      await screen.findByText(/admin reviewing this sees exactly what you write/i),
    ).toBeInTheDocument();
  });

  it("says the shop keeps trading meanwhile", async () => {
    shops = [shop()];
    render(<MyShopPage />);

    fireEvent.click(btn(/ask an admin to delete/i)!);

    // The request is not the deletion, and an owner should not think it is.
    expect(
      await screen.findByText(/keep trading until an admin decides/i),
    ).toBeInTheDocument();
  });

  it("offers the request whatever state the shop is in", () => {
    // Deactivating is an act and depends on the state; asking is a request and
    // does not.
    for (const status of ["active", "inactive", "pending"]) {
      shops = [shop({ shop_status: status })];
      const { unmount } = render(<MyShopPage />);
      expect(btn(/ask an admin to delete/i), status).toBeInTheDocument();
      unmount();
    }
  });

  it("will not send without a reason", async () => {
    shops = [shop()];
    render(<MyShopPage />);

    fireEvent.click(btn(/ask an admin to delete/i)!);

    // An admin is being asked to destroy order history; a blank reason gives
    // them nothing to decide on.
    expect(
      await screen.findByRole("button", { name: /send request/i }),
    ).toBeDisabled();
  });

  it("will not send whitespace either", async () => {
    shops = [shop()];
    render(<MyShopPage />);

    fireEvent.click(btn(/ask an admin to delete/i)!);
    fireEvent.change(await screen.findByLabelText(/why should it be deleted/i), {
      target: { value: "   " },
    });

    expect(screen.getByRole("button", { name: /send request/i })).toBeDisabled();
  });

  it("sends nothing when the dialog is cancelled", async () => {
    shops = [shop()];
    render(<MyShopPage />);

    fireEvent.click(btn(/ask an admin to delete/i)!);
    fireEvent.change(await screen.findByLabelText(/why should it be deleted/i), {
      target: { value: "Closing the branch." },
    });
    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(requestShopDeletion).not.toHaveBeenCalled();
  });

  it("offers neither on a shop still awaiting approval", () => {
    shops = [shop({ shop_status: "pending" })];
    render(<MyShopPage />);

    // Nothing to take down — it was never live — and putting it live is an
    // admin's decision. The server refuses both, so offering either here would
    // be a button that only ever produces an error toast.
    expect(btn(/deactivate/i)).not.toBeInTheDocument();
    expect(btn(/^activate/i)).not.toBeInTheDocument();
  });

  it("still offers Edit whatever state the shop is in", () => {
    for (const status of ["active", "inactive", "pending"]) {
      shops = [shop({ shop_status: status })];
      const { unmount } = render(<MyShopPage />);
      expect(btn(/^edit$/i), status).toBeInTheDocument();
      unmount();
    }
  });

  it("does not call the server before the confirmation is answered", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    shops = [shop()];
    render(<MyShopPage />);

    fireEvent.click(btn(/deactivate/i)!);

    expect(deactivateExistingShop).not.toHaveBeenCalled();
  });
});

/**
 * A shop the ADMIN took offline.
 *
 * The owner's Activate exists so they can undo their own deactivation — and an
 * admin taking a shop down writes the same `inactive`, so the button reversed
 * an enforcement action just as happily until the row carried a mark saying
 * who did it. The server refuses it now; this is the card agreeing with the
 * server rather than offering a button that can only fail.
 */
describe("a shop an admin took offline", () => {
  const seized = (over = {}) =>
    shop({
      shop_status: "inactive",
      metadata: {
        deactivated_by_admin: true,
        status_note: "Selling unlisted medicines.",
      },
      ...over,
    });

  it("does not offer Activate", () => {
    shops = [seized()];
    render(<MyShopPage />);

    expect(btn(/^activate/i)).not.toBeInTheDocument();
  });

  it("can still ask for it to be deleted", () => {
    shops = [seized()];
    render(<MyShopPage />);

    // Asking is safe whatever state the shop is in — an admin who took it
    // offline for cause is the same person who decides whether it goes.
    expect(btn(/ask an admin to delete/i)).toBeInTheDocument();
  });

  it("says an admin did it, not just 'inactive'", () => {
    shops = [seized()];
    render(<MyShopPage />);

    expect(screen.getByText(/taken offline by admin/i)).toBeInTheDocument();
  });

  it("shows the reason the admin gave", () => {
    shops = [seized()];
    render(<MyShopPage />);

    expect(
      screen.getByText(/selling unlisted medicines/i),
    ).toBeInTheDocument();
  });

  it("points at support, the only way to answer back", () => {
    shops = [seized()];
    render(<MyShopPage />);

    const link = screen.getByRole("link", { name: /ask support/i });
    expect(link).toHaveAttribute("href", "/dashboard/support");
  });

  it("still offers Activate on a shop the OWNER closed", () => {
    // The case the rule must not break — same status, no mark.
    shops = [shop({ shop_status: "inactive" })];
    render(<MyShopPage />);

    expect(btn(/^activate/i)).toBeInTheDocument();
    expect(screen.queryByText(/taken offline by admin/i)).not.toBeInTheDocument();
  });
});

/**
 * A request that is already with an admin.
 *
 * Nothing has been deleted yet — the shop keeps trading — so the card has to
 * say that plainly, and the owner needs a way back out of a request they sent
 * by mistake.
 */
describe("a shop with a deletion request open", () => {
  const asked = () =>
    shop({
      metadata: {
        deletion_request: {
          reason: "Closing the branch.",
          requested_at: "2026-09-07T00:00:00.000Z",
        },
      },
    });

  it("says the request is with an admin", () => {
    shops = [asked()];
    render(<MyShopPage />);

    expect(screen.getByText(/deletion requested/i)).toBeInTheDocument();
    expect(screen.getByText(/keeps trading until they do/i)).toBeInTheDocument();
  });

  it("shows the reason that was given", () => {
    shops = [asked()];
    render(<MyShopPage />);

    expect(screen.getByText(/closing the branch/i)).toBeInTheDocument();
  });

  it("does not offer to ask twice", () => {
    shops = [asked()];
    render(<MyShopPage />);

    expect(btn(/ask an admin to delete/i)).not.toBeInTheDocument();
  });

  it("lets the owner take it back", () => {
    shops = [asked()];
    render(<MyShopPage />);

    fireEvent.click(screen.getByRole("button", { name: /withdraw the request/i }));

    expect(withdrawShopDeletionRequest).toHaveBeenCalledWith("s1");
  });
});
