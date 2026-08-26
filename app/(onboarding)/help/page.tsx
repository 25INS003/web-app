import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SupportList } from "@/features/support/SupportList";
import { requireRole } from "@/lib/auth/guards";

export const metadata = { title: "Help · Nedyway" };

/**
 * Support for a shop owner who is not through approval yet.
 *
 * They used to be sent to /support, which lives in the storefront group and
 * wears the shopping header — search, cart, wishlist, account. So the one link
 * offered to somebody waiting on approval dropped them into the customer shop,
 * where they could browse and check out. The tickets were fine; the doorway
 * was not.
 *
 * Same components, same endpoint, minimal chrome. `basePath` keeps every link
 * inside this group.
 */
export default async function PendingHelpPage() {
  const session = await requireRole("shop_owner");
  // An approved owner has a better version of this inside the dashboard.
  if (session.shop_owner_status?.is_approved) redirect("/dashboard/support");

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* The way back. With no storefront nav and no clickable logo, this and
          the sign-out in the layout are the only exits from this group — and
          a support page with no way back to what you were waiting on is its
          own kind of stuck. */}
      <Link
        href="/status"
        className="inline-flex items-center gap-1.5 px-4 text-sm text-muted-foreground transition hover:text-foreground sm:px-6"
      >
        <ArrowLeft className="size-4" />
        Your application
      </Link>
      <SupportList basePath="/help" />
    </div>
  );
}
