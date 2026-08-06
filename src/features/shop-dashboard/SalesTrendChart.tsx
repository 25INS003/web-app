"use client";

import { useId, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import type { SalesPoint } from "@/lib/api/schemas/dashboard";
import { compactCurrency, fullCurrency } from "./format";

// Revenue over time = trend, single series → area chart in ONE hue.
// No legend: with a single series the heading already names what is plotted, so
// a one-swatch legend box would only restate it.
//
// Colors come from the design system's chart tokens as CSS vars, which is what
// makes light/dark work without a JS theme lookup — the token itself has a dark
// step. `--chart-1` (persimmon) passes contrast against both surfaces.

const RANGES = [
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
] as const;

type RangeId = (typeof RANGES)[number]["id"];

export function SalesTrendChart({
  week,
  month,
  year,
  loading = false,
}: {
  week: SalesPoint[];
  month: SalesPoint[];
  year: SalesPoint[];
  loading?: boolean;
}) {
  const [range, setRange] = useState<RangeId>("week");
  const gradientId = useId();

  const series = range === "week" ? week : range === "month" ? month : year;
  const total = series.reduce((sum, point) => sum + point.value, 0);
  const isEmpty = series.length === 0;

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight">
            Sales performance
          </h2>
          <p className="text-sm text-muted-foreground">
            Revenue{" "}
            <span className="tabular-nums">{fullCurrency(total)}</span> over the
            selected period
          </p>
        </div>

        {/* Filters sit in one row above the plot, never inside it. */}
        <div
          role="tablist"
          aria-label="Sales period"
          className="flex shrink-0 gap-1 rounded-xl bg-muted p-1"
        >
          {RANGES.map((option) => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={range === option.id}
              onClick={() => setRange(option.id)}
              className={cn(
                "rounded-lg px-3 py-1 text-sm font-medium transition-colors",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                range === option.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 h-64">
        {loading ? (
          <div className="h-full animate-pulse rounded-xl bg-muted" aria-hidden />
        ) : isEmpty ? (
          <p className="grid h-full place-items-center text-sm text-muted-foreground">
            No sales in this period yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={series}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  {/* Area fill is a wash, never a saturated block. */}
                  <stop
                    offset="0%"
                    stopColor="var(--color-chart-1)"
                    stopOpacity={0.18}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-chart-1)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>

              {/* Recessive grid: hairline, solid (never dashed), horizontal only. */}
              <CartesianGrid
                stroke="var(--color-border)"
                strokeWidth={1}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                width={56}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
                tickFormatter={(value: number) => compactCurrency(value)}
              />
              <Tooltip
                cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
                content={<SalesTooltip />}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill={`url(#${gradientId})`}
                // ≥8px marker with a 2px surface ring so it stays legible where
                // it crosses the line — and so it is big enough to hover.
                activeDot={{
                  r: 5,
                  fill: "var(--color-chart-1)",
                  stroke: "var(--color-card)",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Table view: the values behind the plot, for screen readers and for
          anyone who cannot separate the mark from the surface. */}
      {!loading && !isEmpty && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            View as table
          </summary>
          <table className="mt-2 w-full text-sm">
            <caption className="sr-only">
              Revenue by period for the selected range
            </caption>
            <thead>
              <tr className="text-left text-muted-foreground">
                <th scope="col" className="py-1 font-medium">
                  Period
                </th>
                <th scope="col" className="py-1 text-right font-medium">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody>
              {series.map((point, index) => (
                <tr key={`${point.date}-${index}`} className="border-t border-border">
                  <td className="py-1">{point.date}</td>
                  <td className="py-1 text-right tabular-nums">
                    {fullCurrency(point.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </section>
  );
}

function SalesTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums text-popover-foreground">
        {fullCurrency(payload[0]?.value ?? 0)}
      </p>
    </div>
  );
}
