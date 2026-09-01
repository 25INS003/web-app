import { describe, expect, it } from "vitest";
import { CUSTOMER_CANCELLABLE, STATUS_FLOW } from "./status";

/**
 * How far a customer may cancel their own order.
 *
 * Mirrors CUSTOMER_CANCELLABLE in the backend's customer-order.controller,
 * which is the check that actually decides — this only hides a button that
 * would otherwise produce an error. The two can disagree for a moment (the
 * order moves between the page loading and the button being pressed) and the
 * server wins, but they must not disagree by design.
 */

/** The rule the detail page applies, with the per-shop statuses folded in. */
const canCancel = (parent: string, shops: string[] = []) =>
  CUSTOMER_CANCELLABLE.has(parent) &&
  shops.every((s) => CUSTOMER_CANCELLABLE.has(s));

describe("while the order is still with the shop", () => {
  it.each(["pending", "confirmed", "preparing", "ready"])(
    "offers cancellation at %s",
    (status) => {
      expect(canCancel(status)).toBe(true);
    },
  );
});

describe("once it has left the shop", () => {
  it.each(["picked_up", "in_transit", "delivered"])(
    "does not offer it at %s",
    (status) => {
      expect(canCancel(status)).toBe(false);
    },
  );

  it("does not offer it on an order already cancelled or refunded", () => {
    expect(canCancel("cancelled")).toBe(false);
    expect(canCancel("refunded")).toBe(false);
  });
});

describe("a basket spanning two shops", () => {
  it("hides it when one shop has handed over, though the parent has not", () => {
    // The parent carries one status and a multi-shop basket has one per shop,
    // so reading the parent alone offers a button the server will refuse.
    expect(canCancel("preparing", ["preparing", "picked_up"])).toBe(false);
  });

  it("offers it when every shop is still holding", () => {
    expect(canCancel("preparing", ["preparing", "ready"])).toBe(true);
  });
});

describe("the boundary itself", () => {
  it("is exactly picked_up", () => {
    // Stated against the lifecycle rather than by listing the set again, so
    // adding a status to STATUS_FLOW without deciding which side it falls on
    // shows up here.
    const cutoff = STATUS_FLOW.indexOf("picked_up");
    expect(cutoff).toBeGreaterThan(0);

    for (const [i, status] of STATUS_FLOW.entries()) {
      expect(
        CUSTOMER_CANCELLABLE.has(status),
        `${status} is on the wrong side of the pick-up boundary`,
      ).toBe(i < cutoff);
    }
  });
});
