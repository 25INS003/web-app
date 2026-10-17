import { Leaf } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/shell/SiteFooter";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/**
 * The policy pages: privacy, terms, refunds and account deletion.
 *
 * Their own group rather than part of the storefront, because the storefront
 * layout sends every signed-in admin and shop owner back to their own area —
 * and these pages have to be readable by everybody, signed in or not, whatever
 * their role. The chrome is deliberately plain: a way home and a theme toggle,
 * no cart or search to suggest this is somewhere to shop.
 */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2"
            aria-label="Nedyway home"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-pop">
              <Leaf className="size-5" />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight">
              Nedyway
            </span>
          </Link>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
