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

  it("navigates to an item's action_url when it is clicked", () => {
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole("button", { name: /unread/i }));
    fireEvent.click(screen.getByText("Order Ready! 📦"));
    expect(push).toHaveBeenCalledWith("/orders/abc");
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
