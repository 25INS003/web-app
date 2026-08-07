import { NotificationsView } from "@/features/notifications/NotificationsView";
import { requireSession } from "@/lib/auth/guards";

export const metadata = { title: "Notifications · Nedyway" };

export default async function NotificationsPage() {
  // requireSession, not a bare getSession + redirect: it sends an invalid
  // session to /login?stale=1, which the proxy uses to clear the dead cookies
  // instead of bouncing the request back here forever. See lib/auth/guards.ts.
  const session = await requireSession();
  return <NotificationsView />;
}
