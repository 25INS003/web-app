import type { ReactNode } from "react";
import { StorefrontHeader } from "@/components/shell/StorefrontHeader";
import { confineToOwnArea } from "@/lib/auth/guards";

/**
 * The public shop. Browsable without an account, and by customers — and by
 * nobody else who is signed in.
 *
 * It began with no guard at all, then with one that bounced only a seller
 * whose application was unreviewed. An APPROVED owner or an admin who
 * shortened a URL still landed in the shopfront: a search bar, a wishlist, a
 * Cart button and a checkout, none of which is theirs. `confineToOwnArea`
 * sends every signed-in non-customer back to their own area.
 *
 * It stays silent for signed-out visitors and does not even call the backend
 * for them, so the page is as public as it has always been.
 */
export default async function StorefrontLayout({
  children,
}: {
  children: ReactNode;
}) {
  await confineToOwnArea();

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
