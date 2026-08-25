"use client";

import { ArrowLeft, LifeBuoy, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  TICKET_TYPE_LABELS,
  threadSenderNamer,
  userRefId,
} from "@/lib/api/schemas/support";
import type { TicketMessage } from "@/lib/api/schemas/support";
import { cn } from "@/lib/utils";
import { useSendMessage, useTicket } from "./hooks";
import {
  formatDate,
  formatDateTime,
  MessageScroller,
  StatusBadge,
} from "./ui";

/**
 * One conversation, from the outside — whoever is not support.
 *
 * Serves the customer who raised the ticket and, under /dashboard/support, a
 * shop owner an admin pulled in. Deliberately the same component: both post to
 * the same endpoint and read the same message list, so a second rendering of a
 * thread would only be a second chance to disagree about what was said.
 *
 * `basePath` keeps each audience inside its own area — see SupportList.
 */
export function SupportDetail({
  ticketId,
  currentUserId,
  basePath = "/support",
}: {
  ticketId: string;
  currentUserId: string;
  basePath?: string;
}) {
  const q = useTicket(ticketId);

  if (q.isPending) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="h-6 w-24 animate-pulse rounded bg-muted" />
        <div className="mt-6 h-24 animate-pulse rounded-2xl bg-muted" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <LifeBuoy className="size-7" />
        </span>
        <h1 className="font-display text-2xl font-bold">Ticket not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This request may have been removed, or you don&apos;t have access to it.
        </p>
        <Button asChild className="mt-6">
          <Link href={basePath}>Back to support</Link>
        </Button>
      </div>
    );
  }

  const ticket = q.data;
  const closed = ticket.ticket_status === "closed";
  // A thread can now hold three people — the customer, support, and a shop
  // owner an admin brought in — so "not me" is no longer enough to label a
  // message by.
  const senderName = threadSenderNamer(ticket);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href={basePath}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Support
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {ticket.subject}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {/* The id is a uuid and there is no separate reference number;
                the first block is enough to quote and short enough to read. */}
            {TICKET_TYPE_LABELS[ticket.ticket_type]} · #
            {ticket.id.slice(0, 8)}
            {ticket.created_at ? ` · ${formatDate(ticket.created_at)}` : ""}
          </p>
        </div>
        <StatusBadge status={ticket.ticket_status} />
      </div>

      <div className="mt-6">
        <MessageScroller count={ticket.messages.length}>
          {ticket.messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              mine={userRefId(m.sender_id) === currentUserId}
              senderName={senderName(m.sender_id)}
            />
          ))}
        </MessageScroller>
      </div>

      {closed ? (
        <p className="mt-6 rounded-2xl border border-border bg-muted/50 px-4 py-3 text-center text-sm text-muted-foreground">
          This ticket is closed. Start a new request if you still need help.
        </p>
      ) : (
        <ReplyBox ticketId={ticketId} />
      )}
    </div>
  );
}

function MessageBubble({
  message,
  mine,
  senderName,
}: {
  message: TicketMessage;
  mine: boolean;
  senderName: string;
}) {
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-xs",
          mine
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-card text-foreground",
        )}
      >
        {!mine && (
          <p className="mb-0.5 text-xs font-semibold text-muted-foreground">
            {senderName}
          </p>
        )}
        <p className="whitespace-pre-wrap break-words">{message.message_text}</p>
        <p
          className={cn(
            "mt-1 text-[10px]",
            mine ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {formatDateTime(message.sent_at)}
        </p>
      </div>
    </div>
  );
}

function ReplyBox({ ticketId }: { ticketId: string }) {
  const [text, setText] = useState("");
  const send = useSendMessage(ticketId);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || send.isPending) return;
    send.mutate(trimmed, { onSuccess: () => setText("") });
  };

  return (
    <div className="mt-6 flex items-end gap-2">
      <textarea
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Type your reply…"
        className="min-h-[44px] flex-1 resize-y rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
      />
      <Button
        type="button"
        onClick={submit}
        disabled={send.isPending || !text.trim()}
        aria-label="Send reply"
      >
        {send.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
      </Button>
    </div>
  );
}
