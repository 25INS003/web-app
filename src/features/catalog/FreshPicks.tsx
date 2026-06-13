"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./ProductCard";
import { useProducts } from "./hooks";

export function FreshPicks() {
  const q = useProducts({});
  const items = (q.data?.pages[0]?.data ?? []).slice(0, 8);

  return (
    <section className="mt-12 pb-16">
      <div className="flex items-end justify-between">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Fresh picks
        </h2>
        <Button variant="link" className="px-0" asChild>
          <Link href="/search">View all</Link>
        </Button>
      </div>

      {q.isPending ? (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
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
          ))}
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
