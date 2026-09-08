import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The request the deactivate action actually sends.
 *
 * `PATCH /variants/:id/status` begins with
 *   `if (typeof is_active !== "boolean") throw new ApiError(400, ...)`
 * and this action sent no body at all — so it answered 400 every time, for
 * every caller. Nothing in the app called it, which is exactly why a broken
 * action sat there unnoticed. Asserting the body, not just the URL, because
 * the URL was never the part that was wrong.
 */

const patch = vi.fn();
const del = vi.fn();

// `@/api/apiClient`, which is what the store imports — mocking the wrong
// module left the real axios instance in place and every assertion failed
// against a spy that was never called.
vi.mock("@/api/apiClient", () => ({
  default: {
    patch: (...args: unknown[]) => patch(...args),
    delete: (...args: unknown[]) => del(...args),
  },
}));
vi.mock("@/store/productStore", () => ({
  useProductStore: { getState: () => ({ updateProductInList: vi.fn() }) },
}));

const { useVariantStore } = await import("./productVariantStore");

beforeEach(() => {
  vi.clearAllMocks();
  patch.mockResolvedValue({ data: { data: { variant: { id: "var-1" }, product: null } } });
  del.mockResolvedValue({ data: {} });
});

describe("deactivating a variant", () => {
  it("sends is_active as a boolean", async () => {
    await useVariantStore.getState().setVariantActive("var-1", false);

    expect(patch).toHaveBeenCalledWith("/variants/var-1/status", {
      is_active: false,
    });
  });

  it("sends true to put it back on sale", async () => {
    await useVariantStore.getState().setVariantActive("var-1", true);

    expect(patch).toHaveBeenCalledWith("/variants/var-1/status", {
      is_active: true,
    });
  });

  it("reports failure rather than swallowing it", async () => {
    patch.mockRejectedValueOnce({
      response: { data: { message: "Variant not found" } },
    });

    const ok = await useVariantStore.getState().setVariantActive("var-1", false);

    expect(ok).toBe(false);
    expect(useVariantStore.getState().error).toBe("Variant not found");
  });
});

describe("deleting a variant", () => {
  it("calls the hard-delete route", async () => {
    await useVariantStore.getState().deleteVariant("var-1");

    expect(del).toHaveBeenCalledWith("/variants/var-1");
  });
});
