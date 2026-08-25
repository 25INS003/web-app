"use client";

import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import {
  TICKET_STATUS_LABELS,
  type TicketStatus,
} from "@/lib/api/schemas/support";

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
