import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { queryKeys } from "./keys";

// Recommendations are derived from the cart and wishlist, so those mutations
// invalidate queryKeys.suggestions / queryKeys.complements. That only works if
// the broad key actually PREFIX-MATCHES the specific keys the queries register
// under — invalidating a key nothing matches fails silently, and the symptom is
// just a row that quietly keeps showing stale items.

const seed = (qc: QueryClient, key: readonly unknown[]) =>
  qc.setQueryData(key, { ok: true });

const isStale = (qc: QueryClient, key: readonly unknown[]) =>
  qc.getQueryState(key)?.isInvalidated === true;

describe("recommendation invalidation reaches its queries", () => {
  it("invalidates the complements row however it was parameterised", () => {
    const qc = new QueryClient();
    // Cart-seeded (cart page) and product-seeded (product page) variants.
    const cartRow = [...queryKeys.complements, "cart", 4] as const;
    const productRow = [...queryKeys.complements, ["prod-1"], 4] as const;
    seed(qc, cartRow);
    seed(qc, productRow);

    qc.invalidateQueries({ queryKey: queryKeys.complements });

    expect(isStale(qc, cartRow)).toBe(true);
    expect(isStale(qc, productRow)).toBe(true);
  });

  it("invalidates the suggestions row at any limit", () => {
    const qc = new QueryClient();
    const homeRow = [...queryKeys.suggestions, 8] as const;
    const smallRow = [...queryKeys.suggestions, 4] as const;
    seed(qc, homeRow);
    seed(qc, smallRow);

    qc.invalidateQueries({ queryKey: queryKeys.suggestions });

    expect(isStale(qc, homeRow)).toBe(true);
    expect(isStale(qc, smallRow)).toBe(true);
  });

  it("does not invalidate unrelated queries", () => {
    // A too-broad key would refetch half the app on every cart change.
    const qc = new QueryClient();
    const cart = ["cart"] as const;
    const orders = [...queryKeys.orders.all] as const;
    seed(qc, cart);
    seed(qc, orders);

    qc.invalidateQueries({ queryKey: queryKeys.complements });

    expect(isStale(qc, cart)).toBe(false);
    expect(isStale(qc, orders)).toBe(false);
  });
});
