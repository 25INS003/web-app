import { z } from "zod";
import { api } from "@/lib/api/client";
import {
  createTicketInputSchema,
  ticketDetailSchema,
  ticketListResponseSchema,
  ticketMessageSchema,
  ticketParticipantSchema,
  ticketSchema,
} from "@/lib/api/schemas/support";
import type {
  CreateTicketInput,
  Ticket,
  TicketPriority,
  TicketDetail,
  TicketMessage,
  TicketParticipant,
  TicketStatus,
} from "@/lib/api/schemas/support";

// Both participant endpoints answer with the ticket's full participant list,
// so the caller never has to reconstruct it from what it just sent.
const participantsResponseSchema = z.object({
  participants: z.array(ticketParticipantSchema),
});

export const supportApi = {
  async getTickets(): Promise<Ticket[]> {
    const data = await api.get<unknown>("/support/tickets", {
      params: { limit: 50 },
    });
    return ticketListResponseSchema.parse(data).tickets;
  },

  // Detail endpoint returns the ticket with its embedded message thread.
  async getTicket(ticketId: string): Promise<TicketDetail> {
    const data = await api.get<unknown>(`/support/tickets/${ticketId}`);
    return ticketDetailSchema.parse(data);
  },

  async createTicket(input: CreateTicketInput): Promise<Ticket> {
    // Only the ids travel. The server checks the order is the caller's and
    // the item is on it before storing either — see resolveTicketSubject.
    const body = createTicketInputSchema.parse(input);
    const data = await api.post<unknown>("/support/tickets", body);
    return ticketSchema.parse(data);
  },

  /**
   * Every ticket, for an admin.
   *
   * The same endpoint the customer calls: the backend scopes to
   * `user_id` only for non-staff, so an admin's request comes back with the
   * whole queue. `status` narrows it server-side rather than in the page,
   * because the queue is paged.
   */
  async getAllTickets(status?: string): Promise<Ticket[]> {
    const data = await api.get<unknown>("/support/tickets", {
      params: { limit: 100, ...(status ? { status } : {}) },
    });
    return ticketListResponseSchema.parse(data).tickets;
  },

  /**
   * Move a ticket's status.
   *
   * Also how a ticket gets an owner: the handler claims an unassigned ticket
   * for the admin making the change, so answering one is what assigns it.
   * The change is recorded in the thread, so the customer sees it happen.
   */
  async updateStatus(ticketId: string, status: TicketStatus): Promise<Ticket> {
    const data = await api.put<unknown>(
      `/support/tickets/${ticketId}/status`,
      { status },
    );
    return ticketSchema.parse(data);
  },

  /**
   * Triage a ticket.
   *
   * Staff-only and a separate endpoint from the status change: they are
   * different decisions with different audiences. A status change is written
   * into the thread for the customer to see; a priority change is internal
   * ordering and is not, so this does not disturb the conversation.
   */
  async updatePriority(
    ticketId: string,
    priority: TicketPriority,
  ): Promise<Ticket> {
    const data = await api.put<unknown>(
      `/support/tickets/${ticketId}/priority`,
      { priority },
    );
    return ticketSchema.parse(data);
  },

  /**
   * Bring somebody into the conversation, by user id.
   *
   * Staff-only, enforced server-side. Adding the same person twice answers
   * 200 rather than erroring, so a double click is harmless.
   */
  async addParticipant(
    ticketId: string,
    userId: string,
  ): Promise<TicketParticipant[]> {
    const data = await api.post<unknown>(
      `/support/tickets/${ticketId}/participants`,
      { user_id: userId },
    );
    return participantsResponseSchema.parse(data).participants;
  },

  async removeParticipant(
    ticketId: string,
    userId: string,
  ): Promise<TicketParticipant[]> {
    const data = await api.delete<unknown>(
      `/support/tickets/${ticketId}/participants/${userId}`,
    );
    return participantsResponseSchema.parse(data).participants;
  },

  /**
   * Post a message, with or without files.
   *
   * Multipart only when there is something to attach. A text-only reply stays
   * plain JSON — it is the overwhelmingly common case, and there is no reason
   * for every "thanks" to travel as a file upload. axios sets the multipart
   * boundary itself for FormData.
   */
  async sendMessage(
    ticketId: string,
    messageText: string,
    files: File[] = [],
  ): Promise<TicketMessage> {
    const url = `/message/tickets/${ticketId}/messages`;

    if (!files.length) {
      const data = await api.post<unknown>(url, { message_text: messageText });
      return ticketMessageSchema.parse(data);
    }

    const fd = new FormData();
    fd.append("message_text", messageText);
    for (const file of files) fd.append("attachments", file);

    const data = await api.post<unknown>(url, fd);
    return ticketMessageSchema.parse(data);
  },
};
