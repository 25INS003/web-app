"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Notification } from "@/lib/api/schemas/notifications";
import { useMarkAllRead, useMarkRead, useNotifications } from "./hooks";
import { NotificationIcon, timeAgo } from "./ui";

export function NotificationsView() {
  const router = useRouter();
  const { data: items = [], isLoading, isError } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const hasUnread = items.some((n) => !n.is_read);

  const onItem = (n: Notification) => {
    if (!n.is_read && n.notification_id) markRead.mutate(n.notification_id);
    if (n.action_url) router.push(n.action_url);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Notifications
        </h1>
        {hasUnread && (
          <button
            type="button"
            className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Loading…
        </p>
      ) : isError ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Couldn&apos;t load your notifications. Please try again.
        </p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <Bell className="size-6" aria-hidden />
          </span>
          <p className="text-sm font-medium">No notifications yet</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Order updates and account alerts will show up here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {items.map((n) => (
            <li key={n._id}>
              <button
                type="button"
                onClick={() => onItem(n)}
                className={`flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-muted/60 ${
                  n.is_read ? "" : "bg-primary/5"
                }`}
              >
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-muted text-foreground">
                  <NotificationIcon type={n.type} className="size-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {n.title}
                    </span>
                    {!n.is_read && (
                      <span className="size-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {n.message}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {timeAgo(n.created_at)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
