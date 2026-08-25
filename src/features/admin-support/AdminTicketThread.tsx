"use client";

import { ArrowLeft, Loader2, Send, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TICKET_PRIORITY_LABELS,
  TICKET_TYPE_LABELS,
  threadSenderNamer,
  ticketPriorityValues,
  ticketRaiserName,
  userRefId,
} from "@/lib/api/schemas/support";
import type {
  TicketMessage,
  TicketParticipant,
  TicketPriority,
  TicketStatus,
} from "@/lib/api/schemas/support";
import { cn } from "@/lib/utils";
import {
  useSendMessage,
  useTicket,
  useTicketParticipants,
  useUpdateTicketPriority,
  useUpdateTicketStatus,
} from "@/features/support/hooks";
import { useShopOwnerOptions } from "./shopOwners";
import {
  formatDateTime,
  MessageScroller,
  StatusBadge,
} from "@/features/support/ui";

/**
 * One ticket, from the admin's side.
 *
 * Deliberately the same thread the customer sees rather than a separate
 * console: both sides post to the same endpoint and the messages are one
 * list, so a second rendering of it would be a second chance to disagree
 * about what was said.
 *
 * What differs is authority — an admin can move the status, and the customer
 * cannot — and whose messages sit on which side.
 */

// The moves worth offering, and what each one means to the person waiting.
const NEXT_STATUS: { value: TicketStatus; label: string; hint: string }[] = [
  { value: "in_progress", label: "Start working", hint: "Tells the customer someone has picked this up" },
  { value: "resolved", label: "Mark resolved", hint: "Stamps the resolution time" },
  { value: "closed", label: "Close", hint: "No further replies from either side" },
];

export function AdminTicketThread({
  ticketId,
  currentUserId,
}: {
  ticketId: string;
  currentUserId: string;
}) {
  const q = useTicket(ticketId);
  const setStatus = useUpdateTicketStatus(ticketId);

  if (q.isPending) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-24 animate-pulse rounded bg-muted" />
        <div className="h-24 animate-pulse rounded-2xl bg-muted" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <h2 className="font-display text-lg font-bold">Ticket not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          It may have been removed, or the link is wrong.
        </p>
        <Link href="/admin/support" className="mt-4 inline-block">
          <Button variant="outline">Back to support</Button>
        </Link>
      </div>
    );
  }

  const ticket = q.data;
  const closed = ticket.ticket_status === "closed";
  const raiser = ticketRaiserName(ticket);
  const senderName = threadSenderNamer(ticket);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/support"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Support queue
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {ticket.subject}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {TICKET_TYPE_LABELS[ticket.ticket_type]} ·{" "}
            {TICKET_PRIORITY_LABELS[ticket.ticket_priority]}
            {raiser ? ` · raised by ${raiser}` : ""} · #{ticket.id.slice(0, 8)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!ticket.assigned_admin_id && <Badge variant="outline">Unassigned</Badge>}
          <StatusBadge status={ticket.ticket_status} />
        </div>
      </div>

      {ticket.description && (
        <p className="rounded-2xl border border-border bg-card p-4 text-sm whitespace-pre-wrap">
          {ticket.description}
        </p>
      )}

      <MessageScroller count={ticket.messages.length}>
        {ticket.messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            mine={userRefId(m.sender_id) === currentUserId}
            // Not "anyone but the raiser is support" any more: a thread can
            // hold a shop owner now, and that rule labelled their replies
            // "Support" — on the one screen where an agent needs to tell the
            // shop's answer from their own colleague's.
            senderName={senderName(m.sender_id)}
          />
        ))}
      </MessageScroller>

      {closed ? (
        <p className="rounded-2xl border border-border bg-muted/50 px-4 py-3 text-center text-sm text-muted-foreground">
          This ticket is closed. Neither side can add to it — reopen it to
          continue.
        </p>
      ) : (
        <ReplyBox ticketId={ticketId} />
      )}

      <TriagePanel
        ticketId={ticketId}
        current={ticket.ticket_priority}
      />

      <ParticipantsPanel
        ticketId={ticketId}
        participants={ticket.participants}
      />

      {/* Status controls sit below the reply box on purpose: answering is the
          common action, and closing a ticket you have not replied to should
          take a deliberate look downward. */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-xs font-medium text-muted-foreground">
          Move this ticket
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {NEXT_STATUS.filter((s) => s.value !== ticket.ticket_status).map(
            (s) => (
              <Button
                key={s.value}
                variant="outline"
                size="sm"
                title={s.hint}
                disabled={setStatus.isPending}
                onClick={() => setStatus.mutate(s.value)}
              >
                {setStatus.isPending && <Loader2 className="size-4 animate-spin" />}
                {s.label}
              </Button>
            ),
          )}
          {closed && (
            <Button
              variant="outline"
              size="sm"
              disabled={setStatus.isPending}
              onClick={() => setStatus.mutate("open")}
            >
              Reopen
            </Button>
          )}
        </div>
        {!ticket.assigned_admin_id && (
          <p className="mt-2 text-xs text-muted-foreground">
            Moving the status assigns this ticket to you.
          </p>
        )}
      </div>
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    send.mutate(body, { onSuccess: () => setText("") });
  };

  return (
    <form onSubmit={submit} className="flex items-end gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder="Reply to the customer…"
        className="min-h-[3rem] flex-1 resize-y rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
      />
      <Button type="submit" disabled={send.isPending || !text.trim()}>
        {send.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
        Send
      </Button>
    </form>
  );
}

