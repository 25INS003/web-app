"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/types";
import { queryKeys } from "@/lib/query/keys";
import type {
  CreateTicketInput,
  TicketPriority,
  TicketStatus,
} from "@/lib/api/schemas/support";
import { supportApi } from "./api";

/**
 * How often an open support screen looks for new messages.
 *
 * A thread is a live conversation, so it checks often; a list is a glance at
 * what is waiting, so it checks less. Both are only paid while the tab is
 * open — react-query pauses `refetchInterval` on a hidden tab by default, and
 * the focus refetch below is what catches up on return. The two are chosen to
 * complement each other rather than overlap.
 */
const THREAD_POLL = 10_000;
const LIST_POLL = 30_000;

export function useTickets() {
  return useQuery({
    queryKey: queryKeys.support.tickets(),
    queryFn: supportApi.getTickets,
    staleTime: 30_000,
    refetchInterval: LIST_POLL,
    // Set here rather than globally: `refetchOnWindowFocus` is off across the
    // whole app by default, and turning it on for every screen to fix support
    // would change the behaviour of pages nobody asked about.
    refetchOnWindowFocus: true,
  });
}

/**
 * One thread, kept current.
 *
 * It used to fetch once and never again — no interval, and
 * `refetchOnWindowFocus` is off app-wide — so a reply only appeared on a full
 * page reload. Polling covers the case that matters most, somebody watching a
 * conversation as it happens; the focus refetch covers tabbing away and back,
 * which is when polling is paused.
 *
 * Worth knowing: this endpoint also moves the reader's read cursor, so
 * polling an open thread keeps it current — which is correct, they are
 * looking at it — at the cost of one small upsert per poll.
 */
export function useTicket(ticketId: string) {
  return useQuery({
    queryKey: queryKeys.support.ticket(ticketId),
    queryFn: () => supportApi.getTicket(ticketId),
    enabled: Boolean(ticketId),
    refetchInterval: THREAD_POLL,
    refetchOnWindowFocus: true,
  });
}

/**
 * Raise a ticket, then open it.
 *
 * `basePath` because support is now mounted twice — under the storefront for
 * customers and under /dashboard for shop owners — and the two areas have
 * different chrome. Sending an owner to the storefront copy of the ticket they
 * just raised would drop them out of their own dashboard.
 */
export function useCreateTicket(basePath = "/support") {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (input: CreateTicketInput) => supportApi.createTicket(input),
    onSuccess: (ticket) => {
      toast.success("Support request submitted");
      qc.invalidateQueries({ queryKey: queryKeys.support.tickets() });
      router.push(`${basePath}/${ticket.id}`);
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Could not submit your request",
      ),
  });
}

export function useSendMessage(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ text, files }: { text: string; files?: File[] }) =>
      supportApi.sendMessage(ticketId, text, files ?? []),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.support.ticket(ticketId) });
      qc.invalidateQueries({ queryKey: queryKeys.support.tickets() });
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Could not send your message",
      ),
  });
}

/**
 * The whole support queue, for an admin.
 *
 * Polled, because a ticket is somebody waiting: a queue that only updates on
 * reload is one an admin has to remember to reload. 30s is often enough to
 * notice a new request and cheap enough for a screen left open all day.
 */
export function useAllTickets(status?: string) {
  return useQuery({
    queryKey: [...queryKeys.support.tickets(), "all", status ?? "any"] as const,
    queryFn: () => supportApi.getAllTickets(status),
    refetchInterval: LIST_POLL,
    refetchOnWindowFocus: true,
    placeholderData: (previous) => previous,
  });
}

/**
 * Move a ticket's status.
 *
 * Invalidates the whole support subtree rather than one key: a status change
 * moves the ticket between queue filters, claims it for this admin, and adds
 * a line to the thread — patching one cached list would leave the rest of the
 * screen disagreeing with it.
 */
export function useUpdateTicketStatus(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: TicketStatus) =>
      supportApi.updateStatus(ticketId, status),
    onSuccess: (_t, status) => {
      toast.success(`Ticket marked ${status.replace("_", " ")}`);
      qc.invalidateQueries({ queryKey: queryKeys.support.all });
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Could not update the ticket",
      ),
  });
}

/**
 * Retriage a ticket.
 *
 * Invalidates the whole support subtree because priority is what the queue
 * sorts and filters by — patching this one ticket would leave it sitting in a
 * filter it no longer belongs to.
 *
 * Unlike a status change there is no thread line to show for it, so the toast
 * is the only feedback that anything happened.
 */
export function useUpdateTicketPriority(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (priority: TicketPriority) =>
      supportApi.updatePriority(ticketId, priority),
    onSuccess: (_t, priority) => {
      toast.success(`Priority set to ${priority}`);
      qc.invalidateQueries({ queryKey: queryKeys.support.all });
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Could not set the priority",
      ),
  });
}

/**
 * Add or remove somebody from a conversation.
 *
 * Invalidates the whole support subtree: the change adds a line to the thread
 * and moves the ticket into or out of that person's own support list, so
 * patching the participant array alone would leave the rest disagreeing.
 */
export function useTicketParticipants(ticketId: string) {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: queryKeys.support.all });

  const add = useMutation({
    mutationFn: (userId: string) =>
      supportApi.addParticipant(ticketId, userId),
    onSuccess: () => {
      toast.success("Added to the conversation");
      invalidate();
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Could not add them",
      ),
  });

  const remove = useMutation({
    mutationFn: (userId: string) =>
      supportApi.removeParticipant(ticketId, userId),
    onSuccess: () => {
      toast.success("Removed from the conversation");
      invalidate();
    },
    onError: (err) =>
      toast.error(
        err instanceof ApiError ? err.message : "Could not remove them",
      ),
  });

  return { add, remove };
}
