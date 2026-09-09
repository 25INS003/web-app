import { Clock, Leaf, ShoppingBag, Truck, Wallet } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryRow } from "@/features/catalog/CategoryRow";
import { DeliverableSections } from "@/features/catalog/DeliverableSections";
import { FreshPicks } from "@/features/catalog/FreshPicks";
import { SuggestionRow } from "@/features/suggestions/SuggestionRow";
import {
  HeroCarousel,
  type HeroSlide,
} from "@/features/storefront/HeroCarousel";


/**
 * The admin's banner images, or nothing.
 *
 * Read on the server so the first paint already has the right images — a
 * carousel that swaps its contents a beat after the page appears is worse than
 * either version of it.
 *
 * An empty list is the honest answer for "no banner has been uploaded", and
 * the carousel turns that into the written hero below rather than a blank
 * band. There is deliberately no shipped artwork behind this any more: default
 * images would mean a fresh install advertises pictures nobody chose, and an
 * admin who removes their last banner would get stock photos instead of the
 * headline they had before.
 *
 * A failed request answers the same way. The storefront is the front page —
 * it renders with the headline if settings are unreachable.
 */
async function heroSlides(): Promise<HeroSlide[]> {
  // The docker-network base, not the browser's — this runs on the server. No
  // cookies: the endpoint is public, and sending them would make the response
  // per-user for something that is the same for everybody.
  const base =
    process.env.API_INTERNAL_URL ?? "http://ins03-backend-dev:8000/api/v1";

  try {
    const res = await fetch(`${base}/public/hero-slides`, {
      // `no-store`, deliberately, after trying to be clever with
      // `next: { revalidate: 60 }`.
      //
      // Caching the response meant an admin uploaded a banner, refreshed the
      // shop, saw the old set and had nothing to tell them why — the change
      // had landed in the database and the page was serving a cached empty
      // list. A minute of staleness is not worth that, and the saving was
      // imaginary: this is one indexed read of a single row over the docker
      // network, next to a page that already queries categories, suggestions
      // and stock on every view.
      cache: "no-store",
    });
    if (!res.ok) return [];
    const body = await res.json();
    const uploaded: Array<{ url?: string; src?: string; alt?: string; href?: string | null }> =
      body?.data?.slides ?? [];
    const mapped = uploaded
      // The API stores `url`; the carousel takes `src`. Mapped here rather
      // than renaming the column, so the stored shape stays the one the admin
      // form writes.
      .map((s) => ({
        src: s.url ?? s.src ?? "",
        alt: s.alt ?? "",
        href: s.href ?? undefined,
      }))
      .filter((s) => s.src);

    return mapped;
  } catch {
    return [];
  }
}

const TRUST = [
  { icon: Truck, label: "Free delivery", sub: "on orders over ₹199" },
  { icon: Clock, label: "Fast slots", sub: "in as little as 30 min" },
  { icon: Wallet, label: "Cash on delivery", sub: "pay when it arrives" },
];

export default async function StorefrontHome() {
  const slides = await heroSlides();
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* The admin's image strip, or — with nothing uploaded — the headline
          hero that was here before it. The fallback is the point: a shopfront
          whose first screen is an empty rounded rectangle looks broken, and
          "no banners are set up" is not the visitor's problem. */}
      <HeroCarousel slides={slides}>
      <section className="relative my-6 overflow-hidden rounded-3xl border border-border bg-card px-6 py-14 shadow-sm sm:px-12 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 80% at 85% 10%, oklch(0.62 0.17 38 / 0.16), transparent 60%), radial-gradient(50% 70% at 0% 100%, oklch(0.7 0.14 150 / 0.14), transparent 60%)",
          }}
        />
        <div className="max-w-2xl">
          <Badge variant="success" className="mb-5">
            <Leaf className="size-3" /> Now delivering near you
          </Badge>
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Fresh groceries,
            <br />
            from the shops <span className="text-primary">next door.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
            Browse local shops, fill your basket, and get daily essentials
            delivered to your door — pay on delivery, no app required.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="gap-2" asChild>
              <Link href="/search">
                <ShoppingBag /> Start shopping
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/search">Browse categories</Link>
            </Button>
          </div>
        </div>
      </section>
      </HeroCarousel>

      {/* Trust strip */}
      <section className="grid gap-3 sm:grid-cols-3">
        {TRUST.map(({ icon: Icon, label, sub }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Icon className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Real data, and only where we deliver — a pincode nobody serves gets
          one panel saying so instead of three empty rows under three
          headings. */}
      <DeliverableSections>
        <CategoryRow />
        {/* Renders nothing for signed-out visitors. */}
        <SuggestionRow />
        <FreshPicks />
      </DeliverableSections>
    </div>
  );
}
