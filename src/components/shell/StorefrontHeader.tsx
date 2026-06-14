"use client";

import { Heart, Leaf, Search, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useIsAuthed } from "@/features/auth/useAuth";
import { useCartCount } from "@/features/cart/useCart";
import { NotificationBell } from "@/features/notifications/NotificationBell";

export function StorefrontHeader() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const authed = useIsAuthed();
  const cartCount = useCartCount(authed);
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
            router.push(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : "/search");
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
              <User />
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
    </header>
  );
}
