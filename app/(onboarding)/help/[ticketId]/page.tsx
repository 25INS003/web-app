import { redirect } from "next/navigation";
import { SupportDetail } from "@/features/support/SupportDetail";
import { requireRole } from "@/lib/auth/guards";

export default async function PendingTicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  const session = await requireRole("shop_owner");
  if (session.shop_owner_status?.is_approved) {
    redirect(`/dashboard/support/${ticketId}`);
  }

  return (
    <SupportDetail
      ticketId={ticketId}
      currentUserId={session.user.id}
      basePath="/help"
    />
  );
}
