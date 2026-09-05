import { redirect } from "next/navigation";
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
 * Which state they are in decides whether there is a form to show at all, and
 * that is read from the session rather than left to the proxy. The proxy sends
 * anyone whose `approvalStatus` cookie is not `pending` here, and that cookie
 * is written at sign-in and not again — so an owner who submitted their
 * application in this session still carries `draft`, gets sent here, and was
 * shown the empty form for an application they had already filled in. The
 * cookie is refreshed on submit now as well, but this check is the one that
 * cannot be wrong.
 *
 *   pending   already submitted, waiting on an admin -> /status
 *   approved  nothing to apply for -> /dashboard
 *   draft     never submitted -> the form
 *   rejected  turned down, and the whole point is that they can fix it and
 *   revoked   send it again -> the form, deliberately
 */
export default async function OnboardingPage() {
  const session = await requireRole("shop_owner");
  const status = session.shop_owner_status;

  if (status?.is_approved) redirect("/dashboard");
  if (status?.verification_status === "pending") redirect("/status");

  return <OnboardingWizard />;
}
