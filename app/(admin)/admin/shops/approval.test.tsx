import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Approving and rejecting a shop, from the row rather than a menu.
 *
 * Both lived inside the row's ⋯ dropdown, which is the wrong place for them on
 * this screen: an admin arriving from the dashboard's "Shops awaiting
 * approval" card, on a list filtered to `pending`, is here to make exactly
 * this decision — and it was two clicks behind an icon with no label. The
 * rest of what the row offers is navigation and stays in the menu.
 *
 * Neither button acts on its own. Both open the confirmation dialog, because
 * rejecting takes a reason and approving puts a shop in front of customers.
 */

const push = vi.fn();
// What the real store returns: an OBJECT. It matters — the page used to do
// `const success = await updateShopStatus(...)` and branch on it, so a
// `{ success: false }` was as truthy as a success and every failure toasted
// "approved successfully".
const deleteShop = vi.fn(async () => ({ success: true }));
const declineShopDeletion = vi.fn(async () => ({ success: true }));
const updateShopStatus = vi.fn(
  async (): Promise<{ success: boolean; message?: string }> => ({
    success: true,
  }),
);
const toastSuccess = vi.fn();
const toastError = vi.fn();

const SHOPS = [
  { id: "s1", name: "Waiting Mart", shop_status: "pending", owner_id: "o1" },
  { id: "s2", name: "Live Mart", shop_status: "active", owner_id: "o1" },
  { id: "s3", name: "Closed Mart", shop_status: "inactive", owner_id: "o2" },
  // Separate from the pending one on purpose. A shop that is BOTH awaiting
  // approval and asking to be deleted used to show four buttons — "Reject"
  // (refuse the application) beside "Keep it" (refuse the deletion) — and a
  // fixture that conflated the two could not tell the flows apart either.
  {
    id: "s4",
    name: "Wants Out Ltd",
    shop_status: "active",
    owner_id: "o3",
    metadata: {
      deletion_request: { reason: "Closing the branch.", requested_at: "2026-09-07" },
    },
  },
];

let query = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/admin/shops",
  useSearchParams: () => new URLSearchParams(query),
}));
vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));
vi.mock("@/store/adminShopStore", () => ({
  useAdminShopStore: () => ({
    shops: SHOPS,
    fetchAllShops: vi.fn(),
    updateShopStatus,
    deleteShop,
    declineShopDeletion,
    isLoading: false,
  }),
}));

const { default: AdminShopsPage } = await import("./page");

const buttons = (name: RegExp) => screen.queryAllByRole("button", { name });

/**
 * The buttons on ONE shop's row.
 *
 * Two flows now use the words Approve and Reject — the shop's application and
 * the owner's deletion request — so a page-wide `getByRole` cannot say which
 * row it found. Scoped by the shop's name.
 */
const rowFor = (name: RegExp | string) =>
  screen.getByText(name).closest("tr") as HTMLElement;
const inRow = (shopName: RegExp | string, button: RegExp) =>
  within(rowFor(shopName)).queryAllByRole("button", { name: button });

beforeEach(() => {
  vi.clearAllMocks();
  updateShopStatus.mockResolvedValue({ success: true });
  query = "";
});

describe("approving a shop from the list", () => {
  it("offers Approve and Reject on the row itself", () => {
    render(<AdminShopsPage />);

    // On the pending shop's row specifically. "Wants Out Ltd" also shows
    // Approve and Reject, for its deletion request — different question, same
    // two words.
    expect(inRow("Waiting Mart", /^approve$/i)).toHaveLength(1);
    expect(inRow("Waiting Mart", /^reject$/i)).toHaveLength(1);
  });

  it("offers them only for a shop still awaiting a decision", () => {
    query = "status=approved";
    render(<AdminShopsPage />);

    // Nothing to approve on a shop already live: changing a decided shop's
    // status is what the details dialog is for.
    expect(inRow("Live Mart", /^approve$/i)).toHaveLength(0);
    expect(inRow("Live Mart", /^reject$/i)).toHaveLength(0);
  });

  it("asks before it approves, rather than acting on the click", () => {
    render(<AdminShopsPage />);

    fireEvent.click(inRow("Waiting Mart", /^approve$/i)[0]);

    expect(screen.getByText(/approve shop/i)).toBeInTheDocument();
    expect(updateShopStatus).not.toHaveBeenCalled();
  });

  it("approves the shop whose row was clicked", async () => {
    render(<AdminShopsPage />);

    fireEvent.click(buttons(/^approve$/i)[0]);
    // `act`, because confirming awaits the store and then closes the dialog —
    // a state update after the click resolves.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /confirm approval/i }));
    });

    // 'active', and s1 — the pending row, not the first row on the page.
    expect(updateShopStatus).toHaveBeenCalledWith("s1", "active", "");
  });

  it("carries the rejection reason the admin typed", async () => {
    render(<AdminShopsPage />);

    fireEvent.click(inRow("Waiting Mart", /^reject$/i)[0]);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Address does not match the licence." },
    });
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /confirm rejection/i }),
      );
    });

    expect(updateShopStatus).toHaveBeenCalledWith(
      "s1",
      "inactive",
      "Address does not match the licence.",
    );
  });

  it("does not ask for a reason when approving", () => {
    render(<AdminShopsPage />);

    fireEvent.click(inRow("Waiting Mart", /^approve$/i)[0]);

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("leaves the row's navigation in the menu", () => {
    render(<AdminShopsPage />);

    // The menu still exists and still holds everything that is not the
    // decision — the point was to lift out the two actions this screen is
    // for, not to flatten the row into six buttons.
    expect(buttons(/view details/i)).toHaveLength(0);
    expect(buttons(/view products/i)).toHaveLength(0);
  });
});

