"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore"; // Adjust path if needed
import Link from "next/link";
import { ArrowLeft, Mail, Loader2 } from "lucide-react"; // Assuming you have lucide-react, or use SVGs

export default function ForgotPasswordPage() {
  const { forgotPassword, loading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (!email) {
      setLocalError("Please enter your email address.");
      return;
    }

    const result = await forgotPassword(email);

    if (result.success) {
      setIsSubmitted(true);
    } else {
      setLocalError(result.error || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 shadow-lg rounded-xl">
        
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Forgot Password?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {!isSubmitted
              ? "Enter your email and we'll send you a link to reset your password."
              : "Check your email for the reset link."}
          </p>
        </div>

        {/* Success State */}
        {isSubmitted ? (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Mail className="h-5 w-5 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Email sent successfully
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    We have sent an email to <strong>{email}</strong> with instructions to reset your password.
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    href="/login"
                    className="text-sm font-medium text-green-800 hover:text-green-700 underline"
                  >
                    Return to login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Form State */
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                placeholder="Enter your email address"
              />
            </div>

            {localError && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
                {localError}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                   <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </div>

            <div className="flex items-center justify-center">
              <Link
                href="/login"
                className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}