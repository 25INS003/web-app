import Link from "next/link";

/**
 * The links every public page owes its visitors: the policies, how to get
 * help and how to delete an account. App stores check that these are
 * reachable from the site, so they sit in the footer of every public layout
 * rather than on one page somebody has to find.
 */
export const FOOTER_LINKS = [
  { href: "/support", label: "Help & support" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of service" },
  { href: "/refund", label: "Cancellation & refunds" },
  { href: "/delete-account", label: "Delete your account" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-8 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 sm:px-6">
        <nav aria-label="Legal and support">
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition hover:text-foreground hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p>
          © {new Date().getFullYear()} Nedyway · Fresh groceries, delivered.
        </p>
      </div>
    </footer>
  );
}
