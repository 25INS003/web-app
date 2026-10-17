import Link from "next/link";
import { Fill, LegalPage, MailLink, Section } from "@/features/legal/LegalPage";

export const metadata = {
  title: "Cancellation & refund policy · Nedyway",
  description:
    "How to cancel a Nedyway order, what to do if something is wrong with it, and how refunds work.",
};

export default function RefundPage() {
  return (
    <LegalPage
      title="Cancellation & refund policy"
      intro={
        <p>
          This policy explains when you can cancel an order, what to do if
          something is wrong with what you received, and how refunds are made.
          It forms part of our <Link href="/terms">Terms of service</Link>.
        </p>
      }
    >
      <Section title="1. Cancelling an order yourself">
        <p>
          You can cancel an order in the app or on the website, from the
          order&rsquo;s page under <strong>My Orders</strong>, at any time until
          a delivery partner has picked it up from the shop — that is, while it
          is placed, confirmed, being prepared or ready for pickup. There is no
          charge for cancelling.
        </p>
        <p>
          Once the order has been picked up it is on its way to you and can no
          longer be cancelled in the app. If you need to stop it, contact us
          through <Link href="/support">Help &amp; support</Link> straight away.
        </p>
        <p>
          If an order is split across several shops, it can be cancelled only
          while none of its parts has been picked up.
        </p>
      </Section>

      <Section title="2. Cancellation by the shop or by us">
        <p>
          A shop may cancel an order, or part of it, if an item is out of stock,
          the address is outside its delivery area, or it cannot fulfil the
          order for another reason. We may cancel an order we reasonably believe
          is fraudulent or breaks our terms. Either way we will tell you, and
          you will not be charged for what was cancelled.
        </p>
      </Section>

      <Section title="3. Something wrong with your order">
        <p>
          If an item is missing, damaged, spoiled, past its expiry date or not
          what you ordered, tell us within <Fill field="issueReportWindow" />:
        </p>
        <ol>
          <li>
            Open <strong>Help &amp; support</strong> in the app (Profile → Help
            &amp; Support) or on the website, and start a new request.
          </li>
          <li>
            Choose the order and the type <strong>Order issue</strong> or{" "}
            <strong>Refund</strong>.
          </li>
          <li>
            Describe the problem and which items are affected. A photo helps us
            resolve it faster.
          </li>
        </ol>
        <p>
          Where it is safe and practical, check fresh and chilled items when
          they are handed over, and you may refuse a damaged item at the door.
        </p>
        <p>
          We review each request with the shop. If it is upheld, we will offer a
          refund for the affected items or, where the shop can, a replacement.
        </p>
      </Section>

      <Section title="4. How refunds are made">
        <ul>
          <li>
            Orders are currently paid cash on delivery. If you cancel or the
            order is cancelled before it is delivered, you have not paid
            anything, so there is nothing to refund.
          </li>
          <li>
            If you have paid and a refund is approved, it is paid by{" "}
            <Fill field="refundMethod" /> within <Fill field="refundTimeline" />{" "}
            of approval. You will be told when it is approved and when it is
            sent.
          </li>
          <li>
            Refunds cover the price of the affected items and, where the whole
            order is refunded, the delivery and platform fees you paid for it.
          </li>
          <li>
            Promotion discounts are not paid out in cash, and loyalty points
            used on a refunded order are returned to your account where
            possible.
          </li>
        </ul>
      </Section>

      <Section title="5. Items that cannot be returned">
        <p>
          Because groceries are perishable and for hygiene reasons, we do not
          accept returns of items that were delivered in good condition and as
          ordered — for example, if you changed your mind about a fresh, chilled
          or opened item.
        </p>
      </Section>

      <Section title="6. Contact">
        <p>
          Questions about a cancellation or refund: start a request in{" "}
          <Link href="/support">Help &amp; support</Link>, or email{" "}
          <MailLink field="supportEmail" />. If you are not satisfied with the
          outcome, you can contact our Grievance Officer,{" "}
          <Fill field="grievanceOfficerName" />, at{" "}
          <MailLink field="grievanceOfficerEmail" />.
        </p>
      </Section>
    </LegalPage>
  );
}
