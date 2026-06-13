import type { Session } from "@/lib/api/schemas/auth";

// Where each role lands after auth. Pure (no server imports) so both the client
// login flow and the server guards can use it.
export function homeFor(session: Session): string {
  switch (session.user.user_type) {
    case "admin":
      return "/admin";
    case "shop_owner": {
      const s = session.shop_owner_status;
      if (s?.is_approved) return "/dashboard";
      return s?.verification_status === "pending" ? "/status" : "/onboarding";
    }
    default:
      return "/"; // customer storefront
  }
}
