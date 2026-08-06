"use client";

import { Trophy } from "lucide-react";
import type { TopProduct } from "@/lib/api/schemas/dashboard";
import { compactNumber, fullCurrency } from "./format";

// Comparing magnitude across a handful of named items → horizontal bars in one
// hue, longest first. Horizontal because product names are long and would
// otherwise be rotated or truncated on an x-axis.
//
// Hand-rolled rather than recharts: five bars with labels at the tip is less
// code and more controllable as plain HTML, and it keeps the row semantics
// (name, units, revenue) in the DOM where a screen reader can reach them.

export function TopProducts({
  products,
  loading = false,
}: {
  products: TopProduct[];
  loading?: boolean;
}) {
  // Scale to the largest seller so the bars use the full width.
  const max = products.reduce((peak, p) => Math.max(peak, p.sales), 0) || 1;

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
      <h2 className="font-display text-lg font-bold tracking-tight">
        Top products
      </h2>
      <p className="text-sm text-muted-foreground">
        By units sold this month
      </p>

      {loading ? (
        <ul className="mt-4 space-y-3" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <li key={i} className="h-9 animate-pulse rounded-lg bg-muted" />
          ))}
        </ul>
      ) : products.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          No sales recorded this month yet.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {products.map((product, index) => (
            <li key={`${product.name}-${index}`}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-center gap-1.5 text-sm font-medium">
                  {product.isBest && (
                    <Trophy
                      className="size-3.5 shrink-0 text-chart-1"
                      aria-label="Best seller"
                    />
                  )}
                  <span className="truncate">{product.name}</span>
                </span>
                {/* Value at the tip of the bar, in a text token — never the
                    series color. */}
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                  {compactNumber(product.sales)} ·{" "}
                  <span className="text-foreground">
                    {fullCurrency(product.revenue)}
                  </span>
                </span>
              </div>
              {/* Bar: capped thickness, rounded data-end, grows from a single
                  baseline at the left. */}
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-chart-1"
                  style={{
                    width: `${Math.max((product.sales / max) * 100, product.sales > 0 ? 2 : 0)}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
