"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./ProductCard";
import { useProductPage } from "./hooks";
import type { ProductQuery } from "./api";

/**
 * A titled row of products from one catalogue query.
 *
 * Both home-page rows — best sellers, and everything under ₹99 — are the same
 * component pointed at different filters. They differ in what they ask the API
 * for, not in how they render, and two copies of this markup would be two
 * places to fix the next time a card gains a field.
 *
 * It renders NOTHING when the query comes back empty or fails, the same rule
 * SuggestionRow follows: a heading over an empty band reads as a broken page,
 * and "no product under ₹99 is deliverable to this pincode" is a sentence the
 * visitor does not need read out to them — the rows below still have things to
 * sell. Skeletons only while the first load is in flight, so the row does not
 * pop the content beneath it around.
 */
export function ProductRow({
  title,
  subtitle,
  icon,
  query,
  href,
  limit = 8,
}: {
  title: string;
  subtitle?: string;
  /**
   * A rendered element (`<TrendingUp />`), not a component.
   *
   * This is a client component and the home page that uses it is a server one,
   * where a component prop is a function crossing the boundary — React refuses
   * it ("Functions cannot be passed directly to Client Components") and the
   * page falls back to client rendering with an error. An element is data and
   * serialises. The row supplies the size and colour, so call sites pass the
   * bare glyph.
   */
  icon?: ReactNode;
  /** The catalogue filters. The delivery pincode is added by the hook. */
  query: Omit<ProductQuery, "page" | "limit">;
  /** Where "View all" goes. Omitted, the link is not rendered. */
  href?: string;
  limit?: number;
}) {
  const q = useProductPage(query, limit);
  const items = q.data?.data ?? [];

  if (q.isError || (!q.isPending && items.length === 0)) return null;

  return (
    <section className="mt-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {icon && (
              <span
                aria-hidden
                className="grid place-items-center text-primary [&_svg]:size-4"
              >
                {icon}
              </span>
            )}
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              {title}
            </h2>
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {href && (
          <Button variant="link" className="shrink-0 px-0" asChild>
            <Link href={href}>View all</Link>
          </Button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {q.isPending
          ? Array.from({ length: limit }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="aspect-[4/3] animate-pulse bg-muted" />
                <div className="space-y-2 p-3.5">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))
          : items.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
