import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * One cross, not two.
 *
 * `DialogContent` renders its own close button — a Radix `Close` positioned
 * `absolute top-4 right-4` — and this dialog hand-rolled a second one at
 * exactly the same coordinates, so the header showed two crosses stacked on
 * each other. The built-in is the one that survived: the hand-rolled button
 * wrapped an icon with no text and no aria-label, which is nothing at all to a
 * screen reader.
 */

const { ShopDetailsDialog } = (await import("./ShopDetailsDialog")) as any;

const shop = {
  id: "s1",
  name: "Waiting Mart",
  shop_status: "pending",
  city: "Jammu",
  phone: "9100000000",
  email: "shop@example.com",
};

describe("the shop details dialog", () => {
  it("offers one corner cross and one footer button, and nothing else", () => {
    render(
      <ShopDetailsDialog open onOpenChange={vi.fn()} shop={shop} />,
    );

    // Counting names rather than matching /close/i, because the button that
    // was doubled had NO accessible name — a test that looked for a second
    // thing called "Close" would have passed against the bug it exists to
    // catch. The old dialog rendered three buttons here; it renders two.
    const names = screen
      .getAllByRole("button")
      .map((b) => (b.getAttribute("aria-label") || b.textContent || "").trim())
      // Sorted: `DialogContent` renders its close AFTER the children, so DOM
      // order is the footer's button first. That is an implementation detail
      // of the primitive, not something this test should pin.
      .sort();
    expect(names).toEqual(["Close", "Close Details"]);
  });

  it("still offers the footer's Close Details", () => {
    render(
      <ShopDetailsDialog open onOpenChange={vi.fn()} shop={shop} />,
    );

    // So a fix that removed the wrong one is caught here rather than by an
    // admin with no way out of the dialog.
    expect(
      screen.getByRole("button", { name: /close details/i }),
    ).toBeInTheDocument();
  });

  it("leaves no unnamed button in the header", () => {
    render(
      <ShopDetailsDialog open onOpenChange={vi.fn()} shop={shop} />,
    );

    const unnamed = screen
      .getAllByRole("button")
      .filter(
        (b) => !(b.getAttribute("aria-label") || b.textContent || "").trim(),
      );
    expect(unnamed).toHaveLength(0);
  });
});
