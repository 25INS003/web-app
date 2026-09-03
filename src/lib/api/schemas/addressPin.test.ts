import { describe, expect, it } from "vitest";
import { addressInputSchema } from "./address";

/**
 * An address is not saveable until it has been pinned.
 *
 * `lat`/`lng` were optional, and the outcome was that none of them were ever
 * set — 0 of 75 saved addresses had coordinates, so the shop's delivery screen
 * had nothing to route from. A form that never insists is a form nobody fills.
 *
 * These pin the requirement itself, because the failure it prevents is silent:
 * an address saves fine, looks complete, and is undeliverable.
 */
const typed = {
  contact_name: "Asha",
  contact_phone: "9876543210",
  address_line: "12 MG Road",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
  country: "India",
  tag: "home" as const,
};

describe("address requires a pin", () => {
  it("rejects an address with no coordinates", () => {
    const r = addressInputSchema.safeParse(typed);

    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.path[0])).toEqual(
      expect.arrayContaining(["lat", "lng"]),
    );
  });

  // Half a pin is not a pin — a lone latitude routes nowhere.
  it("rejects a latitude with no longitude", () => {
    expect(addressInputSchema.safeParse({ ...typed, lat: 12.97 }).success).toBe(
      false,
    );
  });

  it("accepts an address that has been pinned", () => {
    const r = addressInputSchema.safeParse({
      ...typed,
      lat: 12.9716,
      lng: 77.5946,
    });

    expect(r.success).toBe(true);
    expect(r.data?.lat).toBe(12.9716);
  });

  // 0,0 is in the Atlantic, but it is a real coordinate and a legitimate value
  // for the schema to accept — rejecting it would be the falsy-zero trap this
  // codebase has already been bitten by more than once.
  it("accepts zero as a coordinate", () => {
    expect(
      addressInputSchema.safeParse({ ...typed, lat: 0, lng: 0 }).success,
    ).toBe(true);
  });

  it.each([
    ["latitude above 90", { lat: 91, lng: 77 }],
    ["latitude below -90", { lat: -91, lng: 77 }],
    ["longitude above 180", { lat: 12, lng: 181 }],
    ["longitude below -180", { lat: 12, lng: -181 }],
  ])("rejects an out-of-range %s", (_label, coords) => {
    expect(addressInputSchema.safeParse({ ...typed, ...coords }).success).toBe(
      false,
    );
  });

  // The customer fixes this on the map, not in the number box, so that is what
  // the message has to say.
  it("names the map in the message", () => {
    const r = addressInputSchema.safeParse(typed);
    const msg = r.error?.issues.find((i) => i.path[0] === "lat")?.message;

    expect(msg).toMatch(/map/i);
  });
});
