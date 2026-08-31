"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getSocket } from "@/lib/realtime/socket";
import { queryKeys } from "@/lib/query/keys";

type NewOrderEvent = {
  orderId?: string;
  amount?: number;
  shopName?: string;
  customerName?: string;
  shopId?: string;
};

/**
 * New orders land on the board as they are placed, without a reload.
 *
 * The backend has emitted `new-order` into the `<shopId>` room since checkout
 * was written (see customer-order.controller.js) and nothing on the shop side
 * ever joined it, so the board's only source of new work was its 30s poll. A
 * shopkeeper watching the screen saw an order up to half a minute after the
 * customer placed it, which on a food order is a real part of the prep window.
 *
 * The poll stays. This is the fast path, not the only path: sockets are the
 * part of the stack most likely to be quietly unavailable — Redis off, a proxy
 * that does not forward /socket.io, a connection dropped and not yet retried —
 * and a board that shows nothing when the socket is down is worse than one that
 * is 30s behind. Belt and braces, deliberately.
 *
 * Invalidating `orders.all` rather than patching the cached page: a new order
 * changes which page it belongs on, the counts on every tab, and the row order.
 * `orders.all` is a prefix of both the list and the stats keys, so one call
 * refreshes the whole screen consistently instead of leaving the table and the
 * tab counts disagreeing.
 */
export function useShopOrdersRealtime(shopId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!shopId) return;
    const socket = getSocket();

    // Re-joined on every `connect`, not just once: a reconnect gets a new
    // socket id and the server's rooms do not survive it, so a board that
    // joined only on mount would go quiet after the first blip — and quiet
    // looks exactly like "no orders".
    const join = () => socket.emit("join-shop", shopId);
    join();
    socket.on("connect", join);

    const onNewOrder = (payload: NewOrderEvent) => {
      // One shared socket for the app, and an owner with several shops can be
      // in more than one room. Only react to this board's shop.
      if (payload?.shopId && payload.shopId !== shopId) return;

      qc.invalidateQueries({ queryKey: queryKeys.orders.all });

      // Announced, because the point is to not have to watch the screen. The
      // order number is what the shopkeeper will look for in the table.
      toast.success(
        payload?.orderId ? `New order ${payload.orderId}` : "New order",
        { description: payload?.customerName },
      );
    };

    socket.on("new-order", onNewOrder);

    return () => {
      socket.off("new-order", onNewOrder);
      socket.off("connect", join);
    };
  }, [shopId, qc]);
}
