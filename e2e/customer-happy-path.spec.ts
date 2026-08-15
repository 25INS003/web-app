import { expect, test } from "@playwright/test";
import { STATE } from "./paths";
import { findInStockProduct } from "./fixtures";

// The critical customer journey against the running dev stack:
// browse/search → add to cart → COD checkout → order tracking.
// The session comes from auth.setup.ts, which signs in once per run.

test.use({ storageState: STATE.customer });

test("customer can add to cart and place a COD order", async ({ page, request }) => {
  // Start from an empty cart. Runs accumulate lines otherwise, and a line that
  // has since gone out of stock makes placement refuse the whole order — the
  // API is right to (it names the items), but the test would be reporting a
  // stale fixture as a checkout bug.
  await request.delete("/api/v1/cart/clear");

  // --- open a product we know is purchasable ---
  const product = await findInStockProduct(request);
  await page.goto(`/p/${product.id}`);
  await expect(page).toHaveURL(/\/p\//);

  // --- pick an in-stock variant if the product has a size selector, then add ---
  const inStockVariant = page
    .locator('[data-testid="variant-option"]:not([disabled])')
    .first();
  if (await inStockVariant.count()) {
    await inStockVariant.click();
  }
  const addToCart = page.getByRole("button", { name: "Add to cart" });
  await expect(addToCart).toBeEnabled();
  await addToCart.click();

  // --- cart → checkout ---
  await page.goto("/cart");
  await page.getByRole("link", { name: "Proceed to checkout" }).click();
  await expect(page).toHaveURL(/\/checkout/);

  // --- pick an address (COD is the default payment) and place the order ---
  const address = page.getByTestId("checkout-address").first();
  await expect(address).toBeVisible();
  await address.click();

  const placeOrder = page.getByRole("button", { name: "Place order" });
  await expect(placeOrder).toBeEnabled();
  await placeOrder.click();

  // --- order placed → in-place confirmation ---
  await expect(
    page.getByRole("heading", { name: /order placed/i }),
  ).toBeVisible({ timeout: 15_000 });

  // --- open the order and confirm its tracking timeline renders ---
  await page.getByRole("link", { name: "View orders" }).click();
  await expect(page).toHaveURL(/\/orders/);
  const firstOrder = page.locator('a[href^="/orders/"]').first();
  await expect(firstOrder).toBeVisible();
  await firstOrder.click();
  await expect(page).toHaveURL(/\/orders\/.+/);
  await expect(
    page.getByText(/Placed|Confirmed|Preparing|Delivered/i).first(),
  ).toBeVisible();
});
