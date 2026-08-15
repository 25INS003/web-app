import { expect, test as setup } from "@playwright/test";
import { STATE } from "./paths";

// Sign each role in ONCE and save the cookie jar. Every spec then reuses it via
// `storageState`, which matters for more than speed:
//
// login is rate-limited to 10 per email per 5 minutes, and a suite that signs
// in per test burns that budget in one run — the failure then looks like a
// broken login rather than a throttle. Authenticating once per role per run
// keeps the suite inside the limit however many specs are added.
//
// The auth cookie is httpOnly and same-origin through nginx, so saving the jar
// is exactly what a returning browser would carry.

const USERS = {
  customer: { email: process.env.E2E_EMAIL ?? "bench-customer@example.com", password: process.env.E2E_PASSWORD ?? "BenchPass123!" },
  owner: { email: "bench-owner@example.com", password: "OwnerPass123!" },
  admin: { email: "admin@nedyway.test", password: "AdminPass123!" },
} as const;

for (const role of ["customer", "owner", "admin"] as const) {
  setup(`authenticate ${role}`, async ({ page }) => {
    const { email, password } = USERS[role];
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(
      page,
      `${role} could not sign in. If this is a 429 the login limiter (10 per email per 5 minutes) has been tripped — wait, or restart the backend to clear it.`,
    ).not.toHaveURL(/\/login/);

    await page.context().storageState({ path: STATE[role] });
  });
}
