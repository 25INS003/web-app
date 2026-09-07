import { Clock } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/features/auth/SignOutButton";
import { getSession } from "@/lib/auth/session.server";
import { RefusedStatus } from "@/features/onboarding/RefusedStatus";

/**
 * Per request, because this page is not always "under review": a refused owner
 * reads their decision here, and the browser tab said otherwise.
 */
export async function generateMetadata() {
  const session = await getSession();
  const status = session?.shop_owner_status?.verification_status;
  return {
    title:
      status === "rejected" || status === "revoked"
        ? "Application not approved · Nedyway"
        : "Under review · Nedyway",
  };
}

/**
 * "Your application is being reviewed" — true only while it is.
 *
 * This page is static, so a rejected or revoked owner reaching it was told
 * their application was still under review, which is the opposite of what had
 * happened. They belong on /onboarding, where the reason they were refused is
 * shown above the form they can fix and resubmit.
 */
export default async function StatusPage() {
  const session = await getSession();
  const status = session?.shop_owner_status;
  // A refused owner reads their decision here rather than being dropped into a
  // form: /status is where they land, and "under review" is not what happened
  // to them. Whether there is a form at all is an admin's decision — see
  // `can_resubmit` — so this page shows the reason and, when the form has been
  // reopened, a button through to it.
  if (
    status?.verification_status === "rejected" ||
    status?.verification_status === "revoked"
  ) {
    return (
      <RefusedStatus
        status={status.verification_status}
        note={status.approval_note}
        reviewedAt={status.reviewed_at}
        canResubmit={Boolean(status.can_resubmit)}
      />
    );
  }
  // Never submitted: the form is the page they want.
  if (status?.verification_status === "draft") redirect("/onboarding");
  if (status?.is_approved) redirect("/dashboard");

  return (
    <div className="text-center">
      <span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-warning/15 text-warning">
        <Clock className="size-6" />
      </span>
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Application under review
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Thanks for submitting your shop details. Our team is reviewing your
        application — you&apos;ll get access to your dashboard once approved.
      </p>
      {/* /help, not /support. Support is in the dashboard and the dashboard is
          exactly what is shut to this person — but the storefront copy at
          /support wears the shopping header, so the one link offered to
          somebody waiting on approval used to drop them into the customer shop
          with a cart and a checkout. Same tickets, no doorway. */}
      <p className="mt-4 text-sm text-muted-foreground">
        Waiting longer than you expected?{" "}
        <Link href="/help" className="font-medium text-primary hover:underline">
          Contact support
        </Link>
        .
      </p>
      <div className="mt-6">
        <SignOutButton />
      </div>
    </div>
  );
}
