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

describe("useTickets", () => {
  it("refreshes the list on a slower beat than the thread", async () => {
    renderHook(() => useTickets(), { wrapper });
    await waitFor(() => expect(supportApi.getTickets).toHaveBeenCalledTimes(1));

    // A list is a glance at what is waiting, not a live conversation — at the
    // thread's interval it should not have moved yet.
    await vi.advanceTimersByTimeAsync(10_000);
    expect(supportApi.getTickets).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(20_000);
    await waitFor(() => expect(supportApi.getTickets).toHaveBeenCalledTimes(2));
  });
});
