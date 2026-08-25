import { z } from "zod";
import { isoDate, objectId } from "./common";

// A user reference is either a bare id (unpopulated) or the populated subset the
// backend selects (first_name/last_name — there is no `name` field).
const userRefSchema = z
  .union([
    objectId,
    z.object({
      id: objectId,
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
  id: objectId,
  // There is no `ticket_id` on a support ticket. It is a Mongo-era mirror of
  // the primary key — the same shape `_id`/`id` and `order_id`/`order_number`
  // had — and `support_tickets` has only `id`. Declaring it as a required
  // string meant every response failed to parse, and because a ZodError is not
  // an ApiError the page fell through to "Could not submit your request". The
  // ticket had in fact been created; only the reply could not be read.
  subject: z.string(),
  description: z.string(),
  ticket_type: ticketTypeSchema,
  ticket_priority: ticketPrioritySchema,
  ticket_status: ticketStatusSchema,
  user_id: userRefSchema,
  assigned_admin_id: userRefSchema,

  // The people behind those ids, attached by the list and the detail.
  //
  // `user_id` is a bare uuid on every response, so `userRefName` on it always
  // fell back to "User" — which is exactly the wrong answer on a support
  // thread, where knowing who you are talking to is the point.
  user: userRefSchema,
  assigned_admin: userRefSchema,
  resolved_at: isoDate.nullish(),
  created_at: isoDate.nullish(),
});
export type Ticket = z.infer<typeof ticketSchema>;

/**
 * A file sent on a message.
 *
 * Stored as `{ name, url, mime_type, size }` — the shape the shop-owner
 * document upload already uses — but parsed tolerantly from a bare string too.
 * The column has existed, defaulting to `[]`, since the table shipped; nothing
 * ever wrote to it, so there is no legacy data to migrate, but a URL is what
 * the old declared type promised and accepting one costs a line.
 *
 * `name` matters because a bucket key ends in `1724_ab12_receipt.pdf`: a
 * thread that renders the URL shows a timestamp where a filename belongs.
 */
export const attachmentSchema = z
  .union([
    z.string().transform((url) => ({ url, name: "", mime_type: "", size: 0 })),
    z.object({
      url: z.string(),
      name: z.string().nullish(),
      mime_type: z.string().nullish(),
      size: z.number().nullish(),
    }),
  ])
  .transform((a) => ({
    url: a.url,
    // Falls back to the tail of the URL so something nameable always shows.
    name: a.name || decodeURIComponent(a.url.split("/").pop() ?? "") || "File",
    mime_type: a.mime_type ?? "",
    size: a.size ?? 0,
  }));
export type Attachment = z.infer<typeof attachmentSchema>;

/** Whether to show this inline or as a file to download. */
export const isImageAttachment = (a: Attachment): boolean =>
  a.mime_type.startsWith("image/") ||
  // A record written before mime_type existed, or one the browser sent
  // untyped, still renders inline when the URL says what it is.
  (!a.mime_type && /\.(png|jpe?g|gif|webp|bmp|avif)$/i.test(a.url));

export const ticketMessageSchema = z.object({
  id: objectId,
  message_id: z.string().optional(),
  ticket_id: objectId,
  sender_id: userRefSchema,
  message_text: z.string(),
  // One unreadable attachment costs that attachment, not the whole message —
  // and a message whose files fail to parse is still a message worth showing.
  attachments: z
    .array(z.unknown())
    .optional()
    .default([])
    .transform((rows) =>
      rows.flatMap((row) => {
        const parsed = attachmentSchema.safeParse(row);
        return parsed.success ? [parsed.data] : [];
      }),
    ),
  is_read: z.boolean().optional(),
  sent_at: isoDate.nullish(),
});
export type TicketMessage = z.infer<typeof ticketMessageSchema>;

// GET /support/tickets/:id returns the ticket with its embedded thread.
/** Somebody brought into the conversation who did not raise it. */
export const ticketParticipantSchema = z.object({
  id: objectId,
  created_at: isoDate.nullish(),
  user: z.object({
    id: objectId,
    first_name: z.string().nullish(),
    last_name: z.string().nullish(),
    email: z.string().nullish(),
    user_type: z.string().nullish(),
  }),
});
export type TicketParticipant = z.infer<typeof ticketParticipantSchema>;

export const ticketDetailSchema = ticketSchema.extend({
  messages: z.array(ticketMessageSchema).optional().default([]),
  message_count: z.number().optional(),
  // Who else can read this. Sent by the detail; absent elsewhere.
  participants: z.array(ticketParticipantSchema).optional().default([]),
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

// ticket_priority is optional, and the CUSTOMER form does not send it: the
// column defaults to `medium` server-side, and self-rated urgency sorts
// nothing because everyone rates their own problem at the top. A shop owner
// raising one does set it — they are reporting on the operational side rather
// than pleading their own case — and an admin can retriage anything afterwards
// through the priority endpoint. No .default() here, so the zod input/output
// types stay aligned for react-hook-form's resolver.
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
  return typeof ref === "object" ? ref.id : ref;
}

/**
 * A ticket's raiser, named.
 *
 * Prefers the populated `user` over `user_id`, which is a bare uuid on every
 * response — reading the id alone always produced the "User" fallback.
 */
export function ticketRaiserName(ticket: {
  user?: UserRef;
  user_id?: UserRef;
}): string {
  const named = userRefName(ticket.user ?? null);
  return named === "User" ? userRefName(ticket.user_id ?? null) : named;
}

export function userRefName(ref: UserRef): string {
  if (ref && typeof ref === "object") {
    const name = `${ref.first_name ?? ""} ${ref.last_name ?? ""}`.trim();
    if (name) return name;
  }
  return "User";
}

/** A person, named as well as what we hold allows. */
function personName(p: {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}): string {
  return (
    `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email || "Participant"
  );
}

/**
 * Names the sender of a message, from what the ticket already carries.
 *
 * `sender_id` is a bare uuid on every message, so naming it directly always
 * produced the "User" fallback — precisely the wrong answer on a thread, where
 * knowing who is talking is the point. The ticket knows everybody who is on
 * it: whoever raised it, and whoever an admin brought in. Anyone else posting
 * is support, which also covers the status lines the server writes.
 *
 * Shared rather than reimplemented per screen: once a thread can hold three
 * people, a customer view and an admin view that each guess separately will
 * eventually put different names on the same message.
 */
export function threadSenderNamer(ticket: {
  user?: UserRef;
  user_id?: UserRef;
  participants?: {
    user: {
      id: string;
      first_name?: string | null;
      last_name?: string | null;
      email?: string | null;
    };
  }[];
}): (ref: UserRef) => string {
  const byId = new Map<string, string>();

  const raiserId = userRefId(ticket.user_id) ?? userRefId(ticket.user);
  if (raiserId) byId.set(raiserId, ticketRaiserName(ticket));
  for (const p of ticket.participants ?? []) {
    byId.set(p.user.id, personName(p.user));
  }

  return (ref: UserRef) => {
    const id = userRefId(ref);
    return (id && byId.get(id)) || "Support";
  };
}
