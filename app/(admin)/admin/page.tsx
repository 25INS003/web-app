"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Store, Users, AlertCircle } from "lucide-react";
import type { ComponentType } from "react";

import { useShopOwnerStore } from "@/store/adminShopownerStore";
import { useAdminShopStore } from "@/store/adminShopStore";

// The approval queues, on the page an admin actually opens.
//
// This was a static placeholder: a card labelled "Pending shop owners" whose
// value was a hard-coded em dash. The endpoints existed, and so did the store
// actions that call them — `fetchPendingOwners` and `fetchPendingShops` were
// written and then used by nothing. An owner requesting approval relied on an
// admin scrolling the full list and noticing an amber badge.
//
// A count is the whole point: zero pending should be visibly zero, and three
// pending should be a number somebody can click.

type Stat = {
  label: string;
  value: number | null;
  href: string;
  icon: ComponentType<{ className?: string }>;
  urgent?: boolean;
};

export default function AdminHome() {
  const { pendingOwners, fetchPendingOwners } = useShopOwnerStore();
  const { pendingShops, fetchPendingShops } = useAdminShopStore();

  useEffect(() => {
    fetchPendingOwners();
    fetchPendingShops();
  }, [fetchPendingOwners, fetchPendingShops]);

  const owners = Array.isArray(pendingOwners) ? pendingOwners.length : null;
  const shops = Array.isArray(pendingShops) ? pendingShops.length : null;

  const stats: Stat[] = [
    {
      label: "Shop owners awaiting approval",
      value: owners,
      href: "/admin/shop-owners?status=pending",
      icon: Users,
      urgent: (owners ?? 0) > 0,
    },
    {
      label: "Shops awaiting approval",
      value: shops,
      href: "/admin/shops?status=pending",
      icon: Store,
      urgent: (shops ?? 0) > 0,
    },
  ];

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
        {stats.map(({ label, value, href, icon: Icon, urgent }) => (
          <Link
            key={label}
            href={href}
            className={`rounded-2xl border bg-card p-5 shadow-xs transition-colors hover:bg-accent/40 ${
              urgent ? "" : "border-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <span
                className={`grid size-9 place-items-center rounded-xl ${
                  urgent
                    ? "bg-warning/10 text-warning"
                    : "bg-accent text-accent-foreground"
                }`}
              >
                {urgent ? (
                  <AlertCircle className="size-4" />
                ) : (
                  <Icon className="size-4" />
                )}
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-bold tabular-nums">
              {/* null means the request has not answered yet. Showing 0 then
                  would say "nothing to do" before we know that. */}
              {value === null ? "…" : value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {value === null
                ? "loading"
                : value === 0
                  ? "nothing waiting"
                  : "review now"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
