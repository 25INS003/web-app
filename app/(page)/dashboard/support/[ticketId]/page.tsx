import { SupportDetail } from "@/features/support/SupportDetail";
import { requireApprovedShopOwner } from "@/lib/auth/guards";

/**
 * One conversation, from the shop's side.
 *
 * The same thread the customer and the admin read — there is one message list,
 * not one per audience. Access is the backend's call, not this route's: it
 * answers 403 unless the owner raised the ticket or an admin added them, so a
 * guessed id shows the not-found state rather than somebody else's complaint.
 */
export default async function ShopSupportTicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  const session = await requireApprovedShopOwner();
  return (
    <SupportDetail
      ticketId={ticketId}
      currentUserId={session.user.id}
      basePath="/dashboard/support"
    />
  );
}
