import { NewTicketForm } from "@/features/support/NewTicketForm";
import { requireSession } from "@/lib/auth/guards";

export const metadata = { title: "New request · Nedyway" };

export default async function NewSupportTicketPage() {
  // requireSession, not a bare getSession + redirect: it sends an invalid
  // session to /login?stale=1, which the proxy uses to clear the dead cookies
  // instead of bouncing the request back here forever. See lib/auth/guards.ts.
  const session = await requireSession();
  return <NewTicketForm />;
}
