"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, UserPlus, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type ShopRole } from "./api";
import {
  isForbidden,
  useAddMember,
  useRevokeMember,
  useSetMemberRole,
  useTeam,
} from "./hooks";

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
  const team = useTeam(shopId);
  const addMember = useAddMember(shopId);
  const setMemberRole = useSetMemberRole(shopId);
  const revokeMember = useRevokeMember(shopId);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ShopRole>("orders");

  // Which row is mid-change, so only that row goes inert. A role change and a
  // revoke are the two things that can be in flight against a single member.
  const busyMemberId = setMemberRole.isPending
    ? setMemberRole.variables.memberId
    : revokeMember.isPending
      ? revokeMember.variables.id
      : null;

  // Only the first load blanks the panel. The refetch after a change is a
  // background one, so the list stays on screen and in place while it lands.
  if (team.isPending) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isForbidden(team.error)) {
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

  // Anything that is not a 403 is a real failure, and it gets said out loud —
  // an empty team and a team that could not be fetched look identical
  // otherwise, and the difference decides whether you go looking for somebody.
  if (team.isError) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-6 text-center">
        <h2 className="font-display text-lg font-semibold">
          Could not load the team
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Something went wrong fetching who works in this shop.
        </p>
        <Button className="mt-4" onClick={() => team.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const { members, roles } = team.data;
  const active = members.filter(m => m.status === "active");
  const revoked = members.filter(m => m.status !== "active");

  function add() {
    addMember.mutate(
      { email: email.trim(), role },
      { onSuccess: () => setEmail("") },
    );
  }

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
            disabled={!email.trim() || addMember.isPending}
            className="sm:mb-0"
          >
            {addMember.isPending ? (
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
                disabled={busyMemberId === m.id}
                onChange={e =>
                  setMemberRole.mutate({
                    memberId: m.id,
                    role: e.target.value as ShopRole,
                  })
                }
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
                disabled={busyMemberId === m.id}
                onClick={() => revokeMember.mutate(m)}
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
