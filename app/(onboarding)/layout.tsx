import { Leaf } from "lucide-react";
import type { ReactNode } from "react";
import { SignOutButton } from "@/features/auth/SignOutButton";

/**
 * Room for the onboarding wizard.
 *
 * It used to live in the `(auth)` group, which constrains its children to
 * `max-w-sm` and wraps them in a bordered card — right for a login form, and
 * wrong for a five-step application: the step bar, the district/state pair and
 * the document list were all being squeezed into a 384px column inside a
 * doubled card border.
 *
 * Same brand header so the two do not look like different products; the width
 * and the card are left to the page.
 */
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-background px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(55% 50% at 50% 0%, oklch(0.62 0.17 38 / 0.1), transparent 70%)",
        }}
      />
      {/* The mark is deliberately NOT a link. Everyone who sees this layout is
          a shop owner waiting on approval, and "/" is the customer storefront
          — making the logo clickable reopens the same doorway the /support
          link used to be.
          
          Which is exactly why sign-out belongs HERE rather than only on the
          status page: with no storefront nav and no clickable logo, a page in
          this group would otherwise have no way out at all. */}
      <div className="mx-auto mb-8 flex w-full max-w-2xl items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-pop">
            <Leaf className="size-5" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Nedyway
          </span>
        </div>
        <SignOutButton variant="ghost" />
      </div>
      {children}
    </div>
  );
}
