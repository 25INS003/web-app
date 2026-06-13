import { redirect } from "next/navigation";
import type { Session, UserType } from "@/lib/api/schemas/auth";
import { getSession } from "./session.server";

export async function requireSession(loginPath = "/login"): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(loginPath);
  return session;
}

export async function requireRole(
  role: UserType,
  loginPath = "/login",
): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(loginPath);
  if (session.user.user_type !== role) redirect("/unauthorized");
  return session;
}

// Shop-owner area: must be an approved owner, else routed to onboarding/status.
export async function requireApprovedShopOwner(): Promise<Session> {
  const session = await requireRole("shop_owner");
  const status = session.shop_owner_status;
  if (!status?.is_approved) {
    redirect(status?.verification_status === "pending" ? "/status" : "/onboarding");
  }
  return session;
}
