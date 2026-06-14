"use client";

import { LifeBuoy, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TICKET_TYPE_LABELS } from "@/lib/api/schemas/support";
import { useTickets } from "./hooks";
import { formatDate, StatusBadge } from "./ui";

export function SupportList() {
  const q = useTickets();

  if (q.isPending) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const tickets = q.data ?? [];

  if (tickets.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <LifeBuoy className="size-7" />
        </span>
        <h1 className="font-display text-2xl font-bold">How can we help?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Raise a support request and our team will get back to you here.
        </p>
        <Button asChild className="mt-6">
          <Link href="/support/new">
            <Plus className="size-4" /> New request
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Support
        </h1>
        <Button asChild size="sm">
          <Link href="/support/new">
            <Plus className="size-4" /> New request
          </Link>
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {tickets.map((t) => (
          <Link
            key={t._id}
            href={`/support/${t._id}`}
            className="block rounded-2xl border border-border bg-card p-4 shadow-xs transition hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{t.subject}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {TICKET_TYPE_LABELS[t.ticket_type]}
                  {t.created_at ? ` · ${formatDate(t.created_at)}` : ""}
                </p>
              </div>
              <StatusBadge status={t.ticket_status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
