import { redirect } from "next/navigation";
import { AccountView } from "@/features/account/AccountView";
import { getSession } from "@/lib/auth/session.server";

export const metadata = { title: "Account · Nedyway" };

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <AccountView user={session.user} />;
}
