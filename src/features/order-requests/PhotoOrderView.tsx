"use client";

import {
  Camera,
  Check,
  ChevronRight,
  ImageOff,
  Loader2,
  Store,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAddresses } from "@/features/checkout/hooks";
import type { OrderRequest } from "@/lib/api/schemas/orderRequest";
import {
  useCancelOrderRequest,
  useMyOrderRequests,
  useSendOrderRequest,
  useShopsForAddress,
} from "./hooks";

/** How many photos one request may carry — the server enforces the same four. */
const MAX_IMAGES = 4;

/**
 * Send a shop a photo of your shopping list.
 *
 * The conversation this replaces already happens: people photograph a list and
 * send it to the shop over WhatsApp, and somebody at the shop reads it out into
 * the till. Nothing here prices or reserves anything — the shop turns it into a
 * real order, and until it does this is a question, not a purchase. The screen
 * says so rather than dressing it up as a checkout.
 */
export function PhotoOrderView() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Order from a photo
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Photograph your list and send it to a shop. They will read it, set the
          order up for you, and you pay for it like any other order.
        </p>
      </header>

      <SendForm />
      <SentList />
    </div>
  );
}

/* ── sending one ──────────────────────────────────────────────────────────── */

function SendForm() {
  const addresses = useAddresses();
  // What they have PICKED, which is not the same as what is selected: until
  // they touch either control, the selection is derived below. Deriving rather
  // than seeding through an effect keeps the first render correct — an effect
  // would render once with nothing chosen and then again with the default.
  const [pickedAddressId, setPickedAddressId] = useState<string>("");
  const [pickedShopId, setPickedShopId] = useState<string>("");
  const [note, setNote] = useState("");
  // The file AND its preview URL together. The URL is made when the photo is
  // picked, not derived from `files` during render: an object URL is a resource
  // with a lifetime, and creating one in a `useMemo` while releasing it in a
  // `useEffect` cleanup mismatches those lifetimes. StrictMode mounts an
  // effect, runs its cleanup, then re-runs it — which revoked every URL the
  // instant it was created while the memo (same `files` array) never
  // recomputed. The photo was selected and held; the thumbnail just rendered
  // blank, which reads exactly like an upload that did not work.
  const [picked, setPicked] = useState<{ file: File; url: string }[]>([]);
  const [percent, setPercent] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const send = useSendOrderRequest(setPercent);

  const list = addresses.data ?? [];

  // Their default address, so the common case is two taps.
  const addressId =
    pickedAddressId ||
    String(list.find((a) => a.is_default)?.id ?? list[0]?.id ?? "");

  const shops = useShopsForAddress(addressId || undefined);

  // The shop has to be one that reaches the chosen address. Rather than
  // clearing the choice when the address changes, it is simply not honoured
  // unless it is in the list currently on offer — same outcome, no effect, and
  // no flash of a stale shop name while the new list loads.
  const offered = shops.data ?? [];
  const shopId = offered.some((s) => s.id === pickedShopId) ? pickedShopId : "";

  // Released on unmount, through a ref so the effect does not re-run — and so
  // does not release the URLs of photos still on screen — every time the set
  // changes. Each individual URL is revoked where its photo is removed.
  const liveUrls = useRef<string[]>([]);
  useEffect(() => {
    liveUrls.current = picked.map((p) => p.url);
  }, [picked]);
  // Unmount only — an empty dependency list, so leaving the page releases
  // whatever is still held without the set changing ever releasing a photo
  // that is still on screen.
  useEffect(
    () => () => liveUrls.current.forEach((url) => URL.revokeObjectURL(url)),
    [],
  );

  const addFiles = (chosen: FileList | null) => {
    if (!chosen) return;
    setPicked((current) =>
      [
        ...current,
        ...Array.from(chosen).map((file) => ({
          file,
          url: URL.createObjectURL(file),
        })),
      ].slice(0, MAX_IMAGES),
    );
    // Cleared so picking the same file twice in a row still fires a change.
    if (fileInput.current) fileInput.current.value = "";
  };

  const removeAt = (index: number) =>
    setPicked((current) => {
      const going = current[index];
      if (going) URL.revokeObjectURL(going.url);
      return current.filter((_, i) => i !== index);
    });

  const ready = picked.length > 0 && addressId && shopId;

  const submit = async () => {
    if (!ready) return;
    await send.mutateAsync({
      shopId,
      addressId,
      note,
      files: picked.map((p) => p.file),
    });
    picked.forEach((p) => URL.revokeObjectURL(p.url));
    setPicked([]);
    setNote("");
    setPercent(null);
  };

  if (addresses.isPending) {
    return <div className="mt-6 h-64 animate-pulse rounded-2xl bg-muted" />;
  }

  if (list.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Add a delivery address first — the shop needs somewhere to send it.
        </p>
        <Button asChild className="mt-4">
          <Link href="/account">Add an address</Link>
        </Button>
      </div>
    );
  }

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-xs">
      <Label htmlFor="photo-order-files">Your list</Label>
      <input
        ref={fileInput}
        id="photo-order-files"
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => addFiles(e.target.files)}
      />

      <div className="mt-2 flex flex-wrap gap-3">
        {picked.map(({ file, url }, i) => (
          <div
            key={`${file.name}-${i}`}
            className="relative size-24 overflow-hidden rounded-xl border border-border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Your list, photo ${i + 1}`}
              className="size-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-background/90 text-muted-foreground transition hover:text-destructive"
              aria-label={`Remove photo ${i + 1}`}
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}

        {picked.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="grid size-24 place-items-center rounded-xl border border-dashed border-border text-muted-foreground transition hover:border-primary/50 hover:text-primary"
          >
            <span className="flex flex-col items-center gap-1">
              <Camera className="size-5" />
              <span className="text-xs">Add photo</span>
            </span>
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Up to {MAX_IMAGES} photos. A second page of a long list is a second
        photo.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="photo-order-address">Deliver to</Label>
          <select
            id="photo-order-address"
            value={addressId}
            onChange={(e) => setPickedAddressId(e.target.value)}
            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
          >
            {list.map((a) => (
              <option key={String(a.id)} value={String(a.id)}>
                {a.address_line}, {a.city} {a.pincode}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="photo-order-shop">Send it to</Label>
          <select
            id="photo-order-shop"
            value={shopId}
            onChange={(e) => setPickedShopId(e.target.value)}
            disabled={shops.isPending || offered.length === 0}
            className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm disabled:opacity-60"
          >
            <option value="">
              {shops.isPending ? "Finding shops…" : "Choose a shop"}
            </option>
            {offered.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.city ? ` · ${s.city}` : ""}
              </option>
            ))}
          </select>
          {/* The one refusal worth saying before anything is uploaded. */}
          {!shops.isPending && offered.length === 0 && (
            <p className="mt-1.5 text-xs text-destructive">
              No shop delivers to that address yet.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <Label htmlFor="photo-order-note">Anything to add? (optional)</Label>
        <textarea
          id="photo-order-note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ripe bananas please, and skip the coriander if it looks tired."
          className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>

      {/* Said before they send, not after a shop has priced it. The platform is
          cash-on-delivery only — the ordinary checkout states the same thing in
          the same words — and a customer handing their list to a shop should
          not have to guess how they will be asked to pay for it. */}
      <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
        <Wallet className="size-4 shrink-0" />
        Pay cash when it arrives. The shop will price your list and you can see
        the total before it is delivered.
      </p>

      <Button
        className="mt-4 w-full sm:w-auto"
        disabled={!ready || send.isPending}
        onClick={submit}
      >
        {send.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {/* The percentage, because a long upload is otherwise
                indistinguishable from a hung one. */}
            {percent !== null ? `Sending… ${percent}%` : "Sending…"}
          </>
        ) : (
          <>
            <Camera className="size-4" />
            Send to the shop
          </>
        )}
      </Button>
    </section>
  );
}

/* ── what they have sent ──────────────────────────────────────────────────── */

const STATUS: Record<
  OrderRequest["status"],
  {
    label: string;
    variant: "default" | "outline" | "success" | "warning" | "muted";
  }
> = {
  pending: { label: "Waiting on the shop", variant: "warning" },
  fulfilled: { label: "Order placed", variant: "success" },
  declined: { label: "Could not be filled", variant: "outline" },
  cancelled: { label: "Withdrawn", variant: "muted" },
};

function SentList() {
  const q = useMyOrderRequests();
  const cancel = useCancelOrderRequest();
  const rows = q.data ?? [];

  if (q.isPending) {
    return <div className="mt-8 h-32 animate-pulse rounded-2xl bg-muted" />;
  }
  if (rows.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="font-display text-lg font-bold tracking-tight">
        Lists you have sent
      </h2>
      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <article
            key={r.id}
            className="rounded-2xl border border-border bg-card p-4 shadow-xs"
          >
            <div className="flex items-start gap-4">
              <Thumbs request={r} />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                    <Store className="size-3.5 text-primary" />
                    {r.shop?.name ?? "A shop"}
                  </span>
                  <Badge variant={STATUS[r.status].variant}>
                    {STATUS[r.status].label}
                  </Badge>
                </div>

                {r.note && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    “{r.note}”
                  </p>
                )}

                {/* The reason, in the shop's own words. A refusal with no
                    explanation leaves somebody sending the same photo again. */}
                {r.status === "declined" && r.decline_note && (
                  <p className="mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {r.decline_note}
                  </p>
                )}

                {r.status === "fulfilled" && r.order && (
                  <div className="mt-2">
                    {/* The amount first. This customer never priced the list
                        themselves — they handed it over and were told an order
                        exists — so "how much?" is the question the card has to
                        answer on its own. The breakdown is a tap away. */}
                    {typeof r.order.total_amount === "number" && (
                      <p className="text-sm">
                        <span className="font-semibold">
                          {formatPrice(r.order.total_amount)}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          · cash on delivery
                        </span>
                      </p>
                    )}
                    <Link
                      href={`/orders/${r.order.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      <Check className="size-3.5" />
                      Order #{r.order.order_number} — see the breakdown
                      <ChevronRight className="size-3.5" />
                    </Link>
                  </div>
                )}
              </div>

              {r.status === "pending" && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={cancel.isPending}
                  onClick={() => cancel.mutate(r.id)}
                >
                  <Trash2 className="size-4" />
                  <span className="sr-only sm:not-sr-only">Withdraw</span>
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/**
 * Every photo they sent, not just the first.
 *
 * A list that ran onto a second page was sent as two pictures, and showing one
 * of them leaves the customer unable to check what they actually sent — which
 * is the main thing this list is for once a shop has it. Wrapped into two
 * columns rather than a single row, so four photos sit in a tidy block beside
 * the text instead of squeezing it off a phone screen.
 */
function Thumbs({ request }: { request: OrderRequest }) {
  if (!request.images.length) {
    return (
      <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
        <ImageOff className="size-5" />
      </span>
    );
  }
  return (
    <div className="flex w-[8.5rem] shrink-0 flex-wrap gap-2">
      {request.images.map((img, i) => (
        // Opened full size in a tab: a thumbnail is enough to tell two photos
        // apart and nowhere near enough to re-read the list off.
        <a
          key={`${img.url}-${i}`}
          href={img.url}
          target="_blank"
          rel="noreferrer"
          className="size-16 overflow-hidden rounded-xl border border-border transition hover:border-primary/50"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.url}
            alt={img.alt_text ?? `Your list, photo ${i + 1}`}
            className="size-full object-cover"
          />
        </a>
      ))}
    </div>
  );
}
