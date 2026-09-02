import { cn } from "@/lib/utils";

/**
 * Shows the real remaining count when the API gave us one.
 *
 * `stock` is deliberately `number | null | undefined`: variant rows carry
 * stock_quantity, but some list payloads only carry the is_in_stock boolean.
 * Unknown falls back to a bare "In stock" rather than inventing a figure —
 * printing a made-up number next to "left" is worse than printing nothing.
 */
export function StockLabel({
  stock,
  inStock,
  className,
  lowThreshold = 10,
}: {
  stock?: number | null;
  inStock: boolean;
  className?: string;
  lowThreshold?: number;
}) {
  if (!inStock || stock === 0) {
    return (
      <span className={cn("font-medium text-destructive", className)}>
        Out of stock
      </span>
    );
  }

  if (stock === undefined || stock === null) {
    return (
      <span className={cn("font-medium text-success", className)}>In stock</span>
    );
  }

  if (stock <= lowThreshold) {
    return (
      <span className={cn("font-medium text-warning", className)}>
        Only {stock} left
      </span>
    );
  }

  return (
    <span className={cn("font-medium text-success", className)}>
      In stock · {stock} available
    </span>
  );
}
