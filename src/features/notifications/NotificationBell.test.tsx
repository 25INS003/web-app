import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

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

const markRead = { mutate: vi.fn(), isPending: false };
vi.mock("./hooks", () => ({
  useUnreadCount: () => ({ data: 3 }),
  useNotifications: () => ({ data: items, isLoading: false }),
  useMarkRead: () => markRead,
  useMarkAllRead: () => ({ mutate: vi.fn(), isPending: false }),
}));

import { NotificationBell } from "./NotificationBell";

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

  it("marks an item read and navigates to its action_url when clicked", () => {
    render(<NotificationBell />);
    fireEvent.click(screen.getByRole("button", { name: /unread/i }));
    fireEvent.click(screen.getByText("Order Ready! 📦"));
    expect(markRead.mutate).toHaveBeenCalledWith("nid1");
    expect(push).toHaveBeenCalledWith("/orders/abc");
  });
});
