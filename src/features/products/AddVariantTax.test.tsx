import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * GST on a variant added to a product that already has one.
 *
 * The edit screen has always had a Tax / GST editor and the API has always
 * accepted `tax` when creating a variant. The ADD form had no such field, so
 * every variant added to an existing product was created untaxed — silently,
 * beside siblings carrying 18%, with nothing on screen saying so and an
 * invoice that was simply short.
 *
 * These assert the payload rather than the inputs: a field that renders but
 * does not reach `addVariant` fixes nothing.
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
  attributes: [],
  tax: [{ name: "GST", rate: 18 }],
  ...over,
});

let variants: Record<string, unknown>[] = [variant()];

// Typed with its parameters so `mock.calls` carries the payload — the
// payload is what these tests are about.
const addVariant = vi.fn(
  async (_productId: string, _payload: Record<string, unknown>) => ({
    id: "var-2",
  }),
);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
  useParams: () => ({ shopId: "shop-1", productId: "prod-1" }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/store/productStore", () => ({
  useProductStore: Object.assign(
    () => ({
      currentProduct: PRODUCT,
      currentVariants: variants,
      getProductDetails: vi.fn(),
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
      addVariant,
      updateVariant: vi.fn(),
      deleteVariant: vi.fn(),
      setVariantActive: vi.fn(),
      uploadVariantImages: vi.fn(async () => true),
      deleteVariantImage: vi.fn(),
      isLoading: false,
    }),
    { getState: () => ({ error: null }) },
  ),
}));
vi.mock("@/components/Dropdowns/CascadingCategorySelect", () => ({
  default: () => <div data-testid="category-select" />,
}));

import { EditProductForm } from "./EditProductForm";

const openAddForm = async () => {
  render(<EditProductForm />);
  fireEvent.click(
    await screen.findByRole("button", { name: /add new variant/i }),
  );
};

/** The add form needs one attribute once the product already has a variant. */
const giveItAnAttribute = () => {
  fireEvent.click(screen.getByRole("button", { name: /\+ add attribute/i }));
  fireEvent.change(screen.getByPlaceholderText(/name \(e\.g\. color\)/i), {
    target: { value: "Size" },
  });
  fireEvent.change(screen.getByPlaceholderText(/value \(e\.g\. red\)/i), {
    target: { value: "1kg" },
  });
};

const submit = async () => {
  fireEvent.click(screen.getByRole("button", { name: /create variant/i }));
  await waitFor(() => expect(addVariant).toHaveBeenCalled());
  return addVariant.mock.calls.at(-1)![1];
};

beforeEach(() => {
  vi.clearAllMocks();
  variants = [variant()];
});

describe("tax on a newly added variant", () => {
  it("offers a Tax / GST field at all", async () => {
    await openAddForm();

    expect(screen.getAllByText(/tax \/ gst/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("button", { name: /\+ add tax/i }).length,
    ).toBeGreaterThan(0);
  });

  it("carries the tax into the create request", async () => {
    await openAddForm();
    giveItAnAttribute();

    const sent = await submit();

    // The whole point: it has to reach `addVariant`, not merely render.
    expect(sent.tax).toEqual([{ name: "GST", rate: 18 }]);
  });

  it("copies the rate from the product's other variants", async () => {
    await openAddForm();

    // GST is a property of what is being sold, so the second size of a thing
    // is taxed like the first. Leaving it blank is how a variant goes out
    // untaxed beside siblings at 18%.
    expect(screen.getByDisplayValue("GST")).toBeInTheDocument();
    expect(screen.getByDisplayValue("18")).toBeInTheDocument();
  });

  it("says the rate was copied rather than typed", async () => {
    await openAddForm();

    // A pre-filled field the owner did not type is one they will not check.
    expect(screen.getByText(/copied from this product/i)).toBeInTheDocument();
  });

  it("lets the owner change what was copied", async () => {
    await openAddForm();
    giveItAnAttribute();

    fireEvent.change(screen.getByDisplayValue("18"), { target: { value: "5" } });
    const sent = await submit();

    expect(sent.tax).toEqual([{ name: "GST", rate: 5 }]);
  });

  it("lets the owner remove it entirely", async () => {
    await openAddForm();
    giveItAnAttribute();

    const taxName = screen.getByDisplayValue("GST");
    const row = taxName.closest("div")!.parentElement!;
    fireEvent.click(within(row).getAllByRole("button")[0]);

    const sent = await submit();
    expect(sent.tax).toEqual([]);
  });

  it("starts empty when no sibling has any tax", async () => {
    variants = [variant({ tax: [] })];
    await openAddForm();

    expect(screen.getByText(/no tax on this variant/i)).toBeInTheDocument();
    expect(screen.queryByText(/copied from this product/i)).not.toBeInTheDocument();
  });

  it("skips a sibling added before the field existed", async () => {
    // A product whose earliest variant carries no tax and a later one that
    // does: seeding from "the first sibling" would reintroduce the very gap
    // this closes.
    variants = [variant({ id: "old", tax: [] }), variant({ id: "new" })];
    await openAddForm();

    expect(screen.getByDisplayValue("18")).toBeInTheDocument();
  });
});
