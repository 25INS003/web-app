import { api } from "@/lib/api/client";
import {
  notificationListResponseSchema,
  unreadCountResponseSchema,
} from "@/lib/api/schemas/notifications";
import type { Notification } from "@/lib/api/schemas/notifications";

export const notificationsApi = {
  async list(limit = 20): Promise<Notification[]> {
    const data = await api.get<unknown>("/notifications/get", {
      params: { limit },
    });
    return notificationListResponseSchema.parse(data).notifications;
  },

  async unreadCount(): Promise<number> {
    const data = await api.get<unknown>("/notifications/count");
    return unreadCountResponseSchema.parse(data).unreadCount;
  },

  async markRead(notificationId: string): Promise<void> {
    await api.post(`/notifications/${notificationId}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.post("/notifications/read-all");
  },
};
