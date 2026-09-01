import { describe, expect, it } from "vitest";
import { addressSchema } from "./address";

/**
 * The map pin has to survive being read back.
 *
 * `z.object` strips keys it does not declare, and the coordinates were declared
 * on the WRITE schema only — so an address was saved with a pin and came back
 * without one. Nothing read them yet, which is the only reason it did not show:
 * reopening a saved address would have found no pin to place on an address that
 * has one. This codebase has lost `product_id`, `brand`, `platform_fee`, `shop`
 * and `cancellation_reason` the same way.
 */
const row = (over: Record<string, unknown> = {}) => ({
  id: "11111111-1111-1111-1111-111111111111",
  address_line: "12 MG Road",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
  ...over,
});

describe("reading a saved address", () => {
  it("keeps the coordinates", () => {
    const parsed = addressSchema.parse(row({ lat: 12.9716, lng: 77.5946 }));

    expect(parsed.lat).toBe(12.9716);
    expect(parsed.lng).toBe(77.5946);
  });

  it("keeps a zero coordinate", () => {
    // Not `toBeFalsy`-adjacent: 0 is a real latitude, and the whole reason the
    // backend needed fixing was code that read it as absent.
    const parsed = addressSchema.parse(row({ lat: 0, lng: 0 }));

    expect(parsed.lat).toBe(0);
    expect(parsed.lng).toBe(0);
  });

  it("accepts an address that has none", () => {
    // Typed by hand — the normal case, and it must not fail the parse and blank
    // the whole address list.
    expect(() => addressSchema.parse(row())).not.toThrow();
    expect(addressSchema.parse(row()).lat).toBeUndefined();
  });

  it("accepts an explicit null", () => {
    // What the column actually holds for an address with no pin.
    expect(addressSchema.parse(row({ lat: null, lng: null })).lat).toBeNull();
  });
});
