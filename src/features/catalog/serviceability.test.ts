import { describe, expect, it } from "vitest";
import { catalogProductSchema } from "@/lib/api/schemas/catalog";

/**
 * Whether a product can reach the customer is a three-state answer, and the
 * middle one is the trap: `undefined` means the request carried no pincode —
 * "not asked" — which is not "no". Reading a missing value as undeliverable
 * would tell every signed-out visitor that nothing can be delivered to them.
 *
 * ProductDetail derives its whole disabled state from `is_serviceable === false`
 * for exactly that reason, so the parse has to preserve all three.
 */
const base = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Widget",
  price: 100,
};

const parse = (over: Record<string, unknown> = {}) =>
  catalogProductSchema.parse({ ...base, ...over });

describe("is_serviceable survives the parse", () => {
  it("keeps a false", () => {
    // z.object strips undeclared keys, which is how this codebase has lost
    // fields before — the flag arriving and being discarded would leave the
    // button enabled for a shop that cannot deliver.
    expect(parse({ is_serviceable: false }).is_serviceable).toBe(false);
  });

  it("keeps a true", () => {
    expect(parse({ is_serviceable: true }).is_serviceable).toBe(true);
  });

  it("is undefined when the API did not answer", () => {
    expect(parse().is_serviceable).toBeUndefined();
  });
});

describe("the disabled rule", () => {
  // Mirrors ProductDetail: `product.is_serviceable === false`.
  const undeliverable = (v: boolean | undefined) => v === false;

  it("blocks only an explicit no", () => {
    expect(undeliverable(false)).toBe(true);
  });

  it("allows a yes", () => {
    expect(undeliverable(true)).toBe(false);
  });

  it("allows an unanswered question", () => {
    // A signed-out visitor has no address, so nothing was asked. They must not
    // be told the product cannot reach them.
    expect(undeliverable(undefined)).toBe(false);
  });
});
