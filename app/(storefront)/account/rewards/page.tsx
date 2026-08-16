import { RewardsView } from "@/features/account/RewardsView";
import { requireSession } from "@/lib/auth/guards";

export const metadata = { title: "Rewards · Nedyway" };

export default async function RewardsPage() {
  // Points are per-customer, so this page is meaningless signed out — and
  // requireSession routes a stale cookie to /login?stale=1 rather than looping.
  await requireSession();
  return <RewardsView />;
}
