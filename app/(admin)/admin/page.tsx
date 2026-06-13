import { Store, Users } from "lucide-react";
import type { ComponentType } from "react";

export const metadata = { title: "Admin · Nedyway" };

const STATS: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { label: "Shops", value: "—", icon: Store },
  { label: "Pending shop owners", value: "—", icon: Users },
];

export default function AdminHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Admin overview
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage shops, owners, categories, and platform health.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map(({ label, value, icon: Icon }) => (
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
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-xs">
        The approval queue, analytics, and management tools arrive with the admin
        panel (Phase 4).
      </div>
    </div>
  );
}
