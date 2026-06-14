"use client";

import { useQuery } from "@tanstack/react-query";
import { ordersApi } from "./api";

export function useOrders() {
  return useQuery({ queryKey: ["orders"], queryFn: ordersApi.getOrders });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ["orders", "detail", orderId],
    queryFn: () => ordersApi.getOrder(orderId),
    enabled: Boolean(orderId),
  });
}
