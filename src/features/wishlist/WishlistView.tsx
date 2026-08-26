"use client";

import { Heart, ShoppingBag, Trash2 } from "lucide-react";
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
import {
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
      <h1 className="font-display text-2xl font-bold tracking-tight">Wishlist</h1>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <WishlistRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function WishlistRow({ item }: { item: WishlistItem }) {
  const remove = useRemoveFromWishlist();
  const move = useMoveToCart();
  const img = wishlistItemImage(item);
  const price = wishlistItemPrice(item);
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
        </Link>
        {item.shop?.name && (
          <p className="text-xs text-muted-foreground">{item.shop.name}</p>
        )}
        {price !== undefined && (
          <p className="mt-1 font-mono text-sm font-bold tabular-nums">
            {formatPrice(price)}
          </p>
        )}
        <div className="mt-auto pt-2">
          <Button
            size="sm"
            className="gap-1.5"
            disabled={busy}
            onClick={() => move.mutate(item.id)}
          >
            <ShoppingBag className="size-3.5" /> Move to cart
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
