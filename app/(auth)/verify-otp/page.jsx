"use client";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export default function VerifyOtp() {
    const [otp, setOtp] = useState("");
    const { email, verifyOtp, isLoading, error } = useAuthStore();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await verifyOtp(email, otp);
        if (res.success) router.push("/reset-password");
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
                <h2 className="text-center text-3xl font-extrabold text-gray-900">Verify OTP</h2>
                <p className="text-center text-sm text-gray-600">Sent to: <b>{email}</b></p>
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        maxLength={6}
                        required
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-center text-2xl tracking-[1em] text-gray-900 focus:border-indigo-500"
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                    />
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <button
                        disabled={isLoading}
                        className="w-full rounded-md bg-indigo-600 py-2 text-white hover:bg-indigo-700 disabled:bg-indigo-400"
                    >
                        {isLoading ? "Verifying..." : "Verify & Continue"}
                    </button>
                </form>
            </div>
        </div>
    );
}