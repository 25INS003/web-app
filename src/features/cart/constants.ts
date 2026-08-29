/**
 * Mirrors MAX_LINE_QUANTITY in backend/src/services/cart/cart.service.js.
 *
 * The server enforces this on add (and clamps the line, then 400s), so the
 * inputs clamp to it too — otherwise a typed 999 is a guaranteed round-trip to
 * an error toast. Stock is the other ceiling; callers take the lower of the two.
 */
export const MAX_LINE_QUANTITY = 50;

/** Effective max for a line: the server's cap, or stock when that is lower. */
export function maxOrderableQty(stock?: number | null): number {
  if (stock === undefined || stock === null) return MAX_LINE_QUANTITY;
  return Math.max(1, Math.min(MAX_LINE_QUANTITY, stock));
}
