"use client";

import { useParams } from "next/navigation";

import { BulkTools } from "@/features/bulk/BulkTools";

/**
 * Admin bulk catalog page, scoped to one shop via the [shopId] route param —
 * the same pattern as the admin per-shop products screen. The backend lets an
 * admin act on any shop (ownership checks are bypassed for admins).
 */
export default function AdminBulkPage() {
  const { shopId } = useParams();

  return (
    <BulkTools
      shopId={String(shopId)}
      backHref={`/admin/shops/${shopId}/products`}
      productHref={(id) => `/admin/shops/${shopId}/products/${id}`}
    />
  );
}
