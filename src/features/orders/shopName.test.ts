// Which shop an order says it came from.
//
// Both order screens printed the literal word "Shop" on every row: the label is
// `orderShopName(o) ?? "Shop"`, and the helper only read a name off a POPULATED
// `shop_id`. The customer order endpoints send a bare uuid there and put the
// name in `shop_details_snapshot`, so the fallback was the only thing that ever
// rendered — a placeholder, shown as if it were a shop's name.

import { describe, expect, it } from "vitest";
import {
  orderSchema,
  orderShopLabel,
  orderShopName,
  shopOrderName,
} from "@/lib/api/schemas/order";

/** A parsed order, so these run against the shape the API really produces. */
const order = (over: Record<string, unknown> = {}) =>
  orderSchema.parse({
    id: "o1",
    order_number: "ORD-1",
    order_status: "pending",
    total_amount: 500,
    items: [],
    ...over,
  });

describe("orderShopName", () => {
  it("reads the snapshot the order was placed with", () => {
    const o = order({
      shop_id: "9d4a6554-88f3-4b05-8556-35749d09d47a",
      shop_details_snapshot: { name: "Harvest Hub" },
    });
    expect(orderShopName(o)).toBe("Harvest Hub");
  });

  it("falls back to a populated shop_id", () => {
    // The shape the detail endpoint uses for the per-shop rows, and what an
    // older payload might carry on the order itself.
    const o = order({ shop_id: { id: "s1", name: "Crust & Co" } });
    expect(orderShopName(o)).toBe("Crust & Co");
  });

  it("prefers the snapshot over a shop that has since been renamed", () => {
    // An order is a record of something that already happened: it should name
    // the shop the customer actually bought from.
    const o = order({
      shop_id: { id: "s1", name: "New Name Groceries" },
      shop_details_snapshot: { name: "Old Name Groceries" },
    });
    expect(orderShopName(o)).toBe("Old Name Groceries");
  });

  it("takes it from the single shop-order line when the parent has none", () => {
    // Orders written before `shop_details_snapshot` existed carry no name on
    // the parent — the seeded ones do exactly this. One shop order means one
    // shop, so the line names it.
    const o = order({
      shop_id: "9d4a6554-0000-0000-0000-0000",
      shop_orders: [{ id: "so1", shop_name: "City Grocers" }],
    });
    expect(orderShopName(o)).toBe("City Grocers");
  });

  it("will not guess from several lines", () => {
    // Two shop orders is two shops; picking the first would name one merchant
    // for an order that spans two.
    const o = order({
      shop_id: "9d4a6554-0000-0000-0000-0000",
      shop_orders: [
        { id: "so1", shop_name: "City Grocers" },
        { id: "so2", shop_name: "Harvest Hub" },
      ],
    });
    expect(orderShopName(o)).toBeUndefined();
  });

  it("is undefined when the payload carries no name at all", () => {
    // Not the string "Shop": the caller decides what to render, and a helper
    // that invents a name would make a missing one impossible to detect.
    expect(orderShopName(order({ shop_id: "9d4a6554-0000-0000-0000-0000" })))
      .toBeUndefined();
  });
});

describe("orderShopLabel", () => {
  it("names the shop for a single-shop order", () => {
    const o = order({ shop_details_snapshot: { name: "Harvest Hub" } });
    expect(orderShopLabel(o)).toBe("Harvest Hub");
  });

  it("counts them for a multi-shop basket", () => {
    // The parent's snapshot is whichever shop was first in the cart, so naming
    // it would attribute the whole order to one of the merchants in it.
    const o = order({
      is_multi_shop: true,
      shop_details_snapshot: { name: "Harvest Hub" },
      shop_orders: [{ id: "so1" }, { id: "so2" }],
    });
    expect(orderShopLabel(o)).toBe("2 shops");
  });

  it("says so without a count when the rows did not come with it", () => {
    const o = order({ is_multi_shop: true, shop_details_snapshot: { name: "Harvest Hub" } });
    expect(orderShopLabel(o)).toBe("Several shops");
  });
});

describe("shopOrderName", () => {
  const lineOf = (over: Record<string, unknown>) =>
    order({ shop_orders: [{ id: "so1", ...over }] }).shop_orders[0];

  it("reads a populated shop_id, which is what the detail sends", () => {
    // This is the one that made a cancelled order say "Cancelled by the shop"
    // with no name: the client read `so.shop`, a key nothing sends.
    expect(shopOrderName(lineOf({ shop_id: { id: "s1", name: "Crust & Co" } }))).toBe(
      "Crust & Co",
    );
  });

  it("reads the flattened shop_name the list sends", () => {
    expect(shopOrderName(lineOf({ shop_name: "Pantry Plus" }))).toBe(
      "Pantry Plus",
    );
  });

  it("prefers the per-shop snapshot", () => {
    expect(
      shopOrderName(
        lineOf({
          shop_details_snapshot: { name: "As Sold" },
          shop_name: "As Now",
        }),
      ),
    ).toBe("As Sold");
  });

  it("is undefined when the line carries no shop", () => {
    expect(shopOrderName(lineOf({}))).toBeUndefined();
  });
});
