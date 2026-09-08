"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useIsAuthed, useSession } from "@/features/auth/useAuth";
import type { Notification } from "@/lib/api/schemas/notifications";
import { useMarkAllRead, useNotifications, useUnreadCount } from "./hooks";
import { NotificationDetail } from "./NotificationDetail";
import { NotificationIcon, timeAgo, toneFor, TONE_CLASSES } from "./ui";
import { useNotificationsRealtime } from "./useNotificationsRealtime";

/**
 * @param viewAllHref where "View all" goes.
 *
 * The bell is mounted in three shells — the storefront, the seller dashboard
 * and the admin — and it used to link to `/notifications` in all of them. That
 * route lives under `(storefront)`, so a seller or an admin pressing "View
 * all" landed in the CUSTOMER shop, complete with a search bar, a Cart button
 * and a Nedyway logo pointing at `/`.
 *
 * A prop rather than a `user_type` check inside the bell: the shell already
 * knows which one it is, and the bell has no business asking.
 */
export function NotificationBell({
  viewAllHref = "/notifications",
}: {
  viewAllHref?: string;
} = {}) {
  const router = useRouter();
  const authed = useIsAuthed();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: session } = useSession(authed);
  const userId = session?.user.id;
  useNotificationsRealtime(userId);

  const { data: unread = 0 } = useUnreadCount(authed);
  const { data: items = [], isLoading } = useNotifications(authed && open);
  const markAllRead = useMarkAllRead();

  /**
   * The notification being read in full, if any.
   *
   * The panel clamps the title AND the message to one line each, so a message
   * carrying a decision and its reason was unreadable here — and clicking it
   * navigated away, which was the only thing a click could do. It opens the
   * full text now; `action_url` is a button inside it.
   *
   * Declared with the other hooks, above `if (!authed) return null` — below it
   * this is a conditional hook, and the order changes the moment somebody
   * signs in.
   */
  const [opened, setOpened] = useState<Notification | null>(null);

  // Which items were unread at the moment the panel opened.
  //
  // Opening marks everything read, so without this snapshot the highlight on
  // the new ones would vanish in the same instant the customer looked at them
  // — they would be told "you have 3" and then shown nothing to distinguish
  // those 3. The badge clears immediately, which is what acknowledgement
  // means; the rows stay marked for as long as the panel is open.
  const [wasUnread, setWasUnread] = useState<Set<string>>(new Set());
  // Guards the effect below against re-firing when the list refetches after
  // the mutation invalidates it.
  const acknowledged = useRef(false);

  useEffect(() => {
    if (!open) {
      acknowledged.current = false;
      return;
    }
    if (isLoading || acknowledged.current) return;

    acknowledged.current = true;
    setWasUnread(new Set(items.filter((n) => !n.is_read).map((n) => n.id)));
    // Clicking the bell IS reading them. Only called when there is something
    // to clear, so opening an already-read list costs no request.
    if (unread > 0) markAllRead.mutate();
  }, [open, isLoading, items, unread, markAllRead]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!authed) return null;

  const onItem = (n: Notification) => {
    setOpen(false);
    setOpened(n);
  };

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
        }
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell />
        {unread > 0 && (
          <span
            aria-live="polite"
            className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>

      {open && (
        <div
          role="menu"
          // `shadow-lg`, not `shadow-pop`. The pop shadow is a hard 3px
          // offset in a solid colour — the app's tactile house style, and
          // wrong for a panel that hangs off a header: it painted a slab down
          // the right edge that read as a border rather than as depth. A
          // dropdown wants ordinary elevation.
          className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            {/* No "Mark all read": opening the panel already did it. */}
            <span className="text-sm font-semibold">Notifications</span>
          </div>

          {/* Scrolls, and cannot outgrow the screen.
          
              `max-h-96` alone is 384px, which is taller than the space under
              the header on a short phone — the panel ran off the bottom and
              the last rows were unreachable, because the overflow that would
              have scrolled them was never triggered. Whichever of the two is
              smaller wins. */}
          <div className="max-h-[min(24rem,60vh)] overflow-y-auto overscroll-contain">
            {isLoading ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Loading…
              </p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                You&apos;re all caught up.
              </p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  role="menuitem"
                  onClick={() => onItem(n)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-muted/60 ${
                    n.is_read && !wasUnread.has(n.id) ? "" : "bg-primary/5"
                  }`}
                >
                  <span
                  className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${TONE_CLASSES[toneFor(n.type)]}`}
                >
                    <NotificationIcon type={n.type} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {n.title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {n.message}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {timeAgo(n.created_at)}
                  </span>
                </button>
              ))
            )}
          </div>

          <Link
            href={viewAllHref}
            onClick={() => setOpen(false)}
            className="block border-t border-border px-4 py-2.5 text-center text-xs font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </div>
      )}

      <NotificationDetail
        notification={opened}
        onClose={() => setOpened(null)}
      />
    </div>
  );
}
