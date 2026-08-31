import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// A stand-in for the shared socket.io client: records the rooms joined and lets
// a test fire a server event by hand.
const handlers = new Map<string, ((payload: unknown) => void)[]>();
const emitted: { event: string; arg: unknown }[] = [];

const fakeSocket = {
  emit: (event: string, arg: unknown) => emitted.push({ event, arg }),
  on: (event: string, fn: (payload: unknown) => void) => {
    handlers.set(event, [...(handlers.get(event) ?? []), fn]);
  },
  off: (event: string, fn: (payload: unknown) => void) => {
    handlers.set(event, (handlers.get(event) ?? []).filter((h) => h !== fn));
  },
};

/** Deliver a server-sent event to whatever the hook registered. */
const server = (event: string, payload?: unknown) =>
  (handlers.get(event) ?? []).forEach((fn) => fn(payload));

vi.mock("@/lib/realtime/socket", () => ({ getSocket: () => fakeSocket }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { useShopOrdersRealtime } from "./useShopOrdersRealtime";

let qc: QueryClient;

/** The query keys invalidated so far, in call order. */
const invalidatedKeys: unknown[] = [];

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={qc}>{children}</QueryClientProvider>
);

beforeEach(() => {
  handlers.clear();
  emitted.length = 0;
  invalidatedKeys.length = 0;
  qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  // The callback is left unannotated so `filters` is inferred from the method
  // being replaced. Writing the parameter type out by hand means restating
  // react-query's signature, which then has to be kept in step with it.
  vi.spyOn(qc, "invalidateQueries").mockImplementation(async (filters) => {
    invalidatedKeys.push(filters?.queryKey);
  });
});

// The board polls every 30s as well. These cover the push path, which is what
// makes an order appear in the round trip rather than on the next tick.
describe("a shop board listening for new orders", () => {
  it("joins its own shop's room", () => {
    renderHook(() => useShopOrdersRealtime("shop-1"), { wrapper });
    expect(emitted).toContainEqual({ event: "join-shop", arg: "shop-1" });
  });

  it("refreshes the board when an order is placed", () => {
    renderHook(() => useShopOrdersRealtime("shop-1"), { wrapper });
    server("new-order", { orderId: "ORD-1", shopId: "shop-1" });

    // `orders` is the prefix of both the list and the stats keys, so the table
    // and the tab counts refresh together rather than disagreeing.
    expect(invalidatedKeys).toContainEqual(["orders"]);
  });

  it("ignores an order placed at another of the owner's shops", () => {
    // One socket is shared by the whole app, so a multi-shop owner is in more
    // than one room and would otherwise refetch this board on every shop's
    // orders.
    renderHook(() => useShopOrdersRealtime("shop-1"), { wrapper });
    server("new-order", { orderId: "ORD-9", shopId: "shop-2" });

    expect(invalidatedKeys).toHaveLength(0);
  });

  it("re-joins the room after a reconnect", () => {
    // The failure this guards is silent: the server's rooms do not survive a
    // reconnect, so a board that joined only on mount goes quiet after the
    // first network blip — and quiet is indistinguishable from "no orders".
    renderHook(() => useShopOrdersRealtime("shop-1"), { wrapper });
    emitted.length = 0;

    server("connect");

    expect(emitted).toContainEqual({ event: "join-shop", arg: "shop-1" });
  });

  it("stops listening when the board unmounts", () => {
    const { unmount } = renderHook(() => useShopOrdersRealtime("shop-1"), {
      wrapper,
    });
    unmount();
    server("new-order", { orderId: "ORD-1", shopId: "shop-1" });

    expect(invalidatedKeys).toHaveLength(0);
  });

  it("does not join anything before a shop is chosen", () => {
    renderHook(() => useShopOrdersRealtime(undefined), { wrapper });
    expect(emitted).toHaveLength(0);
  });
});
