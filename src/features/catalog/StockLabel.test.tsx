import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StockLabel } from "./StockLabel";

/**
 * The low-stock line has to be readable.
 *
 * It was `text-warning-foreground`, which is the colour meant to sit ON a
 * warning background — near-white in light mode, near-black in dark. On the
 * card's own background that made "Only 7 left" invisible in both themes. It
 * went unnoticed because for a while neither token was defined at all, so the
 * class emitted nothing and the text simply inherited a visible colour; adding
 * the tokens is what turned it white.
 *
 * Asserted as a class rather than a rendered colour because jsdom does not
 * apply the stylesheet — but the pairing rule is the thing that was wrong, and
 * it is checkable.
 */
const FOREGROUND_TOKENS = /text-(warning|success|destructive)-foreground/;

describe("StockLabel", () => {
  it("shows the exact count when stock is low", () => {
    render(<StockLabel stock={7} inStock />);

    expect(screen.getByText("Only 7 left")).toBeInTheDocument();
  });

  // The default threshold is 10, so this is the boundary the bug lived at:
  // every product with ten or fewer in stock rendered its count unreadably.
  it.each([1, 7, 10])("uses the warning hue, not its foreground, at %i", (n) => {
    const { container } = render(<StockLabel stock={n} inStock />);
    const el = container.firstElementChild!;

    expect(el.className).toContain("text-warning");
    expect(el.className).not.toMatch(FOREGROUND_TOKENS);
  });

  it("switches to the plain count above the threshold", () => {
    render(<StockLabel stock={11} inStock />);

    expect(screen.getByText(/11 available/)).toBeInTheDocument();
  });

  it("never uses an on-background token for any state", () => {
    for (const props of [
      { stock: 0, inStock: false },
      { stock: null, inStock: true },
      { stock: 3, inStock: true },
      { stock: 50, inStock: true },
    ] as const) {
      const { container, unmount } = render(<StockLabel {...props} />);
      expect(container.firstElementChild!.className).not.toMatch(
        FOREGROUND_TOKENS
      );
      unmount();
    }
  });
});
