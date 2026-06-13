import { Clock } from "lucide-react";
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
      <div className="mt-6">
        <SignOutButton />
      </div>
    </div>
  );
}
