"use client";

import { Heart, Loader2, ShoppingBag, Star, Store, Tag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProgressiveImage } from "@/components/ProgressiveImage";
import {
  wishlistItemImage,
  wishlistItemPrice,
  wishlistProductId,
} from "@/lib/api/schemas/wishlist";
import type { WishlistItem } from "@/lib/api/schemas/wishlist";
import { formatPrice } from "@/lib/utils";

/** At or below this, the row says how many are left rather than "in stock". */
const LOW_STOCK = 5;
import {
  useClearWishlist,
  useMoveToCart,
  useRemoveFromWishlist,
  useWishlist,
} from "./useWishlist";

export function WishlistView() {
  const q = useWishlist();

  if (q.isPending) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const items = q.data ?? [];

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <Heart className="size-7" />
        </span>
        <h1 className="font-display text-2xl font-bold">Your wishlist is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tap the heart on any product to save it for later.
        </p>
        <Button asChild className="mt-6">
          <Link href="/search">Browse products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Wishlist
        </h1>
        <ClearWishlistButton itemCount={items.length} />
      </div>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <WishlistRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

/**
 * Emptying the wishlist.
 *
 * The same two-step as the cart's, and for the same reason: it is
 * irreversible, the storefront kit has no dialog primitive, and an inline
 * confirm keeps a destructive action one deliberate click away without pulling
 * in Radix for a single yes/no. It disarms itself after a few seconds so a
 * stray click does not leave a live "Clear" under the cursor.
 */
function ClearWishlistButton({ itemCount }: { itemCount: number }) {
  const clear = useClearWishlist();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);

  if (!armed) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setArmed(true)}
        disabled={clear.isPending}
        className="shrink-0 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
        Clear wishlist
      </Button>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="text-xs text-muted-foreground">
        Remove all {itemCount} {itemCount === 1 ? "item" : "items"}?
      </span>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => clear.mutate()}
        disabled={clear.isPending}
      >
        {clear.isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          "Clear"
        )}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setArmed(false)}
        disabled={clear.isPending}
      >
        Cancel
      </Button>
    </div>
  );
}

function WishlistRow({ item }: { item: WishlistItem }) {
  const remove = useRemoveFromWishlist();
  const move = useMoveToCart();
  const img = wishlistItemImage(item);
  const price = wishlistItemPrice(item);
  const original = item.price?.original ?? undefined;
  const rating = item.product.average_rating || 0;
  // `is_available` folds "active" and "in stock" together on the server, and
  // stock_status is the plainer signal — either being negative means it cannot
  // be moved to a cart right now.
  const outOfStock =
    item.product.stock_status === "out_of_stock" ||
    item.product.is_available === false;
  const href = `/p/${wishlistProductId(item)}`;
  const busy = remove.isPending || move.isPending;

  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs">
      <Link
        href={href}
        className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted"
      >
        {img ? (
          <ProgressiveImage src={img} alt={item.product.name} className="size-full object-cover" />
        ) : (
          <span className="text-2xl">🛒</span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <Link href={href} className="truncate text-sm font-semibold hover:underline">
          {item.product.name}
          {/* The variant is part of what was saved — "Rice" and "Rice 500g"
              are different things to move to a cart. */}
          {item.variant?.name && item.variant.name !== item.product.name && (
            <span className="font-normal text-muted-foreground">
              {" · "}
              {item.variant.name}
            </span>
          )}
        </Link>

        {/* Shop and brand, told apart the way they are on the cards and in the
            cart: an icon and a visually-hidden label each, so the distinction
            survives without relying on colour or position. */}
        {(item.shop?.name || item.product.brand) && (
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
            {item.shop?.name && (
              <span className="inline-flex min-w-0 items-center gap-1 text-foreground/80">
                <Store className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                <span className="sr-only">Sold by </span>
                <span className="truncate">{item.shop.name}</span>
              </span>
            )}
            {item.product.brand && (
              <span className="inline-flex min-w-0 items-center gap-1 text-muted-foreground">
                <Tag className="size-3 shrink-0" aria-hidden />
                <span className="sr-only">Brand </span>
                <span className="truncate">{item.product.brand}</span>
              </span>
            )}
          </p>
        )}

        <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {price !== undefined && (
            <span className="font-mono text-sm font-bold tabular-nums">
              {formatPrice(price)}
            </span>
          )}
          {/* What it cost before, when it is now less. A saved item is exactly
              the thing somebody is waiting to see drop. */}
          {original !== undefined && price !== undefined && original > price && (
            <>
              <span className="font-mono text-xs text-muted-foreground line-through">
                {formatPrice(original)}
              </span>
              <span className="text-xs font-semibold text-success">
                {Math.round((1 - price / original) * 100)}% off
              </span>
            </>
          )}
          {rating ? (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <Star className="size-3 fill-warning text-warning" aria-hidden />
              {rating.toFixed(1)}
              {item.product.total_reviews ? ` (${item.product.total_reviews})` : ""}
            </span>
          ) : null}
        </div>

        {/* Stock, because the point of a wishlist is to come back later and the
            answer may have changed since. */}
        <p className="mt-0.5 text-xs">
          {outOfStock ? (
            <span className="font-medium text-destructive">Out of stock</span>
          ) : typeof item.product.stock_quantity === "number" &&
            item.product.stock_quantity <= LOW_STOCK ? (
            <span className="font-medium text-warning-foreground">
              Only {item.product.stock_quantity} left
            </span>
          ) : (
            <span className="text-success">In stock</span>
          )}
        </p>

        <div className="mt-auto pt-2">
          <Button
            size="sm"
            className="gap-1.5"
            disabled={busy || outOfStock}
            onClick={() => move.mutate(item.id)}
          >
            <ShoppingBag className="size-3.5" />
            {outOfStock ? "Out of stock" : "Move to cart"}
          </Button>
        </div>
      </div>

      <button
        onClick={() => remove.mutate(item.id)}
        disabled={busy}
        className="self-start text-muted-foreground transition hover:text-destructive disabled:opacity-40"
        aria-label="Remove from wishlist"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
