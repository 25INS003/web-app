import { ShopOrdersView } from "@/features/shop-orders/ShopOrdersView";

export const metadata = { title: "Orders · Nedyway" };

/**
 * The shop's order board.
 *
 * Lives under /dashboard rather than /orders because the customer storefront
 * already owns /orders — see the note beside the nav item in DashboardShell.
 * That nav item has linked here since the shell was written; this is the page
 * it was pointing at.
 *
 * Auth is the layout's job: app/(page)/layout.tsx wraps every route in this
 * group with `requireApprovedShopOwner`.
 */
export default function ShopOrdersPage() {
  return <ShopOrdersView />;
}
