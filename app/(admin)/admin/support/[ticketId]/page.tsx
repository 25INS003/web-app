import { AdminTicketThread } from "@/features/admin-support/AdminTicketThread";
import { requireRole } from "@/lib/auth/guards";

export const metadata = { title: "Ticket · Nedyway Admin" };

export default async function AdminTicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  // The layout already gates this group, but the thread needs the admin's own
  // id to tell their messages from the customer's — and `requireRole` returns
  // the session rather than making the component ask for it again.
  const session = await requireRole("admin");
  return (
    <AdminTicketThread ticketId={ticketId} currentUserId={session.user.id} />
  );
}
