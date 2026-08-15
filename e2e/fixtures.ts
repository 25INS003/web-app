import type { APIRequestContext } from "@playwright/test";

// Preconditions come from the API, not from hoping the seed cooperated.
//
// The dev seed randomises: which products a shop stocks, and a ~25% chance any
// variant is out of stock. A spec that searches for a word and clicks the first
// card will intermittently land on something it cannot add to a cart, and the
// failure looks like a broken Add-to-cart button rather than an unlucky
// fixture. Asking the API for something that satisfies the precondition makes
// the test deterministic without pinning it to seeded ids.

export async function findInStockProduct(request: APIRequestContext) {
  const res = await request.get("/api/v1/catalog/get?limit=60");
  if (!res.ok()) throw new Error(`catalog read failed: ${res.status()}`);
  const body = await res.json();
  const items: Array<Record<string, unknown>> = body?.data?.data ?? [];

  const product = items.find(
    (p) => p.is_in_stock === true && typeof p.default_variant_id === "string",
  );
  if (!product) {
    throw new Error(
      `no in-stock product with a default variant in ${items.length} listings — reseed: npm run db:seed`,
    );
  }
  return {
    id: String(product.id),
    name: String(product.name),
    shopId: String(product.shop_id ?? ""),
  };
}
