"use client";

import { Store } from "lucide-react";

import { BulkTools } from "@/features/bulk/BulkTools";
import { useShopStore } from "@/store/shopStore";
import GlobalSelectShop from "@/components/Dropdowns/selectShop0";

/**
 * Shop-owner bulk catalog page. The tools act on the currently-selected shop
 * (the same shop the Products screen uses); if none is selected yet, prompt for
 * one rather than acting on nothing.
 */
export default function ShopOwnerBulkPage() {
  const currentShop = useShopStore((s) => s.currentShop);
  const shopId = currentShop?.id ?? null;

  if (!shopId) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-muted">
          <Store className="size-6 text-muted-foreground" />
        </div>
        <h1 className="text-lg font-semibold">Select a shop first</h1>
        <p className="text-sm text-muted-foreground">
          Choose which shop&apos;s catalog you want to import or export.
        </p>
        <GlobalSelectShop />
      </div>
    );
  }

  return (
    <BulkTools shopId={shopId} shopName={currentShop?.name} backHref="/products" />
  );
}
