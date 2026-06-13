"use client";

import { useQuery } from "@tanstack/react-query";
import { accountApi } from "./api";

export function useLoyalty() {
  return useQuery({
    queryKey: ["loyalty"],
    queryFn: accountApi.getLoyalty,
    staleTime: 5 * 60 * 1000,
  });
}
