import { NotificationsView } from "@/features/notifications/NotificationsView";

export const metadata = { title: "Notifications · Nedyway" };

/**
 * The shop owner's notifications, inside the shop owner's shell.
 *
 * There was one notifications route and it lived under `(storefront)`, so the
 * bell in the seller dashboard sent an owner into the CUSTOMER shop: search
 * bar, wishlist, a Cart button, and a Nedyway logo linking to `/`. Reading a
 * notification about your own shop dropped you into the storefront with no way
 * back but the browser's Back button.
 *
 * Exactly the fault already fixed for support, where `/support` wears the
 * shopping header and `/help` is the same feature inside the shell an
 * unapproved seller can actually use. Same view, same data, correct shell —
 * the layout above supplies the guard.
 */
export default function OwnerNotificationsPage() {
  return <NotificationsView />;
}
