import Link from "next/link";
import { Fill, LegalPage, MailLink, Section } from "@/features/legal/LegalPage";

export const metadata = {
  title: "Terms of service · Nedyway",
  description: "The terms that apply when you use the Nedyway app and website.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      intro={
        <p>
          These terms are an agreement between you and{" "}
          <Fill field="legalName" />, a company with its registered office at{" "}
          <Fill field="registeredAddress" /> (&ldquo;Nedyway&rdquo;,
          &ldquo;we&rdquo;, &ldquo;us&rdquo;). They apply whenever you use the
          Nedyway mobile app or website (the &ldquo;service&rdquo;). By creating
          an account or placing an order you accept them. Please also read our{" "}
          <Link href="/privacy">Privacy policy</Link> and{" "}
          <Link href="/refund">Cancellation &amp; refund policy</Link>.
        </p>
      }
    >
      <Section title="1. What Nedyway is">
        <p>
          Nedyway is an online marketplace. It lets you browse and order
          groceries and daily essentials from independent local shops
          (&ldquo;sellers&rdquo;). The seller you order from sells you the goods
          and is responsible for them — their quality, labelling, freshness,
          legality and price. Nedyway provides the platform that connects you,
          takes the order and helps arrange delivery and support. Each product
          and order shows which shop is selling it.
        </p>
      </Section>

      <Section title="2. Your account">
        <ul>
          <li>
            You must be at least 18 years old and able to enter a binding
            contract.
          </li>
          <li>
            Give accurate details and keep them up to date. You sign in with
            your email address and password; keep your password secret. You are
            responsible for what happens under your account.
          </li>
          <li>
            Tell us straight away if you think someone else has used your
            account.
          </li>
          <li>
            You can delete your account at any time — see{" "}
            <Link href="/delete-account">Delete your account</Link>.
          </li>
        </ul>
      </Section>

      <Section title="3. Orders and prices">
        <ul>
          <li>
            Prices are set by sellers, are in Indian rupees and include
            applicable taxes unless stated otherwise. Your order summary shows
            the item prices, any delivery fee, any platform fee and any discount
            before you place the order.
          </li>
          <li>
            An order is an offer to buy. It is accepted when the seller confirms
            it. A seller may decline or cancel an order — for example if an item
            is out of stock or the address is outside its delivery area — and we
            will tell you if that happens.
          </li>
          <li>
            Product images are illustrative. Fresh produce and items sold by
            weight may vary slightly from the picture or stated weight.
          </li>
          <li>
            For a photo order, the seller reads your list and turns it into an
            order; check the items and total before you accept it.
          </li>
        </ul>
      </Section>

      <Section title="4. Payment">
        <p>
          Orders are currently paid cash on delivery, to the person who delivers
          them. Please keep the exact amount ready where you can. We may limit
          cash-on-delivery orders — for example, the order value or the number
          of unpaid orders open at once.
        </p>
      </Section>

      <Section title="5. Delivery">
        <p>
          Orders are delivered to the address you choose by the seller or a
          delivery partner. Delivery times shown are estimates. Someone should
          be available to receive the order; if delivery fails because nobody is
          available or the address is wrong, the order may be cancelled.
        </p>
      </Section>

      <Section title="6. Cancellations, returns and refunds">
        <p>
          These are covered by our{" "}
          <Link href="/refund">Cancellation &amp; refund policy</Link>, which
          forms part of these terms.
        </p>
      </Section>

      <Section title="7. Promotions and loyalty points">
        <p>
          Promotion codes and loyalty points have the conditions shown with
          them, have no cash value, cannot be transferred and may be withdrawn
          if they are misused.
        </p>
      </Section>

      <Section title="8. Acceptable use">
        <p>You agree not to:</p>
        <ul>
          <li>use the service for anything unlawful or fraudulent;</li>
          <li>place orders you do not intend to accept or pay for;</li>
          <li>
            post reviews, photos or messages that are false, abusive, obscene,
            infringe someone else&rsquo;s rights, or that you are not entitled
            to share;
          </li>
          <li>
            interfere with the service, try to access other people&rsquo;s
            accounts or data, or scrape or copy the service by automated means.
          </li>
        </ul>
        <p>
          We may remove content, or suspend or close an account, that breaks
          these terms.
        </p>
      </Section>

      <Section title="9. Your content">
        <p>
          You keep ownership of reviews, photos and messages you submit. You
          give us a non-exclusive, royalty-free licence to store, display and
          use them to run the service — for example, showing your review on a
          product page.
        </p>
      </Section>

      <Section title="10. Liability">
        <p>
          We work to keep the service running and accurate, but it is provided
          &ldquo;as is&rdquo; and may sometimes be unavailable. To the extent
          the law allows, Nedyway is not liable for indirect or consequential
          losses, and our total liability for any order is limited to the amount
          you paid for it. Nothing in these terms limits rights you have under
          the Consumer Protection Act, 2019 or any other law that cannot be
          limited.
        </p>
      </Section>

      <Section title="11. Changes and termination">
        <p>
          We may update these terms; we will post the new version here with a
          new date, and tell you in the app or by email if a change is
          significant. If you keep using the service after a change, the new
          terms apply. You may stop using the service and delete your account at
          any time.
        </p>
      </Section>

      <Section title="12. Law and disputes">
        <p>
          These terms are governed by the laws of India. Courts at{" "}
          <Fill field="jurisdictionCity" /> have jurisdiction, without affecting
          your right to approach a consumer commission.
        </p>
      </Section>

      <Section title="13. Grievances and contact">
        <p>
          For help with an order, see{" "}
          <Link href="/support">Help &amp; support</Link>. Complaints can be
          sent to our Grievance Officer, <Fill field="grievanceOfficerName" />,
          at <MailLink field="grievanceOfficerEmail" />. We acknowledge
          complaints within 48 hours and aim to resolve them within one month,
          as the Consumer Protection (E-Commerce) Rules, 2020 require.
        </p>
      </Section>
    </LegalPage>
  );
}
