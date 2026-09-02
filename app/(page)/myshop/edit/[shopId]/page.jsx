"use client";

import { use } from "react";
import { useShopStore } from "@/store/shopStore";
import { EditShopForm } from "@/features/shops/EditShopForm";

/**
 * A shop owner editing their own shop.
 *
 * The store is the source here: it already holds the owner's shops and knows
 * how to fetch them. The admin route supplies a single shop it fetched itself,
 * because an admin has no shops of their own.
 */
export default function EditShopPage({ params }) {
  const { shopId } = use(params);
  const { myShops, fetchMyShops, updateExistingShop, isLoading } =
    useShopStore();

  return (
    <EditShopForm
      shopId={shopId}
      shops={myShops}
      isLoading={isLoading}
      fetchShops={fetchMyShops}
      saveShop={updateExistingShop}
      backHref="/myshop"
    />
  );
}
