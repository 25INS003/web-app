import { cookies } from "next/headers";
import { sessionSchema } from "@/lib/api/schemas/auth";
import type { Session } from "@/lib/api/schemas/auth";

// Server-side base URL: from inside the container the backend is reached on the
// docker network, NOT via the browser's NEXT_PUBLIC_API_URL.
const INTERNAL_API_URL =
  process.env.API_INTERNAL_URL ?? "http://ins03-backend-dev:8000/api/v1";

/**
 * The non-forgeable session: reads the incoming httpOnly cookies and asks the
 * backend `/auth/me`. Returns null when unauthenticated/expired. Used by layout
 * guards — this, not the edge proxy, is the source of truth for role/approval.
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  if (!cookieStore.get("accessToken")) return null;

  try {
    const res = await fetch(`${INTERNAL_API_URL}/auth/me`, {
      headers: { cookie: cookieStore.toString() },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const body = (await res.json()) as { data?: unknown };
    const parsed = sessionSchema.safeParse(body.data);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
