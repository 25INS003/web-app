import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// The card's buttons pull in the cart and wishlist mutations, which is not what
// this file is about — the price row is.
vi.mock("./ProductCardActions", () => ({
  ProductCardActions: () => null,
}));

import { ProductCard } from "./ProductCard";

/**
 * A product saved with `compare_at_price: 0` must not print a stray zero.
 *
 * The guard was `{product.compare_at_price && product.compare_at_price > price
 * && (…)}`. JavaScript short-circuits `0 && …` to `0`, and React renders 0 as a
 * text node — so the card read "₹250 0". It only ever showed up on products
 * added through the form, because the form's blank variant sends 0 while the
 * seeded rows carry null, and `null && …` is null, which React renders as
 * nothing.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const product = (over: Record<string, unknown> = {}): any => ({
  id: "p1",
  product_id: "p1",
  name: "Widget",
  price: 250,
  compare_at_price: null,
  is_in_stock: true,
  ...over,
});

describe("ProductCard price row", () => {
  it("shows no struck-through price when compare_at_price is 0", () => {
    const { container } = render(<ProductCard product={product({ compare_at_price: 0 })} />);

    expect(screen.getByText("₹250")).toBeInTheDocument();
    // The bug rendered a bare "0" as a sibling of the price.
    expect(container.textContent).not.toMatch(/₹250\s*0/);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("shows no struck-through price when compare_at_price is null", () => {
    render(<ProductCard product={product()} />);

    expect(screen.getByText("₹250")).toBeInTheDocument();
    expect(screen.queryByText("₹0")).not.toBeInTheDocument();
  });

  // The feature still has to work: a genuine higher list price is shown.
  it("shows the original price when it is genuinely higher", () => {
    render(<ProductCard product={product({ compare_at_price: 400 })} />);

    expect(screen.getByText("₹250")).toBeInTheDocument();
    expect(screen.getByText("₹400")).toBeInTheDocument();
  });

  // A compare price at or below the selling price is not a discount.
  it("shows nothing when compare_at_price is not above the price", () => {
    render(<ProductCard product={product({ compare_at_price: 250 })} />);

    expect(screen.getAllByText("₹250")).toHaveLength(1);
  });
});
