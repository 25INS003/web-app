import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Where the add/view product screens send the shop owner.
 *
 * Covers a pair of history bugs that were invisible to type-checking: after
 * creating a product, "Back to Products" landed the owner in an empty add
 * form, because the button called `router.back()` while the previous history
 * entry was the form they had just submitted.
 */
const push = vi.fn();
const replace = vi.fn();
const back = vi.fn();
let params: Record<string, string> = {};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace, back }),
  useParams: () => params,
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/store/productStore", () => ({
  useProductStore: () => ({
    createProduct: vi.fn(),
    uploadProductImages: vi.fn(),
    isLoading: false,
  }),
}));
vi.mock("@/store/productVariantStore", () => ({
  useVariantStore: () => ({ uploadVariantImages: vi.fn() }),
}));
vi.mock("@/components/Dropdowns/CascadingCategorySelect", () => ({
  default: () => <div data-testid="category-select" />,
}));

// The form itself is covered by AddProductForm.test.tsx. Here it only needs to
// hand back a product id so the wrapper's `onCreated` can be observed.
vi.mock("@/features/products/AddProductForm", () => ({
  AddProductForm: ({
    shopId,
    onCreated,
  }: {
    shopId: string;
    onCreated: (id: string) => void;
  }) => (
    <button type="button" data-shop={shopId} onClick={() => onCreated("p-9")}>
      create
    </button>
  ),
}));

import AddProductPage from "./[shopId]/add/page";

describe("after creating a product", () => {
  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
    back.mockClear();
    params = { shopId: "shop-1" };
  });

  it("lands on the new product", () => {
    render(<AddProductPage />);
    fireEvent.click(screen.getByText("create"));

    expect(replace).toHaveBeenCalledWith("/products/shop-1/view/p-9");
  });

  // The spent form must not remain in history. `push` would leave the browser
  // Back button pointing at a filled-in form whose product already exists, and
  // resubmitting it would create a duplicate.
  it("does not leave the add form in history", () => {
    render(<AddProductPage />);
    fireEvent.click(screen.getByText("create"));

    expect(push).not.toHaveBeenCalled();
  });
});
