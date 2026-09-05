import type { ReactNode } from "react";
import { StorefrontHeader } from "@/components/shell/StorefrontHeader";
import { confineUnapprovedOwner } from "@/lib/auth/guards";

/**
 * The public shop. Deliberately browsable without an account — except by a
 * seller who is still waiting to be approved.
 *
 * They are the one signed-in party with no business here: the storefront is
 * where customers buy, and an applicant belongs on their application until
 * somebody decides. Removing `/status` from the URL used to land them here,
 * because a public layout had no guard to say otherwise.
 *
 * `confineUnapprovedOwner` is silent for everyone else and does not even call
 * the backend for a visitor with no session, so the page stays as public as it
 * has always been.
 */
export default async function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  await confineUnapprovedOwner();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <StorefrontHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Nedyway · Fresh groceries, delivered.</p>
      </footer>
    </div>
  );
}
