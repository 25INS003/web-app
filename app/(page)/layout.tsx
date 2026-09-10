import type { ReactNode } from "react";
import { DashboardShell } from "@/components/shell/DashboardShell";
import { requireShopWorkspace } from "@/lib/auth/guards";

export default async function ShopLayout({ children }: { children: ReactNode }) {
  // Not requireApprovedShopOwner: a delegated member is usually a customer
  // account, and this area is theirs too now. Each page below still answers to
  // the server's per-shop capability checks.
  const session = await requireShopWorkspace();
  return (
    <DashboardShell section="shop" user={session.user}>
      {children}
    </DashboardShell>
  );
}
