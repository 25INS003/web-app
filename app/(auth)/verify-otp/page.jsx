"use client";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export default function VerifyOtp() {
    const [otp, setOtp] = useState("");
    const [timer, setTimer] = useState(0); // Frontend cooldown timer
    const { email, verifyOtp, resendOtp, isLoading, error, message } = useAuthStore();
    const router = useRouter();

    // Redirect if email is lost (page refresh)
    useEffect(() => {
        if (!email) router.push("/forgot-password");
    }, [email, router]);

    // Handle Countdown Timer
    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await verifyOtp(email, otp);
        if (res.success) router.push("/reset-password");
    };

    const handleResend = async () => {
        if (timer > 0) return;
        const res = await resendOtp(email);
        if (res.success) setTimer(60); 
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900">Verify OTP</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Enter the code sent to <span className="font-semibold text-gray-900">{email}</span>
                    </p>
                </div>
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        maxLength={6}
                        required
                        className="block w-full rounded-md border border-gray-300 px-3 py-3 text-center text-3xl font-bold tracking-[0.5em] text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} // Only numbers
                    />

                    {error && <p className="text-center text-sm text-red-600">{error}</p>}
                    {message && <p className="text-center text-sm text-green-600">{message}</p>}

                    <button
                        type="submit"
                        disabled={isLoading || otp.length !== 6}
                        className="w-full rounded-md bg-indigo-600 py-2 text-white font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
                    >
                        {isLoading ? "Verifying..." : "Verify & Continue"}
                    </button>
                </form>

                <div className="text-center mt-4">
                    <button
                        onClick={handleResend}
                        disabled={timer > 0 || isLoading}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:text-gray-400"
                    >
                        {timer > 0 ? `Resend code in ${timer}s` : "Didn't receive code? Resend"}
                    </button>
                </div>
            </div>
        </div>
    );
}