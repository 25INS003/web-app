"use client";

import { Sparkles } from "lucide-react";
import { ProductCard } from "@/features/catalog/ProductCard";
import { cn } from "@/lib/utils";
import { useSuggestions } from "./useSuggestions";

/**
 * "Suggested for you" — a row of personalised products.
 *
 * Renders nothing at all for signed-out visitors, while suggestions are loading,
 * or when the API returns an empty list. A recommendation row that appears as an
 * empty box or a bank of skeletons that never fill is worse than no row: it
 * pushes the real content down and looks broken.
 */
export function SuggestionRow({
  limit = 8,
  title,
  className,
}: {
  limit?: number;
  title?: string;
  className?: string;
}) {
  const q = useSuggestions(limit);
  const items = q.data?.items ?? [];

  if (q.isPending || q.isError || items.length === 0) return null;

  // Say which it is. A brand-new customer gets the popular fallback, and calling
  // that "picked for you" is a small lie the row does not need to tell.
  const heading =
    title ?? (q.data?.source === "personalised" ? "Suggested for you" : "Popular right now");

  return (
    <section className={cn("mt-12", className)}>
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          {heading}
        </h2>
      </div>
      {q.data?.source === "personalised" && (
        <p className="mt-1 text-sm text-muted-foreground">
          Based on your cart, saved items and recent searches.
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
