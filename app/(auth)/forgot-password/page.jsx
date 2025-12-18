"use client";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
    const [email, setEmailInput] = useState("");
    const { sendOtp, isLoading, error, setEmail } = useAuthStore();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await sendOtp(email);
        setEmail(email);
        if (res.success) router.push("/verify-otp");
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
                <h2 className="text-center text-3xl font-extrabold text-gray-900">Forgot Password?</h2>
                <p className="text-center text-sm text-gray-600">Enter your email to receive a 6-digit OTP.</p>
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <input
                            type="email"
                            required
                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmailInput(e.target.value)}
                        />
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <button
                        disabled={isLoading}
                        className="group relative flex w-full justify-center rounded-md bg-indigo-600 py-2 text-white hover:bg-indigo-700 disabled:bg-indigo-400"
                    >
                        {isLoading ? "Sending..." : "Send OTP"}
                    </button>
                </form>
            </div>
        </div>
    );
}