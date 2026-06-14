import { redirect } from "next/navigation";
import { NotificationsView } from "@/features/notifications/NotificationsView";
import { getSession } from "@/lib/auth/session.server";

export const metadata = { title: "Notifications · Nedyway" };

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <NotificationsView />;
}
