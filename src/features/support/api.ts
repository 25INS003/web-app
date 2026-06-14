import { api } from "@/lib/api/client";
import {
  createTicketInputSchema,
  ticketDetailSchema,
  ticketListResponseSchema,
  ticketMessageSchema,
  ticketSchema,
} from "@/lib/api/schemas/support";
import type {
  CreateTicketInput,
  Ticket,
  TicketDetail,
  TicketMessage,
} from "@/lib/api/schemas/support";

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
    const body = createTicketInputSchema.parse(input);
    const data = await api.post<unknown>("/support/tickets", body);
    return ticketSchema.parse(data);
  },

  // Messages live under /message (not /support) in the backend route table.
  async sendMessage(
    ticketId: string,
    messageText: string,
  ): Promise<TicketMessage> {
    const data = await api.post<unknown>(
      `/message/tickets/${ticketId}/messages`,
      { message_text: messageText },
    );
    return ticketMessageSchema.parse(data);
  },
};
