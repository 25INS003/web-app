import { Clock, Leaf, ShoppingBag, Truck, Wallet } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryRow } from "@/features/catalog/CategoryRow";
import { FreshPicks } from "@/features/catalog/FreshPicks";

const TRUST = [
  { icon: Truck, label: "Free delivery", sub: "on orders over ₹199" },
  { icon: Clock, label: "Fast slots", sub: "in as little as 30 min" },
  { icon: Wallet, label: "Cash on delivery", sub: "pay when it arrives" },
];

export default function StorefrontHome() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* Hero */}
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

      {/* Real data */}
      <CategoryRow />
      <FreshPicks />
    </div>
  );
}
