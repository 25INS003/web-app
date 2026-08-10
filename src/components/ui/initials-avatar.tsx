import { cn } from "@/lib/utils";

/**
 * The persimmon initials tile used wherever a signed-in person is shown.
 *
 * Extracted so the header and the account page cannot drift: they are the same
 * mark at two sizes, and a visitor reads them as the same object, so a change to
 * one that misses the other is a bug rather than a variation.
 *
 * Size, and anything else, comes from `className` — the tile itself only owns
 * the things that make it this mark and not some other one.
 */
export function InitialsAvatar({
  name,
  className,
  ...props
}: {
  name: string;
  className?: string;
} & React.HTMLAttributes<HTMLSpanElement>) {
  const text = initials(name);
  return (
    <span
      // aria-hidden and a title rather than a label: every place this renders,
      // the accessible name already comes from the control wrapping it ("Account"),
      // and announcing "BC" after it would just be noise.
      aria-hidden="true"
      title={name || undefined}
      className={cn(
        "grid shrink-0 place-items-center rounded-2xl bg-primary font-bold text-primary-foreground shadow-pop",
        className,
      )}
      {...props}
    >
      {text || "👤"}
    </span>
  );
}

/** First letters of the first two words — "Bench Customer" becomes "BC". */
export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}
