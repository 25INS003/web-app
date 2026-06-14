"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/realtime/socket";

type OrderStatusEvent = { orderId?: string; order_id?: string; status?: string };

// Live order tracking: join the order's room and refetch the order (and the
// orders list) whenever the backend emits a status change for it.
export function useOrderRealtime(orderId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!orderId) return;
    const socket = getSocket();
    const room = `order:${orderId}`;

    const join = () => socket.emit("join-room", room);
    join();
    socket.on("connect", join); // re-join after a reconnect

    const onStatus = (payload: OrderStatusEvent) => {
      // Shared socket may be in several order rooms; only react to this one.
      if (payload?.orderId && payload.orderId !== orderId) return;
      qc.invalidateQueries({ queryKey: ["orders", "detail", orderId] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    };
    socket.on("order-status", onStatus);

    return () => {
      socket.off("order-status", onStatus);
      socket.off("connect", join);
    };
  }, [orderId, qc]);
}
