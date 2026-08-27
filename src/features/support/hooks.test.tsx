import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./api", () => ({
  supportApi: {
    getTicket: vi.fn(async () => ({ id: "t1", messages: [] })),
    getTickets: vi.fn(async () => []),
  },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { supportApi } from "./api";
import { useTicket, useTickets } from "./hooks";

// A support thread used to fetch once and never again: no interval, and
// `refetchOnWindowFocus` is off app-wide. So a reply only appeared on a full
// page reload — which is exactly what people reported.
//
// These assert the BEHAVIOUR rather than the option values. Checking
// `refetchInterval === 10_000` only restates the constant; advancing the clock
// and counting fetches is what would catch the option being dropped, renamed,
// or overridden by a default.

const wrapper = ({ children }: { children: ReactNode }) => {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false, staleTime: 0 },
    },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.mocked(supportApi.getTicket).mockClear();
  vi.mocked(supportApi.getTickets).mockClear();
});

afterEach(() => vi.useRealTimers());

describe("useTicket", () => {
  it("keeps fetching the thread without a page reload", async () => {
    renderHook(() => useTicket("t1"), { wrapper });
    await waitFor(() => expect(supportApi.getTicket).toHaveBeenCalledTimes(1));

    await vi.advanceTimersByTimeAsync(10_000);
    await waitFor(() => expect(supportApi.getTicket).toHaveBeenCalledTimes(2));

    await vi.advanceTimersByTimeAsync(10_000);
    await waitFor(() => expect(supportApi.getTicket).toHaveBeenCalledTimes(3));
  });

  it("does not fetch at all without a ticket id", async () => {
    renderHook(() => useTicket(""), { wrapper });
    await vi.advanceTimersByTimeAsync(30_000);
    expect(supportApi.getTicket).not.toHaveBeenCalled();
  });
});

describe("leaving the support page", () => {
  // Polling is scoped by SUBSCRIPTION, not by a route check: React Query runs
  // `refetchInterval` only while a query has a mounted observer, so navigating
  // away stops it without anything having to know what a route is.
  //
  // Worth pinning, because it is the sort of guarantee that reads like an
  // implementation detail until somebody relies on it. The thing it would NOT
  // catch is a support query subscribed from a layout or header — that would
  // poll app-wide, and no test here can see it.
  it("stops polling the thread once the component unmounts", async () => {
    const { unmount } = renderHook(() => useTicket("t1"), { wrapper });
    await waitFor(() => expect(supportApi.getTicket).toHaveBeenCalledTimes(1));

    await vi.advanceTimersByTimeAsync(10_000);
    await waitFor(() => expect(supportApi.getTicket).toHaveBeenCalledTimes(2));

    unmount();

    // Half a minute of wall clock after leaving the page.
    await vi.advanceTimersByTimeAsync(30_000);
    expect(supportApi.getTicket).toHaveBeenCalledTimes(2);
  });

  it("leaves nothing running after the thread unmounts", async () => {
    const { unmount } = renderHook(() => useTicket("t1"), { wrapper });
    await waitFor(() => expect(supportApi.getTicket).toHaveBeenCalledTimes(1));

    unmount();

    // Three minutes after leaving: the timer is gone with the observer, not
    // merely idle.
    await vi.advanceTimersByTimeAsync(180_000);
    expect(supportApi.getTicket).toHaveBeenCalledTimes(1);
  });
});

describe("useTickets", () => {
  it("does not poll at all — only the conversation does", async () => {
    // A list is a glance at what is waiting, where a stale badge costs
    // somebody one extra look. A thread is a live back-and-forth, where a
    // stale view is a reply nobody sees. Only the second earns a timer; the
    // list refetches when the tab regains focus instead.
    renderHook(() => useTickets(), { wrapper });
    await waitFor(() => expect(supportApi.getTickets).toHaveBeenCalledTimes(1));

    // Three minutes of an open support list.
    await vi.advanceTimersByTimeAsync(180_000);
    expect(supportApi.getTickets).toHaveBeenCalledTimes(1);
  });
});
