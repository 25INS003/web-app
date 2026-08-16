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
    categoryId: categoryIdOf(product),
  };
}

/** `category_id` is either a bare id or a populated `{ id, name }`. */
function categoryIdOf(product: Record<string, unknown>): string {
  const c = product.category_id;
  if (typeof c === "string") return c;
  if (c && typeof c === "object" && "id" in c) return String((c as { id: unknown }).id);
  return "";
}

/**
 * A category that definitely has something in it — taken from a real product
 * rather than picked off the top of the list.
 *
 * The seeded taxonomy is two levels and products hang off the LEAVES, so the
 * parents ("Fruits & Vegetables", "Dairy & Eggs") are legitimately empty. A
 * test that walks the first few categories and expects products is asserting
 * on the shape of the seed, not on the category page working.
 */
export async function findCategoryWithProducts(request: APIRequestContext) {
  const res = await request.get("/api/v1/catalog/get?limit=60");
  const items: Array<Record<string, unknown>> = (await res.json())?.data?.data ?? [];
  for (const p of items) {
    const id = categoryIdOf(p);
    if (id) return { id, productId: String(p.id) };
  }
  throw new Error("no catalog product carried a category — reseed: npm run db:seed");
}
