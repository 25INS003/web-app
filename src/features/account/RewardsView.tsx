"use client";

import {
  ArrowLeft,
  Clock,
  Gift,
  Loader2,
  Sparkles,
  Tag,
  TrendingUp,
  Trophy,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/features/orders/status";
import type {
  LoyaltyHistoryEntry,
  LoyaltyPoints,
  LoyaltyTier,
  Reward,
} from "@/lib/api/schemas/loyalty";
import { formatPrice } from "@/lib/utils";
import {
  useLoyaltyHistory,
  useLoyaltySummary,
  useRedeemReward,
  useRewards,
} from "./useLoyalty";

// Each rung gets its own treatment so the tier reads at a glance rather than
// being a word on a grey chip. Kept as static class strings — Tailwind cannot
// see classes built by interpolation, and a template literal here would ship
// a card with no colours at all.
const TIER_STYLE: Record<LoyaltyTier, { ring: string; text: string }> = {
  bronze: {
    ring: "from-amber-700/25 to-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
  },
  silver: {
    ring: "from-slate-400/25 to-slate-300/10",
    text: "text-slate-600 dark:text-slate-300",
  },
  gold: {
    ring: "from-yellow-500/25 to-amber-300/10",
    text: "text-yellow-600 dark:text-yellow-400",
  },
  platinum: {
    ring: "from-cyan-400/25 to-sky-300/10",
    text: "text-cyan-700 dark:text-cyan-300",
  },
  diamond: {
    ring: "from-violet-500/25 to-fuchsia-400/10",
    text: "text-violet-600 dark:text-violet-400",
  },
};

const REWARD_ICON: Record<string, typeof Gift> = {
  free_shipping: Truck,
  discount: Tag,
  gift_card: Gift,
};

export function RewardsView() {
  const summary = useLoyaltySummary();

  if (summary.isPending) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="h-8 w-44 animate-pulse rounded bg-muted" />
        <div className="mt-6 h-44 animate-pulse rounded-2xl bg-muted" />
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (summary.isError || !summary.data) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <Trophy className="size-7" />
        </span>
        <h1 className="font-display text-2xl font-bold">
          Rewards are unavailable
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn&apos;t load your points just now. Please try again shortly.
        </p>
        <Button className="mt-6" onClick={() => summary.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const { points, benefits } = summary.data;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/account"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Account
      </Link>

      <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">
        Rewards
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        You earn 1 point for every {formatPrice(points.rupees_per_point)} spent,
        credited when your order is delivered.
      </p>

      <TierCard points={points} perks={benefits?.benefits ?? []} />
      <RewardsCatalogue balance={points.available_points} />
      <HistoryList />
    </div>
  );
}

function TierCard({
  points,
  perks,
}: {
  points: LoyaltyPoints;
  perks: string[];
}) {
  const style = TIER_STYLE[points.tier] ?? TIER_STYLE.bronze;
  const atTop = !points.next_tier;

  return (
    <section
      className={`mt-6 overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${style.ring} p-5`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Trophy className={`size-4 ${style.text}`} /> Your tier
          </div>
          <p
            className={`mt-1 font-display text-2xl font-bold capitalize ${style.text}`}
          >
            {points.tier_label}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0">
          <TrendingUp className="size-3" />
          {points.point_multiplier}× points
        </Badge>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-2">
        <div>
          <p className="font-mono text-3xl font-bold tabular-nums">
            {points.available_points.toLocaleString("en-IN")}
            <span className="ml-1.5 text-base font-medium text-muted-foreground">
              points
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            worth {formatPrice(points.available_value_rupees)} off your basket
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          <p>
            {points.lifetime_points_earned.toLocaleString("en-IN")} earned all
            time
          </p>
          {points.lifetime_points_redeemed > 0 && (
            <p>
              {points.lifetime_points_redeemed.toLocaleString("en-IN")} redeemed
            </p>
          )}
        </div>
      </div>

      {/* Progress is against LIFETIME points, which is why it can sit above the
          spendable balance — redeeming a reward must not cost you your tier. */}
      {!atTop && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {points.points_to_next_tier.toLocaleString("en-IN")} points to{" "}
              {points.next_tier_label}
            </span>
            <span className="tabular-nums">
              {Math.round(points.tier_progress)}%
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-card">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${Math.round(points.tier_progress)}%` }}
            />
          </div>
        </div>
      )}

      {atTop && (
        <p className="mt-4 text-xs font-medium text-muted-foreground">
          You&apos;re at the top tier — every order earns at the maximum rate.
        </p>
      )}

      {perks.length > 0 && (
        <ul className="mt-4 grid gap-1.5 border-t border-border/60 pt-4 sm:grid-cols-2">
          {perks.map((perk) => (
            <li
              key={perk}
              className="flex items-start gap-2 text-xs text-muted-foreground"
            >
              <Sparkles className="mt-0.5 size-3 shrink-0 text-primary" />
              {perk}
            </li>
          ))}
        </ul>
      )}

      {points.points_expiring_soon > 0 && (
        <p className="mt-4 flex items-center gap-1.5 rounded-xl bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
          <Clock className="size-3.5 shrink-0" />
          {points.points_expiring_soon.toLocaleString("en-IN")} points expire on{" "}
          {formatDate(points.next_expiry_date)}
        </p>
      )}
    </section>
  );
}

function RewardsCatalogue({ balance }: { balance: number }) {
  const q = useRewards();
  const redeem = useRedeemReward();
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (q.isPending) {
    return <div className="mt-8 h-40 animate-pulse rounded-2xl bg-muted" />;
  }

  const rewards = q.data?.rewards ?? [];
  if (!rewards.length) return null;

  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-semibold">Redeem your points</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {rewards.map((reward) => (
          <RewardCard
            key={reward._id}
            reward={reward}
            balance={balance}
            busy={redeem.isPending && pendingId === reward._id}
            disabled={redeem.isPending}
            onRedeem={() => {
              setPendingId(reward._id);
              redeem.mutate(reward._id, {
                onSettled: () => setPendingId(null),
              });
            }}
          />
        ))}
      </div>
    </section>
  );
}

