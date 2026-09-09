import Link from "next/link";
import { PencilLine } from "lucide-react";
import { SignOutButton } from "@/features/auth/SignOutButton";
import { RejectionNotice } from "./RejectionNotice";

/**
 * What /status shows somebody whose application was refused.
 *
 * They land here, and the page's own message — "Application under review" — is
 * the opposite of what happened to them. This is that page for them: the
 * decision, the reviewer's reason, and whichever single action is actually
 * open.
 *
 * A form is not offered here even when one is available. Editing an
 * application is a screen, not a panel wedged under a verdict, and the button
 * is what makes the difference between the two states legible: either an admin
 * has reopened it and there is something to press, or they have not and the
 * only route on is support.
 */
export function RefusedStatus({
  status,
  note,
  reviewedAt,
  canResubmit,
}: {
  status: "rejected" | "revoked";
  note?: string | null;
  reviewedAt?: string | null;
  canResubmit: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <RejectionNotice
        status={status}
        note={note}
        reviewedAt={reviewedAt}
        canResubmit={canResubmit}
      />

      {canResubmit && (
        <div className="rounded-2xl border border-border bg-card p-5 text-center">
          <p className="text-sm text-muted-foreground">
            An admin has reopened your application so you can correct it.
          </p>
          <Link
            href="/onboarding"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            <PencilLine className="size-4" />
            Update details
          </Link>
          {/* Said here because the grant is spent on submission: they get one
              send, and finding that out afterwards would be a nasty surprise. */}
          <p className="mt-3 text-xs text-muted-foreground">
            You can send it once. If it is refused again, use Get help to reopen
            it.
          </p>
        </div>
      )}

      <div className="mt-6 text-center">
        <SignOutButton />
      </div>
    </div>
  );
}
