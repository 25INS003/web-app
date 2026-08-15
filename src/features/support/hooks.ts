"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/types";
import { queryKeys } from "@/lib/query/keys";
import type { CreateTicketInput } from "@/lib/api/schemas/support";
import { supportApi } from "./api";

export function useTickets() {
  return useQuery({
    queryKey: queryKeys.support.tickets(),
    queryFn: supportApi.getTickets,
    staleTime: 30_000,
  });
}

export function useTicket(ticketId: string) {
  return useQuery({
    queryKey: queryKeys.support.ticket(ticketId),
    queryFn: () => supportApi.getTicket(ticketId),
    enabled: Boolean(ticketId),
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (input: CreateTicketInput) => supportApi.createTicket(input),
    onSuccess: (ticket) => {
      toast.success("Support request submitted");
      qc.invalidateQueries({ queryKey: queryKeys.support.tickets() });
      router.push(`/support/${ticket.id}`);
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
    mutationFn: (messageText: string) =>
      supportApi.sendMessage(ticketId, messageText),
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
