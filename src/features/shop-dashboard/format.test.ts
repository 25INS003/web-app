import { describe, expect, it } from "vitest";
import {
  compactCurrency,
  compactNumber,
  fullCurrency,
  toDelta,
} from "./format";

describe("compactNumber", () => {
  it("leaves small numbers alone", () => {
    expect(compactNumber(0)).toBe("0");
    expect(compactNumber(842)).toBe("842");
  });

  it("compacts using the Indian scale (K / L / Cr)", () => {
    expect(compactNumber(12_900)).toBe("12.9K");
    expect(compactNumber(1_25_000)).toBe("1.3L");
    expect(compactNumber(5_20_00_000)).toBe("5.2Cr");
  });

  it("does not throw on non-finite input", () => {
    expect(compactNumber(Number.NaN)).toBe("0");
    expect(compactNumber(Number.POSITIVE_INFINITY)).toBe("0");
  });
});

describe("currency", () => {
  it("compacts for tiles and axis ticks", () => {
    expect(compactCurrency(12_900)).toBe("₹12.9K");
  });

  it("groups in full for tooltips and tables", () => {
    // Indian grouping: 1,25,000 — not 125,000.
    expect(fullCurrency(1_25_000)).toBe("₹1,25,000");
  });

  it("falls back to zero rather than NaN", () => {
    expect(fullCurrency(Number.NaN)).toBe("₹0");
    expect(compactCurrency(Number.NaN)).toBe("₹0");
  });
});

describe("toDelta", () => {
  it("signs the label and reads the direction", () => {
    expect(toDelta(12)).toEqual({
      label: "+12%",
      direction: "up",
      tone: "positive",
    });
    expect(toDelta(-4)).toEqual({
      label: "-4%",
      direction: "down",
      tone: "negative",
    });
  });

  it("treats zero as flat and neutral, with no sign", () => {
    expect(toDelta(0)).toEqual({
      label: "0%",
      direction: "flat",
      tone: "neutral",
    });
  });

  it("inverts tone when up is bad, keeping direction truthful", () => {
    // e.g. a rising refund rate: still an upward arrow, but a negative tone.
    const delta = toDelta(9, { upIsGood: false });
    expect(delta.direction).toBe("up");
    expect(delta.tone).toBe("negative");
  });

  it("rounds fractional percentages", () => {
    expect(toDelta(12.4).label).toBe("+12%");
    expect(toDelta(12.6).label).toBe("+13%");
  });
});
