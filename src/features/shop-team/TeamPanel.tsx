"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldCheck, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/types";
import { teamApi, type RoleOption, type ShopMember, type ShopRole } from "./api";

/** What each role means, in the words an owner would use. */
const ROLE_COPY: Record<ShopRole, { label: string; detail: string }> = {
  manager: {
    label: "Manager",
    detail: "Everything except the team and shop settings",
  },
  orders: {
    label: "Orders",
    detail: "See and move the order queue; read stock",
  },
  stock: {
    label: "Stock",
    detail: "Stock levels, inventory history, product edits",
  },
  viewer: { label: "Viewer", detail: "Reads everything, changes nothing" },
};

/**
 * Who else may work in this shop.
 *
 * Owner-only, and the server agrees — `members:manage` is not in any role, so
 * a manager loading this page gets a 403 rather than a screen they can half
 * use. That is what the 403 branch below is for: it is a normal outcome here,
 * not an error worth a toast.
 *
 * Roles come from the server rather than being listed here, so the picker and
 * the guard cannot disagree about what exists.
 */
export function TeamPanel({ shopId }: { shopId: string }) {
  const [members, setMembers] = useState<ShopMember[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ShopRole>("orders");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await teamApi.list(shopId);
      setMembers(data.members);
      setRoles(data.roles);
      setDenied(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setDenied(true);
      else toast.error("Could not load the team");
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  async function add() {
    setBusy("add");
    try {
      await teamApi.add(shopId, email.trim(), role);
      setEmail("");
      await load();
      toast.success("Added to the shop");
    } catch (err) {
      // The "no such account" case is the common one and its message is
      // already the instruction, so it is shown as-is.
      toast.error(
        err instanceof ApiError ? err.message : "Could not add that person",
      );
    } finally {
      setBusy(null);
    }
  }

  async function change(member: ShopMember, next: ShopRole) {
    setBusy(member.id);
    try {
      await teamApi.setRole(shopId, member.id, next);
      await load();
    } catch {
      toast.error("Could not change that role");
    } finally {
      setBusy(null);
    }
  }

  async function revoke(member: ShopMember) {
    setBusy(member.id);
    try {
      await teamApi.revoke(shopId, member.id);
      await load();
      toast.success(`${member.user.email} no longer has access`);
    } catch {
      toast.error("Could not revoke that access");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (denied) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-6 text-center">
        <ShieldCheck className="mx-auto size-6 text-muted-foreground" />
        <h2 className="mt-3 font-display text-lg font-semibold">
          Only the shop&apos;s owner can manage its team
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You can work in this shop, but adding and removing people stays with
          whoever owns it.
        </p>
      </div>
    );
  }

  const active = members.filter(m => m.status === "active");
  const revoked = members.filter(m => m.status !== "active");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-start gap-3">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Users className="size-4" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Team
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            People who can work in this shop. They keep their own account and
            sign in as themselves — you are giving them a job, not your
            password.
          </p>
        </div>
      </header>

      {/* ADD */}
      <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-xs">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="email">Their email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="someone@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={role}
              onChange={e => setRole(e.target.value as ShopRole)}
              className="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none transition focus:border-ring"
            >
              {roles.map(r => (
                <option key={r.role} value={r.role}>
                  {ROLE_COPY[r.role]?.label ?? r.role}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={add}
            disabled={!email.trim() || busy === "add"}
            className="sm:mb-0"
          >
            {busy === "add" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserPlus className="size-4" />
            )}
            Add
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          {ROLE_COPY[role]?.detail}. They need a Nedyway account already — ask
          them to sign up first if they do not have one.
        </p>
      </div>

      {/* ACTIVE */}
      {active.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nobody else works in this shop yet.
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {active.map(m => (
            <li
              key={m.id}
              className="flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {[m.user.first_name, m.user.last_name]
                    .filter(Boolean)
                    .join(" ") || m.user.email}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {m.user.email} · {ROLE_COPY[m.role]?.detail}
                </p>
              </div>

              <select
                value={m.role}
                disabled={busy === m.id}
                onChange={e => change(m, e.target.value as ShopRole)}
                className="h-9 rounded-xl border border-border bg-card px-2 text-sm outline-none transition focus:border-ring"
              >
                {roles.map(r => (
                  <option key={r.role} value={r.role}>
                    {ROLE_COPY[r.role]?.label ?? r.role}
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                disabled={busy === m.id}
                onClick={() => revoke(m)}
              >
                <X className="size-4" />
                Revoke
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* Kept visible: an owner who removed somebody by mistake should be able
          to see it happened, and adding them again restores the same row. */}
      {revoked.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Previously had access
          </p>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
            {revoked.map(m => (
              <li
                key={m.id}
                className="flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground"
              >
                <span className="min-w-0 flex-1 truncate">{m.user.email}</span>
                <span className="text-xs">was {ROLE_COPY[m.role]?.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
