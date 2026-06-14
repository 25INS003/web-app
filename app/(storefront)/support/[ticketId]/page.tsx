import { redirect } from "next/navigation";
import { SupportDetail } from "@/features/support/SupportDetail";
import { getSession } from "@/lib/auth/session.server";

export default async function SupportTicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  const session = await getSession();
  if (!session) redirect("/login");
  return <SupportDetail ticketId={ticketId} currentUserId={session.user._id} />;
}
