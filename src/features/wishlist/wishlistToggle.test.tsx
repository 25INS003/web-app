import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WishlistItem } from "@/lib/api/schemas/wishlist";

let items: WishlistItem[] = [];

vi.mock("./api", () => ({
  wishlistApi: {
    getWishlist: vi.fn(async () => items),
    add: vi.fn(async () => {}),
    remove: vi.fn(async () => {}),
  },
}));
vi.mock("@/features/auth/useAuth", () => ({ useIsAuthed: () => true }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { wishlistApi } from "./api";
import { useWishlistToggle } from "./useWishlist";

const PRODUCT = "11111111-1111-1111-1111-111111111111";
const VARIANT = "22222222-2222-2222-2222-222222222222";

const row = (over: Partial<WishlistItem> = {}): WishlistItem =>
  ({
    id: "w1",
    product: { id: PRODUCT, name: "Widget" },
    variant: { id: VARIANT },
    ...over,
  }) as WishlistItem;

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    {children}
  </QueryClientProvider>
);

const hook = (p: string | undefined, v: string | null | undefined) =>
  renderHook(() => useWishlistToggle(p, v), { wrapper });

beforeEach(() => {
  items = [];
  vi.mocked(wishlistApi.add).mockClear();
  vi.mocked(wishlistApi.remove).mockClear();
});

describe("whether a product reads as saved", () => {
  it("is saved when the wishlist holds it", async () => {
    items = [row()];
    const { result } = hook(PRODUCT, VARIANT);

    await waitFor(() => expect(result.current.saved).toBe(true));
  });

  it("is not saved when the wishlist holds something else", async () => {
    items = [row({ id: "w2", product: { id: "other", name: "Other" } })];
    const { result } = hook(PRODUCT, VARIANT);

    await waitFor(() => expect(result.current.saved).toBe(false));
  });

  it("does not mark everything saved when a row has no variant", async () => {
    // The trap: `w.variant?.id === variantId` is TRUE when both are undefined,
    // so one variant-less row would turn every heart on the page red. Both
    // sides are compared against undefined explicitly.
    items = [row({ id: "w3", product: { id: "other", name: "Other" }, variant: null })];
    const { result } = hook(PRODUCT, undefined);

    // Waits on the WISHLIST having loaded, not on a mutation being idle —
    // `isPending` is the save/remove flag and is false from the first render,
    // so waiting on it asserts against an empty list and passes whatever the
    // matching rule does.
    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.saved).toBe(false);
  });

  it("matches on the variant when the product id is absent", async () => {
    items = [row()];
    const { result } = hook(undefined, VARIANT);

    await waitFor(() => expect(result.current.saved).toBe(true));
  });
});

describe("toggling", () => {
  it("saves when it is not saved", async () => {
    const { result } = hook(PRODUCT, VARIANT);
    await waitFor(() => expect(result.current.saved).toBe(false));

    act(() => result.current.toggle());

    await waitFor(() =>
      expect(wishlistApi.add).toHaveBeenCalledWith(PRODUCT, VARIANT),
    );
  });

  it("removes when it is saved, by the wishlist row's own id", async () => {
    // Not the product id — remove takes the wishlist-item id, and passing the
    // wrong one deletes nothing while reporting success.
    items = [row()];
    const { result } = hook(PRODUCT, VARIANT);
    await waitFor(() => expect(result.current.saved).toBe(true));

    act(() => result.current.toggle());

    await waitFor(() => expect(wishlistApi.remove).toHaveBeenCalledWith("w1"));
  });

  it("saves nothing when there is no variant to save", async () => {
    // A wishlist row is keyed by variant, so a product without one cannot be
    // added — better to do nothing than to send a request that will fail.
    const { result } = hook(PRODUCT, null);
    await waitFor(() => expect(result.current.saved).toBe(false));

    act(() => result.current.toggle());

    await new Promise((r) => setTimeout(r, 20));
    expect(wishlistApi.add).not.toHaveBeenCalled();
  });
});
