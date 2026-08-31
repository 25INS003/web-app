import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Address } from "@/lib/api/schemas/address";

// Node's own `localStorage` shadows jsdom's and is unavailable unless node is
// started with --localstorage-file, so `window.localStorage` is undefined here
// while being perfectly ordinary in a browser. An in-memory stand-in, rather
// than dropping the persistence tests: "remembered across a reload" is the
// behaviour worth having, and it would otherwise go uncovered for a reason that
// has nothing to do with the code.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  key(i: number) {
    return [...this.store.keys()][i] ?? null;
  }
  getItem(k: string) {
    return this.store.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.store.set(k, String(v));
  }
  removeItem(k: string) {
    this.store.delete(k);
  }
  clear() {
    this.store.clear();
  }
}

Object.defineProperty(window, "localStorage", {
  value: new MemoryStorage(),
  writable: true,
  configurable: true,
});

let addressList: Address[] = [];
let pending = false;

vi.mock("@/features/checkout/hooks", () => ({
  useAddresses: () => ({ data: addressList, isPending: pending }),
}));

import {
  formatAddressLine,
  resetSelectedAddress,
  useSelectedAddress,
} from "./useSelectedAddress";

const addr = (over: Partial<Address> & { id: string }): Address => ({
  address_line: "12 MG Road",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
  tag: "home",
  ...over,
});

const HOME = addr({ id: "a1", tag: "home" });
const WORK = addr({ id: "a2", tag: "work", address_line: "4 Brigade Road" });

beforeEach(() => {
  addressList = [HOME, WORK];
  pending = false;
  window.localStorage.clear();
  resetSelectedAddress();
});

describe("which address the customer is shopping against", () => {
  it("falls back to the account's default before anything is picked", () => {
    addressList = [HOME, { ...WORK, is_default: true }];
    const { result } = renderHook(() => useSelectedAddress());
    expect(result.current.selected?.id).toBe("a2");
  });

  it("falls back to the first address when none is marked default", () => {
    const { result } = renderHook(() => useSelectedAddress());
    expect(result.current.selected?.id).toBe("a1");
  });

  it("honours an explicit pick over the default", () => {
    addressList = [{ ...HOME, is_default: true }, WORK];
    const { result } = renderHook(() => useSelectedAddress());

    act(() => result.current.select("a2"));

    expect(result.current.selected?.id).toBe("a2");
  });

  it("keeps the header and checkout on the same address", () => {
    // The reason this is a module-level store rather than component state: two
    // hooks in different parts of the tree, one selection. If these could
    // disagree, the header would name one address while the order went to
    // another.
    const header = renderHook(() => useSelectedAddress());
    const checkout = renderHook(() => useSelectedAddress());

    act(() => header.result.current.select("a2"));

    expect(checkout.result.current.selected?.id).toBe("a2");
  });

  it("remembers the choice across a reload", () => {
    const first = renderHook(() => useSelectedAddress());
    act(() => first.result.current.select("a2"));

    // A fresh page: the old tree is gone and the store is cold, but
    // localStorage is not. Unmounting matters — leaving it mounted would have
    // the hydration of the second tree updating the first.
    first.unmount();
    resetSelectedAddress();

    const reloaded = renderHook(() => useSelectedAddress());

    expect(reloaded.result.current.selected?.id).toBe("a2");
  });

  it("ignores a stored address that is not this account's", () => {
    // The key outlives a sign-out, so the next person to use the browser would
    // otherwise inherit a pointer to somebody else's address. It resolves to
    // nothing and falls back rather than being trusted.
    window.localStorage.setItem("nedyway.delivery-address-id", "someone-else");
    resetSelectedAddress();

    const { result } = renderHook(() => useSelectedAddress());

    expect(result.current.selected?.id).toBe("a1");
  });

  it("orders against the address_id mirror, not the row id", () => {
    // place-order matches the string mirror; sending `id` is rejected. The two
    // are usually equal in fixtures, which is exactly why this is pinned.
    addressList = [{ ...HOME, address_id: "mirror-1" }];
    const { result } = renderHook(() => useSelectedAddress());

    expect(result.current.orderAddressId).toBe("mirror-1");
  });

  it("falls back to the row id when there is no mirror", () => {
    const { result } = renderHook(() => useSelectedAddress());
    expect(result.current.orderAddressId).toBe("a1");
  });

  it("has nothing selected, and nothing to order against, with no addresses", () => {
    addressList = [];
    const { result } = renderHook(() => useSelectedAddress());

    expect(result.current.selected).toBeUndefined();
    // Checkout disables "Place order" on this being null.
    expect(result.current.orderAddressId).toBeNull();
  });
});

describe("the one-line form shown in the header", () => {
  it("reads as street, city, pincode", () => {
    expect(formatAddressLine(HOME)).toBe("12 MG Road, Bengaluru, 560001");
  });

  it("skips a missing part rather than leaving a stray comma", () => {
    expect(formatAddressLine(addr({ id: "x", city: "" }))).toBe(
      "12 MG Road, 560001",
    );
  });
});
