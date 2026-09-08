import { NotificationsView } from "@/features/notifications/NotificationsView";

export const metadata = { title: "Notifications · Nedyway" };

/**
 * The admin's notifications, inside the admin shell.
 *
 * The admin shell mounts the same bell, so "View all" sent an admin to the
 * customer storefront for the same reason it did an owner. See the shop
 * owner's copy of this page.
 */
export default function AdminNotificationsPage() {
  return <NotificationsView />;
}
