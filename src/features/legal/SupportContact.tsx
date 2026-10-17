import { Mail, Phone } from "lucide-react";
import Link from "next/link";
import { Fill, MailLink } from "./LegalPage";

/**
 * How to reach a person, and answers to the questions people most often
 * write in with.
 *
 * Public on purpose: app stores require a support page anybody can open, and
 * somebody who cannot sign in is exactly who needs it most. The ticket list
 * above it on /support is only drawn for a signed-in customer.
 */
export function SupportContact() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 pb-14 sm:px-6">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <h2 className="font-display text-xl font-semibold">Contact us</h2>
        <ul className="mt-4 space-y-3 text-sm">
          <li className="flex items-center gap-3">
            <Mail className="size-4 text-muted-foreground" />
            <MailLink field="supportEmail" />
          </li>
          <li className="flex items-center gap-3">
            <Phone className="size-4 text-muted-foreground" />
            <Fill field="supportPhone" />
          </li>
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">
          Hours: <Fill field="supportHours" />
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Complaints: Grievance Officer, <Fill field="grievanceOfficerName" />,{" "}
          <MailLink field="grievanceOfficerEmail" />
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold">Common questions</h2>
        <dl className="mt-4 space-y-5 text-[15px] leading-relaxed">
          <div>
            <dt className="font-semibold">How do I cancel an order?</dt>
            <dd className="mt-1 text-foreground/90">
              Open the order under My Orders and cancel it. This works until a
              delivery partner has picked it up. See the{" "}
              <Link
                className="font-medium text-primary underline"
                href="/refund"
              >
                cancellation &amp; refund policy
              </Link>
              .
            </dd>
          </div>
          <div>
            <dt className="font-semibold">
              Something in my order was wrong or missing.
            </dt>
            <dd className="mt-1 text-foreground/90">
              Start a new request in Help &amp; Support, pick the order and
              choose Order issue or Refund. A photo helps.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">How do I pay?</dt>
            <dd className="mt-1 text-foreground/90">
              Orders are currently paid cash on delivery.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">I forgot my password.</dt>
            <dd className="mt-1 text-foreground/90">
              Tap &ldquo;Forgot password?&rdquo; on the sign-in screen; we email
              you a code to set a new one.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">How do I delete my account?</dt>
            <dd className="mt-1 text-foreground/90">
              Follow the steps on{" "}
              <Link
                className="font-medium text-primary underline"
                href="/delete-account"
              >
                Delete your account
              </Link>
              .
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
