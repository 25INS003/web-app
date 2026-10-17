import Link from "next/link";
import { Fill, LegalPage, MailLink, Section } from "@/features/legal/LegalPage";

export const metadata = {
  title: "Delete your account · Nedyway",
  description:
    "How to delete your Nedyway account and personal data, and what is kept afterwards.",
};

export default function DeleteAccountPage() {
  return (
    <LegalPage
      title="Delete your account"
      intro={
        <p>
          You can ask us to delete your Nedyway account and the personal data
          linked to it at any time. Deletion is handled by our support team, who
          confirm the request came from you before anything is removed.
        </p>
      }
    >
      <Section title="1. From the app (recommended)">
        <ol>
          <li>Sign in to the Nedyway app.</li>
          <li>
            Go to <strong>Profile → Help &amp; Support</strong> and tap{" "}
            <strong>New request</strong>.
          </li>
          <li>
            Choose the type <strong>Account</strong> and write &ldquo;Please
            delete my account&rdquo;.
          </li>
          <li>Send the request. We reply in the same conversation.</li>
        </ol>
        <p>
          On the website, the same request can be made from{" "}
          <Link href="/support">Help &amp; support</Link> after signing in.
        </p>
      </Section>

      <Section title="2. By email">
        <p>
          If you cannot sign in, email <MailLink field="supportEmail" /> from
          the email address registered on your account, with the subject
          &ldquo;Delete my account&rdquo;. We may ask you to confirm that the
          account is yours.
        </p>
      </Section>

      <Section title="3. What happens next">
        <ul>
          <li>
            We confirm the request and delete your account{" "}
            <Fill field="deletionTimeline" />. You will be told when it is done.
          </li>
          <li>
            Orders that are still open should be completed or cancelled first;
            we will tell you if one is holding the deletion up.
          </li>
          <li>
            Deleted: your profile (name, email, phone, date of birth, photo),
            password, saved addresses, cart, wishlist, notification settings and
            device push tokens, loyalty points, and your search and shopping
            activity.
          </li>
          <li>
            Kept, only as long as the law requires: records of orders you placed
            and their invoices, which we must keep for tax and accounting
            purposes. Reviews you posted are removed or shown without your name.
          </li>
          <li>
            Copies in our database backups are removed as the backups expire, at
            most 90 days later.
          </li>
          <li>
            Deletion is permanent: the account cannot be restored afterwards.
          </li>
        </ul>
      </Section>

      <Section title="4. Questions">
        <p>
          See our <Link href="/privacy">Privacy policy</Link>, or contact our
          Grievance Officer, <Fill field="grievanceOfficerName" />, at{" "}
          <MailLink field="grievanceOfficerEmail" />.
        </p>
      </Section>
    </LegalPage>
  );
}
