"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createTicketInputSchema,
  TICKET_PRIORITY_LABELS,
  TICKET_TYPE_LABELS,
  ticketPriorityValues,
  ticketTypeValues,
} from "@/lib/api/schemas/support";
import type { CreateTicketInput } from "@/lib/api/schemas/support";
import { cn } from "@/lib/utils";
import { useCreateTicket } from "./hooks";

export function NewTicketForm() {
  const create = useCreateTicket();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketInputSchema),
    defaultValues: {
      subject: "",
      description: "",
      ticket_type: "general",
      ticket_priority: "medium",
    },
  });

  const ticketType = watch("ticket_type");
  const priority = watch("ticket_priority");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link
        href="/support"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Support
      </Link>

      <h1 className="font-display text-2xl font-bold tracking-tight">
        New support request
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Describe your issue and we&apos;ll get back to you here.
      </p>

      <form
        onSubmit={handleSubmit((v) => create.mutate(v))}
        noValidate
        className="mt-6 space-y-6"
      >
        <div className="space-y-1.5">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            placeholder="Brief summary of the issue"
            {...register("subject")}
          />
          {errors.subject && (
            <p className="text-xs text-destructive">{errors.subject.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Topic</Label>
          <div className="flex flex-wrap gap-2">
            {ticketTypeValues.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setValue("ticket_type", t)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition",
                  ticketType === t
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {TICKET_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>
          <div className="flex flex-wrap gap-2">
            {ticketPriorityValues.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setValue("ticket_priority", p)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition",
                  priority === p
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {TICKET_PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            rows={6}
            placeholder="Share as much detail as you can…"
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"
            {...register("description")}
          />
          {errors.description && (
            <p className="text-xs text-destructive">
              {errors.description.message}
            </p>
          )}
        </div>

        <Button type="submit" disabled={create.isPending}>
          {create.isPending && <Loader2 className="size-4 animate-spin" />}
          Submit request
        </Button>
      </form>
    </div>
  );
}
