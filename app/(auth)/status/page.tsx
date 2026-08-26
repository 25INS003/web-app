import { Clock } from "lucide-react";
import Link from "next/link";
import { SignOutButton } from "@/features/auth/SignOutButton";

export const metadata = { title: "Under review · Nedyway" };

export default function StatusPage() {
  return (
    <div className="text-center">
      <span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-warning/15 text-warning-foreground">
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
