import { Clock, Leaf, ShoppingBag, Truck, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";

const CATEGORIES = [
  { label: "Fruits & Veg", emoji: "🥦" },
  { label: "Dairy & Eggs", emoji: "🥚" },
  { label: "Bakery", emoji: "🍞" },
  { label: "Beverages", emoji: "🧃" },
  { label: "Snacks", emoji: "🍪" },
  { label: "Household", emoji: "🧴" },
  { label: "Personal Care", emoji: "🧼" },
];

type Product = {
  name: string;
  shop: string;
  price: number;
  compareAt?: number;
  emoji: string;
  tint: string;
  fresh?: boolean;
};

const PRODUCTS: Product[] = [
  { name: "Farm Tomatoes 1kg", shop: "Green Basket", price: 38, compareAt: 50, emoji: "🍅", tint: "from-[oklch(0.62_0.17_38/0.18)]", fresh: true },
  { name: "Toned Milk 1L", shop: "Daily Dairy", price: 54, emoji: "🥛", tint: "from-[oklch(0.62_0.1_220/0.16)]" },
  { name: "Brown Bread", shop: "Crust & Co", price: 45, compareAt: 55, emoji: "🍞", tint: "from-[oklch(0.8_0.14_80/0.2)]" },
  { name: "Bananas (dozen)", shop: "Green Basket", price: 60, emoji: "🍌", tint: "from-[oklch(0.8_0.14_80/0.22)]", fresh: true },
  { name: "Free-range Eggs 12", shop: "Daily Dairy", price: 96, emoji: "🥚", tint: "from-[oklch(0.7_0.14_150/0.16)]" },
  { name: "Cold Brew 250ml", shop: "Brew Lab", price: 120, compareAt: 150, emoji: "🧋", tint: "from-[oklch(0.55_0.16_330/0.16)]" },
  { name: "Sunflower Oil 1L", shop: "Pantry Plus", price: 145, emoji: "🛢️", tint: "from-[oklch(0.8_0.14_80/0.18)]" },
  { name: "Baby Spinach 200g", shop: "Green Basket", price: 32, emoji: "🥬", tint: "from-[oklch(0.7_0.14_150/0.2)]", fresh: true },
];

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
            <Button size="lg" className="gap-2">
              <ShoppingBag /> Start shopping
            </Button>
            <Button size="lg" variant="outline">
              Browse categories
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

      {/* Categories */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Shop by category
        </h2>
        <div className="mt-5 flex flex-wrap gap-2.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.label}
              className="group inline-flex items-center gap-2 rounded-full border border-border bg-card py-2 pl-2 pr-4 text-sm font-medium shadow-xs transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <span className="grid size-8 place-items-center rounded-full bg-muted text-base transition group-hover:bg-primary/10">
                {c.emoji}
              </span>
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* Fresh picks */}
      <section className="mt-12 pb-16">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Fresh picks
          </h2>
          <Button variant="link" className="px-0">
            View all
          </Button>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {PRODUCTS.map((p) => (
            <article
              key={p.name}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className={cn(
                  "relative grid aspect-[4/3] place-items-center bg-gradient-to-br to-transparent",
                  p.tint,
                )}
              >
                <span className="text-5xl drop-shadow-sm">{p.emoji}</span>
                {p.fresh && (
                  <Badge variant="success" className="absolute left-2.5 top-2.5">
                    <Leaf className="size-3" /> Fresh
                  </Badge>
                )}
                {p.compareAt && (
                  <Badge className="absolute right-2.5 top-2.5">
                    {Math.round((1 - p.price / p.compareAt) * 100)}% off
                  </Badge>
                )}
              </div>
              <div className="flex flex-1 flex-col p-3.5">
                <h3 className="text-sm font-semibold leading-snug">{p.name}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.shop}</p>
                <div className="mt-3 flex items-end justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-base font-bold tabular-nums">
                      {formatPrice(p.price)}
                    </span>
                    {p.compareAt && (
                      <span className="font-mono text-xs text-muted-foreground line-through">
                        {formatPrice(p.compareAt)}
                      </span>
                    )}
                  </div>
                  <Button size="sm" className="gap-1.5">
                    <ShoppingBag className="size-3.5" /> Add
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
