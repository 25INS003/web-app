import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Taking a variant off sale, and deleting it.
 *
 * The edit screen offered exactly one way to stop selling a variant:
 * "Delete Variant", which destroys its price, SKU, stock history and images
 * for good. An owner with one size out of stock for a fortnight had to delete
 * it and rebuild it afterwards.
 *
 * The endpoint for the reversible version has existed all along — and so has
 * a store action for it, which sent no body at all against a handler whose
 * first line rejects a request without `is_active`. It could never have
 * succeeded; nothing called it, so nobody found out.
 */

const PRODUCT = {
  id: "prod-1",
  name: "Spinach",
  description: "Fresh spinach",
  brand: "DailyGood",
  is_available: true,
  category_id: "cat-1",
  main_image_url: "https://media.example/spinach.png",
};

const variant = (over: Record<string, unknown> = {}) => ({
  id: "var-1",
  name: "500g",
  price: 40,
  stock_quantity: 12,
  sku: "SPIN-500",
  is_active: true,
  images: [],
  // An array, like the presenter sends — the form maps over it.
  attributes: [],
  ...over,
});

let variants: Record<string, unknown>[] = [variant()];

const getProductDetails = vi.fn();
const setVariantActive = vi.fn(async () => true);
const deleteVariant = vi.fn(async () => true);
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
  useParams: () => ({ shopId: "shop-1", productId: "prod-1" }),
}));
vi.mock("sonner", () => ({
  toast: {
    success: (...a: unknown[]) => toastSuccess(...a),
    error: (...a: unknown[]) => toastError(...a),
  },
}));
vi.mock("@/store/productStore", () => ({
  useProductStore: Object.assign(
    () => ({
      currentProduct: PRODUCT,
      currentVariants: variants,
      getProductDetails,
      updateProduct: vi.fn(),
      uploadProductImages: vi.fn(),
      deleteProductMainImage: vi.fn(),
      isLoading: false,
    }),
    { getState: () => ({ error: null }) },
  ),
}));
vi.mock("@/store/productVariantStore", () => ({
  useVariantStore: Object.assign(
    () => ({
      addVariant: vi.fn(),
      updateVariant: vi.fn(),
      deleteVariant,
      setVariantActive,
      uploadVariantImages: vi.fn(),
      deleteVariantImage: vi.fn(),
      isLoading: false,
    }),
    { getState: () => ({ error: "Something the server said" }) },
  ),
}));
vi.mock("@/components/Dropdowns/CascadingCategorySelect", () => ({
  default: () => <div data-testid="category-select" />,
}));

import { EditProductForm } from "./EditProductForm";

/** The variant card is collapsed until its Edit button is pressed. */
const openVariant = async () => {
  render(<EditProductForm />);
  const toggles = await screen.findAllByRole("button", { name: /^edit$/i });
  fireEvent.click(toggles[0]);
};

const btn = (name: RegExp) => screen.queryByRole("button", { name });

beforeEach(() => {
  vi.clearAllMocks();
  variants = [variant()];
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

describe("a variant's deactivate and delete", () => {
  it("offers Deactivate beside Delete", async () => {
    await openVariant();

    expect(btn(/deactivate/i)).toBeInTheDocument();
    expect(btn(/delete variant/i)).toBeInTheDocument();
  });

  it("sends an explicit false rather than a toggle", async () => {
    await openVariant();

    fireEvent.click(btn(/deactivate/i)!);

    // Explicit, so two tabs both pressing "Deactivate" agree on the outcome
    // instead of flipping it twice.
    await waitFor(() => expect(setVariantActive).toHaveBeenCalledWith("var-1", false));
  });

  it("warns before taking it off sale, and says it is reversible", async () => {
    await openVariant();

    fireEvent.click(btn(/deactivate/i)!);

    const asked = vi.mocked(window.confirm).mock.calls[0][0];
    expect(asked).toMatch(/turn it back on/i);
  });

  it("offers Activate instead once it is off sale", async () => {
    variants = [variant({ is_active: false })];
    await openVariant();

    expect(btn(/^activate$/i)).toBeInTheDocument();
    expect(btn(/deactivate/i)).not.toBeInTheDocument();
  });

  it("turns it back on without asking", async () => {
    variants = [variant({ is_active: false })];
    await openVariant();

    fireEvent.click(btn(/^activate$/i)!);

    // Putting something back on sale is not a destructive act.
    expect(window.confirm).not.toHaveBeenCalled();
    await waitFor(() => expect(setVariantActive).toHaveBeenCalledWith("var-1", true));
  });

  it("marks an off-sale variant on the collapsed card", async () => {
    variants = [variant({ is_active: false })];
    await openVariant();

    // Otherwise the owner has to open every card to find out what customers
    // can actually buy.
    expect(screen.getByText(/off sale/i)).toBeInTheDocument();
  });

  it("says nothing on a card that is selling", async () => {
    await openVariant();

    expect(screen.queryByText(/off sale/i)).not.toBeInTheDocument();
  });

  it("points at Deactivate when warning about the delete", async () => {
    await openVariant();

    fireEvent.click(btn(/delete variant/i)!);

    // The whole reason this was worth adding: an owner reaching for Delete
    // usually means Deactivate.
    const asked = vi.mocked(window.confirm).mock.calls[0][0];
    expect(asked).toMatch(/deactivate/i);
    expect(asked).toMatch(/cannot be undone/i);
  });

  it("does not call the server when the warning is declined", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    await openVariant();

    fireEvent.click(btn(/deactivate/i)!);
    fireEvent.click(btn(/delete variant/i)!);

    expect(setVariantActive).not.toHaveBeenCalled();
    expect(deleteVariant).not.toHaveBeenCalled();
  });

  it("reports a refusal in the server's own words", async () => {
    setVariantActive.mockResolvedValueOnce(false as never);
    await openVariant();

    fireEvent.click(btn(/deactivate/i)!);

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("Something the server said"),
    );
    expect(toastSuccess).not.toHaveBeenCalled();
  });
});