function RewardCard({
  reward,
  balance,
  busy,
  disabled,
  onRedeem,
}: {
  reward: Reward;
  balance: number;
  busy: boolean;
  disabled: boolean;
  onRedeem: () => void;
}) {
  const Icon = REWARD_ICON[reward.type] ?? Gift;
  const affordable = balance >= reward.points_required;
  const shortfall = reward.points_required - balance;

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{reward.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {reward.short_description || reward.description}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
        <span className="font-mono text-sm font-bold tabular-nums">
          {reward.points_required.toLocaleString("en-IN")}
          <span className="ml-1 text-xs font-medium text-muted-foreground">
            pts
          </span>
        </span>
        {/* An unaffordable reward shows the gap rather than a dead button —
            "480 points short" tells you what to do; a greyed-out control does
            not. */}
        {affordable ? (
          <Button size="sm" onClick={onRedeem} disabled={disabled}>
            {busy && <Loader2 className="animate-spin" />}
            Redeem
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">
            {shortfall.toLocaleString("en-IN")} points short
          </span>
        )}
      </div>
    </div>
  );
}

function HistoryList() {
  const q = useLoyaltyHistory();

  if (q.isPending) {
    return <div className="mt-8 h-40 animate-pulse rounded-2xl bg-muted" />;
  }

  const history = q.data ?? [];

  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-semibold">Points activity</h2>
      {history.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Nothing yet — your first delivered order will show up here.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {history.map((entry, i) => (
            <HistoryRow key={entry._id ?? i} entry={entry} />
          ))}
        </ul>
      )}
    </section>
  );
}

function HistoryRow({ entry }: { entry: LoyaltyHistoryEntry }) {
  const positive = entry.points > 0;
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{entry.description}</p>
        <p className="text-xs text-muted-foreground">
          {formatDate(entry.created_at)}
          {entry.tier_at_transaction && (
            <span className="capitalize"> · {entry.tier_at_transaction}</span>
          )}
        </p>
      </div>
      <span
        className={`shrink-0 font-mono text-sm font-bold tabular-nums ${
          positive ? "text-success" : "text-muted-foreground"
        }`}
      >
        {positive ? "+" : ""}
        {entry.points.toLocaleString("en-IN")}
      </span>
    </li>
  );
}
