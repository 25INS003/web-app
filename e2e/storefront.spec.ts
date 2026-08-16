import { expect, test } from "@playwright/test";
import { findCategoryWithProducts, findInStockProduct } from "./fixtures";

// Storefront pages a signed-out visitor sees. These are deliberately data-level
// assertions, not "the page loaded": the whole class of bug this suite exists
// to catch renders a perfect shell around an empty list, answers 200, and logs
// nothing — which is exactly what the `_id` → `id` contract break did.

test.describe("storefront (signed out)", () => {
  test("home lists shops and products", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // The seed creates 10 shops and ~250 products; an empty grid here means the
    // response was rejected, not that the catalogue is empty.
    const cards = page.locator('a[href^="/p/"], a[href^="/c/"]');
    await expect(cards.first()).toBeVisible();
  });

  test("search returns products and each has a price", async ({ page }) => {
    await page.goto("/search?q=milk");
    const first = page.locator('a[href^="/p/"]').first();
    await expect(first).toBeVisible();

    // A rupee amount, not a paise one. DEBT-4c: the API converts at the edge,
    // and a four-or-more-digit price on a grocery item is the tell that it did
    // not — this is the browser-side counterpart of the Postman money check.
    const text = await first.innerText();
    const amounts = [...text.matchAll(/₹\s*([\d,]+(?:\.\d+)?)/g)].map((m) =>
      Number(m[1].replace(/,/g, "")),
    );
    expect(amounts.length, `no price rendered in: ${text}`).toBeGreaterThan(0);
    for (const a of amounts) expect(a, `${a} looks like paise`).toBeLessThan(100000);
  });

  test("a product page shows its details", async ({ page, request }) => {
    // An in-stock product specifically: ~25% of seeded variants have no stock,
    // and those legitimately render no Add-to-cart button.
    const product = await findInStockProduct(request);
    await page.goto(`/p/${product.id}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: /add to cart/i })).toBeVisible();
  });

  test("category browse lists that category's products", async ({ page, request }) => {
    // The category comes from a product that is actually in it. Navigated by id
    // rather than by clicking the home page's category row, which is
    // client-rendered — a link-based test would be asserting on render timing
    // rather than on the category page working.
    const { id, productId } = await findCategoryWithProducts(request);
    await page.goto(`/c/${id}`);
    await expect(page).toHaveURL(/\/c\//);
    await expect(page.locator(`a[href="/p/${productId}"]`)).toBeVisible();
  });

  test("protected pages send a visitor to sign in", async ({ page }) => {
    for (const path of ["/account", "/orders", "/wishlist", "/checkout"]) {
      await page.goto(path);
      await expect(page.getByRole("button", { name: /sign in/i }), `${path} should gate`).toBeVisible();
    }
  });
});
