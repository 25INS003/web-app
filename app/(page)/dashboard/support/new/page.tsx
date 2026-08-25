import { NewTicketForm } from "@/features/support/NewTicketForm";
import { requireApprovedShopOwner } from "@/lib/auth/guards";

export const metadata = { title: "New request · Nedyway" };

export default async function ShopNewTicketPage() {
  await requireApprovedShopOwner();
  // Owners pick a priority; customers do not — see NewTicketForm.
  return <NewTicketForm basePath="/dashboard/support" canSetPriority />;
}
