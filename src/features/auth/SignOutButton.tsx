"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLogout } from "./useAuth";

export function SignOutButton({
  variant = "outline",
}: {
  variant?: "outline" | "ghost" | "default";
}) {
  const logout = useLogout();
  return (
    <Button
      variant={variant}
      onClick={() => logout.mutate()}
      disabled={logout.isPending}
    >
      <LogOut className="size-4" /> Sign out
    </Button>
  );
}
