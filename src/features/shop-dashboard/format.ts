// Number/currency formatting for the shop dashboard.
//
// Locale is en-IN throughout: it groups by lakh/crore (1,25,000 not 125,000) and
// compacts to K/L/Cr, which is what this audience reads. Kept in its own module
// so it is unit-testable without rendering a chart.

const compact = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const plain = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** 12900 → "12.9K" · 4200000 → "42L". For stat-tile values and axis ticks. */
export function compactNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return compact.format(value);
}

/** 12900 → "₹12.9K". Stat tiles and axis ticks, where space is tight. */
export function compactCurrency(value: number): string {
  if (!Number.isFinite(value)) return "₹0";
  return `₹${compact.format(value)}`;
}

/** 125000 → "₹1,25,000". Tooltips and tables, where the exact figure matters. */
export function fullCurrency(value: number): string {
  if (!Number.isFinite(value)) return "₹0";
  return `₹${plain.format(value)}`;
}

/**
 * A period-over-period delta for a stat tile.
 *
 * `direction` is the raw sign; `tone` folds in whether up is actually good, so a
 * caller can render a rising refund count as negative. Tone is never the only
 * signal — the tile pairs it with an arrow icon and the "vs last month" label,
 * per the accessibility rule that status is never color-alone.
 */
export type Delta = {
  label: string;
  direction: "up" | "down" | "flat";
  tone: "positive" | "negative" | "neutral";
};

export function toDelta(
  percent: number,
  { upIsGood = true }: { upIsGood?: boolean } = {},
): Delta {
  const safe = Number.isFinite(percent) ? Math.round(percent) : 0;
  const direction = safe > 0 ? "up" : safe < 0 ? "down" : "flat";
  const tone =
    direction === "flat"
      ? "neutral"
      : (direction === "up") === upIsGood
        ? "positive"
        : "negative";
  return { label: `${safe > 0 ? "+" : ""}${safe}%`, direction, tone };
}
