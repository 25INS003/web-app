import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/features/onboarding/OnboardingWizard";
import { requireRole } from "@/lib/auth/guards";
import { getSession } from "@/lib/auth/session.server";
import { RejectionNotice } from "@/features/onboarding/RejectionNotice";

/**
 * Set per request rather than as a static export, because which page this is
 * depends on who is reading it: a refused applicant is not setting up a shop,
 * they are fixing an application — and the browser tab said otherwise.
 */
export async function generateMetadata() {
  const session = await getSession();
  const status = session?.shop_owner_status?.verification_status;
  const refused = status === "rejected" || status === "revoked";
  // Only "update" when there is something to update: a refused applicant
  // without permission gets the decision, not a form, and the tab should not
  // promise otherwise.
  if (refused) {
    return {
      title: session?.shop_owner_status?.can_resubmit
        ? "Update your application · Nedyway"
        : "Application not approved · Nedyway",
    };
  }
  return { title: "Set up your shop · Nedyway" };
}

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

  // A refused applicant is told so, and why, above the form they are being
  // asked to fill in again. Without it the page reads as a first application:
  // they signed in, landed on "Set up your shop", and nothing said a decision
  // had been made at all.
  const refused =
    status?.verification_status === "rejected" ||
    status?.verification_status === "revoked";

  // A refusal is final until an admin reopens the form. Somebody who has been
  // turned down and not been given permission gets the reason and a way to ask
  // — not a form, and not a form that would be refused on submit anyway.
  //
  // The server refuses the submission too. This is what stops them being
  // walked through five steps first.
  if (refused && !status?.can_resubmit) {
    return (
      <RejectionNotice
        status={status.verification_status as "rejected" | "revoked"}
        note={status.approval_note}
        reviewedAt={status.reviewed_at}
        canResubmit={false}
      />
    );
  }

  return (
    <>
      {refused && (
        <RejectionNotice
          status={status.verification_status as "rejected" | "revoked"}
          note={status.approval_note}
          reviewedAt={status.reviewed_at}
          canResubmit
        />
      )}
      <OnboardingWizard resubmitting={refused} />
    </>
  );
}
