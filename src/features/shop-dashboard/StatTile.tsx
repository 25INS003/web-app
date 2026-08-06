"use client";

import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import type { Delta } from "./format";

/**
 * A headline number. Four of these form the KPI row.
 *
 * Deliberately not a chart: a single current value with a period delta is a stat
 * tile, and a one-bar bar chart would say less in more space.
 *
 * The delta never signals by color alone — it always carries a direction arrow
 * and a named comparison period, so it survives grayscale, CVD, and forced-colors.
 */
export function StatTile({
  label,
  value,
  delta,
  deltaPeriod = "vs last month",
  icon: Icon,
  loading = false,
}: {
  label: string;
  value: string;
  delta?: Delta;
  deltaPeriod?: string;
  icon: ComponentType<{ className?: string }>;
  loading?: boolean;
}) {
  const DeltaIcon =
    delta?.direction === "up"
      ? ArrowUpRight
      : delta?.direction === "down"
        ? ArrowDownRight
        : ArrowRight;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between">
        {/* Sentence case, no trailing colon — the stat-tile label contract. */}
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="grid size-9 place-items-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="size-4" />
        </span>
      </div>

      {loading ? (
        <div
          className="mt-3 h-8 w-24 animate-pulse rounded-md bg-muted"
          aria-hidden
        />
      ) : (
        <p className="mt-3 font-display text-2xl font-bold tabular-nums">
          {value}
        </p>
      )}

      {delta && !loading && (
        <p
          className={cn(
            "mt-1 flex items-center gap-1 text-xs",
            delta.tone === "positive" && "text-success",
            delta.tone === "negative" && "text-destructive",
            delta.tone === "neutral" && "text-muted-foreground",
          )}
        >
          <DeltaIcon className="size-3.5 shrink-0" aria-hidden />
          <span className="font-medium tabular-nums">{delta.label}</span>
          <span className="text-muted-foreground">{deltaPeriod}</span>
        </p>
      )}
    </div>
  );
}
