"use client";

import { Bell } from "lucide-react";
import { useState } from "react";
import type { Notification } from "@/lib/api/schemas/notifications";
import { useMarkAllRead, useMarkRead, useNotifications } from "./hooks";
import { NotificationDetail } from "./NotificationDetail";
import { NotificationIcon, timeAgo, toneFor, TONE_CLASSES } from "./ui";

export function NotificationsView() {
  const [opened, setOpened] = useState<Notification | null>(null);
  const { data: items = [], isLoading, isError } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const hasUnread = items.some((n) => !n.is_read);

  /**
   * Open it, rather than leave.
   *
   * A click used to push `action_url` straight away, so a notification whose
   * point is what it SAYS — a shop taken offline and why, an application
   * refused and why — could only be navigated away from. `action_url` is a
   * button in the dialog now.
   */
  const onItem = (n: Notification) => {
    if (!n.is_read && n.notification_id) markRead.mutate(n.notification_id);
    setOpened(n);
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
            <li key={n.id}>
              <button
                type="button"
                onClick={() => onItem(n)}
                className={`flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-muted/60 ${
                  n.is_read ? "" : "bg-primary/5"
                }`}
              >
                <span
                  className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full ${TONE_CLASSES[toneFor(n.type)]}`}
                >
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
                  {/* Two lines here, the whole thing in the dialog. The row
                      is a list item; an eight-line message would bury the ones
                      under it. */}
                  <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">
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

      <NotificationDetail
        notification={opened}
        onClose={() => setOpened(null)}
      />
    </div>
  );
}
