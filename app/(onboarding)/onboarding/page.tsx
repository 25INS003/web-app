import { OnboardingWizard } from "@/features/onboarding/OnboardingWizard";
import { requireRole } from "@/lib/auth/guards";

export const metadata = { title: "Set up your shop · Nedyway" };

/**
 * The shop owner's application.
 *
 * `requireRole("shop_owner")` rather than `requireApprovedShopOwner`: an
 * approved owner has no business here, but an unapproved one is exactly who
 * this page is for — and the approved-owner guard would bounce every visitor
 * straight back out.
 *
 * The proxy already redirects an approved owner to /dashboard, so this only
 * has to keep out the wrong role.
 */
export default async function OnboardingPage() {
  await requireRole("shop_owner");
  return <OnboardingWizard />;
}
