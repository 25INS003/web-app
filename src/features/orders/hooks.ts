"use client";

import { useQuery } from "@tanstack/react-query";
import { ordersApi } from "./api";

export function useOrders() {
  return useQuery({ queryKey: ["orders"], queryFn: ordersApi.getOrders });
}
