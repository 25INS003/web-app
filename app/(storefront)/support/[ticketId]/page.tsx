import { SupportDetail } from "@/features/support/SupportDetail";
import { requireSession } from "@/lib/auth/guards";

export default async function SupportTicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  // requireSession, not a bare getSession + redirect: it sends an invalid
  // session to /login?stale=1, which the proxy uses to clear the dead cookies
  // instead of bouncing the request back here forever. See lib/auth/guards.ts.
  const session = await requireSession();
  return <SupportDetail ticketId={ticketId} currentUserId={session.user.id} />;
}
