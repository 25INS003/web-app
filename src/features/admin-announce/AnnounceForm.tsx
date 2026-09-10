"use client";

import { useState } from "react";
import { Loader2, Megaphone, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/types";
import { announceApi, type BroadcastResult } from "./api";

/** Mirrors the server's limits, so the counter agrees with the 400 it would return. */
const MAX_TITLE = 80;
const MAX_MESSAGE = 240;

/**
 * One announcement, to every customer at once.
 *
 * Every other notification on the platform is a consequence of something the
 * recipient did. This one is a person deciding to interrupt thousands of
 * people, which is why the page is deliberately plain and slow: a preview of
 * what a phone will actually show, a confirm step, and a result that says how
 * many were reached rather than a green tick.
 *
 * It sends as `promotional`, the one category customers can switch off. That
 * is the deal — an announcement that ignored the switch would be the reason
 * they turn the rest off too.
 */
export function AnnounceForm() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);

  const titleLeft = MAX_TITLE - title.length;
  const messageLeft = MAX_MESSAGE - message.length;

  const linkLooksWrong = link.length > 0 && !link.startsWith("/");
  const ready =
    title.trim().length > 0 &&
    message.trim().length > 0 &&
    titleLeft >= 0 &&
    messageLeft >= 0 &&
    !linkLooksWrong;

  async function send() {
    setSending(true);
    try {
      const res = await announceApi.send({
        title: title.trim(),
        message: message.trim(),
        ...(link.trim() ? { action_url: link.trim() } : {}),
      });
      setResult(res);
      setConfirming(false);
      setTitle("");
      setMessage("");
      setLink("");
      toast.success(`Sent to ${res.in_app} customers`);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not send the announcement",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-start gap-3">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Megaphone className="size-4" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Announcements
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Goes to every customer, in the app and as a push notification.
            Customers who have turned promotions off will not receive it.
          </p>
        </div>
      </header>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-xs">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="title">Title</Label>
            <span
              className={`text-xs tabular-nums ${
                titleLeft < 0 ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {titleLeft}
            </span>
          </div>
          <Input
            id="title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Weekend fruit sale 🍓"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="message">Message</Label>
            <span
              className={`text-xs tabular-nums ${
                messageLeft < 0 ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {messageLeft}
            </span>
          </div>
          <textarea
            id="message"
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            placeholder="20% off every fruit until Sunday. Tap to browse."
            className="w-full rounded-xl border border-border bg-card p-3 text-sm outline-none transition focus:border-ring"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="link">Where it opens (optional)</Label>
          <Input
            id="link"
            value={link}
            onChange={e => setLink(e.target.value)}
            placeholder="/c/fresh-fruits"
          />
          <p className="text-xs text-muted-foreground">
            A path, not a full URL — the app turns it into one of its own
            screens. Leave it empty and tapping just opens the app.
          </p>
          {linkLooksWrong && (
            <p className="text-xs text-destructive">
              Start it with a slash, like /c/fresh-fruits.
            </p>
          )}
        </div>
      </div>

      {/* What a phone will actually show. The title and body are truncated by
          the lock screen long before they hit the server's limit, so the
          preview matters more than the counter above. */}
      {(title || message) && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            On a phone
          </p>
          <div className="flex items-start gap-3 rounded-2xl bg-muted p-4">
            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              N
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Nedyway · now</p>
              <p className="truncate text-sm font-semibold">
                {title || "Title"}
              </p>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {message || "Message"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Two steps, because there is no unsend. */}
      {confirming ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="flex-1 text-sm">
            This sends to every customer immediately. There is no way to recall
            it.
          </p>
          <Button variant="outline" onClick={() => setConfirming(false)}>
            Back
          </Button>
          <Button onClick={send} disabled={sending}>
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Send it
          </Button>
        </div>
      ) : (
        <Button disabled={!ready} onClick={() => setConfirming(true)}>
          <Send className="size-4" />
          Review and send
        </Button>
      )}

      {result && (
        <div className="space-y-1 rounded-2xl border border-border bg-card p-5 text-sm">
          <p className="font-semibold">Sent</p>
          <p className="text-muted-foreground">
            {result.in_app} of {result.customers} customers got it in the app;{" "}
            {result.pushed} phone{result.pushed === 1 ? " was" : "s were"} pushed
            to.
          </p>
          {result.failed > 0 && (
            <p className="text-muted-foreground">
              {result.failed} push{result.failed === 1 ? "" : "es"} failed
              {result.cleared_tokens > 0 &&
                `, and ${result.cleared_tokens} dead device token${
                  result.cleared_tokens === 1 ? " was" : "s were"
                } cleared`}
              .
            </p>
          )}
          {!result.push_enabled && (
            <p className="text-warning-foreground">
              Push is not configured on this server, so this went to the in-app
              feed only.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
