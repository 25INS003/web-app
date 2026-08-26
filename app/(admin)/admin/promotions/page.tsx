import { PromotionsView } from "@/features/admin-promotions/PromotionsView";

export const metadata = { title: "Discount codes · Nedyway" };

/**
 * Auth is the layout's job: app/(admin) wraps this group, and the backend
 * refuses the endpoints to anyone but an admin regardless.
 */
export default function AdminPromotionsPage() {
  return <PromotionsView />;
}
