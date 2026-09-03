"use client";

import { useEffect, useRef } from "react";

/**
 * Fetch the next page when a sentinel scrolls into view.
 *
 * The data layer was already an infinite query — only the trigger was a button.
 * This watches an element placed after the last card and asks for more before
 * the customer reaches it, so the list reads as continuous rather than paged.
 *
 * `rootMargin` starts the fetch 600px early. Waiting for the sentinel to be
 * actually visible means the customer hits the bottom, stops, and waits — which
 * is a slower "Load more" button with no button.
 *
 * The observer is deliberately torn down and rebuilt when `hasNextPage` or
 * `isFetching` changes: the callback closes over both, and an observer left in
 * place with a stale closure would either fire forever at the end of the list or
 * stop firing after the first page.
 *
 * Returns a ref to attach to the sentinel. Attach it even when there is no next
 * page — the hook simply does not observe.
 */
export function useInfiniteScroll<T extends HTMLElement = HTMLDivElement>({
  hasNextPage,
  isFetching,
  fetchNextPage,
}: {
  hasNextPage: boolean;
  isFetching: boolean;
  fetchNextPage: () => unknown;
}) {
  const ref = useRef<T>(null);

  // Kept in a ref so the effect below does not re-run on every render just
  // because react-query handed back a new function identity.
  //
  // Written in an effect rather than during render: a ref write during render
  // is a side effect, and React may render without committing. The observer
  // fires on intersection, long after the commit, so it always reads the
  // current value.
  const fetchRef = useRef(fetchNextPage);
  useEffect(() => {
    fetchRef.current = fetchNextPage;
  });

  const canLoad = hasNextPage && !isFetching;

  useEffect(() => {
    const el = ref.current;
    if (!el || !canLoad) return;

    // Not every environment provides it — jsdom does not, and neither do very
    // old browsers. Without this the page still works; it just never auto-loads,
    // which is why the manual control stays on screen.
    if (typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) fetchRef.current();
      },
      { rootMargin: "600px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [canLoad]);

  return ref;
}
