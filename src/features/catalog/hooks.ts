"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { catalogApi } from "./api";
import type { ProductQuery } from "./api";

const PAGE_SIZE = 20;

export function useProducts(filters: Omit<ProductQuery, "page" | "limit">) {
  return useInfiniteQuery({
    queryKey: queryKeys.products.list("catalog", filters),
    queryFn: ({ pageParam }) =>
      catalogApi.getProducts({ ...filters, page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < (last.pages ?? 1) ? last.page + 1 : undefined,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: catalogApi.getCategories,
    staleTime: 5 * 60_000,
  });
}

export function useTopCategories() {
  return useQuery({
    queryKey: [...queryKeys.categories, "top"],
    queryFn: catalogApi.getTopCategories,
    staleTime: 5 * 60_000,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail("catalog", id),
    queryFn: () => catalogApi.getProduct(id),
  });
}

export function useProductReviews(id: string) {
  return useQuery({
    queryKey: [...queryKeys.products.detail("catalog", id), "reviews"],
    queryFn: () => catalogApi.getProductReviews(id),
  });
}