/**
 * Taking a live shop offline.
 *
 * The endpoint has always accepted `inactive` for any shop — deactivating is
 * deliberately NOT gated on the owner's state, so an admin can take down the
 * shop of an owner they have just revoked — but nothing on this screen asked
 * for it. The only status an admin could change was a pending shop's.
 */
describe("deactivating a shop", () => {
  it("offers Deactivate on a live shop", () => {
    query = "status=approved";
    render(<AdminShopsPage />);

    expect(inRow("Live Mart", /deactivate/i)).toHaveLength(1);
    // "Wants Out Ltd" is live too, but a shop with a deletion request open is
    // out of the status queues altogether — it is answering a different
    // question. It is still there under "All shops", asserted below.
    expect(screen.queryByText("Wants Out Ltd")).not.toBeInTheDocument();
  });

  it("does not offer it for a shop that was never approved", () => {
    query = "status=pending";
    render(<AdminShopsPage />);

    // A pending shop is rejected, not deactivated. Both write `inactive`, but
    // they are not the same decision and the owner is not told the same thing.
    expect(buttons(/deactivate/i)).toHaveLength(0);
    expect(inRow("Waiting Mart", /^reject$/i)).toHaveLength(1);
  });

  it("says what taking it offline means before it is done", () => {
    query = "status=approved";
    render(<AdminShopsPage />);

    fireEvent.click(inRow("Live Mart", /deactivate/i)[0]);

    expect(
      screen.getByText(/no longer see it or be able to order/i),
    ).toBeInTheDocument();
  });

  it("will not go through without a reason", () => {
    query = "status=approved";
    render(<AdminShopsPage />);

    fireEvent.click(inRow("Live Mart", /deactivate/i)[0]);

    // The owner is sent this text and nothing else explains the decision to
    // them — the same rule as refusing an owner's application.
    expect(
      screen.getByRole("button", { name: /confirm deactivation/i }),
    ).toBeDisabled();
  });

  it("takes the shop offline with the reason attached", async () => {
    query = "status=approved";
    render(<AdminShopsPage />);

    fireEvent.click(inRow("Live Mart", /deactivate/i)[0]);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Selling unlisted medicines." },
    });
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /confirm deactivation/i }),
      );
    });

    expect(updateShopStatus).toHaveBeenCalledWith(
      "s2",
      "inactive",
      "Selling unlisted medicines.",
    );
  });

  it("offers Activate on a shop that is down, and no reason with it", async () => {
    query = "status=rejected";
    render(<AdminShopsPage />);

    fireEvent.click(buttons(/^activate$/i)[0]);

    // Putting a shop back is good news; there is nothing to justify.
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /confirm reactivation/i }),
      );
    });
    expect(updateShopStatus).toHaveBeenCalledWith("s3", "active", "");
  });

  it("reports a refusal in the server's own words", async () => {
    // Activating is gated on the OWNER being approved, so this one really can
    // be refused, and the 409 carries the fix ("approve the owner first").
    updateShopStatus.mockResolvedValue({
      success: false,
      message: "Cannot activate this shop: its owner is pending.",
    });
    query = "status=rejected";
    render(<AdminShopsPage />);

    fireEvent.click(buttons(/^activate$/i)[0]);
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /confirm reactivation/i }),
      );
    });

    // The bug: `if (success)` on an object is true whatever it holds, so this
    // path toasted "reactivated successfully" and the row never changed.
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith(
      "Cannot activate this shop: its owner is pending.",
    );
  });
});

