"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Using Input instead of custom OTP input for simplicity or stick to standard inputs styled as boxes
import { Lock, Timer, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function VerifyOtp() {
    const [otp, setOtp] = useState("");
    const [timer, setTimer] = useState(0); 
    const { email, verifyOtp, resendOtp, isLoading, error, message } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!email) router.push("/forgot-password");
    }, [email, router]);

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await verifyOtp(email, otp);
        if (res.success) {
            toast.success("Verified!", { description: "Redirecting to reset password..." });
            router.push("/reset-password");
        } else {
            toast.error("Verification Failed", { description: res.error || "Invalid OTP" });
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;
        const res = await resendOtp(email);
        if (res.success) {
            toast.success("OTP Resent");
            setTimer(60); 
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4 relative overflow-hidden">
             {/* Ambient Background */}
             <div className="absolute inset-0 z-0">
                 <Image 
                    src="/login-bg-new.png" 
                    alt="Background blur" 
                    fill 
                    className="object-cover blur-3xl opacity-20 dark:opacity-10 scale-110" 
                />
            </div>

            <div className="relative z-10 w-full max-w-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-8 md:p-10">
                
                <div className="text-center mb-8">
                     <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 mb-4">
                        <Lock size={24} fill="currentColor" className="opacity-75" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Verify OTP</h2>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Enter the code sent to <span className="font-semibold text-slate-800 dark:text-slate-200">{email}</span>
                    </p>
                </div>
                
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="flex justify-center">
                         <input
                            type="text"
                            maxLength={6}
                            required
                            className="block w-full text-center text-4xl font-bold bg-transparent border-b-2 border-slate-300 dark:border-slate-600 focus:border-blue-600 focus:outline-none tracking-[0.5em] text-slate-900 dark:text-white py-4 transition-colors font-mono placeholder:tracking-normal placeholder:text-base placeholder:text-slate-400 placeholder:font-sans"
                            placeholder="000000"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading || otp.length !== 6}
                        className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
                    >
                        {isLoading ? "Verifying..." : "Verify & Continue"}
                    </Button>
                </form>

                <div className="text-center mt-6">
                    <button
                        onClick={handleResend}
                        disabled={timer > 0 || isLoading}
                        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {timer > 0 ? (
                            <>
                                <Timer size={16} className="mr-2 animate-pulse" /> Resend code in {timer}s
                            </>
                        ) : "Didn't receive code? Resend"}
                    </button>
                </div>
                
                 <div className="text-center mt-4">
                        <Link 
                            href="/forgot-password" 
                            className="inline-flex items-center text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                            <ArrowLeft size={12} className="mr-1" />
                            Change Email
                        </Link>
                    </div>

            </div>
        </div>
    );
}