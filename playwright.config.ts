import { defineConfig, devices } from "@playwright/test";

// E2E runs against the running dev stack (nginx serves the storefront and proxies
// /api to the backend — same-origin, so the httpOnly auth cookies work). Bring the
// stack up first: `docker compose -f docker-compose.dev.yml up -d`.
export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost",
    trace: "on-first-retry",
    headless: true,
  },
  projects: [
    // Signs each role in once and saves the cookie jar; everything else depends
    // on it. Without this each spec logs in for itself and the suite trips the
    // login rate limiter (10 per email per 5 minutes) partway through a run.
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
});
