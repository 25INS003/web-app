import { describe, expect, it } from "vitest";
import {
  recipientOf,
  shopOrderDetailSchema,
  shopOrderPageSchema,
} from "./shopOrder";

/**
 * `z.object` strips what it does not declare.
 *
 * The address snapshot the checkout writes carries `lat`, `lng`, `landmark`,
 * `full_name` and `phone_number`. The schema declared none of them and named
 * the addresses table's `contact_name` / `contact_phone` instead — so the board
 * received a delivery address with no coordinates and nobody to hand it to,
 * while the API had been sending all of it the whole time.
 *
 * Line images were dropped the same way: `order_items.image_url` is written at
 * checkout and was never declared here.
 */

// Shaped exactly as customer-order.controller.js writes it.
const snapshot = {
  full_name: "Asha Rao",
  phone_number: "9876543210",
  address_line: "12 MG Road",
  landmark: "Opposite the bank",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
  lat: 12.9716,
  lng: 77.5946,
};

const order = (over: Record<string, unknown> = {}) => ({
  id: "11111111-1111-4111-8111-111111111111",
  order_number: "ORD-100049",
  order_status: "confirmed",
  delivery_address_snapshot: snapshot,
  items: [
    {
      product_id: "22222222-2222-4222-8222-222222222222",
      product_name: "Rice 5kg",
      image_url: "https://example.test/rice.jpg",
      quantity: 2,
      unit_price: 250,
      total_price: 500,
    },
  ],
  ...over,
});

const parseOne = (o: Record<string, unknown>) =>
  shopOrderPageSchema.parse({ page: 1, limit: 25, total: 1, orders: [o] })
    .orders[0];

describe("shop order address snapshot", () => {
  it("keeps the coordinates", () => {
    const parsed = parseOne(order());

    expect(parsed.delivery_address_snapshot?.lat).toBe(12.9716);
    expect(parsed.delivery_address_snapshot?.lng).toBe(77.5946);
  });

  // A numeric column can arrive as a string over JSON; a NaN here becomes a
  // broken map link rather than a visible error.
  it("coerces coordinates that arrive as strings", () => {
    const parsed = parseOne(
      order({
        delivery_address_snapshot: { ...snapshot, lat: "12.9716", lng: "77.5946" },
      }),
    );

    expect(parsed.delivery_address_snapshot?.lat).toBe(12.9716);
    expect(parsed.delivery_address_snapshot?.lng).toBe(77.5946);
  });

  it("keeps the landmark", () => {
    expect(parseOne(order()).delivery_address_snapshot?.landmark).toBe(
      "Opposite the bank",
    );
  });

  it("survives an address with no coordinates", () => {
    const bare = { ...snapshot, lat: null, lng: null };
    const parsed = parseOne(order({ delivery_address_snapshot: bare }));

    expect(parsed.delivery_address_snapshot?.lat).toBeNull();
    expect(parsed.delivery_address_snapshot?.address_line).toBe("12 MG Road");
  });
});

describe("recipientOf", () => {
  // The snapshot's names, which is what the checkout actually writes.
  it("reads the snapshot's own field names", () => {
    expect(recipientOf(snapshot)).toEqual({
      name: "Asha Rao",
      phone: "9876543210",
    });
  });

  // An older snapshot may carry the table's names instead.
  it("falls back to the address table's names", () => {
    expect(
      recipientOf({ contact_name: "Ravi", contact_phone: "9000000000" }),
    ).toEqual({ name: "Ravi", phone: "9000000000" });
  });

  it("returns nulls rather than throwing on a missing address", () => {
    expect(recipientOf(null)).toEqual({ name: null, phone: null });
  });
});

describe("shop order lines", () => {
  it("keeps the product image", () => {
    expect(parseOne(order()).items[0].image_url).toBe(
      "https://example.test/rice.jpg",
    );
  });

  it("keeps the product id, so a line can link to the product", () => {
    expect(parseOne(order()).items[0].product_id).toBe(
      "22222222-2222-4222-8222-222222222222",
    );
  });
});

describe("shopOrderDetailSchema", () => {
  it("unwraps the order and keeps its special instructions", () => {
    const parsed = shopOrderDetailSchema.parse({
      order: { ...order(), special_instructions: "Leave at the gate" },
    });

    expect(parsed.order_number).toBe("ORD-100049");
    expect(parsed.special_instructions).toBe("Leave at the gate");
    expect(parsed.delivery_address_snapshot?.lat).toBe(12.9716);
  });

  it("tolerates a missing status history", () => {
    expect(
      shopOrderDetailSchema.parse({ order: order() }).status_logs,
    ).toEqual([]);
  });
});
