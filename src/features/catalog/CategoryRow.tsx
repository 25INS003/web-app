"use client";

import Link from "next/link";
import { useCategories, useTopCategories } from "./hooks";

const EMOJI: Record<string, string> = {
  "Fruits & Vegetables": "🥦",
  "Dairy & Eggs": "🥚",
  Bakery: "🍞",
  Beverages: "🧃",
  Snacks: "🍪",
  "Staples & Grains": "🌾",
  "Meat & Seafood": "🍗",
  Frozen: "🧊",
  Household: "🧴",
  "Personal Care": "🧼",
};

export function CategoryRow() {
  const top = useTopCategories();
  const all = useCategories();
  // Prefer categories ranked by purchase amount; fall back to the first
  // top-level categories until there's order data to rank by.
  const tops =
    top.data && top.data.length > 0
      ? top.data.slice(0, 10)
      : (all.data ?? []).filter((c) => !c.parent_id).slice(0, 10);

  return (
    <section className="mt-12">
      <h2 className="font-display text-2xl font-semibold tracking-tight">
        Shop by category
      </h2>
      <div className="mt-5 flex flex-wrap gap-2.5">
        {tops.map((c) => (
          <Link
            key={c.id}
            href={`/c/${c.id}`}
            className="group inline-flex items-center gap-2 rounded-full border border-border bg-card py-2 pl-2 pr-4 text-sm font-medium shadow-xs transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <span className="grid size-8 place-items-center rounded-full bg-muted text-base transition group-hover:bg-primary/10">
              {EMOJI[c.name] ?? "🛒"}
            </span>
            {c.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
