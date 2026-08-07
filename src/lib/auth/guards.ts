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
