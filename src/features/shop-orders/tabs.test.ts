import { describe, expect, it } from "vitest";
import {
  SHOP_ORDER_STATUSES,
  STATUS_LABEL,
} from "@/lib/api/schemas/shopOrder";
import { OPEN, OUT, ENDED, TERMINAL_ONLY } from "./ShopOrdersView";

// Every status the API can return has to be reachable from some tab.
//
// Twice now a status has been added to the backend and belonged to no view:
// `picked_up` and `in_transit` stranded orders a shop delivered itself, and
// `refunded` had no home at all. Both were invisible rather than wrong, which
// is the hard kind to notice. This fails the moment a status has nowhere to go.
describe("every order status is reachable", () => {
  const ALL = SHOP_ORDER_STATUSES as readonly string[];

  it("belongs to a tab", () => {
    const covered = new Set<string>([
      ...OPEN,
      ...OUT,
      ...ENDED,
      ...TERMINAL_ONLY,
    ]);
    const orphans = ALL.filter((s) => !covered.has(s));
    expect(orphans, "statuses with no tab").toEqual([]);
  });

  it("has a label, so no tab renders a raw enum value", () => {
    const unlabelled = ALL.filter(
      (s) => !STATUS_LABEL[s as keyof typeof STATUS_LABEL],
    );
    expect(unlabelled, "statuses with no label").toEqual([]);
  });
});
