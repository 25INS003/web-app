import { z } from "zod";
import { isoDate, objectId } from "./common";

// A user reference is either a bare id (unpopulated) or the populated subset the
// backend selects (first_name/last_name — there is no `name` field).
const userRefSchema = z
  .union([
    objectId,
    z.object({
      _id: objectId,
      first_name: z.string().nullish(),
      last_name: z.string().nullish(),
      email: z.string().nullish(),
      profile_image: z.string().nullish(),
    }),
  ])
  .nullish();
export type UserRef = z.infer<typeof userRefSchema>;

export const ticketTypeValues = [
  "order_issue",
  "payment_issue",
  "technical",
  "account_issue",
  "general",
  "refund",
] as const;
export const ticketPriorityValues = ["low", "medium", "high", "urgent"] as const;
export const ticketStatusValues = [
  "open",
  "in_progress",
  "resolved",
  "closed",
] as const;

// Response schemas tolerate unknown enum values (.catch) so a backend addition
// never hard-fails the page.
export const ticketTypeSchema = z.enum(ticketTypeValues).catch("general");
export type TicketType = z.infer<typeof ticketTypeSchema>;
export const ticketPrioritySchema = z.enum(ticketPriorityValues).catch("medium");
export type TicketPriority = z.infer<typeof ticketPrioritySchema>;
export const ticketStatusSchema = z.enum(ticketStatusValues).catch("open");
export type TicketStatus = z.infer<typeof ticketStatusSchema>;

export const ticketSchema = z.object({
  _id: objectId,
  ticket_id: z.string(),
  subject: z.string(),
  description: z.string(),
  ticket_type: ticketTypeSchema,
  ticket_priority: ticketPrioritySchema,
  ticket_status: ticketStatusSchema,
  user_id: userRefSchema,
  assigned_admin_id: userRefSchema,
  resolved_at: isoDate.nullish(),
  created_at: isoDate.nullish(),
});
export type Ticket = z.infer<typeof ticketSchema>;

export const ticketMessageSchema = z.object({
  _id: objectId,
  message_id: z.string().optional(),
  ticket_id: objectId,
  sender_id: userRefSchema,
  message_text: z.string(),
  attachments: z.array(z.string()).optional().default([]),
  is_read: z.boolean().optional(),
  sent_at: isoDate.nullish(),
});
export type TicketMessage = z.infer<typeof ticketMessageSchema>;

// GET /support/tickets/:id returns the ticket with its embedded thread.
export const ticketDetailSchema = ticketSchema.extend({
  messages: z.array(ticketMessageSchema).optional().default([]),
  message_count: z.number().optional(),
});
export type TicketDetail = z.infer<typeof ticketDetailSchema>;

// GET /support/tickets response envelope (data payload).
export const ticketListResponseSchema = z.object({
  tickets: z.array(ticketSchema),
  summary: z
    .object({
      total_tickets: z.number(),
      status_counts: z.record(z.string(), z.number()).optional().default({}),
    })
    .optional(),
});

// --- form input ---

// ticket_priority has no .default() so the zod input/output types stay aligned
// for react-hook-form's resolver; the form supplies the default via defaultValues.
export const createTicketInputSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(3, "Please add a short subject")
    .max(120, "Keep the subject under 120 characters"),
  description: z
    .string()
    .trim()
    .min(10, "Tell us a bit more (at least 10 characters)")
    .max(2000, "Keep it under 2000 characters"),
  ticket_type: z.enum(ticketTypeValues),
  ticket_priority: z.enum(ticketPriorityValues).optional(),
});
export type CreateTicketInput = z.infer<typeof createTicketInputSchema>;

// --- display helpers ---

export const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  order_issue: "Order issue",
  payment_issue: "Payment issue",
  technical: "Technical",
  account_issue: "Account",
  general: "General",
  refund: "Refund",
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export function userRefId(ref: UserRef): string | undefined {
  if (!ref) return undefined;
  return typeof ref === "object" ? ref._id : ref;
}

export function userRefName(ref: UserRef): string {
  if (ref && typeof ref === "object") {
    const name = `${ref.first_name ?? ""} ${ref.last_name ?? ""}`.trim();
    if (name) return name;
  }
  return "User";
}
