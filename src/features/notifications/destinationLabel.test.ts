import { describe, expect, it } from "vitest";
import { destinationLabel } from "./NotificationDetail";
import { fullTimestamp, toneFor, TONE_CLASSES } from "./ui";

/**
 * The button in an opened notification, named after where it goes.
 *
 * It said "View details" on every notification, inside a dialog that had just
 * shown the whole message — so it read as "there is more of this to see" when
 * it meant "leave, and go to the shop this is about".
 *
 * The paths below are the ones the server actually sends, taken from the
 * `action_url` values in the notification calls rather than invented.
 */
describe("naming a notification's destination", () => {
  it("names the order page", () => {
    expect(destinationLabel("/orders/abc123")).toBe("View order");
  });

  it("names the product page", () => {
    // `/products/:shopId/view/:productId` — an admin approving or editing a
    // product sends this.
    expect(destinationLabel("/products/shop-1/view/prod-1")).toBe("View product");
  });

  it("names My Shops", () => {
    // Every shop decision lands here: approved, deactivated, suspended,
    // deleted, deletion declined.
    expect(destinationLabel("/myshop")).toBe("Go to My Shops");
  });

  it("names the application page", () => {
    expect(destinationLabel("/status")).toBe("View application");
  });

  it("names the seller dashboard", () => {
    expect(destinationLabel("/dashboard")).toBe("Go to dashboard");
  });

  it("prefers support over the dashboard it sits under", () => {
    // `/dashboard/support` starts with `/dashboard`, so order matters — the
    // longer path has to be tested first or every support link reads "Go to
    // dashboard".
    expect(destinationLabel("/dashboard/support")).toBe("Go to Get help");
  });

  it("names support on the onboarding side too", () => {
    // A seller waiting on approval gets /help; the dashboard is shut to them.
    expect(destinationLabel("/help")).toBe("Go to Get help");
  });

  it("ignores a query string", () => {
    expect(destinationLabel("/myshop?highlight=s1")).toBe("Go to My Shops");
  });

  it("does not mistake a longer word for the route", () => {
    // `/ordering` is not `/orders`. A bare `startsWith` would call it one.
    expect(destinationLabel("/ordering")).toBe("Open");
  });

  it("stays vague rather than guessing wrongly", () => {
    // A route this does not know about gets a word that is unhelpful but
    // true, which beats naming the wrong destination.
    expect(destinationLabel("/some/new/page")).toBe("Open");
  });
});

/**
 * The tone a notification carries.
 *
 * Every notification arrived in the same flat grey circle, so a payment
 * failure and a promotional nudge looked identical and the feed read as one
 * undifferentiated list.
 */
describe("a notification's tone", () => {
  it("marks the good news", () => {
    expect(toneFor("order_delivered")).toBe("positive");
    expect(toneFor("payment_success")).toBe("positive");
    expect(toneFor("product_approved")).toBe("positive");
  });

  it("marks the bad", () => {
    expect(toneFor("payment_failed")).toBe("negative");
    expect(toneFor("order_cancelled")).toBe("negative");
    expect(toneFor("product_rejected")).toBe("negative");
  });

  it("marks the ones asking for attention", () => {
    expect(toneFor("stock_alert")).toBe("warning");
  });

  it("leaves a system alert neutral", () => {
    // The schema maps every UNRECOGNISED type to `system_alert`, and the shop
    // notifications are all unrecognised — so painting this one as a failure
    // would paint "Your shop is live" red.
    expect(toneFor("system_alert")).toBe("neutral");
  });

  it("has a class for every tone", () => {
    for (const tone of ["neutral", "positive", "warning", "negative"] as const) {
      expect(TONE_CLASSES[tone]).toBeTruthy();
    }
  });
});

describe("the full timestamp", () => {
  it("spells the date out, where timeAgo would say '3d'", () => {
    const full = fullTimestamp("2026-06-14T08:44:17.340Z");
    expect(full).toMatch(/June/);
    expect(full).toMatch(/2026/);
  });

  it("says nothing for a missing or unparseable date", () => {
    expect(fullTimestamp(null)).toBe("");
    expect(fullTimestamp("not a date")).toBe("");
  });
});