/**
 * Deleting a shop, and answering an owner who asked for it.
 *
 * The admin had no delete at all. The only permanent delete in the system was
 * a button on the OWNER's dashboard — it took the shop's products and its
 * order history with it — so the person with the least reason to weigh that
 * could do it and the person meant to decide could not. That button now sends
 * a request; this is where it is answered.
 */
describe("deleting a shop", () => {
  /** The deletion request's own Approve — it approves the OWNER'S REQUEST. */
  const approveDeletion = () => inRow("Wants Out Ltd", /^approve$/i)[0];

  it("offers exactly two answers, and nothing else", () => {
    render(<AdminShopsPage />);

    // The whole change: a shop with a request open is answering ONE question,
    // so it offers Approve (delete it) and Reject (do not) and none of the
    // usual status buttons — which is what made "Reject the application" sit
    // beside "Keep it" and read as the same refusal.
    expect(inRow("Wants Out Ltd", /^approve$/i)).toHaveLength(1);
    expect(inRow("Wants Out Ltd", /^reject$/i)).toHaveLength(1);
    expect(inRow("Wants Out Ltd", /deactivate|^activate$/i)).toHaveLength(0);
  });

  it("will not delete without a reason", () => {
    render(<AdminShopsPage />);
    fireEvent.click(approveDeletion());

    // It is the only thing the owner is told about a shop that no longer
    // exists.
    expect(screen.getByRole("button", { name: /delete permanently/i })).toBeDisabled();
    expect(deleteShop).not.toHaveBeenCalled();
  });

  it("says what will be destroyed before it happens", () => {
    render(<AdminShopsPage />);
    fireEvent.click(approveDeletion());

    // The row says "Approve"; the dialog has to say the word it stands for.
    expect(screen.getByText(/approve the deletion/i)).toBeInTheDocument();
    expect(screen.getByText(/permanently delete/i)).toBeInTheDocument();
  });

  it("deletes with the reason attached", async () => {
    render(<AdminShopsPage />);
    fireEvent.click(approveDeletion());
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Fraudulent listing." },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /delete permanently/i }));
    });

    expect(deleteShop).toHaveBeenCalledWith("s4", "Fraudulent listing.");
  });
});

/**
 * Answering an owner who asked for their shop to be deleted.
 *
 * The request is how an owner asks; it is not a precondition on the admin, and
 * it is not an instruction either. "Keep it" is the other answer, and it has to
 * be as reachable as the delete.
 */
describe("a shop whose owner asked for deletion", () => {
  it("offers Reject when a request is open", () => {
    render(<AdminShopsPage />);

    expect(inRow("Wants Out Ltd", /^reject$/i)).toHaveLength(1);
  });

  it("offers nothing of the sort when no one asked", () => {
    render(<AdminShopsPage />);

    // Live Mart's row has no deletion question to answer at all.
    expect(inRow("Live Mart", /^reject$/i)).toHaveLength(0);
  });

  it("will not reject without a reason", () => {
    render(<AdminShopsPage />);

    fireEvent.click(inRow("Wants Out Ltd", /^reject$/i)[0]);

    expect(screen.getByRole("button", { name: /reject request/i })).toBeDisabled();
  });

  it("rejects with the reason, leaving the shop alone", async () => {
    render(<AdminShopsPage />);

    fireEvent.click(inRow("Wants Out Ltd", /^reject$/i)[0]);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "You still have unfulfilled orders." },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /reject request/i }));
    });

    expect(declineShopDeletion).toHaveBeenCalledWith(
      "s4",
      "You still have unfulfilled orders.",
    );
    // Declining is not a status change; nothing may touch the shop.
    expect(updateShopStatus).not.toHaveBeenCalled();
  });
});

/**
 * Where the dashboard's deletion card lands.
 *
 * The other two cards link with `?status=`; this one links with
 * `?deletion=requested`. Same rules: the filter lives in the URL so Back
 * undoes it, and the page says it is filtered rather than silently showing two
 * shops of forty.
 */
