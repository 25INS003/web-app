import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Only the navigation is under test here. The stores talk to the API, the
// category picker fetches a tree, and the toast is a portal — none of them say
// anything about where Back goes.
const back = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back, push: vi.fn() }),
  useParams: () => ({}),
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

import { AddProductForm } from "./AddProductForm";

describe("AddProductForm navigation", () => {
  beforeEach(() => back.mockClear());

  // Both callers mount this same form, and neither passes a router. When the
  // form was lifted out of the shop-owner page, `const router = useRouter()`
  // stayed behind on the page — so Back and Cancel referenced an undefined
  // binding and threw on click. Nothing caught it: the reference only
  // evaluates inside the handler, so it type-checks, lints and renders fine,
  // and the page looks correct right up until someone clicks Back.
  it("goes back from the header arrow", () => {
    render(<AddProductForm shopId="shop-1" onCreated={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /go back/i }));

    expect(back).toHaveBeenCalledTimes(1);
  });

  it("goes back from Cancel", () => {
    render(<AddProductForm shopId="shop-1" onCreated={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(back).toHaveBeenCalledTimes(1);
  });

  // Cancel sits inside the <form>; the header arrow sits outside it. Neither
  // may submit — a half-filled draft must not be posted on the way out.
  it("does not submit the form on the way out", () => {
    const onCreated = vi.fn();
    render(<AddProductForm shopId="shop-1" onCreated={onCreated} />);

    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(onCreated).not.toHaveBeenCalled();
  });
});