/**
 * Triage — how urgent this actually is.
 *
 * The judgement belongs here rather than on the form the customer fills in:
 * self-rated urgency sorts nothing, because everyone rates their own problem
 * at the top. Customer tickets open at `medium` and get their real priority
 * from whoever reads the queue; a shop owner's opening choice is a starting
 * point this overrides.
 *
 * The current value is a pressed button rather than a separate badge, so the
 * panel answers "what is it, and what can I make it" in one row.
 */
function TriagePanel({
  ticketId,
  current,
}: {
  ticketId: string;
  current: TicketPriority;
}) {
  const setPriority = useUpdateTicketPriority(ticketId);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">Priority</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {ticketPriorityValues.map((p) => (
          <Button
            key={p}
            size="sm"
            variant={p === current ? "default" : "outline"}
            aria-pressed={p === current}
            disabled={setPriority.isPending || p === current}
            onClick={() => setPriority.mutate(p)}
          >
            {TICKET_PRIORITY_LABELS[p]}
          </Button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Changes the queue order. The customer is not told — unlike a status
        change, this is not news they are waiting for.
      </p>
    </div>
  );
}

/**
 * Who else is in the conversation, and a way to add a shop owner.
 *
 * Most tickets are about an order, and the answer lives with the shop that
 * took it. Forwarding the question and relaying the reply loses the thread —
 * adding the shop owner to it does not, and both the customer and the shop
 * then see the same messages.
 *
 * The panel names everyone rather than counting them: "who can read this" is
 * the question worth answering on a screen holding somebody's complaint.
 */
function ParticipantsPanel({
  ticketId,
  participants,
}: {
  ticketId: string;
  participants: TicketParticipant[];
}) {
  const owners = useShopOwnerOptions();
  const { add, remove } = useTicketParticipants(ticketId);
  const [picked, setPicked] = useState("");

  // Anyone already in the thread is not offered again — the server would
  // no-op, but a list that keeps suggesting them reads like it did nothing.
  const already = new Set(participants.map((p) => p.user.id));
  const options = (owners.data ?? []).filter((o) => !already.has(o.userId));

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">
        In this conversation
      </p>

      <div className="mt-2 flex flex-wrap gap-2">
        {participants.length === 0 ? (
          <span className="text-xs text-muted-foreground">
            Just the customer and support.
          </span>
        ) : (
          participants.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs"
            >
              <UserPlus className="size-3 text-muted-foreground" />
              {[p.user.first_name, p.user.last_name].filter(Boolean).join(" ") ||
                p.user.email ||
                "Participant"}
              {p.user.user_type ? (
                <span className="text-muted-foreground">
                  · {p.user.user_type.replace("_", " ")}
                </span>
              ) : null}
              <button
                type="button"
                aria-label="Remove from conversation"
                disabled={remove.isPending}
                onClick={() => remove.mutate(p.user.id)}
                className="ml-0.5 text-muted-foreground transition hover:text-destructive"
              >
                <X className="size-3" />
              </button>
            </span>
          ))
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          aria-label="Shop owner"
          value={picked}
          onChange={(e) => setPicked(e.target.value)}
          disabled={owners.isPending || options.length === 0}
          className="h-9 min-w-[14rem] rounded-lg border border-border bg-card px-3 text-sm"
        >
          <option value="">
            {owners.isPending
              ? "Loading shop owners…"
              : options.length === 0
                ? "No other shop owners to add"
                : "Add a shop owner…"}
          </option>
          {options.map((o) => (
            <option key={o.userId} value={o.userId}>
              {o.label}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="outline"
          disabled={!picked || add.isPending}
          onClick={() => {
            add.mutate(picked, { onSuccess: () => setPicked("") });
          }}
        >
          {add.isPending && <Loader2 className="size-4 animate-spin" />}
          Add to conversation
        </Button>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        They will see this whole thread, and the customer is told in it.
      </p>
    </div>
  );
}