describe("the deletion-requests filter", () => {
  it("shows only the shops whose owners asked", () => {
    query = "deletion=requested";
    render(<AdminShopsPage />);

    expect(screen.getByText(/Wants Out Ltd/)).toBeInTheDocument();
    expect(screen.queryByText(/Waiting Mart/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Live Mart/)).not.toBeInTheDocument();
  });

  it("says the list is filtered, and how to leave", () => {
    query = "deletion=requested";
    render(<AdminShopsPage />);

    expect(screen.getByText(/asked for deletion/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /show all shops/i }),
    ).toBeInTheDocument();
  });

  it("clears the filter from the URL, not just the view", () => {
    query = "deletion=requested";
    render(<AdminShopsPage />);

    fireEvent.click(screen.getByRole("button", { name: /show all shops/i }));

    // In the URL, so a refresh does not silently re-apply a filter that was
    // turned off.
    expect(push).toHaveBeenCalledWith("/admin/shops");
  });

  it("marks the request on the row in the unfiltered list too", () => {
    render(<AdminShopsPage />);

    // An admin scrolling the full list should see which shops are waiting on
    // them without having to come via the card.
    expect(screen.getByText(/deletion requested/i)).toBeInTheDocument();
  });

  it("keeps a neighbouring param when clearing", () => {
    query = "deletion=requested&status=pending";
    render(<AdminShopsPage />);

    fireEvent.click(screen.getByRole("button", { name: /show all shops/i }));

    expect(push).toHaveBeenCalledWith("/admin/shops?status=pending");
  });
});

/**
 * The reason reaching the person who decides.
 *
 * The owner types it, the server stores it, the API returns it on every shop —
 * and nothing rendered it. An admin was being asked to destroy a business and
 * given a red badge to decide on.
 */
describe("the reason an owner gave", () => {
  it("shows on the row", () => {
    render(<AdminShopsPage />);

    expect(screen.getByText(/closing the branch/i)).toBeInTheDocument();
  });

  it("shows in the delete dialog, where the decision is taken", () => {
    render(<AdminShopsPage />);

    fireEvent.click(inRow("Wants Out Ltd", /^approve$/i)[0]);

    // Not only back on the row they clicked from.
    expect(screen.getByText(/the owner asked for this, saying/i)).toBeInTheDocument();
    expect(screen.getAllByText(/closing the branch/i).length).toBeGreaterThan(1);
  });

  it("shows in the decline dialog too", () => {
    render(<AdminShopsPage />);

    fireEvent.click(inRow("Wants Out Ltd", /^reject$/i)[0]);

    expect(screen.getByText(/the owner asked for this, saying/i)).toBeInTheDocument();
  });

  it("says what deleting destroys", () => {
    render(<AdminShopsPage />);

    fireEvent.click(inRow("Wants Out Ltd", /^approve$/i)[0]);

    expect(screen.getByText(/order history go with it/i)).toBeInTheDocument();
  });

  it("says nothing of the sort for a shop nobody asked about", () => {
    render(<AdminShopsPage />);

    // Deactivating Live Mart, which nobody asked to delete. Inventing a
    // request would be worse than silence.
    fireEvent.click(inRow("Live Mart", /deactivate/i)[0]);
    expect(
      screen.queryByText(/the owner asked for this, saying/i),
    ).not.toBeInTheDocument();
  });
});

/**
 * Which list a shop with an open deletion request belongs to.
 *
 * It was in both: counted under "Shops awaiting approval" AND sitting in the
 * deletion queue. Once the row stopped offering Approve/Reject for the
 * application, that became a shop an admin was told to approve and given no
 * way to approve.
 */
describe("a shop that is answering the deletion question", () => {
  it("is out of the pending queue", () => {
    query = "status=pending";
    render(<AdminShopsPage />);

    expect(screen.getByText("Waiting Mart")).toBeInTheDocument();
    expect(screen.queryByText("Wants Out Ltd")).not.toBeInTheDocument();
  });

  it("is out of the approved queue too", () => {
    query = "status=approved";
    render(<AdminShopsPage />);

    expect(screen.queryByText("Wants Out Ltd")).not.toBeInTheDocument();
  });

  it("is still listed under all shops", () => {
    render(<AdminShopsPage />);

    // Hiding it from the unfiltered list would be an admin looking at every
    // shop and not being shown one.
    expect(screen.getByText("Wants Out Ltd")).toBeInTheDocument();
  });

  it("is in the deletion queue", () => {
    query = "deletion=requested";
    render(<AdminShopsPage />);

    expect(screen.getByText("Wants Out Ltd")).toBeInTheDocument();
  });
});
