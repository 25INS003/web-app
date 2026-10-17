import Link from "next/link";
import { Fill, LegalPage, MailLink, Section } from "@/features/legal/LegalPage";

export const metadata = {
  title: "Privacy policy · Nedyway",
  description:
    "What personal data Nedyway collects, why, who it is shared with, how long it is kept and how to exercise your rights.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      intro={
        <p>
          Nedyway is a marketplace that lets you order groceries and daily
          essentials from shops near you, through the Nedyway mobile app and
          website. It is operated by <Fill field="legalName" />{" "}
          (&ldquo;Nedyway&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). This
          policy explains what personal data we collect, why, who we share it
          with and the choices you have. It is written to meet India&rsquo;s
          Digital Personal Data Protection Act, 2023 (&ldquo;DPDP Act&rdquo;)
          and the Information Technology Act, 2000 and its rules. In the DPDP
          Act&rsquo;s terms, we are the Data Fiduciary and you are the Data
          Principal.
        </p>
      }
    >
      <Section title="1. Data we collect">
        <p>We collect only what we need to run your account and your orders.</p>
        <ul>
          <li>
            <strong>Account details</strong> — your first and last name, email
            address, password and, if you give them, your mobile number, date of
            birth and profile photo. Your password is stored only as a one-way
            hash; we cannot read it.
          </li>
          <li>
            <strong>Delivery addresses</strong> — address line, landmark, city,
            state, pincode, the contact name and phone number for delivery, and,
            if you pin it on the map, the address&rsquo;s map coordinates.
          </li>
          <li>
            <strong>Location</strong> — only when you ask the app to find your
            current location while adding or choosing an address. The app asks
            for location permission &ldquo;while using the app&rdquo; only and
            does not track you in the background. Your location is used to fill
            in the address and to show shops that deliver to it.
          </li>
          <li>
            <strong>Orders</strong> — what you ordered, from which shops,
            prices, delivery and platform fees, any promotion code used, payment
            method, order status history, receipts, and loyalty points earned or
            redeemed.
          </li>
          <li>
            <strong>Photo orders</strong> — if you send a photo of a shopping
            list, the photos, any note you add and the delivery address you
            choose.
          </li>
          <li>
            <strong>Things you post or send us</strong> — product reviews and
            ratings (and any photos attached to them), support requests and the
            messages in them, and order disputes.
          </li>
          <li>
            <strong>Shopping activity</strong> — your cart, your wishlist, and a
            record of searches you make and items you remove from your cart or
            wishlist, which we use to suggest products you may want.
          </li>
          <li>
            <strong>Device and session data</strong> — a push-notification token
            for your device, your notification preferences, and, each time you
            sign in, your IP address and the browser or device type, kept with
            your session.
          </li>
        </ul>
        <p>
          <strong>Payments.</strong> At present, orders on Nedyway are paid cash
          on delivery. We do not collect or store card, UPI or bank account
          details. If we add online payment, it will be handled by a payment
          gateway and we will update this policy before it goes live.
        </p>
        <p>
          <strong>No advertising or third-party tracking.</strong> Nedyway does
          not include advertising or third-party analytics tools, does not track
          you across other companies&rsquo; apps or websites, and does not sell
          your personal data.
        </p>
      </Section>

      <Section title="2. Why we use it">
        <ul>
          <li>To create and secure your account and sign you in.</li>
          <li>
            To take, prepare, deliver and support your orders, including sending
            your order to the shop and to the person delivering it.
          </li>
          <li>
            To send you messages about your account and orders: email
            verification codes, password-reset codes, order updates and support
            replies, by email and push notification.
          </li>
          <li>
            To send you offers and announcements by push notification, which you
            can turn off in the app&rsquo;s notification settings or your
            phone&rsquo;s settings.
          </li>
          <li>
            To suggest products based on your searches and shopping activity.
          </li>
          <li>
            To keep the service safe — preventing fraud and abuse, enforcing our{" "}
            <Link href="/terms">Terms of service</Link> — and to meet our legal
            obligations, such as keeping tax and accounting records.
          </li>
        </ul>
        <p>
          We process your data on the basis of the consent you give when you
          create an account and use the service, and for the legitimate uses the
          DPDP Act allows, such as complying with the law. You can withdraw
          consent at any time by deleting your account (see section 7);
          withdrawing does not affect processing that took place before.
        </p>
      </Section>

      <Section title="3. Who we share it with">
        <ul>
          <li>
            <strong>The shops you order from</strong> receive your name, phone
            number, delivery address and what you ordered, so they can prepare
            and deliver the order. Shops are independent businesses.
          </li>
          <li>
            <strong>Delivery partners</strong> receive your name, phone number
            and delivery address for the orders they deliver.
          </li>
          <li>
            <strong>Service providers</strong> who process data for us, only to
            provide their service:
            <ul>
              <li>Zoho ZeptoMail, to send transactional email;</li>
              <li>
                Google Firebase Cloud Messaging and Apple Push Notification
                service, to deliver push notifications;
              </li>
              <li>
                map providers, to show maps and turn a location into an address:
                Apple Maps or Google Maps (depending on your phone) in the app,
                and OpenStreetMap on the website;
              </li>
              <li>our hosting and backup-storage providers.</li>
            </ul>
          </li>
          <li>
            <strong>Authorities</strong>, when the law requires it or to protect
            the rights and safety of our users and the public.
          </li>
        </ul>
        <p>
          Some of these providers may process data outside India. Where they do,
          we rely on the transfer being permitted under the DPDP Act.
        </p>
      </Section>

      <Section title="4. How long we keep it">
        <ul>
          <li>
            Your account data is kept while your account is open. When you
            delete your account we delete or anonymise it, except what we must
            keep by law (for example, order and invoice records needed for tax
            and accounting).
          </li>
          <li>Sign-in sessions expire after 7 days.</li>
          <li>
            Email verification and password-reset codes expire after 10 minutes.
          </li>
          <li>
            Database backups are kept for up to 30 days on our servers and up to
            90 days in off-site storage, after which they are deleted. Data you
            delete may remain in these backups until they expire.
          </li>
        </ul>
      </Section>

      <Section title="5. How we protect it">
        <p>
          Data travels between your device and our servers over encrypted HTTPS
          connections, passwords are stored only as one-way hashes, and access
          to our systems is restricted to the people who need it. No system is
          perfectly secure; if a personal data breach occurs we will notify you
          and the Data Protection Board of India as the DPDP Act requires.
        </p>
      </Section>

      <Section title="6. Your rights">
        <p>Under the DPDP Act you have the right to:</p>
        <ul>
          <li>
            get a summary of the personal data we hold about you and how it is
            used;
          </li>
          <li>
            correct, complete or update it — most of it you can edit yourself in
            the app under Profile;
          </li>
          <li>have it erased, by deleting your account;</li>
          <li>withdraw your consent;</li>
          <li>have your grievances addressed; and</li>
          <li>
            nominate another person to exercise these rights if you die or
            become unable to.
          </li>
        </ul>
        <p>
          To exercise any of them, write to our Grievance Officer (section 9).
          We will respond within the time the law allows.
        </p>
      </Section>

      <Section id="delete" title="7. Deleting your account">
        <p>
          You can ask us to delete your account and personal data at any time.
          See <Link href="/delete-account">Delete your account</Link> for the
          steps.
        </p>
      </Section>

      <Section title="8. Children">
        <p>
          Nedyway is meant for people aged 18 and over. We do not knowingly
          collect personal data from children. If you believe a child has given
          us personal data, contact us and we will delete it.
        </p>
      </Section>

      <Section title="9. Grievance Officer and contact">
        <p>
          For questions, requests or complaints about your personal data,
          contact our Grievance Officer:
        </p>
        <p>
          <Fill field="grievanceOfficerName" />
          <br />
          <Fill field="legalName" />
          <br />
          <Fill field="registeredAddress" />
          <br />
          Email: <MailLink field="grievanceOfficerEmail" />
        </p>
        <p>
          If you are not satisfied with our response, you may complain to the
          Data Protection Board of India.
        </p>
      </Section>

      <Section title="10. Changes to this policy">
        <p>
          We will post any change on this page and update the date at the top.
          If a change is significant we will also tell you in the app or by
          email before it takes effect.
        </p>
      </Section>
    </LegalPage>
  );
}
