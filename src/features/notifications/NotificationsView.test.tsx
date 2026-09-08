import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Reading a notification on the notifications page.
 *
 * The page did show the whole message — but a click pushed `action_url`, so
 * the only thing you could do with a notification was leave it. For an order
 * update that is the right instinct; for the messages that carry a decision
 * and its reason it meant the reason was never the thing you landed on.
 */

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const LONG_MESSAGE =
  "Corner Store is no longer visible to customers. Reason: the licence on " +
  "file expired in March and the certificate you uploaded is for a different " +
  "address. Send the current one through support and we will review it again.";

const markRead = { mutate: vi.fn(), isPending: false };
const markAllRead = { mutate: vi.fn(), isPending: false };

const items = [
  {
    id: "n1",
    notification_id: "nid1",
    title: "Your shop has been taken offline",
    message: LONG_MESSAGE,
    type: "system_alert",
    is_read: false,
    data: {},
    action_url: "/myshop",
    created_at: "2026-06-14T08:44:17.340Z",
  },
];

vi.mock("./hooks", () => ({
  useNotifications: () => ({ data: items, isLoading: false, isError: false }),
  useMarkRead: () => markRead,
  useMarkAllRead: () => markAllRead,
}));

import { NotificationsView } from "./NotificationsView";

const openIt = () =>
  fireEvent.click(screen.getByText("Your shop has been taken offline"));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("opening a notification", () => {
  it("shows the whole message rather than navigating away", () => {
    render(<NotificationsView />);
    openIt();

    expect(screen.getByRole("dialog")).toHaveTextContent(LONG_MESSAGE);
    expect(push).not.toHaveBeenCalled();
  });

  it("still marks it read", () => {
    render(<NotificationsView />);
    openIt();

    // Opening it IS reading it; that part did not change.
    expect(markRead.mutate).toHaveBeenCalledWith("nid1");
  });

  it("names where the button goes, and goes there", () => {
    render(<NotificationsView />);
    openIt();
    fireEvent.click(screen.getByRole("button", { name: /go to my shops/i }));

    expect(push).toHaveBeenCalledWith("/myshop");
  });

  it("closes when it goes", () => {
    render(<NotificationsView />);
    openIt();
    fireEvent.click(screen.getByRole("button", { name: /go to my shops/i }));

    // Leaving the dialog open behind a route change would have it reappear on
    // the way back.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
