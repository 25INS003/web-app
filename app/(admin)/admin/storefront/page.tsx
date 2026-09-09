import { StorefrontBanner } from "@/features/admin-storefront/StorefrontBanner";

export const metadata = { title: "Storefront banner · Nedyway Admin" };

/**
 * The images the customer shop opens with.
 *
 * The admin layout above supplies the role guard, so this is only ever
 * rendered for an admin.
 */
export default function AdminStorefrontPage() {
  return <StorefrontBanner />;
}
