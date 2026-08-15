"use client";

import {
  LifeBuoy,
  Loader2,
  MapPin,
  Package,
  Pencil,
  Plus,
  Sparkles,
  Star,
  Trash2,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/features/auth/SignOutButton";
import { AddressForm } from "@/features/checkout/AddressForm";
import {
  useAddresses,
  useDeleteAddress,
  useSetDefaultAddress,
} from "@/features/checkout/hooks";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import type { User } from "@/lib/api/schemas/auth";
import type { Address } from "@/lib/api/schemas/address";
import { useLoyalty } from "./useLoyalty";

export function AccountView({ user }: { user: User }) {
  const fullName = `${user.first_name} ${user.last_name}`.trim();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <InitialsAvatar name={fullName} className="size-14 text-xl" />
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {fullName || "Your account"}
            </h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {user.phone && (
              <p className="text-sm text-muted-foreground">{user.phone}</p>
            )}
          </div>
        </div>
        <SignOutButton />
      </div>

      <LoyaltyCard />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Link
          href="/orders"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground">
            <Package className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Your orders</p>
            <p className="text-xs text-muted-foreground">Track & reorder</p>
          </div>
        </Link>
        <Link
          href="/wishlist"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Wishlist</p>
            <p className="text-xs text-muted-foreground">Saved for later</p>
          </div>
        </Link>
        <Link
          href="/support"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground">
            <LifeBuoy className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Support</p>
            <p className="text-xs text-muted-foreground">Help & requests</p>
          </div>
        </Link>
      </div>

      <AddressBook />
    </div>
  );
}

function LoyaltyCard() {
  const q = useLoyalty();
  if (q.isPending) {
    return <div className="mt-6 h-28 animate-pulse rounded-2xl bg-muted" />;
  }
  if (q.isError || !q.data) return null;
  const { available_points, tier } = q.data;
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-success/10 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Trophy className="size-4 text-warning" /> Loyalty
        </div>
        <span className="rounded-full bg-card px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary capitalize">
          {tier}
        </span>
      </div>
      <p className="mt-2 font-mono text-3xl font-bold tabular-nums">
        {available_points.toLocaleString()}
        <span className="ml-1.5 text-base font-medium text-muted-foreground">
          points
        </span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Earn points on every order — redeem them at checkout.
      </p>
    </div>
  );
}

function AddressBook() {
  const q = useAddresses();
  const [showForm, setShowForm] = useState(false);
  // Only one row is ever open for editing, and opening one closes the add form
  // — two forms on screen at once made it ambiguous which "Save" applied.
  const [editingId, setEditingId] = useState<string | null>(null);
  const list = q.data ?? [];

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Saved addresses</h2>
      </div>

      {q.isPending ? (
        <div className="mt-3 h-20 animate-pulse rounded-2xl bg-muted" />
      ) : (
        <div className="mt-3 space-y-3">
          {list.length === 0 && !showForm && (
            <p className="text-sm text-muted-foreground">
              No saved addresses yet.
            </p>
          )}
          {list.map((a) => (
            <AddressRow
              key={a.id}
              address={a}
              editing={editingId === a.id}
              onEdit={() => {
                setShowForm(false);
                setEditingId(a.id);
              }}
              onDone={() => setEditingId(null)}
            />
          ))}

          {showForm ? (
            <div className="rounded-2xl border border-border bg-card p-4">
              <AddressForm onDone={() => setShowForm(false)} />
            </div>
          ) : (
            <button
              onClick={() => {
                setEditingId(null);
                setShowForm(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            >
              <Plus className="size-4" /> Add a new address
            </button>
          )}
          {list.length === 1 && list[0]?.is_default && (
            // The API refuses to delete the default address, so a lone address
            // cannot be removed at all. Saying so beats a Delete button that
            // only ever errors.
            <p className="text-xs text-muted-foreground">
              Add a second address to be able to remove this one — your default
              address can&apos;t be deleted.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function AddressRow({
  address,
  editing,
  onEdit,
  onDone,
}: {
  address: Address;
  editing: boolean;
  onEdit: () => void;
  onDone: () => void;
}) {
  const remove = useDeleteAddress();
  const setDefault = useSetDefaultAddress();
  const [confirming, setConfirming] = useState(false);
  const busy = remove.isPending || setDefault.isPending;

  if (editing) {
    return (
      <div className="rounded-2xl border border-primary/40 bg-card p-4">
        <AddressForm address={address} onDone={onDone} />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
          <MapPin className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold capitalize">
            {address.tag ?? address.label ?? "Address"}
            {address.contact_name ? ` · ${address.contact_name}` : ""}
            {address.is_default && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                Default
              </span>
            )}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {address.address_line}, {address.city}, {address.state}{" "}
            {address.pincode}
          </p>
          {address.contact_phone && (
            <p className="text-xs text-muted-foreground">
              {address.contact_phone}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <Button size="sm" variant="ghost" onClick={onEdit} disabled={busy}>
          <Pencil className="size-3.5" /> Edit
        </Button>

        {!address.is_default && (
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => setDefault.mutate(address.id)}
          >
            <Star className="size-3.5" /> Set as default
          </Button>
        )}

        {/* Hidden on the default address: the API rejects that delete outright,
            so offering it would only ever produce an error toast. */}
        {!address.is_default &&
          (confirming ? (
            <span className="ml-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Remove?</span>
              <Button
                size="sm"
                variant="destructive"
                disabled={busy}
                onClick={() =>
                  remove.mutate(address.id, {
                    onSettled: () => setConfirming(false),
                  })
                }
              >
                {remove.isPending && <Loader2 className="animate-spin" />}
                Yes, remove
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirming(false)}
              >
                Cancel
              </Button>
            </span>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto text-destructive hover:text-destructive"
              disabled={busy}
              onClick={() => setConfirming(true)}
            >
              <Trash2 className="size-3.5" /> Remove
            </Button>
          ))}
      </div>
    </div>
  );
}
