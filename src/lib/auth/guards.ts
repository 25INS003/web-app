import { redirect } from "next/navigation";
import type { Session, UserType } from "@/lib/api/schemas/auth";
import { getSession } from "./session.server";

/**
 * Where a guard sends someone whose session turned out to be invalid.
 *
 * The `stale` marker is load-bearing, not decoration. The edge proxy can only
 * check that an `accessToken` cookie EXISTS — it cannot verify it — so it
 * bounces anyone holding one away from /login. These guards do the real check
 * against /auth/me. When a cookie is present but the session behind it is gone
 * (the user was deleted or deactivated, the token expired, the backend was
 * unreachable), the two disagree and ping-pong forever:
 *
 *   /account  -> guard: no session -> /login
 *   /login    -> proxy: cookie present -> /dashboard
 *   /dashboard-> guard: no session -> /login  -> ... endlessly
 *
 * Because the guard redirect is streamed in the RSC payload rather than sent as
 * a 3xx, the browser renders each hop before navigating — so it presents as a
 * flickering page rather than a redirect-loop error.
 *
 * The proxy treats this marker as "the real check already failed", clears the
 * stale cookies and lets /login render. See proxy.ts.
 */
const STALE_LOGIN = "/login?stale=1";

export async function requireSession(
  loginPath = STALE_LOGIN,
): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(loginPath);
  return session;
}

export async function requireRole(
  role: UserType,
  loginPath = STALE_LOGIN,
): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(loginPath);
  // A valid session for the wrong role is not a stale cookie — the user is
  // genuinely signed in, just not entitled — so it must NOT clear their cookies.
  if (session.user.user_type !== role) redirect("/unauthorized");
  return session;
}

/**
 * Keep the customer shop for customers.
 *
 * The storefront is public, so it had no guard at all, and then only enough of
 * one to bounce an UNREVIEWED seller. An approved owner or an admin who
 * shortened a URL landed in the shopfront — a search bar, a wishlist, a Cart
 * button and a checkout, none of which belongs to them. Signed in, they have
 * their own area; this sends them back to it.
 *
 * Who passes through:
 *  - signed-out visitors, because that is what the storefront is for;
 *  - customers, obviously;
 *  - delivery executives, who have no area of their own in this app yet.
 *    Bouncing them would be a redirect to nowhere. When that area exists this
 *    is the line to change.
 *
 * The edge proxy bounces these paths too, and does it faster, but it decides on
 * a readable `userRole` cookie that a determined user can edit. This reads
 * /auth/me, so it cannot be talked out of. Cheap where it matters:
 * `getSession` returns null without a fetch when there is no token cookie, so
 * an anonymous visitor browsing the storefront pays nothing.
 */
export async function confineToOwnArea(): Promise<void> {
  const session = await getSession();
  if (!session) return;

  const { user_type } = session.user;
  if (user_type === "customer" || user_type === "delivery_executive") return;
  if (user_type === "admin") redirect("/admin");

  // A shop owner, approved or not. Only a `draft` applicant has a form left to
  // fill; everybody else has something to read first — `pending` is waiting,
  // and a refused owner has a decision and a reason, and may not have a form at
  // all since reopening it is an admin's call. This matches the proxy's
  // `ownerHome`, which the previous version of this guard did not: it sent
  // every non-pending applicant to /onboarding, including refused ones.
  const status = session.shop_owner_status;
  if (status?.is_approved) redirect("/dashboard");
  redirect(status?.verification_status === "draft" ? "/onboarding" : "/status");
}

// Shop-owner area: must be an approved owner, else routed to onboarding/status.
export async function requireApprovedShopOwner(): Promise<Session> {
  const session = await requireRole("shop_owner");
  const status = session.shop_owner_status;
  if (!status?.is_approved) {
    redirect(
      status?.verification_status === "pending" ? "/status" : "/onboarding",
    );
  }
  return session;
}
