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
  const items: Array<Record<string, unknown>> = (await res.json())?.data?.data ?? [];

  // `is_in_stock` on a product is a ROLLUP across its variants, so a product
  // can be "in stock" while the DEFAULT variant — the one the product page
  // preselects and the cart adds — has none. Butter is exactly that: Small at
  // 0, Regular at 99. The page then correctly shows Out of stock and offers no
  // Add-to-cart button, and a test that trusted the rollup reported a broken
  // button. Check the variant the page will actually use.
  for (const p of items) {
    if (!p.is_in_stock || typeof p.default_variant_id !== "string") continue;

    const detail = await request.get(`/api/v1/catalog/id/${p.id}`);
    if (!detail.ok()) continue;
    const body = await detail.json();
    const variants: Array<Record<string, unknown>> = body?.data?.variants ?? [];
    const preselected =
      variants.find((v) => v.id === p.default_variant_id) ?? variants[0];
    if (!preselected || Number(preselected.stock_quantity ?? 0) <= 0) continue;

    return {
      id: String(p.id),
      name: String(p.name),
      shopId: String(p.shop_id ?? ""),
      variantId: String(preselected.id),
      categoryId: categoryIdOf(p),
    };
  }

  throw new Error(
    `no product in ${items.length} listings had a purchasable default variant — reseed: npm run db:seed`,
  );
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
