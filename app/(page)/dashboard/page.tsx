import { IndianRupee, Package, ShoppingCart, TrendingUp } from "lucide-react";
import type { ComponentType } from "react";

export const metadata = { title: "Dashboard · Nedyway" };

const STATS: {
  label: string;
  value: string;
  delta: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { label: "Revenue (30d)", value: "₹—", delta: "live in Phase 3", icon: IndianRupee },
  { label: "Orders (30d)", value: "—", delta: "live in Phase 3", icon: ShoppingCart },
  { label: "Products", value: "—", delta: "live in Phase 3", icon: Package },
  { label: "Avg. order value", value: "₹—", delta: "live in Phase 3", icon: TrendingUp },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">Your shop at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map(({ label, value, delta, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-card p-5 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="grid size-9 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="size-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-bold tabular-nums">
              {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{delta}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-xs">
        Sales charts, recent orders, and live stats arrive with the shop-owner
        panel (Phase 3).
      </div>
    </div>
  );
}
