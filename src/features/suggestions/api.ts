import { z } from "zod";
import { api } from "@/lib/api/client";
import { catalogProductSchema } from "@/lib/api/schemas/catalog";
import type { CatalogProduct } from "@/lib/api/schemas/catalog";

// The backend returns suggestions in the catalog product shape on purpose, so
// they render through the same ProductCard as everything else.
const suggestionsSchema = z.object({
  // "personalised" vs "popular" — the UI labels the row honestly rather than
  // telling a brand-new customer that a bestseller list was picked for them.
  source: z.enum(["personalised", "popular"]),
  count: z.number(),
  suggestions: z.array(catalogProductSchema),
});

export type Suggestions = {
  source: "personalised" | "popular";
  items: CatalogProduct[];
};

export const suggestionsApi = {
  async get(limit = 8, pincode?: string): Promise<Suggestions> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (pincode) params.set("pincode", pincode);
    const data = suggestionsSchema.parse(
      await api.get<unknown>(`/suggestions?${params.toString()}`),
    );
    return { source: data.source, items: data.suggestions };
  },
};

const complementsSchema = z.object({
  // "co_purchase" = learned from real baskets, "category" = domain default,
  // "blended" = mining filled part of the row and the map topped it up.
  source: z.enum(["co_purchase", "category", "blended", "none"]),
  count: z.number(),
  suggestions: z.array(catalogProductSchema),
});

export type Complements = {
  source: "co_purchase" | "category" | "blended" | "none";
  items: CatalogProduct[];
};

export const complementsApi = {
  /** Omit productIds to use whatever is in the customer's cart. */
  async get(
    limit = 6,
    productIds?: string[],
    pincode?: string,
  ): Promise<Complements> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (productIds?.length) params.set("product_ids", productIds.join(","));
    if (pincode) params.set("pincode", pincode);
    const data = complementsSchema.parse(
      await api.get<unknown>(`/suggestions/complements?${params.toString()}`),
    );
    return { source: data.source, items: data.suggestions };
  },
};
