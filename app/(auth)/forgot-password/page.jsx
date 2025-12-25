"use client";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPassword() {
    const [emailInput, setEmailInput] = useState("");
    const { sendOtp, isLoading, error, setEmail } = useAuthStore();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 1. Store email in Zustand for use in Verify/Resend pages
        setEmail(emailInput); 

        // 2. Call the Step 1 API
        const res = await sendOtp(emailInput);
        
        if (res?.success) {
            router.push("/verify-otp");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900">Forgot Password?</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Enter your email and we'll send you a 6-digit code.
                    </p>
                </div>
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email" className="sr-only">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            required
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                            placeholder="ragnar@gmail.com"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                        />
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-50 p-2">
                            <p className="text-sm text-red-600 text-center">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition-colors"
                    >
                        {isLoading ? "Sending Code..." : "Send OTP"}
                    </button>

                    <div className="text-center">
                        <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                            Back to Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}