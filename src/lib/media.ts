/**
 * Media-URL helpers for the bucket service.
 *
 * The bucket stores each raster upload as two JPEGs and serves both from the
 * same URL: the full-size image by default, and a small, heavily-compressed
 * preview at `?size=small`. The UI fetches the preview first for a fast first
 * paint and swaps in the full image behind it (see `ProgressiveImage`).
 *
 * Only OUR bucket URLs carry a `small` variant. External / seed image hosts
 * (themealdb, wikimedia, randomuser) do not, so the query param must never be
 * appended to them — it would 404 or, at best, be ignored while needlessly
 * splitting the browser cache. Everything here is gated on `isBucketMedia`.
 */

/** True for a URL served by our media bucket, relative or absolute. */
export function isBucketMedia(url: string): boolean {
  return url.includes("/media_api/");
}

/**
 * The small-preview URL for a bucket image, or `null` when there is no preview
 * to fetch (a non-bucket host, or no URL at all).
 *
 * Uses the URL parser rather than string concatenation so an existing query
 * string is preserved and both relative (`/media_api/…`) and absolute
 * (`http://host/media_api/…`) forms are handled correctly. Relative inputs are
 * parsed against a throwaway base and re-serialised path-only, so the base host
 * never leaks into the result.
 */
export function smallVariant(url: string | null | undefined): string | null {
  if (!url || !isBucketMedia(url)) return null;
  try {
    const isAbsolute = /^https?:\/\//i.test(url);
    const u = new URL(url, "http://_");
    u.searchParams.set("size", "small");
    return isAbsolute ? u.toString() : `${u.pathname}${u.search}`;
  } catch {
    // Conservative fallback if URL() ever rejects the input.
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}size=small`;
  }
}
