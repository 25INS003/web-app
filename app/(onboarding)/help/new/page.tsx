import { redirect } from "next/navigation";
import { NewTicketForm } from "@/features/support/NewTicketForm";
import { requireRole } from "@/lib/auth/guards";

export const metadata = { title: "New request · Nedyway" };

export default async function PendingNewTicketPage() {
  const session = await requireRole("shop_owner");
  if (session.shop_owner_status?.is_approved) redirect("/dashboard/support/new");

  // No priority picker here: an applicant waiting on approval is not
  // triaging their own queue position.
  return <NewTicketForm basePath="/help" />;
}
