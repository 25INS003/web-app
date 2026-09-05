import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The saved main image, and whether the edit screen shows it.
//
// Hydrating `existingImage` was guarded on `currentProduct.main_image` — the
// mongoose-era NESTED OBJECT, which no longer exists; the row carries
// `main_image_url` and `main_image_alt` columns. The guard could therefore
// never be true, so the picture never loaded into local state and the screen
// offered an empty "Click to upload" box for a product that already had an
// image. Both the admin and the shop-owner edit routes mount this same form,
// which is why it was reported on both.

const PRODUCT = {
  id: "prod-1",
  name: "Spinach",
  description: "Fresh spinach",
  brand: "DailyGood",
  is_available: true,
  category_id: "cat-1",
  main_image_url: "https://media.example/spinach.png",
};

const getProductDetails = vi.fn();
let product: Record<string, unknown> | null = PRODUCT;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
  useParams: () => ({ shopId: "shop-1", productId: "prod-1" }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/store/productStore", () => ({
  useProductStore: Object.assign(
    () => ({
      currentProduct: product,
      currentVariants: [],
      getProductDetails,
      updateProduct: vi.fn(),
      uploadProductImages: vi.fn(),
      deleteProductMainImage: vi.fn(),
      isLoading: false,
    }),
    { getState: () => ({ error: null }) }
  ),
}));
vi.mock("@/store/productVariantStore", () => ({
  useVariantStore: () => ({
    addVariant: vi.fn(),
    updateVariant: vi.fn(),
    deleteVariant: vi.fn(),
    uploadVariantImages: vi.fn(),
    deleteVariantImage: vi.fn(),
    isLoading: false,
  }),
}));
vi.mock("@/components/Dropdowns/CascadingCategorySelect", () => ({
  default: () => <div data-testid="category-select" />,
}));

import { EditProductForm } from "./EditProductForm";

describe("EditProductForm main image", () => {
  beforeEach(() => {
    product = PRODUCT;
    getProductDetails.mockClear();
  });

  it("shows the image the product already has", async () => {
    render(<EditProductForm />);

    const img = await screen.findByAltText("Product");
    expect(img).toHaveAttribute("src", PRODUCT.main_image_url);
  });

  it("labels it as saved rather than as a new upload", async () => {
    render(<EditProductForm />);

    // The badge is how an owner tells "this is on the server" from "this is
    // the file I just picked" — it only renders on the image itself.
    expect(await screen.findByText("Saved")).toBeInTheDocument();
  });

  it("offers the upload box when there is genuinely no image", async () => {
    product = { ...PRODUCT, main_image_url: null };

    render(<EditProductForm />);

    await waitFor(() =>
      expect(screen.getByText(/click to upload/i)).toBeInTheDocument()
    );
    expect(screen.queryByAltText("Product")).not.toBeInTheDocument();
  });
});
