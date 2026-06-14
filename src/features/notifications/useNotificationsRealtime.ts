"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/realtime/socket";
import { queryKeys } from "@/lib/query/keys";

// Live notifications: join the user's own room and refetch the feed + unread
// count whenever the backend emits a notification for them.
export function useNotificationsRealtime(userId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    const room = `user:${userId}`;

    const join = () => socket.emit("join-room", room);
    join();
    socket.on("connect", join); // re-join after a reconnect

    const onNotification = () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.list() });
      qc.invalidateQueries({ queryKey: queryKeys.notifications.count() });
    };
    socket.on("notification", onNotification);

    return () => {
      socket.off("notification", onNotification);
      socket.off("connect", join);
    };
  }, [userId, qc]);
}
