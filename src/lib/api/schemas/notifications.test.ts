import { describe, expect, it } from "vitest";
import {
  notificationListResponseSchema,
  notificationSchema,
} from "./notifications";

describe("notificationSchema", () => {
  it("parses a well-formed notification", () => {
    const n = notificationSchema.parse({
      _id: "6a2e5493f7bc866c400eba32",
      notification_id: "6a2e5493f7bc866c400eba33",
      title: "Order Ready! 📦",
      message: "Your order is ready.",
      type: "order_ready",
      is_read: false,
      action_url: "/orders/abc",
      created_at: "2026-06-14T08:44:17.340Z",
    });
    expect(n.type).toBe("order_ready");
    expect(n.is_read).toBe(false);
  });

  it("falls back to system_alert for an unknown type (.catch)", () => {
    const n = notificationSchema.parse({
      _id: "x",
      title: "t",
      message: "m",
      type: "totally_new_backend_type",
    });
    expect(n.type).toBe("system_alert");
  });

  it("defaults is_read and data when omitted", () => {
    const n = notificationSchema.parse({
      _id: "x",
      title: "t",
      message: "m",
      type: "order_placed",
    });
    expect(n.is_read).toBe(false);
    expect(n.data).toEqual({});
  });
});

describe("notificationListResponseSchema", () => {
  it("parses the feed envelope payload", () => {
    const parsed = notificationListResponseSchema.parse({
      notifications: [
        { _id: "a", title: "t", message: "m", type: "order_delivered" },
      ],
      pagination: { totalNotifications: 1, unreadCount: 1 },
    });
    expect(parsed.notifications).toHaveLength(1);
    expect(parsed.pagination?.unreadCount).toBe(1);
  });
});
