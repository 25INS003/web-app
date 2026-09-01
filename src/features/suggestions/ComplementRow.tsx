"use client";

import { useQuery } from "@tanstack/react-query";
import { Blend } from "lucide-react";
import { ProductCard } from "@/features/catalog/ProductCard";
import { useIsAuthed } from "@/features/auth/useAuth";
import { queryKeys } from "@/lib/query/keys";
import { cn } from "@/lib/utils";
import { useDeliveryPincode } from "@/features/catalog/hooks";
import { complementsApi } from "./api";

/**
 * "Goes well with" — complements rather than lookalikes.
 *
 * Distinct from SuggestionRow: that one finds products SIMILAR to what the
 * customer likes, which for bread means more bread. This finds what completes
 * the basket — butter, jam — from co-purchase data, falling back to a category
 * map where the catalogue has not seen enough baskets yet.
 *
 * Pass `productIds` to ask about specific items (a product page); omit it and
 * the server uses the customer's cart.
 */
export function ComplementRow({
  productIds,
  limit = 4,
  title = "Goes well with",
  className,
}: {
  productIds?: string[];
  limit?: number;
  title?: string;
  className?: string;
}) {
  const isAuthed = useIsAuthed();
  const pincode = useDeliveryPincode();

  const q = useQuery({
    queryKey: [...queryKeys.complements, productIds ?? "cart", limit, pincode ?? null],
    queryFn: () => complementsApi.get(limit, productIds, pincode),
    // Cart-seeded complements must re-fetch as the cart changes, so this shares
    // the cart's staleness rather than caching independently.
    staleTime: 30_000,
    enabled: isAuthed && (productIds ? productIds.length > 0 : true),
    retry: false,
  });

  const items = q.data?.items ?? [];

  // Render nothing rather than an empty box or permanent skeletons — a
  // cross-sell row that never fills just pushes real content down the page.
  if (q.isPending || q.isError || items.length === 0) return null;

  return (
    <section className={cn("mt-10", className)}>
      <div className="flex items-center gap-2">
        <Blend className="size-4 text-primary" />
        <h2 className="font-display text-xl font-semibold tracking-tight">
          {title}
        </h2>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
