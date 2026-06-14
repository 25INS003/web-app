import { afterEach, describe, expect, it, vi } from "vitest";
import { timeAgo } from "./ui";

const NOW = new Date("2026-06-14T12:00:00.000Z").getTime();

afterEach(() => vi.useRealTimers());

function at(msAgo: number) {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  return new Date(NOW - msAgo).toISOString();
}

describe("timeAgo", () => {
  it("returns empty for missing/invalid input", () => {
    expect(timeAgo(null)).toBe("");
    expect(timeAgo(undefined)).toBe("");
    expect(timeAgo("nope")).toBe("");
  });

  it("formats sub-minute as 'just now'", () => {
    expect(timeAgo(at(30_000))).toBe("just now");
  });

  it("formats minutes, hours and days compactly", () => {
    expect(timeAgo(at(5 * 60_000))).toBe("5m");
    expect(timeAgo(at(3 * 60 * 60_000))).toBe("3h");
    expect(timeAgo(at(2 * 24 * 60 * 60_000))).toBe("2d");
  });
});
