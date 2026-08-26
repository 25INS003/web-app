"use client";

import {
  ArrowLeft,
  Heart,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressiveImage } from "@/components/ProgressiveImage";
import { useAddToCart } from "@/features/cart/useCart";
import { useAddToWishlist } from "@/features/wishlist/useWishlist";
import {
  productImage,
  reviewerName,
  shopName,
} from "@/lib/api/schemas/catalog";
import { ComplementRow } from "@/features/suggestions/ComplementRow";
import type { ProductVariant } from "@/lib/api/schemas/catalog";
import { cn, formatPrice } from "@/lib/utils";
import { useProduct, useProductReviews } from "./hooks";

export function ProductDetail({ productId }: { productId: string }) {
  const q = useProduct(productId);
  const reviewsQ = useProductReviews(productId);
  const add = useAddToCart();
  const wishlist = useAddToWishlist();
  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const [qty, setQty] = useState(1);

  if (q.isPending) return <DetailSkeleton />;
  if (q.isError || !q.data) return <NotFound />;

  const { product, variants } = q.data;
  const selected =
    variant ?? variants.find((v) => v.is_default) ?? variants[0] ?? null;
  const price = selected?.price ?? product.price;
  const compare = selected?.compare_at_price ?? product.compare_at_price ?? null;
  const stock = selected?.stock_quantity ?? (product.is_in_stock ? 99 : 0);
  const inStock = stock > 0;
  const off = compare && compare > price ? Math.round((1 - price / compare) * 100) : 0;
  const img = selected?.images?.[0]?.url || productImage(product) || null;
  const shop = shopName(product);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <Link
        href="/search"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to shop
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* gallery */}
        <div className="relative aspect-square overflow-hidden rounded-3xl border border-border bg-card">
          {img ? (
            <ProgressiveImage src={img} alt={product.name} className="size-full object-contain p-8" />
          ) : (
            <div className="grid size-full place-items-center bg-gradient-to-br from-primary/10 to-success/10 text-7xl">
              🛒
            </div>
          )}
          {off > 0 && <Badge className="absolute left-4 top-4">{off}% off</Badge>}
        </div>

        {/* info */}
        <div>
          {shop && <p className="text-sm font-medium text-primary">{shop}</p>}
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
            {product.name}
          </h1>
          <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
            {product.rating ? (
              <span className="flex items-center gap-1">
                <Star className="size-4 fill-warning text-warning" />
                {product.rating.toFixed(1)}
                {product.total_ratings ? ` (${product.total_ratings})` : ""}
              </span>
            ) : null}
            {product.brand && <span>· {product.brand}</span>}
          </div>

          <div className="mt-5 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tabular-nums">
              {formatPrice(price)}
            </span>
            {compare && compare > price && (
              <span className="font-mono text-base text-muted-foreground line-through">
                {formatPrice(compare)}
              </span>
            )}
            {product.unit && (
              <span className="text-sm text-muted-foreground">/ {product.unit}</span>
            )}
          </div>

          {variants.length > 1 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium">Size</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const label =
                    v.attributes?.find((a) => a.name === "Size")?.value ?? v.name;
                  const sel = selected?.id === v.id;
                  const oos = (v.stock_quantity ?? 0) <= 0;
                  return (
                    <button
                      key={v.id}
                      data-testid="variant-option"
                      disabled={oos}
                      onClick={() => {
                        setVariant(v);
                        setQty(1);
                      }}
                      className={cn(
                        "rounded-xl border px-4 py-2 text-sm font-medium transition",
                        sel
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/40",
                        oos && "cursor-not-allowed opacity-40 line-through",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <p className="mt-5 text-sm">
            {inStock ? (
              stock <= 10 ? (
                <span className="font-medium text-warning-foreground">
                  Only {stock} left
                </span>
              ) : (
                <span className="font-medium text-success">In stock</span>
              )
            ) : (
              <span className="font-medium text-destructive">Out of stock</span>
            )}
          </p>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex items-center rounded-xl border border-border">
              <button
                onClick={() => setQty((n) => Math.max(1, n - 1))}
                className="grid size-10 place-items-center text-muted-foreground transition hover:text-foreground"
                aria-label="Decrease quantity"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center text-sm font-medium tabular-nums">
                {qty}
              </span>
              <button
                onClick={() => setQty((n) => Math.min(stock || 1, n + 1))}
                className="grid size-10 place-items-center text-muted-foreground transition hover:text-foreground"
                aria-label="Increase quantity"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <Button
              size="lg"
              className="flex-1 gap-2"
              disabled={!inStock || !selected || add.isPending}
              onClick={() =>
                selected && add.mutate({ productVarId: selected.id, quantity: qty })
              }
            >
              {add.isPending ? <Loader2 className="animate-spin" /> : <ShoppingBag />}
              {inStock ? "Add to cart" : "Out of stock"}
            </Button>
            <Button
              size="icon"
              variant="outline"
              aria-label="Save to wishlist"
              disabled={!selected || wishlist.isPending}
              onClick={() =>
                selected &&
                wishlist.mutate({
                  productId: product.id,
                  variantId: selected.id,
                })
              }
            >
              {wishlist.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Heart />
              )}
            </Button>
          </div>

          {product.description && (
            <div className="mt-8 border-t border-border pt-6">
              <h2 className="font-display text-lg font-semibold">
                About this product
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Complements for THIS product specifically — bread here means butter
          and jam, not more bread. Above the reviews because it is a shopping
          action, not reference material. */}
      <ComplementRow productIds={[productId]} limit={4} />

      <ReviewsSection q={reviewsQ} />
    </div>
  );
}

function ReviewsSection({
  q,
}: {
  q: ReturnType<typeof useProductReviews>;
}) {
  const reviews = q.data?.reviews ?? [];
  const avg = q.data?.averageRating;
  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="font-display text-xl font-semibold">
        Reviews{reviews.length ? ` (${reviews.length})` : ""}
      </h2>
      {q.isPending ? (
        <p className="mt-3 text-sm text-muted-foreground">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No reviews yet — be the first after your order.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {avg ? (
            <p className="text-sm text-muted-foreground">
              Average{" "}
              <span className="font-semibold text-foreground">
                {avg.toFixed(1)}
              </span>{" "}
              / 5
            </p>
          ) : null}
          {reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{reviewerName(r)}</span>
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "size-3.5",
                        i < r.rating
                          ? "fill-warning text-warning"
                          : "text-muted-foreground/30",
                      )}
                    />
                  ))}
                </span>
              </div>
              {r.comment && (
                <p className="mt-1.5 text-sm text-muted-foreground">{r.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-3xl bg-muted" />
        <div className="space-y-4">
          <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
          <div className="h-10 w-1/2 animate-pulse rounded bg-muted" />
          <div className="h-12 w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="font-display text-2xl font-bold">Product not found</p>
      <p className="mt-2 text-sm text-muted-foreground">
        It may have been removed or is unavailable.
      </p>
      <Button asChild className="mt-6">
        <Link href="/search">Back to shop</Link>
      </Button>
    </div>
  );
}
