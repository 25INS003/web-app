import { AnnounceForm } from "@/features/admin-announce/AnnounceForm";

export const metadata = { title: "Announcements · Nedyway Admin" };

/**
 * Send one promotional notification to every customer.
 *
 * The admin layout above supplies the role guard, so this is only ever
 * rendered for an admin — the endpoint checks again regardless.
 */
export default function AdminAnnouncementsPage() {
  return <AnnounceForm />;
}
