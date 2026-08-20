"use client";

import { Check, Inbox, Loader2, RefreshCw, Store, Users, X } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/features/orders/status";
import {
  STATUS_LABEL,
  STATUS_VARIANT,
  businessName,
  ownerName,
} from "@/lib/api/schemas/admin";
import type { ShopOwner } from "@/lib/api/schemas/admin";
import {
  useAdminShops,
  useAllOwners,
  useOwnerDecision,
  usePendingOwners,
  usePendingShops,
} from "./hooks";

export function AdminOverview() {
  const pending = usePendingOwners();
  const owners = useAllOwners();
  const shops = useAdminShops();
  const pendingShops = usePendingShops();
  const decide = useOwnerDecision();

  const queue = pending.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Admin overview
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage shops, owners, categories, and platform health.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => pending.refetch()}
          disabled={pending.isFetching}
        >
          <RefreshCw
            className={`size-4 ${pending.isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          label="Pending shop owners"
          value={pending.isPending ? null : queue.length}
          icon={Inbox}
          href="/admin/shop-owners"
          highlight={queue.length > 0}
        />
        <Tile
          label="Shop owners"
          value={owners.isPending ? null : (owners.data?.length ?? 0)}
          icon={Users}
          href="/admin/shop-owners"
        />
        <Tile
          label="Shops"
          value={shops.isPending ? null : (shops.data?.length ?? 0)}
          icon={Store}
          href="/admin/shops"
        />
        <Tile
          label="Shops awaiting approval"
          value={pendingShops.isPending ? null : (pendingShops.data?.length ?? 0)}
          icon={Store}
          href="/admin/shops"
          highlight={(pendingShops.data?.length ?? 0) > 0}
        />
      </div>

      <section className="rounded-2xl border border-border bg-card shadow-xs">
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-bold">
              Seller applications
            </h2>
            <p className="text-sm text-muted-foreground">
              People who registered to sell and are waiting on a decision.
            </p>
          </div>
          {queue.length > 0 && (
            <Badge variant="warning">{queue.length} waiting</Badge>
          )}
        </header>

        {pending.isPending ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : pending.isError ? (
          <Empty
            title="Could not load applications"
            body="Something went wrong fetching the approval queue."
            action={
              <Button onClick={() => pending.refetch()}>Try again</Button>
            }
          />
        ) : queue.length === 0 ? (
          <Empty
            title="Nothing waiting"
            body="New seller registrations appear here automatically."
          />
        ) : (
          <ul className="divide-y divide-border">
            {queue.map((owner) => (
              <ApplicantRow
                key={owner.id}
                owner={owner}
                busy={decide.isPending}
                onDecide={(decision) =>
                  decide.mutate({ ownerId: owner.id, decision })
                }
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ApplicantRow({
  owner,
  busy,
  onDecide,
}: {
  owner: ShopOwner;
  busy: boolean;
  onDecide: (decision: "approve" | "reject") => void;
}) {
  const business = businessName(owner);
  const place = [owner.business_address_district, owner.business_address_state]
    .filter(Boolean)
    .join(", ");

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{ownerName(owner)}</span>
          <Badge variant={STATUS_VARIANT[owner.verification_status]}>
            {STATUS_LABEL[owner.verification_status]}
          </Badge>
          {owner.user_id?.is_email_verified === false && (
            <Badge variant="outline">Email unverified</Badge>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {owner.user_id?.email}
          {business ? ` · ${business}` : ""}
          {place ? ` · ${place}` : ""}
          {owner.created_at ? ` · applied ${formatDate(owner.created_at)}` : ""}
        </p>
      </div>

      <div className="flex shrink-0 gap-2">
        {/* Reject sits left of approve and is the quieter control on purpose:
            both are one click and neither asks twice, so the destructive one
            should not be the one under the cursor by default. */}
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => onDecide("reject")}
        >
          <X className="size-4" />
          Reject
        </Button>
        <Button size="sm" disabled={busy} onClick={() => onDecide("approve")}>
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          Approve
        </Button>
      </div>
    </li>
  );
}

function Tile({
  label,
  value,
  icon: Icon,
  href,
  highlight = false,
}: {
  label: string;
  value: number | null;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl border bg-card p-5 shadow-xs transition hover:border-primary/50 ${
        highlight ? "border-primary/40" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span
          className={`grid size-9 place-items-center rounded-xl ${
            highlight
              ? "bg-primary/10 text-primary"
              : "bg-accent text-accent-foreground"
          }`}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-bold tabular-nums">
        {value === null ? (
          <span className="inline-block h-7 w-10 animate-pulse rounded bg-muted align-middle" />
        ) : (
          value
        )}
      </p>
    </Link>
  );
}

function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="p-10 text-center">
      <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <Inbox className="size-6" />
      </span>
      <h3 className="font-display text-base font-bold">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {body}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
