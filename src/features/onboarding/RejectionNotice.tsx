import Link from "next/link";
import { AlertTriangle, LifeBuoy } from "lucide-react";

/**
 * Why an application was refused, shown above the form they have to fix.
 *
 * Until this existed a rejected seller signed in and landed on a blank "Set up
 * your shop" wizard with no indication anything had been decided — from their
 * side the application had simply vanished and they were starting again. The
 * reason was not merely unshown but never captured: the reject button sent no
 * body and `shop_owners` had nowhere to put one.
 *
 * The support link matters as much as the note. Everything else is shut to
 * somebody in this state, so if the reason does not make sense to them — or
 * they disagree with it — a ticket is the only way to say so, and it is not a
 * route they would find on their own.
 *
 * `revoked` shares the component and changes the words: that person WAS
 * trading and has been taken offline, which is a different thing to be told
 * than "your application was refused".
 */
export function RejectionNotice({
  status,
  note,
  reviewedAt,
  canResubmit = false,
}: {
  status: "rejected" | "revoked";
  note?: string | null;
  reviewedAt?: string | null;
  /**
   * Whether an admin has opened the form for them. A refusal is final until
   * one does, so without it this is the whole page rather than a heading above
   * a wizard — and what it offers is the way to ask, not the way to edit.
   */
  canResubmit?: boolean;
}) {
  const revoked = status === "revoked";

  return (
    <div className="mx-auto mb-6 w-full max-w-2xl rounded-2xl border border-destructive/25 bg-destructive/5 p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-destructive/15 text-destructive">
          <AlertTriangle className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            {revoked
              ? "Your shop has been taken offline"
              : "Your application was not approved"}
          </h2>

          {note ? (
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                {revoked
                  ? "An admin gave this reason:"
                  : "An admin reviewed it and gave this reason:"}
              </p>
              {/* The reviewer's own words, quoted rather than paraphrased —
                  `whitespace-pre-line` so a note written as a list of things to
                  fix still reads as one. */}
              <blockquote className="mt-2 whitespace-pre-line border-l-2 border-destructive/40 pl-3 text-sm text-foreground">
                {note}
              </blockquote>
            </>
          ) : (
            // Older decisions were recorded before a reason could be captured.
            // Saying so is better than an empty quote, and points them at the
            // one place they can ask.
            <p className="mt-1 text-sm text-muted-foreground">
              No reason was recorded. Use Get help and we will explain.
            </p>
          )}

          {reviewedAt && (
            <p className="mt-2 text-xs text-muted-foreground">
              Reviewed{" "}
              {new Date(reviewedAt).toLocaleDateString(undefined, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}

          <p className="mt-3 text-sm text-muted-foreground">
            {canResubmit
              ? revoked
                ? "Update the details below and send them again to have your shop reviewed."
                : "Update the details below and send your application again."
              : // Says plainly that the decision stands and what the one
                // available action is. "Contact support" on its own reads as
                // a formality; naming what to ask for makes it a step.
                "This decision stands for now. If you would like to correct your application and send it again, use Get help to ask us to reopen it."}
          </p>

          <Link
            href="/help"
            className={
              canResubmit
                ? "mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                : // The only thing they can do, so it is a button rather than
                  // a line of text under one.
                  "mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            }
          >
            <LifeBuoy className="size-4" />
            {canResubmit ? "Get help with this" : "Get help to reopen it"}
          </Link>
        </div>
      </div>
    </div>
  );
}
