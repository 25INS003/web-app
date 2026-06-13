import { Leaf } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative grid min-h-dvh place-items-center bg-background px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(55% 50% at 50% 0%, oklch(0.62 0.17 38 / 0.1), transparent 70%)",
        }}
      />
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2"
          aria-label="Nedyway home"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-pop">
            <Leaf className="size-5" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Nedyway
          </span>
        </Link>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-md sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
