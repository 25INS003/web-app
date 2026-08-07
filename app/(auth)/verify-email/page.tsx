import Link from "next/link";
import { redirect } from "next/navigation";
import { VerifyEmailForm } from "@/features/auth/VerifyEmailForm";

export const metadata = { title: "Verify your email · Nedyway" };

/**
 * Where registration lands, and where login redirects an unverified account.
 *
 * `searchParams` is a Promise in this version of Next and must be awaited —
 * see node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md.
 */
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string | string[] }>;
}) {
  const { email } = await searchParams;
  // A repeated ?email= yields an array; take the first rather than rendering
  // "a@b.com,c@d.com" into the form.
  const address = Array.isArray(email) ? email[0] : email;

  // Nothing to verify without an address, and the form would post an empty one.
  if (!address) redirect("/login");

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Verify your email
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        We sent a 6-digit code to{" "}
        <span className="font-medium text-foreground">{address}</span>. It
        expires in 10 minutes.
      </p>

      <div className="mt-6">
        <VerifyEmailForm email={address} />
      </div>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Wrong address?{" "}
        <Link
          href="/register"
          className="font-medium text-primary hover:underline"
        >
          Sign up again
        </Link>
      </p>
    </div>
  );
}
