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
      {/* Support is in the dashboard, and this page exists precisely because
          the dashboard is still shut. Someone whose application has sat here
          for a week has nobody to ask otherwise — /support needs only a
          session, not an approved shop. */}
      <p className="mt-4 text-sm text-muted-foreground">
        Waiting longer than you expected?{" "}
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
