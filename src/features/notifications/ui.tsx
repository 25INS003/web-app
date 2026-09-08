"use client";

import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  CreditCard,
  MessageSquare,
  Package,
  PackageCheck,
  Pencil,
  ShoppingBag,
  Star,
  Tag,
  Truck,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { NotificationType } from "@/lib/api/schemas/notifications";

const ICONS: Record<NotificationType, LucideIcon> = {
  order_placed: ShoppingBag,
  order_accepted: CheckCircle2,
  order_ready: Package,
  order_picked_up: Truck,
  order_delivered: PackageCheck,
  order_cancelled: XCircle,
  payment_success: CreditCard,
  payment_failed: CreditCard,
  new_message: MessageSquare,
  system_alert: Bell,
  promotional: Tag,
  review_reminder: Star,
  stock_alert: AlertTriangle,
  delivery_assigned: Truck,
  product_approved: PackageCheck,
  product_rejected: XCircle,
  product_updated: Pencil,
};

export function NotificationIcon({
  type,
  className,
}: {
  type: NotificationType;
  className?: string;
}) {
  const Icon = ICONS[type] ?? Bell;
  return <Icon className={className ?? "size-4"} aria-hidden />;
}

// Compact relative time ("just now", "5m", "3h", "2d") with an absolute fallback.
export function timeAgo(value?: string | null): string {
  if (!value) return "";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return new Date(value).toLocaleDateString();
}

/**
 * The colour a notification carries, from what it is about.
 *
 * Not decoration: an order delivered and a payment failed arrived in the same
 * flat grey circle, so the feed read as one undifferentiated list and the two
 * that actually need attention looked like the twelve that do not. Semantic
 * tokens rather than raw colours, so both themes follow.
 *
 * `system_alert` is the default AND the bucket every unrecognised type falls
 * into (the schema's `.catch`), so it stays neutral — a shop notification
 * landing here must not be painted as a failure.
 */
export type NotificationTone = "neutral" | "positive" | "warning" | "negative";

const TONES: Partial<Record<NotificationType, NotificationTone>> = {
  order_accepted: "positive",
  order_delivered: "positive",
  payment_success: "positive",
  product_approved: "positive",
  order_ready: "positive",
  order_cancelled: "negative",
  payment_failed: "negative",
  product_rejected: "negative",
  stock_alert: "warning",
  review_reminder: "warning",
  promotional: "warning",
};

export const toneFor = (type: NotificationType): NotificationTone =>
  TONES[type] ?? "neutral";

export const TONE_CLASSES: Record<NotificationTone, string> = {
  neutral: "bg-muted text-foreground",
  positive: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  negative: "bg-destructive/10 text-destructive",
};

/**
 * The full date, for the tooltip and the dialog.
 *
 * `timeAgo` collapses to "3d" and then to a bare date, which is right in a
 * list and useless when somebody is trying to work out exactly when they were
 * told something.
 */
export function fullTimestamp(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
