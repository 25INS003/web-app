import { Store } from "lucide-react";
import Link from "next/link";
import { SignOutButton } from "@/features/auth/SignOutButton";

export const metadata = { title: "Set up your shop · Nedyway" };

export default function OnboardingPage() {
  return (
    <div className="text-center">
      <span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Store className="size-6" />
      </span>
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Let&apos;s set up your shop
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The multi-step onboarding wizard (business details, address, bank,
        documents) arrives with Phase 3. Once submitted, an admin reviews and
        approves your shop.
      </p>
      {/* The owner guard sends BOTH the not-yet-applied and the rejected here,
          and a rejected applicant has a question this page cannot answer.
          /support needs only a session, not an approved shop. */}
      <p className="mt-4 text-sm text-muted-foreground">
        Questions about your application?{" "}
        <Link href="/support" className="font-medium text-primary hover:underline">
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
