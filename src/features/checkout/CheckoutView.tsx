"use client";

import { CheckCircle2, Loader2, MapPin, Plus, Tag, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCartTotal } from "@/features/cart/useCart";
import type { Address } from "@/lib/api/schemas/address";
import { cn, formatPrice } from "@/lib/utils";
import { useSelectedAddress } from "@/features/address/useSelectedAddress";
import { AddressEditor } from "@/features/address/AddressEditor";
import { usePlaceOrder, useQuotePromotion } from "./hooks";
import type { PromotionQuote } from "./api";

export function CheckoutView() {
  const total = useCartTotal();
  const place = usePlaceOrder();
  // The same selection the header bar drives, not a second one held here. Two
  // independent picks would let the header say one address while the order went
  // to another — and the header is the one being read on the way to this page.
  const {
    addresses: list,
    selected: selectedAddr,
    orderAddressId,
    select,
    isPending: addressesPending,
  } = useSelectedAddress();
  const [showForm, setShowForm] = useState(false);
  const [quote, setQuote] = useState<PromotionQuote | null>(null);

  if (place.isSuccess) return <Confirmation orderId={place.data.orderId} />;
  if (total.data?.is_empty) return <EmptyCart />;

  const selectedId = selectedAddr?.id ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">Checkout</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem]">
        {/* delivery address */}
        <section>
          <h2 className="font-display text-lg font-semibold">
            Delivery address
          </h2>

          {addressesPending ? (
            <div className="mt-3 h-24 animate-pulse rounded-2xl bg-muted" />
          ) : (
            <div className="mt-3 space-y-3">
              {list.map((a) => (
                <AddressCard
                  key={a.id}
                  address={a}
                  selected={selectedId === a.id}
                  onSelect={() => select(a.id)}
                />
              ))}

              {showForm ? (
                <div className="rounded-2xl border border-border bg-card p-4">
                  <AddressEditor onDone={() => setShowForm(false)} />
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
              {(total.data?.platform_fee ?? 0) > 0 && (
                <SummaryRow
                  label="Platform fee"
                  value={total.data?.platform_fee}
                />
              )}
              {quote && (
                <SummaryRow
                  label={`Discount (${quote.promotion.code})`}
                  value={-quote.cartSummary.discountAmount}
                />
              )}
              <div className="my-2 border-t border-border" />
              <SummaryRow
                label="Total"
                value={
                  quote
                    ? (total.data?.final_amount ?? 0) -
                      quote.cartSummary.discountAmount
                    : total.data?.final_amount
                }
                strong
              />
            </dl>

            <PromoField
              subtotal={total.data?.total_amount ?? 0}
              quote={quote}
              onApplied={setQuote}
            />

            <div className="mt-4 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
              Payment: <span className="font-medium text-foreground">Cash on delivery</span>
            </div>

            <Button
              size="lg"
              className="mt-4 w-full"
              disabled={!orderAddressId || place.isPending}
              onClick={() =>
                orderAddressId &&
                place.mutate({
                  addressId: orderAddressId,
                  // The code, not the quoted amount — checkout prices it again
                  // against the real basket.
                  promotionCode: quote?.promotion.code ?? null,
                })
              }
            >
              {place.isPending && <Loader2 className="animate-spin" />}
              Place order
            </Button>
            {!selectedId && !addressesPending && (
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
      data-testid="checkout-address"
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

/**
 * Entering a discount code.
 *
 * The quote is a preview: nothing is reserved and no usage is recorded, so a
 * customer can try codes without spending them. Only the CODE is sent when the
 * order is placed — never the amount shown here — because the server prices it
 * again against the basket actually being ordered. Trusting a number from the
 * client would let anyone post their own discount.
 *
 * The applied state is a removable chip rather than a filled-in input: a code
 * that has been accepted is a fact about the order, not something half-typed.
 */
function PromoField({
  subtotal,
  quote,
  onApplied,
}: {
  subtotal: number;
  quote: PromotionQuote | null;
  onApplied: (q: PromotionQuote | null) => void;
}) {
  const [code, setCode] = useState("");
  const apply = useQuotePromotion();

  if (quote) {
    return (
      <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-primary/40 bg-primary/5 px-3 py-2 text-sm">
        <span className="inline-flex min-w-0 items-center gap-2">
          <Tag className="size-4 shrink-0 text-primary" />
          <span className="truncate font-medium">{quote.promotion.code}</span>
          <span className="shrink-0 text-muted-foreground">
            −{formatPrice(quote.cartSummary.discountAmount)}
          </span>
        </span>
        <button
          type="button"
          aria-label="Remove discount code"
          onClick={() => onApplied(null)}
          className="shrink-0 text-muted-foreground transition hover:text-destructive"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  const submit = () => {
    const trimmed = code.trim();
    if (!trimmed || apply.isPending) return;
    apply.mutate(
      {
        code: trimmed,
        totalAmount: subtotal,
        // The server recomputes against the real basket, so this only has to
        // be enough for the preview's own targeting rules.
        cartItems: [
          { product_id: "cart", price: subtotal, quantity: 1 },
        ],
      },
      { onSuccess: (q) => { onApplied(q); setCode(""); } },
    );
  };

  return (
    <div className="mt-4 flex items-center gap-2">
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Discount code"
        aria-label="Discount code"
        className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-card px-3 text-sm uppercase outline-none transition placeholder:normal-case focus:border-ring focus:ring-2 focus:ring-ring/30"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!code.trim() || apply.isPending}
        onClick={submit}
      >
        {apply.isPending && <Loader2 className="size-4 animate-spin" />}
        Apply
      </Button>
    </div>
  );
}
