"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useSelectedAddress } from "@/features/address/useSelectedAddress";
import { queryKeys } from "@/lib/query/keys";
import { catalogApi } from "./api";
import type { ProductQuery } from "./api";

const PAGE_SIZE = 20;

/**
 * The deliverable catalogue.
 *
 * The pincode is added here rather than by each caller. It is not a filter the
 * customer chose from a panel — it is a fact about where they are, and every
 * list of things to buy is subject to it. Threading it through call sites means
 * one that forgets, and a page that offers what cannot be delivered.
 *
 * It goes into the query key too, so switching address in the header refetches
 * rather than leaving the previous area's products on screen.
 *
 * No address, no filter. A signed-out visitor browsing the whole catalogue is
 * the right default: the alternative is an empty shop for anyone who has not
 * signed in yet.
 */
export function useProducts(filters: Omit<ProductQuery, "page" | "limit">) {
  const { selected } = useSelectedAddress();
  const pincode = selected?.pincode;
  const query = { ...filters, ...(pincode ? { pincode } : {}) };

  return useInfiniteQuery({
    queryKey: queryKeys.products.list("catalog", query),
    queryFn: ({ pageParam }) =>
      catalogApi.getProducts({ ...query, page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < (last.pages ?? 1) ? last.page + 1 : undefined,
  });
}

/** Where the catalogue is currently being filtered to, for empty states. */
export function useDeliveryPincode(): string | undefined {
  return useSelectedAddress().selected?.pincode;
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

/**
 * One product, and whether it can reach the selected address.
 *
 * The pincode is in the key as well as the request: switching address must
 * re-answer "does this deliver to me", and a cached yes from the previous area
 * is the wrong answer to show next to an add-to-cart button.
 */
export function useProduct(id: string) {
  const pincode = useDeliveryPincode();
  return useQuery({
    queryKey: [...queryKeys.products.detail("catalog", id), pincode ?? null],
    queryFn: () => catalogApi.getProduct(id, pincode),
  });
}

export function useProductReviews(id: string) {
  return useQuery({
    queryKey: [...queryKeys.products.detail("catalog", id), "reviews"],
    queryFn: () => catalogApi.getProductReviews(id),
  });
}
