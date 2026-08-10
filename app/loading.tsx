import { Leaf, Loader2 } from "lucide-react";

/**
 * Root loading boundary — the first thing a visitor sees on a cold navigation.
 *
 * It reuses the brand mark from StorefrontHeader verbatim rather than
 * approximating it, so the mark does not shift position or weight when the real
 * header replaces this screen.
 *
 * Every colour here is a theme token. The previous version hardcoded a
 * slate-900 gradient and an indigo spinner, which pinned it to a cold, dark
 * palette the app does not have: the theme is warm paper with a persimmon
 * primary, and it follows the viewer's light/dark preference. On a light
 * viewport that produced a full-screen dark flash on every navigation.
 */
export default function Loading() {
  return (
    // text-foreground is set alongside bg-background deliberately. Colour
    // inherits as a COMPUTED value, not as the var() reference, so a subtree
    // that redefines the theme tokens gets the new background but keeps the
    // ancestor's resolved text colour — dark ink on a dark ground. Pinning both
    // here means this screen resolves its own pair and cannot be left
    // unreadable by whatever renders it.
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-foreground">
      <div className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-pop">
          <Leaf className="size-5" />
        </span>
        <span className="font-display text-xl font-semibold tracking-tight">
          Nedyway
        </span>
      </div>

      {/* role="status" so a screen reader announces the wait; the icon is
          decorative and the text carries the meaning. */}
      <p
        role="status"
        className="flex items-center gap-2 text-sm text-muted-foreground"
      >
        <Loader2
          className="size-4 animate-spin text-primary"
          aria-hidden="true"
        />
        Loading…
      </p>
    </div>
  );
}
