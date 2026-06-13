import Link from "next/link";
import { RegisterForm } from "@/features/auth/RegisterForm";

export const metadata = { title: "Create account · Nedyway" };

export default function RegisterPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Create your account
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Join Nedyway to shop fresh — or to sell.
      </p>

      <div className="mt-6">
        <RegisterForm />
      </div>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
