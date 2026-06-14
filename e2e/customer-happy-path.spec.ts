import { expect, test } from "@playwright/test";

// Critical customer journey against the running dev stack:
// login → browse/search → add to cart → COD checkout → order tracking.
// Uses the seeded bench customer (override via E2E_EMAIL / E2E_PASSWORD).
const EMAIL = process.env.E2E_EMAIL ?? "bench-customer@example.com";
const PASSWORD = process.env.E2E_PASSWORD ?? "BenchPass123!";

test("customer can sign in, add to cart and place a COD order", async ({
  page,
}) => {
  // --- sign in ---
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  // Lands authenticated off the /login route.
  await expect(page).not.toHaveURL(/\/login/);

  // --- browse / search → open a product ---
  await page.goto("/search?q=avocado");
  const firstProduct = page.locator('a[href^="/p/"]').first();
  await expect(firstProduct).toBeVisible();
  await firstProduct.click();
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
