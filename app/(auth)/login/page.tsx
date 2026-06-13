import Link from "next/link";
import { LoginForm } from "@/features/auth/LoginForm";

export const metadata = { title: "Sign in · Nedyway" };

export default function LoginPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Welcome back
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Sign in to your Nedyway account.
      </p>

      <div className="mt-6">
        <LoginForm />
      </div>

      <div className="mt-5 flex items-center justify-between text-sm">
        <Link
          href="/forgot-password"
          className="text-muted-foreground transition hover:text-foreground"
        >
          Forgot password?
        </Link>
        <Link
          href="/register"
          className="font-medium text-primary hover:underline"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}
