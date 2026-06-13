"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCartTotal } from "@/features/cart/useCart";
import { addressInputSchema } from "@/lib/api/schemas/address";
import type { Address, AddressInput } from "@/lib/api/schemas/address";
import { cn, formatPrice } from "@/lib/utils";
import { useAddAddress, useAddresses, usePlaceOrder } from "./hooks";

export function CheckoutView() {
  const addresses = useAddresses();
  const total = useCartTotal();
  const place = usePlaceOrder();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!selectedId && addresses.data?.length) {
      setSelectedId(
        addresses.data.find((a) => a.is_default)?._id ?? addresses.data[0]._id,
      );
    }
  }, [addresses.data, selectedId]);

  if (place.isSuccess) return <Confirmation orderId={place.data.orderId} />;
  if (total.data?.is_empty) return <EmptyCart />;

  const list = addresses.data ?? [];
  const selectedAddr = list.find((a) => a._id === selectedId);
  // place-order matches the string `address_id` mirror, not _id
  const orderAddressId = selectedAddr?.address_id ?? selectedAddr?._id ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">Checkout</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem]">
        {/* delivery address */}
        <section>
          <h2 className="font-display text-lg font-semibold">
            Delivery address
          </h2>

          {addresses.isPending ? (
            <div className="mt-3 h-24 animate-pulse rounded-2xl bg-muted" />
          ) : (
            <div className="mt-3 space-y-3">
              {list.map((a) => (
                <AddressCard
                  key={a._id}
                  address={a}
                  selected={selectedId === a._id}
                  onSelect={() => setSelectedId(a._id)}
                />
              ))}

              {showForm ? (
                <div className="rounded-2xl border border-border bg-card p-4">
                  <AddressForm onDone={() => setShowForm(false)} />
                </div>
              ) : (
                <button
                  onClick={() => setShowForm(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                >
                  <Plus className="size-4" /> Add a new address
                </button>
              )}
            </div>
          )}
        </section>

        {/* summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <h2 className="font-display text-lg font-semibold">Order summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <SummaryRow
                label={`Subtotal (${total.data?.items_count ?? 0} items)`}
                value={total.data?.total_amount}
              />
              <SummaryRow label="Delivery" value={total.data?.delivery_fee} />
              <div className="my-2 border-t border-border" />
              <SummaryRow label="Total" value={total.data?.final_amount} strong />
            </dl>

            <div className="mt-4 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
              Payment: <span className="font-medium text-foreground">Cash on delivery</span>
            </div>

            <Button
              size="lg"
              className="mt-4 w-full"
              disabled={!orderAddressId || place.isPending}
              onClick={() => orderAddressId && place.mutate(orderAddressId)}
            >
              {place.isPending && <Loader2 className="animate-spin" />}
              Place order
            </Button>
            {!selectedId && !addresses.isPending && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Select or add a delivery address
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function AddressCard({
  address,
  selected,
  onSelect,
}: {
  address: Address;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border bg-card hover:border-primary/40",
      )}
    >
      <span
        className={cn(
          "mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl",
          selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        <MapPin className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold capitalize">
          {address.tag ?? address.label ?? "Address"}
          {address.contact_name ? ` · ${address.contact_name}` : ""}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {address.address_line}, {address.city}, {address.state} {address.pincode}
        </p>
        {address.contact_phone && (
          <p className="text-xs text-muted-foreground">{address.contact_phone}</p>
        )}
      </div>
    </button>
  );
}

function AddressForm({ onDone }: { onDone: () => void }) {
  const add = useAddAddress();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressInputSchema),
    defaultValues: {
      contact_name: "",
      contact_phone: "",
      address_line: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      tag: "home",
    },
  });
  const tag = watch("tag");

  const field = (name: keyof AddressInput, label: string, props = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} {...register(name)} {...props} />
      {errors[name] && (
        <p className="text-xs text-destructive">{errors[name]?.message}</p>
      )}
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit((v) => add.mutate(v, { onSuccess: onDone }))}
      className="space-y-3"
      noValidate
    >
      <div className="grid grid-cols-2 gap-3">
        {field("contact_name", "Full name")}
        {field("contact_phone", "Phone")}
      </div>
      {field("address_line", "Address")}
      <div className="grid grid-cols-3 gap-3">
        {field("city", "City")}
        {field("state", "State")}
        {field("pincode", "Pincode")}
      </div>
      <div className="flex gap-2">
        {(["home", "work", "other"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setValue("tag", t)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium capitalize transition",
              tag === t
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" disabled={add.isPending}>
          {add.isPending && <Loader2 className="animate-spin" />}
          Save address
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string;
  value?: number;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className={strong ? "font-semibold" : "text-muted-foreground"}>
        {label}
      </dt>
      <dd
        className={
          strong
            ? "font-mono text-base font-bold tabular-nums"
            : "font-mono tabular-nums"
        }
      >
        {value === undefined ? "—" : formatPrice(value)}
      </dd>
    </div>
  );
}

function Confirmation({ orderId }: { orderId: string }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-success/12 text-success">
        <CheckCircle2 className="size-7" />
      </span>
      <h1 className="font-display text-2xl font-bold">Order placed!</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {orderId ? `Order ${orderId} is confirmed. ` : "Your order is confirmed. "}
        Pay cash on delivery.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button asChild>
          <Link href="/orders">View orders</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/search">Continue shopping</Link>
        </Button>
      </div>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-2xl font-bold">Your cart is empty</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Add items before checking out.
      </p>
      <Button asChild className="mt-6">
        <Link href="/search">Start shopping</Link>
      </Button>
    </div>
  );
}
