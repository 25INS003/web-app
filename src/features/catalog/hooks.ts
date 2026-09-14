"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useSelectedAddress } from "@/features/address/useSelectedAddress";
import { queryKeys } from "@/lib/query/keys";
import { catalogApi } from "./api";
import type { ProductQuery } from "./api";

const PAGE_SIZE = 20;

/**
 * A catalogue query with the delivery pincode folded in.
 *
 * Shared by every catalogue read rather than repeated in each, because the
 * pincode is not one filter among others: it is the difference between a list
 * of things that can be bought and a list of things that cannot. A hook that
 * built its own query would be one refactor away from forgetting it.
 */
function useDeliverableQuery(filters: Omit<ProductQuery, "page" | "limit">) {
  const { selected } = useSelectedAddress();
  const pincode = selected?.pincode;
  return { ...filters, ...(pincode ? { pincode } : {}) };
}

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
  const query = useDeliverableQuery(filters);

  return useInfiniteQuery({
    queryKey: queryKeys.products.list("catalog", query),
    queryFn: ({ pageParam }) =>
      catalogApi.getProducts({ ...query, page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < (last.pages ?? 1) ? last.page + 1 : undefined,
  });
}

/**
 * One page of the deliverable catalogue, for a row rather than a grid.
 *
 * `useProducts` is an infinite query: a home-page row that wants eight
 * products would carry paging state it never advances and fetch twenty rows to
 * render eight of them. This asks for exactly what the row shows.
 *
 * The pincode goes in through the same helper, so a row cannot end up
 * advertising a shop that does not deliver to the address in the header.
 */
export function useProductPage(
  filters: Omit<ProductQuery, "page" | "limit">,
  limit = 8,
) {
  const query = useDeliverableQuery(filters);

  return useQuery({
    // "catalog-row", not "catalog": this caches a single page where
    // `useProducts` caches an infinite query's `{ pages }`, and two different
    // shapes must never meet under one key.
    queryKey: queryKeys.products.list("catalog-row", { ...query, limit }),
    queryFn: () => catalogApi.getProducts({ ...query, page: 1, limit }),
  });
}

/** Where the catalogue is currently being filtered to, for empty states. */
export function useDeliveryPincode(): string | undefined {
  return useSelectedAddress().selected?.pincode;
}

/**
 * Whether anybody delivers to the selected address at all.
 *
 * Asked directly rather than inferred from an empty product page. Empty has two
 * causes that need different words — nobody delivers here, and nothing matched
 * your filters — and a customer outside the delivery area who is told to try
 * another category will go round the whole catalogue to find it equally empty.
 *
 * `notDeliverable` is deliberately not "the opposite of serviceable": while the
 * question is in flight the answer is unknown, and rendering a "we do not
 * deliver here" panel on every page load before the reply arrives would be
 * worse than the bug it fixes. It stays false until the API has actually said
 * no.
 *
 * Cached for the session — which pincodes are covered changes when a shop signs
 * up, not while somebody is shopping.
 */
export function useServiceability() {
  const pincode = useDeliveryPincode();

  const q = useQuery({
    queryKey: [...queryKeys.products.all, "serviceable", pincode],
    queryFn: () => catalogApi.getServiceability(pincode as string),
    enabled: Boolean(pincode),
    staleTime: 10 * 60_000,
    retry: false,
  });

  return {
    pincode,
    isPending: Boolean(pincode) && q.isPending,
    // A failed check must not black out the storefront: if we cannot tell,
    // show the catalogue. The pincode filter still applies underneath.
    notDeliverable: q.data?.serviceable === false,
    shopCount: q.data?.shop_count,
  };
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
