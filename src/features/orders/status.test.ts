import { describe, expect, it } from "vitest";
import type { Order } from "@/lib/api/schemas/order";
import {
  formatDate,
  STATUS_FLOW,
  statusBadgeVariant,
  timelineSteps,
} from "./status";

describe("statusBadgeVariant", () => {
  it("maps terminal/edge statuses to their variants", () => {
    expect(statusBadgeVariant("delivered")).toBe("success");
    expect(statusBadgeVariant("cancelled")).toBe("muted");
    expect(statusBadgeVariant("refunded")).toBe("muted");
    expect(statusBadgeVariant("pending")).toBe("warning");
    expect(statusBadgeVariant("preparing")).toBe("default");
  });
});

describe("timelineSteps", () => {
  const order = {
    order_status: "ready",
    order_time: "2026-06-14T10:00:00.000Z",
    accepted_time: "2026-06-14T10:05:00.000Z",
    preparing_time: "2026-06-14T10:10:00.000Z",
    ready_time: "2026-06-14T10:20:00.000Z",
  } as unknown as Order;

  it("marks steps up to the current status as done, current as current", () => {
    const steps = timelineSteps(order);
    expect(steps).toHaveLength(STATUS_FLOW.length);

    const byStep = Object.fromEntries(steps.map((s) => [s.step, s]));
    expect(byStep.pending.done).toBe(true);
    expect(byStep.ready.done).toBe(true);
    expect(byStep.ready.current).toBe(true);
    // Steps after the current one are not done yet.
    expect(byStep.picked_up.done).toBe(false);
    expect(byStep.delivered.done).toBe(false);
  });

  it("threads through the matching timestamp per step", () => {
    const ready = timelineSteps(order).find((s) => s.step === "ready");
    expect(ready?.at).toBe("2026-06-14T10:20:00.000Z");
  });
});

describe("formatDate", () => {
  it("returns an empty string for missing or invalid dates", () => {
    expect(formatDate(null)).toBe("");
    expect(formatDate(undefined)).toBe("");
    expect(formatDate("not-a-date")).toBe("");
  });

  it("formats a valid ISO date", () => {
    expect(formatDate("2026-06-14T10:00:00.000Z")).not.toBe("");
  });
});
