"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import apiClient from "@/api/apiClient";
import { EditShopForm } from "@/features/shops/EditShopForm";

/**
 * An admin editing any shop's settings.
 *
 * Fetches the one shop rather than reading the shop store, which holds the
 * signed-in owner's shops — an admin has none, so the store would report the
 * shop as missing and bounce them out.
 *
 * Saves through PUT /admin/shops/:shopId. The owner's own route sits behind
 * verifyShopOwner, which rejects an admin outright; the two endpoints share
 * their write (applyShopUpdate) so money conversion and delivery-area
 * replacement cannot drift apart between them.
 */
export default function AdminEditShopPage() {
  const { shopId } = useParams();
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchShops = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/admin/shops/${shopId}`);
      // getShopById returns the shop directly as `data`. Wrapped in an array
      // because the form finds its shop by id, the same way it does for an
      // owner with several.
      const shop = res.data.data;
      setShops(shop ? [shop] : []);
    } catch {
      // The form shows "Shop not found" and returns to the list, which is the
      // right outcome for a bad id or a shop that has been removed.
      setShops([]);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const saveShop = async (id, formData) => {
    const res = await apiClient.put(`/admin/shops/${id}`, formData);
    return res.data.data?.shop ?? null;
  };

  return (
    <EditShopForm
      shopId={shopId}
      shops={shops}
      isLoading={isLoading}
      fetchShops={fetchShops}
      saveShop={saveShop}
      backHref="/admin/shops"
    />
  );
}
