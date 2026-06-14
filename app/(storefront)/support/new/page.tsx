import { redirect } from "next/navigation";
import { NewTicketForm } from "@/features/support/NewTicketForm";
import { getSession } from "@/lib/auth/session.server";

export const metadata = { title: "New request · Nedyway" };

export default async function NewSupportTicketPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <NewTicketForm />;
}
