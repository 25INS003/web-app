import { AdminOverview } from "@/features/admin/AdminOverview";

export const metadata = { title: "Admin · Nedyway" };

/**
 * The admin overview.
 *
 * This was a placeholder — two hardcoded "—" tiles and a note promising the
 * approval queue in Phase 4. Seller registrations were reaching the database
 * and the API correctly the whole time; this screen simply never asked for
 * them, which read as "the request never arrived".
 *
 * Auth is the layout's job: app/(admin)/layout.tsx wraps this group in
 * `requireRole("admin")`.
 */
export default function AdminHome() {
  return <AdminOverview />;
}
