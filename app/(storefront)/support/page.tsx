import { LifeBuoy } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SupportContact } from "@/features/legal/SupportContact";
import { SupportList } from "@/features/support/SupportList";
import { getSession } from "@/lib/auth/session.server";

export const metadata = {
  title: "Help & support · Nedyway",
  description:
    "Contact Nedyway support, raise a request about an order, and find answers to common questions.",
};

/**
 * Public, unlike the rest of the support area.
 *
 * It used to require a session, which made the one page that says how to reach
 * us unreachable to anybody who could not sign in — and app stores require a
 * support URL anyone can open. Signed in, a customer still gets their requests
 * first; signed out, the page says how to get in touch. The ticket screens
 * under it (/support/new, /support/:id) still require a session.
 */
export default async function SupportPage() {
  const session = await getSession();

  return (
    <>
      {session ? (
        <SupportList />
      ) : (
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <LifeBuoy className="size-7" />
          </span>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Help &amp; support
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to raise a request about an order and follow our replies, or
            contact us directly below.
          </p>
          <Button asChild className="mt-6">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      )}
      <SupportContact />
    </>
  );
}
