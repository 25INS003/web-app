import type { ReactNode } from "react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { requireRole } from "@/lib/auth/guards";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireRole("admin");
  return (
    <DashboardShell section="admin" user={session.user}>
      {children}
    </DashboardShell>
  );
}
