import { describe, expect, it } from "vitest";
import { asNumber, fromNumericInput } from "./number";

describe("fromNumericInput", () => {
  it("never returns NaN, whatever the input holds", () => {
    // The bug: `parseFloat("")` is NaN, and an empty box is the normal state
    // of a number field the moment someone clears it. That NaN went into
    // state and came back out as `value={NaN}`.
    //
    // NaN is the whole property under test, so this asserts only that — the
    // partial input a user passes through while typing ("1e" on the way to
    // "1e5") parses to a number rather than to nothing, and that is fine.
    for (const raw of ["", "abc", "-", ".", "e", "1e", "1e5", "--3"]) {
      expect(Number.isNaN(fromNumericInput(raw) as number)).toBe(false);
    }
  });

  it("returns empty for input with no number in it at all", () => {
    for (const raw of ["", "abc", "-", ".", "e", "--3"]) {
      expect(fromNumericInput(raw)).toBe("");
    }
  });

  it("keeps the empty box empty rather than forcing a zero", () => {
    // Collapsing to 0 would make the user select the 0 before they could type.
    expect(fromNumericInput("")).toBe("");
    expect(fromNumericInput("")).not.toBe(0);
  });

  it("reads the numbers a price field actually receives", () => {
    expect(fromNumericInput("0")).toBe(0);
    expect(fromNumericInput("49")).toBe(49);
    expect(fromNumericInput("49.50")).toBe(49.5);
    expect(fromNumericInput("-5")).toBe(-5);
  });
});

describe("asNumber", () => {
  it("turns a cleared field back into the number the API expects", () => {
    expect(asNumber("")).toBe(0);
    expect(asNumber("", 1)).toBe(1);
  });

  it("passes real numbers through", () => {
    expect(asNumber(49)).toBe(49);
    expect(asNumber("49.5")).toBe(49.5);
    expect(asNumber(0)).toBe(0);
  });

  it("rejects NaN and Infinity, not just NaN", () => {
    // Infinity is reachable by typing 1e999, and it serialises to null in
    // JSON — so it would arrive at the server as a missing field rather than
    // as an obviously wrong one.
    expect(asNumber(NaN)).toBe(0);
    expect(asNumber(Infinity)).toBe(0);
    expect(asNumber(1e999)).toBe(0);
    expect(asNumber(-Infinity, 1)).toBe(1);
  });
});
