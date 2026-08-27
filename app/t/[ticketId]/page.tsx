import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/guards";

/**
 * One ticket link, resolved at click time.
 *
 * The same ticket lives at a different path for each audience — a customer
 * reads it at /support, an approved shop owner at /dashboard/support, an
 * applicant still waiting at /help, an agent at /admin/support — and a shop
 * owner's own path changes the moment they are approved.
 *
 * So a link chosen when an email was written can be wrong by the time it is
 * opened. This asks who is reading and sends them to their own screen, which
 * also means one URL in the email template instead of four.
 *
 * `requireSession` rather than a bare check: a signed-out click lands on
 * /login?stale=1, which clears dead cookies instead of bouncing forever — see
 * lib/auth/guards.ts.
 */
export default async function TicketLinkPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  const session = await requireSession();

  const { user_type } = session.user;

  if (user_type === "admin") redirect(`/admin/support/${ticketId}`);

  if (user_type === "shop_owner") {
    // An unapproved owner cannot reach /dashboard — the guard there would
    // bounce them to /status and lose the ticket they were sent to read.
    redirect(
      session.shop_owner_status?.is_approved
        ? `/dashboard/support/${ticketId}`
        : `/help/${ticketId}`,
    );
  }

  redirect(`/support/${ticketId}`);
}
