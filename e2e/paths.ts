import path from "node:path";

// Where auth.setup.ts saves each role's cookie jar. In its own module because
// Playwright forbids a spec importing a test file, and both the setup project
// and every spec need these paths.
export const STATE = {
  customer: path.join(__dirname, ".auth", "customer.json"),
  owner: path.join(__dirname, ".auth", "owner.json"),
  admin: path.join(__dirname, ".auth", "admin.json"),
};
