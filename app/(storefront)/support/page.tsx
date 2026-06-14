import { redirect } from "next/navigation";
import { SupportList } from "@/features/support/SupportList";
import { getSession } from "@/lib/auth/session.server";

export const metadata = { title: "Support · Nedyway" };

export default async function SupportPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <SupportList />;
}
