"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Notification } from "@/lib/api/schemas/notifications";
import {
  fullTimestamp,
  NotificationIcon,
  timeAgo,
  toneFor,
  TONE_CLASSES,
} from "./ui";

/**
 * One notification, in full.
 *
 * Neither place a notification appears would let you read a long one. The bell
 * clamps the title AND the message to a single line each, and the list page —
 * which does show the whole message — treated a click as "go to `action_url`",
 * so the only thing you could do with a notification was leave it.
 *
 * That is fine for "Order delivered" and useless for the messages that carry a
 * decision: an admin taking a shop offline, refusing an application or turning
 * down a deletion request writes a reason, and the reason IS the notification.
 * Truncated at 40 characters it is worse than nothing, because it looks like it
 * has been read.
 *
 * So opening one shows it. `action_url` becomes a button rather than the
 * unavoidable consequence of a click — still one press away, but no longer in
 * the way of reading.
 */
/**
 * What the button should say, from where it goes.
 *
 * "View details" was the same words on every notification, in a dialog that
 * had just shown the whole message — so it read as "there is more of this to
 * see" when it actually meant "leave, and go to the shop this is about". A
 * button should say what happens before it is pressed.
 *
 * Matched longest-prefix-first, and the routes are the ones the server
 * actually sends: `/orders/:id`, `/products/:shopId/view/:id`, `/myshop`,
 * `/dashboard`, `/status`. Anything unrecognised falls back to a phrase that
 * is vague but not misleading — better than naming a destination wrongly.
 */
const DESTINATIONS: [RegExp, string][] = [
  [/^\/orders\b/, "View order"],
  [/^\/products\b/, "View product"],
  [/^\/myshop\b/, "Go to My Shops"],
  [/^\/dashboard\/support\b/, "Go to Support"],
  [/^\/dashboard\b/, "Go to dashboard"],
  [/^\/status\b/, "View application"],
  [/^\/help\b/, "Go to Support"],
  [/^\/support\b/, "Go to Support"],
];

export function destinationLabel(actionUrl: string): string {
  const path = actionUrl.split("?")[0];
  for (const [pattern, label] of DESTINATIONS) {
    if (pattern.test(path)) return label;
  }
  return "Open";
}

export function NotificationDetail({
  notification,
  onClose,
}: {
  notification: Notification | null;
  onClose: () => void;
}) {
  const router = useRouter();

  const tone = TONE_CLASSES[toneFor(notification?.type ?? "system_alert")];

  const go = () => {
    if (!notification?.action_url) return;
    onClose();
    router.push(notification.action_url);
  };

  return (
    <Dialog
      open={Boolean(notification)}
      onOpenChange={(open: boolean) => !open && onClose()}
    >
      <DialogContent className="sm:max-w-lg gap-0 overflow-hidden rounded-2xl border-border bg-card p-0">
        {/* A tinted band rather than a plain white header: the icon carries
            the notification's tone, and at this size it is the first thing
            read. `pr-12` keeps the title clear of the close cross. */}
        <div className="flex items-start gap-3.5 border-b border-border bg-muted/40 px-6 py-5 pr-12">
          <span
            className={`mt-0.5 grid size-11 shrink-0 place-items-center rounded-2xl ${tone}`}
          >
            <NotificationIcon
              type={notification?.type ?? "system_alert"}
              className="size-5"
            />
          </span>
          <DialogHeader className="min-w-0 flex-1 space-y-1 text-left">
            {/* Not truncated, and allowed to wrap onto a second line — this is
                the one place the whole title fits. */}
            <DialogTitle className="text-balance text-base font-semibold leading-snug">
              {notification?.title}
            </DialogTitle>
            {/* Conditional: `timeAgo` returns "" for a missing date, and an
                empty description still occupies a line under the title. */}
            {notification?.created_at && (
              <DialogDescription className="text-xs">
                {/* Relative for the glance, absolute in the tooltip for the
                    moment somebody needs to know exactly when they were
                    told. */}
                <span title={fullTimestamp(notification.created_at)}>
                  {timeAgo(notification.created_at)}
                </span>
              </DialogDescription>
            )}
          </DialogHeader>
        </div>

        {/* Scrolls rather than growing past the viewport: these messages are
            written by admins and have no length limit.

            `whitespace-pre-line` so a reason written as a list of things to fix
            still reads as one. `break-words` because a long unbroken string —
            an order id, a URL — would otherwise push the dialog wider than the
            screen. */}
        <div className="max-h-[50vh] overflow-y-auto px-6 py-5">
          <p className="whitespace-pre-line break-words text-sm leading-relaxed text-foreground">
            {notification?.message}
          </p>
        </div>

        {/* No Close button of its own. `DialogContent` renders one — a cross
            whose accessible name is already "Close" — and a footer button with
            the same name gives the dialog two identically-named controls,
            which is the fault that was just fixed on the shop details dialog.
            Escape and the overlay close it too. */}
        {notification?.action_url && (
          <DialogFooter className="border-t border-border bg-muted/30 px-6 py-4">
            <Button
              onClick={go}
              // Full width on a phone, where a dialog fills the screen and a
              // right-aligned button is a long way from the thumb.
              className="w-full rounded-xl sm:w-auto"
            >
              {destinationLabel(notification.action_url)}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
