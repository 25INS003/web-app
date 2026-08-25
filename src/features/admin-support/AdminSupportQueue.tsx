"use client";

import { LifeBuoy, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TICKET_PRIORITY_LABELS,
  TICKET_TYPE_LABELS,
  ticketRaiserName,
} from "@/lib/api/schemas/support";
import type { Ticket } from "@/lib/api/schemas/support";
import { useAllTickets } from "@/features/support/hooks";
import { formatDate, StatusBadge } from "@/features/support/ui";

/**
 * The support queue.
 *
 * Customers could raise tickets and nobody could answer them: the backend has
 * always let an admin read and reply to any ticket, but the only support
 * screens lived under the storefront, so there was no way in without calling
 * the API by hand.
 *
 * Ordered oldest-first within the open filters, because this is a queue and
 * the longest wait is the one that has been ignored longest.
 */

const FILTERS = [
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In progress" },
  { key: "resolved", label: "Resolved" },
  { key: "closed", label: "Closed" },
  { key: "", label: "All" },
] as const;

const PRIORITY_VARIANT: Record<
  string,
  "default" | "success" | "warning" | "muted" | "outline"
> = {
  urgent: "warning",
  high: "warning",
  medium: "outline",
  low: "muted",
};

export function AdminSupportQueue() {
  const [status, setStatus] = useState<string>("open");
  const q = useAllTickets(status || undefined);

  const tickets = [...(q.data ?? [])].sort((a, b) => {
    // Oldest first while a ticket is still waiting on someone; newest first
    // once it is done, where the recent outcome is the interesting one.
    const at = new Date(a.created_at ?? 0).getTime();
    const bt = new Date(b.created_at ?? 0).getTime();
    return status === "resolved" || status === "closed" ? bt - at : at - bt;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Support
          </h1>
          <p className="text-sm text-muted-foreground">
            Requests raised by customers and shop owners.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => q.refetch()}
          disabled={q.isFetching}
        >
          <RefreshCw className={`size-4 ${q.isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key || "all"}
            onClick={() => setStatus(f.key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              status === f.key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {q.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : q.isError ? (
        <Empty
          title="Could not load the queue"
          body="Something went wrong fetching support requests."
          action={<Button onClick={() => q.refetch()}>Try again</Button>}
        />
      ) : tickets.length === 0 ? (
        <Empty
          title={status === "open" ? "Nothing waiting" : "Nothing here"}
          body={
            status === "open"
              ? "No open requests. New ones appear here automatically."
              : "No requests with this status."
          }
        />
      ) : (
        <ul className="space-y-2">
          {tickets.map((t) => (
            <TicketRow key={t.id} ticket={t} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TicketRow({ ticket }: { ticket: Ticket }) {
  const raiser = ticketRaiserName(ticket);

  return (
    <li>
      <Link
        href={`/admin/support/${ticket.id}`}
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs transition hover:border-primary/40 hover:shadow-md"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{ticket.subject}</span>
            <Badge variant={PRIORITY_VARIANT[ticket.ticket_priority] ?? "outline"}>
              {TICKET_PRIORITY_LABELS[ticket.ticket_priority]}
            </Badge>
            {/* Unassigned is the state that matters on a queue: it means
                nobody has picked this up yet. Answering or moving the status
                claims it. */}
            {!ticket.assigned_admin_id && (
              <Badge variant="outline">Unassigned</Badge>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {TICKET_TYPE_LABELS[ticket.ticket_type]}
            {raiser ? ` · ${raiser}` : ""}
            {ticket.created_at ? ` · ${formatDate(ticket.created_at)}` : ""}
            {` · #${ticket.id.slice(0, 8)}`}
          </p>
        </div>
        <StatusBadge status={ticket.ticket_status} />
      </Link>
    </li>
  );
}

function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <LifeBuoy className="size-6" />
      </span>
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {body}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
