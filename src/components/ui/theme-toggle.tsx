"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

/**
 * Light/dark toggle.
 *
 * Both icons are always rendered and CSS picks one, rather than branching on
 * `resolvedTheme` during render. next-themes reads the stored preference from
 * localStorage, which the server cannot see, so `resolvedTheme` is undefined on
 * the server and on the first client paint. Choosing the icon from it therefore
 * produced a hydration mismatch for anyone on dark: the server sent the moon and
 * the light-theme label, the client hydrated to the sun and the other label, and
 * React errored on reload. It only ever surfaced in dark, because in light both
 * sides happened to agree.
 *
 * `suppressHydrationWarning` on <html> does not help here — it covers that one
 * element's own attributes, not a descendant rendering different children.
 *
 * The CSS approach also beats the usual `mounted` flag, which fixes the error by
 * rendering nothing on the first paint and so makes the button visibly pop in.
 * Here the markup is identical on both sides and the correct icon is right from
 * the first frame, because .dark is already on <html> by then.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      // Stable across themes on purpose: a label that changed with the theme
      // would reintroduce the same mismatch on an attribute instead of on the
      // children. The visible icon carries the current state.
      aria-label="Toggle light and dark theme"
      // Read at click time, not during render, so this stays hydration-safe.
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Moon className="dark:hidden" />
      <Sun className="hidden dark:block" />
    </Button>
  );
}
