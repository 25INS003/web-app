import { ShopOrderRequestsView } from "@/features/order-requests/ShopOrderRequestsView";

export const metadata = { title: "Photo orders · Nedyway" };

/**
 * The shop's photographed-list queue.
 *
 * Under /dashboard for the same reason the order board is: the customer
 * storefront already owns /order-requests, and these are two ends of the same
 * conversation seen from opposite sides.
 *
 * Auth is the layout's job — app/(page)/layout.tsx wraps this group with
 * `requireApprovedShopOwner`.
 */
export default function ShopOrderRequestsPage() {
  return <ShopOrderRequestsView />;
}
