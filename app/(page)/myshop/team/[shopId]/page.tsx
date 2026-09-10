import { TeamPanel } from "@/features/shop-team/TeamPanel";

export const metadata = { title: "Team · Nedyway" };

/**
 * Who can work in one shop.
 *
 * The owner guard is the server's — `members:manage` belongs to no role, so a
 * delegated member who reaches this URL gets a 403 and the panel says so
 * rather than rendering controls that would fail on use.
 */
export default async function ShopTeamPage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = await params;
  return <TeamPanel shopId={shopId} />;
}
