import type { ReactNode } from "react";
import { StorefrontHeader } from "@/components/shell/StorefrontHeader";

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <StorefrontHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Nedyway · Fresh groceries, delivered.</p>
      </footer>
    </div>
  );
}
