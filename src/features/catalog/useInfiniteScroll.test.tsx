import { render } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useInfiniteScroll } from "./useInfiniteScroll";

/**
 * The sentinel drives the fetch, so the conditions under which it must NOT
 * fetch are the interesting ones: at the end of the list, and while a page is
 * already in flight. Getting either wrong produces an unbounded request loop
 * against the catalogue rather than a visible bug.
 */

type Observed = { cb: (entries: unknown[]) => void };
const observers = () =>
  (globalThis.IntersectionObserver as unknown as { instances: Observed[] })
    .instances;

/** Drive an intersection by hand — jsdom does not scroll. */
const intersect = () =>
  act(() => {
    for (const o of observers()) o.cb([{ isIntersecting: true }]);
  });

function Probe(props: {
  hasNextPage: boolean;
  isFetching: boolean;
  fetchNextPage: () => void;
}) {
  const ref = useInfiniteScroll<HTMLDivElement>(props);
  return <div ref={ref} data-testid="sentinel" />;
}

beforeEach(() => {
  observers().length = 0;
});

describe("useInfiniteScroll", () => {
  it("fetches when the sentinel comes into view", () => {
    const fetchNextPage = vi.fn();
    render(
      <Probe hasNextPage isFetching={false} fetchNextPage={fetchNextPage} />
    );

    intersect();

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  // The end of the list. Observing here would fire on every scroll event for
  // the rest of the session.
  it("does not observe when there is no next page", () => {
    const fetchNextPage = vi.fn();
    render(
      <Probe
        hasNextPage={false}
        isFetching={false}
        fetchNextPage={fetchNextPage}
      />
    );

    expect(observers()).toHaveLength(0);
    intersect();
    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  // A page already in flight. Without this the sentinel stays visible while the
  // request runs and asks for the same page repeatedly.
  it("does not observe while a page is already loading", () => {
    const fetchNextPage = vi.fn();
    render(<Probe hasNextPage isFetching fetchNextPage={fetchNextPage} />);

    expect(observers()).toHaveLength(0);
    intersect();
    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  // react-query hands back a fresh function identity on most renders. If the
  // effect depended on it the observer would be torn down and rebuilt
  // constantly, and a rebuild that lands mid-scroll fires again.
  it("keeps one observer across re-renders that only change the callback", () => {
    const { rerender } = render(
      <Probe hasNextPage isFetching={false} fetchNextPage={vi.fn()} />
    );
    const first = observers().length;

    rerender(
      <Probe hasNextPage isFetching={false} fetchNextPage={vi.fn()} />
    );

    expect(observers()).toHaveLength(first);
  });

  it("calls the latest callback, not the one captured at mount", () => {
    const stale = vi.fn();
    const fresh = vi.fn();
    const { rerender } = render(
      <Probe hasNextPage isFetching={false} fetchNextPage={stale} />
    );

    rerender(<Probe hasNextPage isFetching={false} fetchNextPage={fresh} />);
    intersect();

    expect(fresh).toHaveBeenCalledTimes(1);
    expect(stale).not.toHaveBeenCalled();
  });
});
