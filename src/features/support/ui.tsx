"use client";

import { Check, CheckCheck, FileText, Package, Paperclip, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressiveImage } from "@/components/ProgressiveImage";
import {
  isImageAttachment,
  TICKET_STATUS_LABELS,
  type Attachment,
  type TicketStatus,
} from "@/lib/api/schemas/support";
import { cn } from "@/lib/utils";

const STATUS_VARIANT: Record<
  TicketStatus,
  "default" | "success" | "warning" | "muted"
> = {
  open: "default",
  in_progress: "warning",
  resolved: "success",
  closed: "muted",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>{TICKET_STATUS_LABELS[status]}</Badge>
  );
}

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

export function formatDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : dateFmt.format(d);
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : dateTimeFmt.format(d);
}

/**
 * How many messages are waiting on this ticket for whoever is looking.
 *
 * Nothing at all at zero, rather than a grey "0": a badge that is always
 * present stops being a signal, and the row's own weight already says
 * whether it has been read.
 */
export function UnreadBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span
      aria-label={`${count} unread ${count === 1 ? "message" : "messages"}`}
      className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold leading-none text-primary-foreground"
    >
      {/* Past 9 the exact number stops mattering and the badge starts
          stretching the row. */}
      {count > 9 ? "9+" : count}
    </span>
  );
}

/**
 * Who has read a message you sent.
 *
 * Only ever shown on your own messages — somebody else's read state is the
 * record of YOU opening the thread, which is not news to you.
 *
 * Named, not counted. On a thread with a customer, an agent and a shop owner,
 * "read" without a name leaves the sender unable to tell whether the party
 * who actually needs to act has seen it. Each reader has their own cursor, so
 * this can say.
 */
export function ReadReceipt({
  readBy,
}: {
  readBy: { id: string; first_name?: string | null; last_name?: string | null }[];
}) {
  const names = readBy
    .map((r) => `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim())
    .filter(Boolean);

  const label = names.length
    ? `Read by ${names.join(", ")}`
    : // Delivered, nobody has opened it. "Sent" rather than "Unread": unread
      // is a statement about a reader, and there is no reader yet.
      "Sent";

  return (
    <span
      title={label}
      aria-label={label}
      className="ml-1 inline-flex align-middle"
    >
      {names.length ? (
        <CheckCheck className="size-3.5" />
      ) : (
        <Check className="size-3.5 opacity-70" />
      )}
    </span>
  );
}

/**
 * What the ticket is about, when it is about something.
 *
 * The reason the ids are stored: an agent opening a thread should start from
 * the order and the line, not from a search through prose. Links through to
 * the order so it is one click, not a copied number.
 */
export function TicketSubject({
  order,
  product,
  orderHref,
}: {
  order?: { id: string; order_number?: string | null } | null;
  product?: { name?: string | null; main_image_url?: string | null } | null;
  /** Omitted for staff, who have no customer-facing order page to visit. */
  orderHref?: string;
}) {
  if (!order && !product) return null;

  const body = (
    <>
      <Package className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate">
        {order?.order_number ? `#${order.order_number}` : "Order"}
        {product?.name ? ` · ${product.name}` : ""}
      </span>
    </>
  );

  return (
    <div className="mt-2">
      {orderHref && order ? (
        <Link
          href={`${orderHref}/${order.id}`}
          className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs transition hover:border-primary/40 hover:bg-muted"
        >
          {body}
        </Link>
      ) : (
        <span className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs">
          {body}
        </span>
      )}
    </div>
  );
}

/** 12 KB reads as nothing; "12.4 KB" is what a person checks against a limit. */
export function formatBytes(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/**
 * The files on a message, once it has been sent.
 *
 * Images render inline: the reason somebody attaches a photo to a support
 * ticket is so the other side can see it, and a link they have to click first
 * is a photo nobody looks at. Everything else becomes a named row, because a
 * bucket URL ends in `1724_ab12_receipt.pdf` and that is not a filename a
 * person recognises.
 *
 * Every one opens in a new tab — losing an unsent reply to look at an
 * attachment would be its own bug.
 */
export function AttachmentList({
  attachments,
  mine,
}: {
  attachments: Attachment[];
  /** Own bubbles are on the primary colour, so borders have to lift off it. */
  mine?: boolean;
}) {
  if (!attachments.length) return null;

  // Keyed by position, NOT by url. The bucket deduplicates by content hash, so
  // two files attached to the same message come back sharing one url whenever
  // their bytes match — someone attaching the same photo twice, or two copies
  // of a receipt. That is a legitimate message with two attachments, and it
  // made React collide the keys and drop one of them. The list is fixed for
  // the life of a sent message — never reordered, filtered or inserted into —
  // so the index is a stable identity here.
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {attachments.map((a, i) =>
        isImageAttachment(a) ? (
          <a
            key={i}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            title={a.name}
            className="block overflow-hidden rounded-lg border border-border/60 transition hover:opacity-90"
          >
            {/* Bucket-hosted attachments: the preview loads first, the full
                image swaps in behind it. */}
            <ProgressiveImage
              src={a.url}
              alt={a.name}
              className="max-h-44 max-w-[12rem] object-cover"
            />
          </a>
        ) : (
          <a
            key={i}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex max-w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs transition",
              mine
                ? "border-primary-foreground/30 hover:bg-primary-foreground/10"
                : "border-border bg-muted/40 hover:bg-muted",
            )}
          >
            <FileText className="size-4 shrink-0" />
            <span className="truncate">{a.name}</span>
            {a.size > 0 && (
              <span className="shrink-0 opacity-70">{formatBytes(a.size)}</span>
            )}
          </a>
        ),
      )}
    </div>
  );
}

