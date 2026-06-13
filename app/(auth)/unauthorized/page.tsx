import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Access denied · Nedyway" };

export default function UnauthorizedPage() {
  return (
    <div className="text-center">
      <span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <ShieldAlert className="size-6" />
      </span>
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Access denied
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        You don&apos;t have permission to view that page.
      </p>
      <Button asChild className="mt-6 w-full">
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
