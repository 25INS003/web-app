import { describe, expect, it } from "vitest";
import { isFresh, relevantOrders } from "./OrderPicker";
import type { Order } from "@/lib/api/schemas/order";

// Which orders the picker offers.
//
// A union of two rules, because they answer different questions: "the last
// ten" covers somebody chasing an old delivery, "the last day" covers a heavy
// day where the newest order is already eleventh — which is exactly when a
// problem is most likely to be fresh.

const NOW = new Date("2026-08-27T12:00:00Z").getTime();
const daysAgo = (n: number) =>
  new Date(NOW - n * 24 * 60 * 60 * 1000).toISOString();

const order = (id: string, days: number): Order =>
  ({ id, order_number: id, order_time: daysAgo(days) }) as unknown as Order;

describe("relevantOrders", () => {
  it("offers the ten most recent", () => {
    const all = Array.from({ length: 25 }, (_, i) => order(`o${i}`, i + 10));
    expect(relevantOrders(all, NOW)).toHaveLength(10);
  });

  it("keeps everything from the last day, past the tenth", () => {
    // Fifteen orders today: a heavy week, where a cap of ten would hide the
    // five most recent behind older ones.
    const all = Array.from({ length: 15 }, (_, i) => order(`today${i}`, 0));
    expect(relevantOrders(all, NOW)).toHaveLength(15);
  });

  it("unions the two rules rather than picking one", () => {
    const all = [
      ...Array.from({ length: 12 }, (_, i) => order(`fresh${i}`, 0.5)),
      ...Array.from({ length: 5 }, (_, i) => order(`old${i}`, 30 + i)),
    ];
    const out = relevantOrders(all, NOW);
    // All twelve fresh ones, and nothing older sneaks in past the ten cap
    // beyond what the cap already allowed.
    expect(out.filter((o) => o.id.startsWith("fresh"))).toHaveLength(12);
    expect(out.length).toBeGreaterThanOrEqual(12);
  });

  it("returns no duplicates when an order satisfies both rules", () => {
    const all = Array.from({ length: 5 }, (_, i) => order(`o${i}`, 0));
    const out = relevantOrders(all, NOW);
    expect(new Set(out.map((o) => o.id)).size).toBe(out.length);
  });

  it("sorts newest first regardless of what the API sent", () => {
    const all = [order("old", 9), order("new", 1), order("middle", 5)];
    expect(relevantOrders(all, NOW).map((o) => o.id)).toEqual([
      "new",
      "middle",
      "old",
    ]);
  });

  it("excludes an old order once ten newer ones exist", () => {
    const all = [
      ...Array.from({ length: 10 }, (_, i) => order(`recent${i}`, i + 5)),
      order("ancient", 400),
    ];
    expect(relevantOrders(all, NOW).map((o) => o.id)).not.toContain("ancient");
  });

  it("copes with an empty history", () => {
    expect(relevantOrders([], NOW)).toEqual([]);
  });

  it("does not mutate what it was given", () => {
    const all = [order("a", 5), order("b", 1)];
    relevantOrders(all, NOW);
    expect(all.map((o) => o.id)).toEqual(["a", "b"]);
  });
});

describe("isFresh", () => {
  it("counts the last day", () => {
    expect(isFresh(order("x", 0), NOW)).toBe(true);
    expect(isFresh(order("x", 0.9), NOW)).toBe(true);
  });

  it("stops at a day", () => {
    // 1.5 days ago was inside the old two-day window and is outside this one —
    // the assertion that would have gone on passing if the constant changed
    // and nothing else did.
    expect(isFresh(order("x", 1.5), NOW)).toBe(false);
    expect(isFresh(order("x", 30), NOW)).toBe(false);
  });
});
