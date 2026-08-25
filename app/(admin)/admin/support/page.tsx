import { AdminSupportQueue } from "@/features/admin-support/AdminSupportQueue";

export const metadata = { title: "Support · Nedyway Admin" };

/**
 * The support queue.
 *
 * Customers could raise tickets and no one could answer them: the backend has
 * always let an admin read and reply to any ticket, but every support screen
 * lived under the storefront, so there was no way in short of calling the API
 * by hand.
 *
 * Auth is the layout's job: app/(admin)/layout.tsx wraps this group in
 * `requireRole("admin")`.
 */
export default function AdminSupportPage() {
  return <AdminSupportQueue />;
}
