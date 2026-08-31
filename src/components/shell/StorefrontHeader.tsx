"use client";

import { Heart, Leaf, Search, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { DeliveryAddressBar } from "@/features/address/DeliveryAddressBar";
import { useIsAuthed, useSession, useUserRole } from "@/features/auth/useAuth";
import { useCartCount } from "@/features/cart/useCart";
import { NotificationBell } from "@/features/notifications/NotificationBell";

export function StorefrontHeader() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const authed = useIsAuthed();
  // Skipped for signed-out visitors — /auth/me is a guaranteed 401 there.
  const session = useSession(authed);
  const cartCount = useCartCount(authed);
  // The whole row goes, not just its contents: an empty bordered strip reads as
  // something that failed to load.
  const role = useUserRole();
  const showsAddress = !authed || !role || role === "customer";
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        {/* brand */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-pop">
            <Leaf className="size-5" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Nedyway
          </span>
        </Link>

        {/* search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.push(
              q.trim()
                ? `/search?q=${encodeURIComponent(q.trim())}`
                : "/search",
            );
          }}
          className="relative ml-2 hidden flex-1 md:block"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search for groceries, shops, brands…"
            aria-label="Search products"
            className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40"
          />
        </form>

        {/* actions */}
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex"
            aria-label="Wishlist"
            asChild
          >
            <Link href="/wishlist">
              <Heart />
            </Link>
          </Button>
          <NotificationBell />
          <Button variant="ghost" size="icon" aria-label="Account" asChild>
            <Link href="/account">
              {/* Signed in, the generic person icon becomes the same initials
                  tile the account page shows, so the header says WHO is signed in
                  rather than merely that someone is. Signed out it stays the
                  outline icon — there are no initials to draw, and a filled tile
                  would read as a session that does not exist.

                  Gated on session.data, not on isAuthed: the cookie says a
                  session exists but carries no name, so rendering on the cookie
                  alone would flash an empty tile until /auth/me resolves. */}
              {session.data?.user ? (
                <InitialsAvatar
                  name={`${session.data.user.first_name} ${session.data.user.last_name}`.trim()}
                  className="size-7 rounded-xl text-[11px]"
                />
              ) : (
                <User />
              )}
            </Link>
          </Button>
          <Button className="relative gap-2" asChild>
            <Link href="/cart">
              <ShoppingBag />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-foreground text-[10px] font-bold text-background">
                  {cartCount}
                </span>
              )}
            </Link>
          </Button>
        </div>
      </div>

      {/* Where the order is going. Its own row rather than squeezed in beside
          the search: an address is too long to truncate usefully at that width,
          and a pincode shortened to fit is the one part that must stay
          readable. */}
      {showsAddress && (
        <div className="border-t border-border/60">
          <div className="mx-auto flex h-11 max-w-7xl items-center px-4 sm:px-6">
            <DeliveryAddressBar />
          </div>
        </div>
      )}
    </header>
  );
}
