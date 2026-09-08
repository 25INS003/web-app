import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// --- mocks (declared before importing the component) ---
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("@/features/auth/useAuth", () => ({
  useIsAuthed: () => true,
  useSession: () => ({ data: { user: { id: "u1" } } }),
}));
vi.mock("./useNotificationsRealtime", () => ({
  useNotificationsRealtime: () => {},
}));

/**
 * The long one is the point of the detail view.
 *
 * A decision an admin makes — a shop taken offline, an application refused —
 * arrives as a notification whose reason IS the message. The panel clamps it
 * to a single line, so at this length it was legible only as an ellipsis.
 */
const LONG_MESSAGE =
  "Corner Store is no longer visible to customers. Reason: the licence on " +
  "file expired in March and the certificate you uploaded is for a different " +
  "address. Send the current one through support and we will review it again.";

const items = [
  {
    id: "n1",
    notification_id: "nid1",
    title: "Order Ready! 📦",
    message: "Your order is ready.",
    type: "order_ready",
    is_read: false,
    data: {},
    action_url: "/orders/abc",
    created_at: "2026-06-14T08:44:17.340Z",
  },
  {
    id: "n2",
    notification_id: "nid2",
    title: "Your shop has been taken offline",
    message: LONG_MESSAGE,
    type: "system_alert",
    is_read: true,
    data: {},
    // No action_url: nothing to go to, so reading it is the only thing there
    // is to do — and before this there was no way to.
    action_url: null,
    created_at: "2026-06-14T08:44:17.340Z",
  },
];

const markAllRead = { mutate: vi.fn(), isPending: false };
let unreadCount = 3;
vi.mock("./hooks", () => ({
  useUnreadCount: () => ({ data: unreadCount }),
  useNotifications: () => ({ data: items, isLoading: false }),
  useMarkAllRead: () => markAllRead,
}));

import { NotificationBell } from "./NotificationBell";

beforeEach(() => {
  markAllRead.mutate.mockClear();
  push.mockClear();
});

describe("NotificationBell", () => {
  it("shows the unread badge and count in the aria-label", () => {
    render(<NotificationBell />);
    const btn = screen.getByRole("button", { name: /3 unread/i });
    expect(btn).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("opens the dropdown and lists notifications on click", () => {
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole("button", { name: /unread/i }));
    expect(screen.getByText("Order Ready! 📦")).toBeInTheDocument();
  });

  it("opens the notification instead of leaving the page", () => {
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole("button", { name: /unread/i }));
    fireEvent.click(screen.getByText("Order Ready! 📦"));

    // The panel clamps the title and the message to one line each, so a click
    // used to be the only thing you could do with a notification — and it took
    // you away from it. It opens now.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("still gets you there, from a button that names the destination", () => {
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole("button", { name: /unread/i }));
    fireEvent.click(screen.getByText("Order Ready! 📦"));
    fireEvent.click(screen.getByRole("button", { name: /view order/i }));

    expect(push).toHaveBeenCalledWith("/orders/abc");
  });

  it("shows a long message in full", () => {
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole("button", { name: /unread/i }));
    fireEvent.click(screen.getByText("Your shop has been taken offline"));

    // The row's copy is clamped by CSS; the dialog's is the whole string.
    expect(screen.getByRole("dialog")).toHaveTextContent(LONG_MESSAGE);
  });

  it("offers no destination when there is none", () => {
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole("button", { name: /unread/i }));
    fireEvent.click(screen.getByText("Your shop has been taken offline"));

    // A destination button that goes nowhere is worse than no button.
    expect(
      screen.queryByRole("button", { name: /view order|go to/i }),
    ).not.toBeInTheDocument();
    // The dialog's own cross is the way out, and the only one — a second
    // control also called "Close" is the fault just fixed elsewhere.
    expect(screen.getAllByRole("button", { name: /^close$/i })).toHaveLength(1);
  });

  it("marks everything read as soon as the bell is opened", () => {
    // Opening IS the acknowledgement — the customer should not have to press a
    // second button to clear a badge they have just looked at.
    render(<NotificationBell />);
    expect(markAllRead.mutate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /unread/i }));

    expect(markAllRead.mutate).toHaveBeenCalledTimes(1);
  });

  it("keeps the unread rows highlighted while the panel is open", () => {
    // The badge clears immediately, but the rows must not: marking them read
    // and un-highlighting them in the same instant tells the customer "you have
    // 3" and then shows them nothing to distinguish those 3.
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole("button", { name: /unread/i }));

    const row = screen.getByText("Order Ready! 📦").closest("button");
    expect(row?.className).toContain("bg-primary/5");
  });

  it("asks for nothing when there is nothing unread to clear", () => {
    unreadCount = 0;
    render(<NotificationBell />);

    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));

    expect(markAllRead.mutate).not.toHaveBeenCalled();
    unreadCount = 3;
  });
});

/**
 * Where "View all" goes.
 *
 * The bell is mounted in the storefront header, the seller dashboard and the
 * admin shell, and it linked to `/notifications` in all three. That route
 * lives under `(storefront)`, so a seller or an admin pressing "View all"
 * landed in the CUSTOMER shop — search bar, Cart button, and a Nedyway logo
 * pointing at `/`, with no way back but the browser.
 */
describe("the bell's View all link", () => {
  const viewAll = () => screen.getByRole("link", { name: /view all/i });

  it("goes to the storefront page by default", () => {
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole("button", { name: /unread/i }));

    expect(viewAll()).toHaveAttribute("href", "/notifications");
  });

  it("goes where the shell tells it to", () => {
    render(<NotificationBell viewAllHref="/dashboard/notifications" />);
    fireEvent.click(screen.getByRole("button", { name: /unread/i }));

    // The seller's own page, inside the seller's own shell.
    expect(viewAll()).toHaveAttribute("href", "/dashboard/notifications");
  });

  it("works for the admin shell too", () => {
    render(<NotificationBell viewAllHref="/admin/notifications" />);
    fireEvent.click(screen.getByRole("button", { name: /unread/i }));

    expect(viewAll()).toHaveAttribute("href", "/admin/notifications");
  });
});
