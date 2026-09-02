"use client";

import {
  IndianRupee,
  ReceiptText,
  FolderTree,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Package,
  ShieldCheck,
  ShoppingCart,
  Store,
  Tag,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useLogout } from "@/features/auth/useAuth";
import type { User } from "@/lib/api/schemas/auth";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: ComponentType<{ className?: string }> };

const NAV: Record<"shop" | "admin", NavItem[]> = {
  shop: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/myshop", label: "My Shops", icon: Store },
    { href: "/products", label: "Products", icon: Package },
    // shop orders live under /dashboard to avoid colliding with the customer
    // storefront's /orders (built in Phase 3)
    { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
    // Owners are on tickets two ways: ones they raise, and ones an admin adds
    // them to. Both need a door into the owner area — the storefront /support
    // screen wears the shopping chrome and is not linked from anywhere here.
    { href: "/dashboard/support", label: "Support", icon: LifeBuoy },
  ],
  admin: [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/shops", label: "Shops", icon: Store },
    { href: "/admin/products/pending", label: "Product approvals", icon: Package },
    { href: "/admin/shop-owners", label: "Shop Owners", icon: Users },
    { href: "/admin/categories", label: "Categories", icon: FolderTree },
    { href: "/admin/promotions", label: "Discount codes", icon: Tag },
    { href: "/admin/orders", label: "Orders", icon: ReceiptText },
    { href: "/admin/platform-fees", label: "Platform fees", icon: IndianRupee },
    { href: "/admin/support", label: "Support", icon: LifeBuoy },
    { href: "/admin/reports", label: "Reports", icon: ShieldCheck },
  ],
};

export function DashboardShell({
  section,
  user,
  children,
}: {
  section: "shop" | "admin";
  user: User;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const nav = NAV[section];

  const isActive = (href: string) =>
    href === "/dashboard" || href === "/admin"
      ? pathname === href
      : pathname.startsWith(href);

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2 px-5">
        <span className="grid size-8 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Store className="size-4" />
        </span>
        <span className="font-display text-lg font-semibold tracking-tight">
          Nedyway
        </span>
        <span className="ml-auto rounded-md bg-sidebar-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sidebar-accent-foreground">
          {section}
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-3">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
              isActive(href)
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 px-2 text-xs text-sidebar-foreground/60">
          {user.first_name} {user.last_name}
        </div>
        <button
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-background">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 md:block">
        {sidebar}
      </aside>

      {/* mobile off-canvas */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64">{sidebar}</aside>
        </div>
      )}

      <div className="md:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            {open ? <X /> : <Menu />}
          </Button>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