/** What the composer accepts — mirrors the backend's multer filter. */
export const ATTACHMENT_ACCEPT =
  "image/*,application/pdf,.doc,.docx";
export const MAX_ATTACHMENTS = 5;

/**
 * The largest file the stack will take, in MB.
 *
 * Must match MAX_FILE_SIZE on the backend and the bucket. Checked here as
 * well as there so the answer is instant: without it the only way to learn a
 * file is too big is to upload it and be told afterwards, which on a phone
 * photo over a slow connection is the worst possible moment.
 *
 * NEXT_PUBLIC_* is inlined at BUILD time, so changing the limit means
 * rebuilding this image, not just editing a ConfigMap.
 */
export const MAX_ATTACHMENT_MB = Number(
  process.env.NEXT_PUBLIC_MAX_UPLOAD_MB ?? 10,
);
const MAX_ATTACHMENT_BYTES = MAX_ATTACHMENT_MB * 1024 * 1024;

/**
 * The attach control and the queue of files waiting to go.
 *
 * Files are held here until the message is sent rather than uploaded on
 * selection: picking the wrong file is common, and an upload-on-select would
 * have already written it to the bucket by the time somebody noticed.
 *
 * Returns its own picker button so the two reply boxes stay a text area, a
 * paperclip and a send button, without either reimplementing the list.
 */
export function useAttachmentPicker() {
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (picked: FileList | null) => {
    if (!picked?.length) return;

    // Rejected before it is queued, and named — "one of your files was too
    // big" leaves someone removing them one at a time to find out which.
    const chosen = Array.from(picked);
    const tooBig = chosen.filter((f) => f.size > MAX_ATTACHMENT_BYTES);
    for (const f of tooBig) {
      toast.error(
        `${f.name} is ${formatBytes(f.size)} — the limit is ${MAX_ATTACHMENT_MB} MB per file.`,
      );
    }
    const fits = chosen.filter((f) => f.size <= MAX_ATTACHMENT_BYTES);

    // Counted against `files` out here rather than inside the updater: React
    // may run an updater twice, and a toast fired from one would be shown
    // twice with it. `files` is current for the render this handler belongs
    // to, and a file picker cannot deliver two selections in one tick.
    const room = MAX_ATTACHMENTS - files.length;
    if (fits.length > room) {
      // Silently dropping the overflow would look like the picker ignored
      // them.
      toast.error(
        `Only ${MAX_ATTACHMENTS} files per message — the rest were not added.`,
      );
    }
    const accepted = fits.slice(0, Math.max(room, 0));
    if (accepted.length) setFiles((prev) => [...prev, ...accepted]);
    // Cleared so re-picking the SAME file fires change again — without this,
    // removing a file and choosing it a second time does nothing.
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (index: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== index));

  const control = (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ATTACHMENT_ACCEPT}
        onChange={(e) => add(e.target.files)}
        className="hidden"
        aria-hidden
        tabIndex={-1}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Attach a file"
        title={
          files.length >= MAX_ATTACHMENTS
            ? `Up to ${MAX_ATTACHMENTS} files per message`
            : "Attach a file"
        }
        disabled={files.length >= MAX_ATTACHMENTS}
        onClick={() => inputRef.current?.click()}
      >
        <Paperclip className="size-4" />
      </Button>
    </>
  );

  const queue = files.length ? (
    <div className="mb-2 flex flex-wrap gap-2">
      {files.map((f, i) => (
        <span
          key={`${f.name}-${i}`}
          className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs"
        >
          <FileText className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{f.name}</span>
          <span className="shrink-0 text-muted-foreground">
            {formatBytes(f.size)}
          </span>
          <button
            type="button"
            aria-label={`Remove ${f.name}`}
            onClick={() => remove(i)}
            className="ml-0.5 text-muted-foreground transition hover:text-destructive"
          >
            <X className="size-3.5" />
          </button>
        </span>
      ))}
    </div>
  ) : null;

  return { files, control, queue, clear: () => setFiles([]) };
}

/**
 * The message list, scrolled rather than grown.
 *
 * A thread rendered at its natural height pushes the reply box off the bottom
 * of the screen: the longer the conversation, the further someone has to
 * scroll the whole page to answer it — worst on the ticket that has had the
 * most said about it. Capping the list keeps the reply box where it was.
 *
 * `min-h` as well as `max-h` so a two-message thread does not collapse into a
 * sliver, and the whole thing sizes to the viewport so a tall screen shows
 * more rather than wasting the space.
 */
export function MessageScroller({
  children,
  count,
}: {
  children: React.ReactNode;
  /** Message count — what "something new arrived" is measured by. */
  count: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);

  // Whether the reader is at the bottom, sampled before the DOM updates.
  //
  // Someone scrolled up is reading history, and yanking them to the newest
  // message mid-sentence is worse than making them scroll down themselves.
  // The 80px tolerance is so "near enough the bottom" still counts as
  // following along.
  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  useEffect(() => {
    const el = ref.current;
    if (!el || !pinned.current) return;
    el.scrollTop = el.scrollHeight;
  }, [count]);

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      className="max-h-[min(60vh,32rem)] min-h-[8rem] space-y-3 overflow-y-auto overscroll-contain rounded-2xl border border-border bg-muted/20 p-3"
    >
      {children}
    </div>
  );
}
