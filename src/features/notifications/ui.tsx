"use client";

import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  CreditCard,
  MessageSquare,
  Package,
  PackageCheck,
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
