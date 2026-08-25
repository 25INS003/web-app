import { SupportList } from "@/features/support/SupportList";
import { requireApprovedShopOwner } from "@/lib/auth/guards";

export const metadata = { title: "Support · Nedyway" };

/**
 * The shop owner's support conversations.
 *
 * Two kinds land here. The ones they raised themselves — a payout query, a
 * rejected listing — and the ones an admin pulled them into, which until now
 * they had no screen to read: the backend put those tickets in their list and
 * let them post, but the owner area had no route and no nav item, so the only
 * way to reach a conversation you had been added to was to know the storefront
 * URL and type it.
 *
 * Auth is the layout's job — app/(page)/layout.tsx wraps this group in
 * `requireApprovedShopOwner`. Calling it again here is not belt-and-braces: it
 * is how this page gets the session without a second /auth/me round trip being
 * anything other than the same request's cache.
 */
export default async function ShopSupportPage() {
  await requireApprovedShopOwner();
  return <SupportList basePath="/dashboard/support" />;
}
