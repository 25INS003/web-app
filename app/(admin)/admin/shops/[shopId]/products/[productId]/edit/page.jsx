"use client";

import { EditProductForm } from "@/features/products/EditProductForm";

/**
 * An admin editing a product in somebody else's shop.
 *
 * Reached from the approval queue: a submission that is nearly right — a typo,
 * a wrong category, a price with a missing digit — is better corrected than
 * rejected and sent back around the loop.
 *
 * Editing does not decide anything. The update route never touches
 * `approval_status`, so the product is still waiting when the admin returns to
 * the queue, and approving stays a separate, deliberate action.
 *
 * The segments are named [shopId] and [productId] to match the shop-owner
 * route, because the shared form reads both from useParams.
 */
export default function AdminEditProductPage() {
  return <EditProductForm />;
}
