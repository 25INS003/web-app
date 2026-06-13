import type { ReactNode } from "react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { requireApprovedShopOwner } from "@/lib/auth/guards";

export default async function ShopLayout({ children }: { children: ReactNode }) {
  const session = await requireApprovedShopOwner();
  return (
    <DashboardShell section="shop" user={session.user}>
      {children}
    </DashboardShell>
  );
}
