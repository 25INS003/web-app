import { describe, expect, it } from "vitest";
import { productRef } from "./utils";

/**
 * The reference is what someone reads off one tab and looks for on another, so
 * the only property that matters is that the same product always renders the
 * same handle — and that a missing id does not render as "PRD-UNDEFINED".
 */
describe("productRef", () => {
  const id = "aa389f0d-a927-41d0-ac4d-e80479ab5dd0";

  it("is stable for the same id", () => {
    expect(productRef(id)).toBe(productRef(id));
  });

  it("reads as a reference, not a uuid", () => {
    expect(productRef(id)).toBe("PRD-AA389F0D");
  });

  it("differs for different products", () => {
    expect(productRef(id)).not.toBe(
      productRef("bb389f0d-a927-41d0-ac4d-e80479ab5dd0"),
    );
  });

  // A row still loading, or a payload missing the field, must not render a
  // reference that looks real.
  it.each([null, undefined, ""])("renders a dash for %s", (missing) => {
    expect(productRef(missing as string | null | undefined)).toBe("—");
  });
});
