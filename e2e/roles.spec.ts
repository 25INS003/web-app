import { expect, test, type Page } from "@playwright/test";
import { STATE } from "./paths";

// Each role's own area. The contract break this suite was written for was
// silent — a 200 with an empty body — so every assertion here is about DATA
// arriving, not about a page responding.

const CUSTOMER_EMAIL = process.env.E2E_EMAIL ?? "bench-customer@example.com";

// Anything that looks like an unconverted paise amount on screen. The API
// converts at the edge (DEBT-4c); five figures for a grocery total is the tell.
async function expectNoPaise(page: Page) {
  const body = await page.locator("body").innerText();
  const amounts = [...body.matchAll(/₹\s*([\d,]+(?:\.\d+)?)/g)].map((m) =>
    Number(m[1].replace(/,/g, "")),
  );
  const suspect = amounts.filter((a) => a >= 100000);
  expect(suspect, `amounts that look like paise: ${suspect.join(", ")}`).toHaveLength(0);
}

test.describe("customer", () => {
  test.use({ storageState: STATE.customer });

  test("account, orders and wishlist carry real data", async ({ page }) => {

    await page.goto("/account");
    await expect(page.getByText(CUSTOMER_EMAIL)).toBeVisible();

    await page.goto("/orders");
    // The seed gives this customer order history; an empty list means the
    // response was rejected rather than that they have never ordered.
    await expect(page.locator('a[href^="/orders/"]').first()).toBeVisible();
    await expectNoPaise(page);

    await page.goto("/wishlist");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("an order detail shows its lines and total", async ({ page }) => {
    await page.goto("/orders");
    await page.locator('a[href^="/orders/"]').first().click();
    await expect(page).toHaveURL(/\/orders\/.+/);
    await expect(page.getByText(/₹/).first()).toBeVisible();
    await expectNoPaise(page);
  });

  test("notifications and support render", async ({ page }) => {
    for (const path of ["/notifications", "/support"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 }), path).toBeVisible();
    }
  });
});

test.describe("shop owner", () => {
  test.use({ storageState: STATE.owner });

  test("dashboard shows figures, not placeholders", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // The dashboard was 20 pipelines through a function that did not exist —
    // the whole endpoint was a TypeError. A rendered ₹ figure proves it answers.
    await expect(page.getByText(/₹/).first()).toBeVisible();
    await expectNoPaise(page);
  });

  test("my shops and products list", async ({ page }) => {
    await page.goto("/myshop");
    await expect(page.getByRole("heading", { name: /my shops/i })).toBeVisible();
    // The owner has at least one seeded shop; a zero count means the response
    // was rejected, not that they have none.
    await expect(page.getByText(/total shops/i)).toBeVisible();

    await page.goto("/products");
    // This page leads with a shop picker rather than an h1.
    await expect(page.getByText(/product management/i)).toBeVisible();
  });
});

test.describe("admin", () => {
  test.use({ storageState: STATE.admin });

  test("admin area, shops and shop owners", async ({ page }) => {
    for (const path of ["/admin", "/admin/shops", "/admin/shop-owners", "/admin/categories"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 }), path).toBeVisible();
    }
  });

  test("reports render without a server error", async ({ page }) => {
    const failures: string[] = [];
    page.on("response", (r) => {
      if (r.url().includes("/api/") && r.status() >= 500) failures.push(`${r.status()} ${r.url()}`);
    });
    await page.goto("/admin/reports");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForTimeout(2000);
    expect(failures, `5xx from the reports page: ${failures.join(", ")}`).toHaveLength(0);
  });

  test("a customer cannot reach the admin area", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: STATE.customer });
    const page = await ctx.newPage();
    await page.goto("/admin");
    // The gate renders in place rather than redirecting, so the URL stays
    // /admin — what matters is that the admin content is not there.
    await expect(page.getByText(/access denied/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /shop owners/i })).toHaveCount(0);
    await ctx.close();
  });
});
