"use client";

import { Suspense, use } from "react";
import { useSearchParams } from "next/navigation";
import { ShopOrderDetail } from "@/features/shop-orders/ShopOrderDetail";
import { useMyShops } from "@/features/shop-orders/hooks";

/**
 * One order, for the shop that owns it.
 *
 * The shop arrives as `?shop=` because the board holds its selection in
 * component state, which does not survive navigating here. A URL without it —
 * pasted, or bookmarked — falls back to the owner's first shop, which is right
 * for the common case of an owner with one.
 */
function Detail({ orderId }: { orderId: string }) {
  const shopParam = useSearchParams().get("shop") ?? undefined;
  const shops = useMyShops();
  const shopId = shopParam ?? shops.data?.[0]?.id;

  if (!shopId) {
    return (
      <p className="text-sm text-muted-foreground">
        {shops.isPending ? "Loading…" : "No shop to load this order against."}
      </p>
    );
  }

  return <ShopOrderDetail shopId={shopId} orderId={orderId} />;
}

export default function ShopOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);

  // useSearchParams needs a boundary above it.
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-muted" />}>
      <Detail orderId={orderId} />
    </Suspense>
  );
}
