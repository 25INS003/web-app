import { z } from "zod";
import { isoDate, objectId } from "./common";

export const notificationTypeValues = [
  "order_placed",
  "order_accepted",
  "order_ready",
  "order_picked_up",
  "order_delivered",
  "order_cancelled",
  "payment_success",
  "payment_failed",
  "new_message",
  "system_alert",
  "promotional",
  "review_reminder",
  "stock_alert",
  "delivery_assigned",
  // An admin's decision on a product a shop owner submitted, and an admin's
  // edit to one. Listed rather than left to the `.catch` below, which would
  // render all three as a generic system alert.
  "product_approved",
  "product_rejected",
  "product_updated",
] as const;

// .catch keeps an unknown backend type from hard-failing the feed.
export const notificationTypeSchema = z
  .enum(notificationTypeValues)
  .catch("system_alert");
export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const notificationSchema = z.object({
  id: objectId,
  notification_id: z.string().optional(),
  title: z.string(),
  message: z.string(),
  type: notificationTypeSchema,
  priority: z.string().optional(),
  is_read: z.boolean().optional().default(false),
  data: z.record(z.string(), z.unknown()).optional().default({}),
  action_url: z.string().nullish(),
  image_url: z.string().nullish(),
  created_at: isoDate.nullish(),
});
export type Notification = z.infer<typeof notificationSchema>;

// GET /notifications/get response (data payload).
export const notificationListResponseSchema = z.object({
  notifications: z.array(notificationSchema),
  pagination: z
    .object({
      currentPage: z.number().optional(),
      totalPages: z.number().optional(),
      totalNotifications: z.number().optional(),
      unreadCount: z.number().optional(),
      hasNextPage: z.boolean().optional(),
      hasPrevPage: z.boolean().optional(),
    })
    .optional(),
});

export const unreadCountResponseSchema = z.object({
  unreadCount: z.number(),
});

// --- display helpers ---

// Lucide icon names per type; the bell/list maps these to components.
export const NOTIFICATION_ICON: Record<NotificationType, string> = {
  order_placed: "ShoppingBag",
  order_accepted: "CheckCircle2",
  order_ready: "Package",
  order_picked_up: "Truck",
  order_delivered: "PackageCheck",
  order_cancelled: "XCircle",
  payment_success: "CreditCard",
  payment_failed: "CreditCard",
  new_message: "MessageSquare",
  system_alert: "Bell",
  promotional: "Tag",
  review_reminder: "Star",
  stock_alert: "AlertTriangle",
  delivery_assigned: "Truck",
  product_approved: "PackageCheck",
  product_rejected: "XCircle",
  product_updated: "Pencil",
};
