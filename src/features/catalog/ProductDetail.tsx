"use client";

import {
  ArrowLeft,
  Heart,
  Loader2,
  ShoppingBag,
  Star,
  Store,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QuantityInput } from "@/components/ui/quantity-input";
import { ProgressiveImage } from "@/components/ProgressiveImage";
import { maxOrderableQty } from "@/features/cart/constants";
import { StockLabel } from "./StockLabel";
import { useAddToCart } from "@/features/cart/useCart";
import { useWishlistToggle } from "@/features/wishlist/useWishlist";
import {
  productImage,
  reviewerName,
  shopName,
} from "@/lib/api/schemas/catalog";
import { ComplementRow } from "@/features/suggestions/ComplementRow";
import type { ProductVariant } from "@/lib/api/schemas/catalog";
import { cn, formatPrice } from "@/lib/utils";
import { useDeliveryPincode, useProduct, useProductReviews } from "./hooks";

export function ProductDetail({ productId }: { productId: string }) {
  const q = useProduct(productId);
  const reviewsQ = useProductReviews(productId);
  const add = useAddToCart();
  const [variant, setVariant] = useState<ProductVariant | null>(null);
  const [qty, setQty] = useState(1);

  const deliveryPincode = useDeliveryPincode();

  // Resolved here rather than from `selected` below, because hooks cannot be
  // called after the early returns and `selected` is computed past them. The
  // same precedence: an explicit pick, then the flagged default, then the first.
  const variantsForWishlist = q.data?.variants ?? [];
  const selectedVariantId =
    variant?.id ??
    variantsForWishlist.find((v) => v.is_default)?.id ??
    variantsForWishlist[0]?.id;

  // The same hook the card uses, so one product reads the same in both places.
  // This button previously only ever ADDED: the heart never went red, and
  // pressing it twice saved the same thing twice.
  const wishlist = useWishlistToggle(productId, selectedVariantId);

  if (q.isPending) return <DetailSkeleton />;
  if (q.isError || !q.data) return <NotFound />;

  const { product, variants } = q.data;
  const selected =
    variant ?? variants.find((v) => v.is_default) ?? variants[0] ?? null;
  const price = selected?.price ?? product.price;
  const compare = selected?.compare_at_price ?? product.compare_at_price ?? null;
  // null means "the payload didn't tell us" — distinct from 0. The old code
  // collapsed both into a number and used 99 as the unknown case, which is fine
  // for capping the stepper but can't be shown to a customer as a real count.
  const stock = selected?.stock_quantity ?? null;
  const inStock = stock === null ? !!product.is_in_stock : stock > 0;
  const maxQty = maxOrderableQty(stock);
  const off = compare && compare > price ? Math.round((1 - price / compare) * 100) : 0;
  const img = selected?.images?.[0]?.url || productImage(product) || null;
  const shop = shopName(product);

  // `undefined` means the request carried no pincode — "not asked", which is
  // not "no". Only an explicit false is a shop that does not deliver here, so a
  // signed-out visitor is never told a product cannot reach them.
  const undeliverable = product.is_serviceable === false;

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
          {/* Same icon + hidden-label pairing the cart uses, so "who sells it"
              and "whose product it is" read identically on both screens. */}
          {shop && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
              <Store className="size-3.5 shrink-0" aria-hidden />
              <span className="sr-only">Sold by </span>
              {shop}
            </p>
          )}
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
            {product.brand && (
              <span className="flex items-center gap-1">
                <Tag className="size-3.5 shrink-0" aria-hidden />
                <span className="sr-only">Brand </span>
                {product.brand}
              </span>
            )}
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
            <StockLabel stock={stock} inStock={inStock} />
          </p>

          {/* Said before the button rather than only on it: the reason it is
              disabled is a fact about the shop, not about this product, and
              "out of stock" would send someone back tomorrow to find the same
              thing. The page still opens — a shared link should. */}
          {undeliverable && (
            <p
              role="status"
              className="mt-3 rounded-xl border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
            >
              <span className="font-medium text-foreground">{shop}</span> does
              not deliver to {deliveryPincode}. Change the delivery address in
              the header to order this.
            </p>
          )}

          <div className="mt-5 flex items-center gap-3">
            <QuantityInput
              value={qty}
              onCommit={setQty}
              max={maxQty}
              disabled={!inStock || undeliverable}
              className="h-10 rounded-xl"
            />
            <Button
              size="lg"
              className="flex-1 gap-2"
              disabled={!inStock || undeliverable || !selected || add.isPending}
              onClick={() =>
                selected && add.mutate({ productVarId: selected.id, quantity: qty })
              }
            >
              {add.isPending ? <Loader2 className="animate-spin" /> : <ShoppingBag />}
              {undeliverable
                ? "Not delivered to your area"
                : inStock
                  ? "Add to cart"
                  : "Out of stock"}
            </Button>
            <Button
              size="icon"
              variant="outline"
              aria-label={
                wishlist.saved ? "Remove from wishlist" : "Save to wishlist"
              }
              aria-pressed={wishlist.saved}
              disabled={!selected || wishlist.isPending}
              onClick={() => wishlist.toggle()}
              className={cn(
                wishlist.saved &&
                  "border-destructive/30 bg-destructive/10 text-destructive",
              )}
            >
              {wishlist.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Heart className={cn(wishlist.saved && "fill-current")} />
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
